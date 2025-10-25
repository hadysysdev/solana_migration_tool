use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenInterface, Mint, TokenAccount};
// WSOL vault address will be set lazily during first swap via adapters
use crate::{
    state::*,
    errors::W3SwapError,
    events::*,
    utils::*,
};

/// Create a new migration project (step 1: init project only)
#[derive(Accounts)]
#[instruction(params: CreateProjectParams)]
pub struct CreateProjectInit<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    #[account(
        init,
        payer = project_admin,
        space = Project::LEN,
        seeds = [b"project", project_admin.key().as_ref(), params.project_id.to_le_bytes().as_ref()],
        bump
    )]
    pub project: Account<'info, Project>,
    
    pub old_token_mint: InterfaceAccount<'info, Mint>,
    pub new_token_mint: InterfaceAccount<'info, Mint>,
    
    pub old_token_program: Interface<'info, TokenInterface>,
    pub new_token_program: Interface<'info, TokenInterface>,
    
    #[account(
        mut,
        constraint = platform_config.project_admins.contains(&project_admin.key()) @ W3SwapError::NotProjectAdmin
    )]
    pub project_admin: Signer<'info>,
    
    /// CHECK: Fee destination from platform config
    #[account(
        mut,
        address = platform_config.fee_destination_wallet
    )]
    pub fee_destination: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Create a new migration project (step 2: init vaults + SOL commitment)
#[derive(Accounts)]
pub struct CreateProjectVaults<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Created @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,

    #[account(
        init,
        payer = project_admin,
        token::mint = old_token_mint,
        token::authority = project,
        token::token_program = old_token_program,
        seeds = [b"old_token_vault", project.key().as_ref()],
        bump
    )]
    pub old_token_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = project_admin,
        token::mint = new_token_mint,
        token::authority = project,
        token::token_program = new_token_program,
        seeds = [b"new_token_vault", project.key().as_ref()],
        bump
    )]
    pub new_token_vault: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Liquidity vault PDA for SOL commitment
    #[account(
        init,
        payer = project_admin,
        space = 0,
        seeds = [b"liquidity_vault", project.key().as_ref()],
        bump
    )]
    pub liquidity_vault: UncheckedAccount<'info>,

    pub old_token_mint: InterfaceAccount<'info, Mint>,
    pub new_token_mint: InterfaceAccount<'info, Mint>,

    pub old_token_program: Interface<'info, TokenInterface>,
    pub new_token_program: Interface<'info, TokenInterface>,

    #[account(mut)]
    pub project_admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Fund a project with new tokens
#[derive(Accounts)]
pub struct FundProject<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Created @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,
    
    #[account(
        mut,
        address = project.new_token_vault
    )]
    pub new_token_vault: InterfaceAccount<'info, TokenAccount>,
    
    pub new_token_mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        mut,
        token::mint = project.new_token_mint,
        token::authority = project_admin
    )]
    pub project_admin_token_account: InterfaceAccount<'info, TokenAccount>,
    
    pub project_admin: Signer<'info>,
    
    pub new_token_program: Interface<'info, TokenInterface>,
}

/// Activate a project for migrations and create initial LP
#[derive(Accounts)]
pub struct ActivateProject<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Funded @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,
    
    #[account(
        mut,
        address = project.new_token_vault
    )]
    pub new_token_vault: InterfaceAccount<'info, TokenAccount>,
    
    /// CHECK: Liquidity vault PDA holding committed SOL
    #[account(
        mut,
        seeds = [b"liquidity_vault", project.key().as_ref()],
        bump
    )]
    pub liquidity_vault: UncheckedAccount<'info>,
    
    #[account(
        init_if_needed,
        payer = project_admin,
        token::mint = lp_mint,
        token::authority = project,
        token::token_program = token_program,
        seeds = [b"lp_escrow_vault", project.key().as_ref()],
        bump
    )]
    pub lp_escrow_vault: InterfaceAccount<'info, TokenAccount>,
    
    /// CHECK: Meteora DLMM pool to be created
    #[account(mut)]
    pub meteora_pool: UncheckedAccount<'info>,
    
    /// CHECK: LP token mint from Meteora position
    pub lp_mint: UncheckedAccount<'info>,
    
    pub new_token_mint: InterfaceAccount<'info, Mint>,
    pub new_token_program: Interface<'info, TokenInterface>,
    pub token_program: Interface<'info, TokenInterface>,
    
    #[account(mut)]
    pub project_admin: Signer<'info>,
    
    /// CHECK: Meteora DLMM program
    pub meteora_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

/// Pause a project temporarily
#[derive(Accounts)]
pub struct PauseProject<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Active @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,
    
    pub project_admin: Signer<'info>,
}

/// Resume a paused project
#[derive(Accounts)]
pub struct ResumeProject<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Paused @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,
    
    #[account(
        address = project.new_token_vault
    )]
    pub new_token_vault: InterfaceAccount<'info, TokenAccount>,
    
    pub new_token_mint: InterfaceAccount<'info, Mint>,
    
    pub project_admin: Signer<'info>,
}

/// End a project migration period
#[derive(Accounts)]
pub struct EndProject<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Active || project.status == ProjectStatus::Paused @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,
    
    pub project_admin: Signer<'info>,
}

/// Complete settlement and start LP lockup period
#[derive(Accounts)]
pub struct CompleteSettlement<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Ended @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub project_admin: Signer<'info>,
}

/// Finalize project and claim LP tokens (after lockup)
#[derive(Accounts)]
pub struct FinalizeProjectTransfers<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Finalized @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,
    
    #[account(
        mut,
        address = project.lp_escrow_vault
    )]
    pub lp_escrow_vault: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        mut,
        address = project.new_token_vault
    )]
    pub new_token_vault: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        mut,
        address = project.old_token_vault
    )]
    pub old_token_vault: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        mut,
        token::mint = lp_mint,
        token::authority = project_admin
    )]
    pub admin_lp_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        mut,
        token::mint = project.new_token_mint,
        token::authority = project_admin
    )]
    pub admin_new_token_account: InterfaceAccount<'info, TokenAccount>,
    
    /// LP token mint
    pub lp_mint: InterfaceAccount<'info, Mint>,
    
    pub new_token_mint: InterfaceAccount<'info, Mint>,
    pub new_token_program: Interface<'info, TokenInterface>,
    pub lp_token_program: Interface<'info, TokenInterface>,
    
    #[account(mut)]
    pub project_admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Create a new migration project (step 1)
pub fn create_project_init(
    ctx: Context<CreateProjectInit>,
    params: CreateProjectParams,
) -> Result<()> {
    // Validate parameters
    validate_not_default_pubkey(&params.old_token_mint)?;
    validate_not_default_pubkey(&params.new_token_mint)?;
    if params.old_token_mint == params.new_token_mint {
        return Err(W3SwapError::InvalidInstructionData.into());
    }
    validate_token_program(&params.old_token_program)?;
    validate_token_program(&params.new_token_program)?;
    
    // Validate migration period based on platform-configured min/max days
    if params.migration_start <= 0 || params.migration_end <= params.migration_start {
        return Err(W3SwapError::InvalidMigrationPeriod.into());
    }

    let migration_duration = params.migration_end - params.migration_start;

    // Convert configured day bounds to seconds and validate
    let min_seconds = days_to_seconds(ctx.accounts.platform_config.min_migration_days as u64);
    let max_seconds = days_to_seconds(ctx.accounts.platform_config.max_migration_days as u64);
    if migration_duration < min_seconds || migration_duration > max_seconds {
        return Err(W3SwapError::InvalidMigrationDuration.into());
    }
    
    // Validate SOL commitment - required for LP creation
    if params.sol_commitment_amount == 0 {
        return Err(W3SwapError::AmountIsZero.into());
    }
    
    // Check minimum SOL commitment from platform config
    if params.sol_commitment_amount < ctx.accounts.platform_config.min_sol_commitment {
        return Err(W3SwapError::InsufficientSolCommitment.into());
    }
    
    // Validate exchange ratio - PRD: "both validated > 0 on-chain"
    if params.special_ratio_enabled {
        if params.exchange_ratio_numerator == 0 || params.exchange_ratio_denominator == 0 {
            return Err(W3SwapError::InvalidExchangeRatio.into());
        }
        if params.special_ratio_wallets.is_empty() {
            return Err(W3SwapError::EmptySpecialRatioList.into());
        }
        if params.special_ratio_wallets.len() > MAX_ALLOWLIST_ENTRIES {
            return Err(W3SwapError::SpecialRatioListFull.into());
        }
    } else {
        // If special ratio not enabled, should not have ratio values or wallets
        if params.exchange_ratio_numerator != 0 || params.exchange_ratio_denominator != 0 {
            return Err(W3SwapError::InvalidExchangeRatio.into());
        }
        if !params.special_ratio_wallets.is_empty() {
            return Err(W3SwapError::InvalidSpecialRatioConfig.into());
        }
    }
    
    // Validate allow/deny lists only if they are enabled
    if params.allowlist_enabled && params.allowlist.len() > MAX_ALLOWLIST_ENTRIES {
        return Err(W3SwapError::AllowListFull.into());
    }
    if params.denylist_enabled && params.denylist.len() > MAX_ALLOWLIST_ENTRIES {
        return Err(W3SwapError::DenyListFull.into());
    }
    
    // Charge platform fee from platform config (lamports)
    transfer_sol(
        &ctx.accounts.project_admin.to_account_info(),
        &ctx.accounts.fee_destination.to_account_info(),
        &ctx.accounts.system_program,
        ctx.accounts.platform_config.platform_fee_lamports,
    )?;
    
    let now = current_timestamp();
    let project = &mut ctx.accounts.project;
    
    project.project_id = params.project_id;
    project.project_admin = ctx.accounts.project_admin.key();
    project.old_token_mint = params.old_token_mint;
    project.new_token_mint = params.new_token_mint;
    project.old_token_program = params.old_token_program;
    project.new_token_program = params.new_token_program;
    // Derive and store vault addresses (initialized in step 2)
    let proj_key = project.key();
    project.old_token_vault = Pubkey::find_program_address(&[b"old_token_vault", proj_key.as_ref()], &crate::ID).0;
    project.new_token_vault = Pubkey::find_program_address(&[b"new_token_vault", proj_key.as_ref()], &crate::ID).0;
    project.liquidity_vault = Pubkey::find_program_address(&[b"liquidity_vault", proj_key.as_ref()], &crate::ID).0;
    // WSOL vault is set lazily by swap adapters on first use
    project.lp_escrow_vault = Pubkey::default(); // Will be set when LP is created
    project.status = ProjectStatus::Created;
    project.migration_start = params.migration_start;
    project.migration_end = params.migration_end;
    project.migration_duration = params.migration_end - params.migration_start; // Store calculated duration
    project.total_pause_duration = 0;
    project.last_pause_start = 0;
    project.activated_at = 0; // Will be set when activated
    project.exchange_ratio_numerator = params.exchange_ratio_numerator;
    project.exchange_ratio_denominator = params.exchange_ratio_denominator;
    project.auto_pause_threshold_percent = ctx.accounts.platform_config.auto_pause_threshold_percent;
    // Protection removed
    project.project_name = params.project_name;
    // Not used in simplified model
    project.total_old_migrated = 0;
    project.total_new_distributed = 0;
    project.total_sol_committed = params.sol_commitment_amount;
    // No LP creation deadline in simplified model
    project.lp_created = false;
    project.lp_tokens_deposited = 0;
    project.lp_lock_end = 0;
    project.special_ratio_enabled = params.special_ratio_enabled;
    project.special_ratio_wallets = params.special_ratio_wallets;
    project.allowlist_enabled = params.allowlist_enabled;
    project.denylist_enabled = params.denylist_enabled;
    
    // Optimize storage: only allocate lists if they're actually used
    project.allowlist = if params.allowlist_enabled && !params.allowlist.is_empty() {
        Some(params.allowlist)
    } else {
        None
    };
    project.denylist = if params.denylist_enabled && !params.denylist.is_empty() {
        Some(params.denylist)
    } else {
        None
    };
    project.bump = ctx.bumps.project;
    
    emit!(ProjectCreated {
        project_id: params.project_id,
        project_admin: ctx.accounts.project_admin.key(),
        project_pda: project.key(),
        old_token_mint: params.old_token_mint,
        new_token_mint: params.new_token_mint,
        migration_duration: params.migration_end - params.migration_start,
        allowlist_enabled: params.allowlist_enabled,
        denylist_enabled: params.denylist_enabled,
        timestamp: now,
    });
    
    Ok(())
}

/// Create a new migration project (step 2)
pub fn create_project_vaults(
    ctx: Context<CreateProjectVaults>,
) -> Result<()> {
    // Transfer SOL commitment from admin to liquidity vault
    transfer_sol(
        &ctx.accounts.project_admin.to_account_info(),
        &ctx.accounts.liquidity_vault.to_account_info(),
        &ctx.accounts.system_program,
        ctx.accounts.project.total_sol_committed,
    )?;
    Ok(())
}

/// Fund a project with new tokens
pub fn fund_project(
    ctx: Context<FundProject>,
    amount: u64,
) -> Result<()> {
    validate_amount_not_zero(amount)?;
    
    let project = &mut ctx.accounts.project;
    
    // Transfer new tokens to vault
    transfer_tokens_checked(
        &ctx.accounts.project_admin_token_account,
        &ctx.accounts.new_token_vault,
        &ctx.accounts.new_token_mint,
        &ctx.accounts.project_admin.to_account_info(),
        &ctx.accounts.new_token_program,
        amount,
        ctx.accounts.new_token_mint.decimals,
        None,
    )?;
    
    // Update project status if this is the first funding
    if project.status == ProjectStatus::Created {
        project.status = ProjectStatus::Funded;
        
        emit!(ProjectStatusChanged {
            project_id: project.project_id,
            project_admin: project.project_admin,
            project_pda: project.key(),
            old_status: ProjectStatus::Created,
            new_status: ProjectStatus::Funded,
            timestamp: current_timestamp(),
        });
    }
    
    emit!(ProjectFunded {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        amount,
        total_funded: ctx.accounts.new_token_vault.amount,
        timestamp: current_timestamp(),
    });
    
    Ok(())
}

/// Activate a project for migrations and create initial LP
pub fn activate_project(
    ctx: Context<ActivateProject>,
    lp_config: LpConfiguration,
) -> Result<()> {
    let now = current_timestamp();
    
    // Check if project start time has passed
    if now < ctx.accounts.project.migration_start {
        return Err(W3SwapError::ProjectNotReady.into());
    }
    
    // Check if vault has sufficient tokens
    if ctx.accounts.new_token_vault.amount == 0 {
        return Err(W3SwapError::ProjectNotFunded.into());
    }
    
    // Validate LP configuration
    validate_lp_configuration(&lp_config)?;
    
    // Check if liquidity vault has sufficient SOL for LP creation
    let liquidity_vault_balance = ctx.accounts.liquidity_vault.lamports();
    if liquidity_vault_balance == 0 {
        return Err(W3SwapError::InsufficientSolForProtection.into());
    }
    
    // Validate that we're activating at the right time
    if now > ctx.accounts.project.migration_end {
        return Err(W3SwapError::MigrationPeriodEnded.into());
    }
    
    // Create Meteora DLMM pool and add initial liquidity first (placeholder)
    // Off-chain CPI integration should replace this. For now, simulate by
    // moving new tokens to LP escrow; keep SOL untouched in liquidity_vault.
    create_meteora_pool_and_add_liquidity(
        &ctx,
        &lp_config,
        0,
    )?;
    
    // Now update project state
    let project = &mut ctx.accounts.project;
    let old_status = project.status.clone();
    
    // Store LP configuration
    project.lp_config = Some(lp_config.clone());
    
    // Update project status and timing
    project.status = ProjectStatus::Active;
    project.activated_at = now;
    // Recalculate end time based on actual activation: activated_at + duration
    project.migration_end = now + project.migration_duration;
    
    project.lp_created = true;
    project.lp_lock_end = 0; // Will be set after settlement completes
    project.meteora_pool = ctx.accounts.meteora_pool.key();
    project.lp_escrow_vault = ctx.accounts.lp_escrow_vault.key();
    project.lp_tokens_deposited = lp_config.token_allocation; // Placeholder
    
    emit!(ProjectStatusChanged {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        old_status,
        new_status: ProjectStatus::Active,
        timestamp: now,
    });
    
    emit!(LpCreated {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        timestamp: now,
    });
    
    Ok(())
}

/// Pause a project temporarily
pub fn pause_project(
    ctx: Context<PauseProject>,
) -> Result<()> {
    let project = &mut ctx.accounts.project;
    let old_status = project.status.clone();
    
    // Track pause start time for duration calculation
    project.start_pause()?;
    
    project.status = ProjectStatus::Paused;
    
    emit!(ProjectStatusChanged {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        old_status,
        new_status: ProjectStatus::Paused,
        timestamp: current_timestamp(),
    });
    
    Ok(())
}

/// Resume a paused project
pub fn resume_project(
    ctx: Context<ResumeProject>,
) -> Result<()> {
    let project = &mut ctx.accounts.project;
    let old_status = project.status.clone();
    
    // Check if vault balance is above threshold before resuming
    let decimals = ctx.accounts.new_token_mint.decimals;
    let one_token = 10u64.pow(decimals as u32);
    let threshold_amount = one_token
        .checked_mul(ctx.accounts.platform_config.auto_pause_threshold_percent as u64)
        .ok_or(W3SwapError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(W3SwapError::ArithmeticOverflow)?;
    
    if ctx.accounts.new_token_vault.amount < threshold_amount {
        return Err(W3SwapError::InsufficientVaultBalanceToResume.into());
    }
    
    // Track pause duration and update end time
    project.end_pause()?;
    
    // Check if migration period is still valid (using updated end time)
    let now = current_timestamp();
    let current_end_time = project.calculate_current_end_time();
    if now > current_end_time {
        return Err(W3SwapError::MigrationPeriodEnded.into());
    }
    
    project.status = ProjectStatus::Active;
    
    emit!(ProjectStatusChanged {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        old_status,
        new_status: ProjectStatus::Active,
        timestamp: now,
    });
    
    Ok(())
}

/// End a project migration period
pub fn end_project(
    ctx: Context<EndProject>,
) -> Result<()> {
    let project = &mut ctx.accounts.project;
    let old_status = project.status.clone();
    
    project.status = ProjectStatus::Ended;
    
    emit!(ProjectStatusChanged {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        old_status,
        new_status: ProjectStatus::Ended,
        timestamp: current_timestamp(),
    });
    
    Ok(())
}

/// Complete settlement and start LP lockup period
pub fn complete_settlement(
    ctx: Context<CompleteSettlement>,
    total_sol_from_sales: u64,
    lp_tokens_escrowed: u64,
) -> Result<()> {
    let now = current_timestamp();
    let project = &mut ctx.accounts.project;
    
    // Validate project is in ended state
    if project.status != ProjectStatus::Ended {
        return Err(W3SwapError::InvalidProjectStatus.into());
    }
    
    // Set lockup period - starts NOW after settlement completes
    let lock_seconds = days_to_seconds(ctx.accounts.platform_config.min_lp_lock_days as u64);
    project.lp_lock_end = now + lock_seconds;
    project.lp_tokens_deposited = lp_tokens_escrowed;
    
    // Update project status to indicate settlement is complete
    project.status = ProjectStatus::Finalized;
    
    emit!(SettlementCompleted {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        total_sol_from_sales,
        lp_tokens_escrowed,
        lockup_starts_at: now,
        lockup_ends_at: project.lp_lock_end,
        timestamp: now,
    });
    
    msg!("Settlement completed - LP lockup period started for 30 days");
    
    Ok(())
}

/// Finalize project and claim LP tokens (after lockup period)
pub fn finalize_project_transfers(
    ctx: Context<FinalizeProjectTransfers>,
) -> Result<()> {
    let now = current_timestamp();
    let project = &ctx.accounts.project;
    
    // Validate lockup period has ended
    if now < project.lp_lock_end {
        return Err(W3SwapError::LockupPeriodNotEnded.into());
    }
    
    // Get project seeds for signing
    let project_seeds = project_seeds(&project.project_admin, project.project_id);
    let mut project_seed_refs: Vec<&[u8]> = project_seeds.iter().map(|s| s.as_slice()).collect();
    let bump_slice = [project.bump];
    project_seed_refs.push(&bump_slice);
    let project_signer_seeds = &[project_seed_refs.as_slice()];
    
    // Transfer LP tokens to admin
    if ctx.accounts.lp_escrow_vault.amount > 0 {
        transfer_tokens_checked(
            &ctx.accounts.lp_escrow_vault,
            &ctx.accounts.admin_lp_token_account,
            &ctx.accounts.lp_mint,
            &project.to_account_info(),
            &ctx.accounts.lp_token_program,
            ctx.accounts.lp_escrow_vault.amount,
            ctx.accounts.lp_mint.decimals,
            Some(project_signer_seeds),
        )?;
    }

    // Close LP escrow vault to reclaim rent (requires zero balance)
    close_token_account(
        &ctx.accounts.lp_escrow_vault,
        &ctx.accounts.project_admin.to_account_info(),
        &project.to_account_info(),
        &ctx.accounts.lp_token_program,
        Some(project_signer_seeds),
    )?;
    
    // Transfer any remaining new tokens to admin
    if ctx.accounts.new_token_vault.amount > 0 {
        transfer_tokens_checked(
            &ctx.accounts.new_token_vault,
            &ctx.accounts.admin_new_token_account,
            &ctx.accounts.new_token_mint,
            &project.to_account_info(),
            &ctx.accounts.new_token_program,
            ctx.accounts.new_token_vault.amount,
            ctx.accounts.new_token_mint.decimals,
            Some(project_signer_seeds),
        )?;
    }
    
    Ok(())
}

/// Step 2: Close remaining accounts and reclaim SOL rent
#[derive(Accounts)]
pub struct CloseProjectAccounts<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Finalized @ W3SwapError::InvalidProjectStatus,
        close = project_admin
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        address = project.new_token_vault
    )]
    pub new_token_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        address = project.old_token_vault
    )]
    pub old_token_vault: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Liquidity vault PDA to be closed
    #[account(
        mut,
        seeds = [b"liquidity_vault", project.key().as_ref()],
        bump
    )]
    pub liquidity_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub project_admin: Signer<'info>,

    /// Token program interfaces (used to close token accounts via CPI)
    pub new_token_program: Interface<'info, TokenInterface>,
    pub old_token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,
}

pub fn close_project_accounts(
    ctx: Context<CloseProjectAccounts>,
) -> Result<()> {
    let now = current_timestamp();
    let project = &ctx.accounts.project;

    // Close token vaults via CPI using project as authority
    let seeds = project_seeds(&project.project_admin, project.project_id);
    let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
    let bump_slice = [project.bump];
    seed_refs.push(&bump_slice);
    let signer = &[seed_refs.as_slice()];

    // Close new token vault if exists
    close_token_account(
        &ctx.accounts.new_token_vault,
        &ctx.accounts.project_admin.to_account_info(),
        &project.to_account_info(),
        &ctx.accounts.new_token_program,
        Some(signer),
    )?;

    // Close old token vault if exists
    close_token_account(
        &ctx.accounts.old_token_vault,
        &ctx.accounts.project_admin.to_account_info(),
        &project.to_account_info(),
        &ctx.accounts.old_token_program,
        Some(signer),
    )?;

    // Close liquidity vault and reclaim SOL rent to admin
    let liquidity_vault_info = ctx.accounts.liquidity_vault.to_account_info();
    let admin_info = ctx.accounts.project_admin.to_account_info();
    let vault_lamports = liquidity_vault_info.lamports();
    if vault_lamports > 0 {
        **liquidity_vault_info.try_borrow_mut_lamports()? = 0;
        **admin_info.try_borrow_mut_lamports()? = admin_info
            .lamports()
            .checked_add(vault_lamports)
            .ok_or(W3SwapError::ArithmeticOverflow)?;
    }

    emit!(ProjectFinalized {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        lp_tokens_claimed: 0,
        new_tokens_claimed: 0,
        rent_reclaimed: vault_lamports,
        timestamp: now,
    });
    Ok(())
}

/// Validate LP configuration parameters
fn validate_lp_configuration(config: &LpConfiguration) -> Result<()> {
    // Validate token allocation is not zero
    if config.token_allocation == 0 {
        return Err(W3SwapError::AmountIsZero.into());
    }
    
    // Validate initial price is not zero
    if config.initial_price == 0 {
        return Err(W3SwapError::AmountIsZero.into());
    }
    
    // Validate price range
    if config.price_range_min >= config.price_range_max {
        return Err(W3SwapError::InvalidExchangeRatio.into());
    }
    
    // Validate bin step (common values: 10, 20, 50, 100)
    if config.bin_step == 0 || config.bin_step > 1000 {
        return Err(W3SwapError::InvalidExchangeRatio.into());
    }
    
    // Validate base fee (should be reasonable, e.g., 1-1000 bps)
    if config.base_fee > 1000 {
        return Err(W3SwapError::InvalidExchangeRatio.into());
    }
    
    Ok(())
}

/// Create Meteora DLMM pool and add initial liquidity
/// This is a placeholder implementation. In production, this would use
/// proper CPI calls to the Meteora DLMM program
fn create_meteora_pool_and_add_liquidity(
    ctx: &Context<ActivateProject>,
    lp_config: &LpConfiguration,
    _sol_amount: u64,
) -> Result<()> {
    // TODO: Implement actual Meteora DLMM integration
    // This would involve:
    // 1. Creating the DLMM pool with specified parameters
    // 2. Adding initial liquidity with SOL + new tokens
    // 3. Receiving LP tokens
    // 4. Depositing LP tokens to escrow vault
    
    msg!("Creating Meteora DLMM pool with config: initial_price={}, token_allocation={}, bin_step={}, base_fee={}", 
         lp_config.initial_price, 
         lp_config.token_allocation, 
         lp_config.bin_step, 
         lp_config.base_fee);
    
    // For now, we'll simulate the process
    // In production, replace this with actual Meteora CPI calls
    
    // Transfer tokens from new_token_vault for LP
    let project = &ctx.accounts.project;
    let project_seeds = project_seeds(&project.project_admin, project.project_id);
    let mut project_seed_refs: Vec<&[u8]> = project_seeds.iter().map(|s| s.as_slice()).collect();
    let bump_slice = [project.bump];
    project_seed_refs.push(&bump_slice);
    let project_signer_seeds = &[project_seed_refs.as_slice()];
    
    // Transfer tokens from vault (this would be part of Meteora CPI)
    transfer_tokens_checked(
        &ctx.accounts.new_token_vault,
        &ctx.accounts.lp_escrow_vault, // Temporary: should go to Meteora, then LP tokens back
        &ctx.accounts.new_token_mint,
        &project.to_account_info(),
        &ctx.accounts.new_token_program,
        lp_config.token_allocation,
        ctx.accounts.new_token_mint.decimals,
        Some(project_signer_seeds),
    )?;
    
    // Note: In actual implementation, SOL would be provided to LP program,
    // and we'd receive LP tokens back to deposit in escrow. We avoid
    // manipulating lamports here in the placeholder.
    
    // Update project state (will be done by the caller)
    // project.lp_tokens_deposited = lp_config.token_allocation; // Placeholder
    
    msg!("LP creation simulated successfully");
    
    Ok(())
}
