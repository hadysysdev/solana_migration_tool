use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
// WSOL vault address will be set lazily during first swap via adapters
use crate::{errors::W3SwapError, events::*, state::*, utils::*};

/// Pre-allocate the project PDA account with full space
/// This avoids the 10,240 byte reallocation limit for inner instructions
#[derive(Accounts)]
#[instruction(project_id: u64)]
pub struct AllocateProjectAccount<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// Signer that funds rent for the oversized project PDA
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        constraint = platform_config.project_admins.contains(&project_admin.key()) @ W3SwapError::NotProjectAdmin
    )]
    pub project_admin: Signer<'info>,

    /// CHECK: PDA to be allocated before initializing data
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project_id.to_le_bytes().as_ref()],
        bump
    )]
    pub project: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// Create a new migration project (step 1: init project only)
/// Note: Project account must be pre-allocated via allocate_project_account instruction
#[derive(Accounts)]
#[instruction(params: CreateProjectParams)]
pub struct CreateProjectInit<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), params.project_id.to_le_bytes().as_ref()],
        bump,
        owner = crate::ID
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



/// Activate a project for migrations (Step 3: Activation)
#[derive(Accounts)]
pub struct ActivateProject<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Funded @ W3SwapError::InvalidProjectStatus,
        constraint = project.lp_created == true @ W3SwapError::ProjectNotReady // Ensure LP is created
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        address = project.new_token_vault
    )]
    pub new_token_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub project_admin: Signer<'info>,
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

/// Pre-allocate the project PDA account with full space
/// This is required before calling create_project_init to avoid Solana's
/// 10,240 byte reallocation limit for inner instructions.
pub fn allocate_project_account(
    ctx: Context<AllocateProjectAccount>,
    project_id: u64,
) -> Result<()> {
    let project_info = ctx.accounts.project.to_account_info();

    // If the project was already allocated we simply verify ownership
    // and allow the call to succeed. This makes the instruction idempotent.
    if *project_info.owner == crate::ID {
        let data = project_info.try_borrow_data()?;
        if data.len() >= 16 {
            let discriminator: [u8; 8] = data[..8].try_into().unwrap();
            let stored_project_id_bytes: [u8; 8] = data[8..16].try_into().unwrap();
            let stored_project_id = u64::from_le_bytes(stored_project_id_bytes);
            
            // Check if discriminator is set AND project_id matches
            if discriminator != [0; 8] && stored_project_id == project_id {
                return Ok(());
            }
        }
    } else {
        // Only do system create_account if it's not already owned by us
        require_keys_eq!(
            *project_info.owner,
            System::id(),
            W3SwapError::InvalidAccountOwner
        );
        require_eq!(
            project_info.lamports(),
            0,
            W3SwapError::ProjectAlreadyAllocated
        );
        require_eq!(
            project_info.data_len(),
            0,
            W3SwapError::ProjectAlreadyAllocated
        );

        // Allocate only 10KB initially to avoid CPI limit
        let space = 10240u64;
        let rent_lamports = ctx.accounts.rent.minimum_balance(space as usize);

        let project_id_bytes = project_id.to_le_bytes();
        let bump_bytes = [ctx.bumps.project];
        let project_admin_key = ctx.accounts.project_admin.key();
        let signer_seeds: &[&[u8]] = &[
            b"project",
            project_admin_key.as_ref(),
            &project_id_bytes,
            &bump_bytes,
        ];

        // Manually invoke the system program
        invoke_signed(
            &system_instruction::create_account(
                &ctx.accounts.payer.key(),
                &ctx.accounts.project.key(),
                rent_lamports,
                space,
                &crate::ID,
            ),
            &[
                ctx.accounts.payer.to_account_info(),
                project_info.clone(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[signer_seeds],
        )?;
    }

    let mut data = project_info.try_borrow_mut_data()?;
    
    // Initialize header fields using a struct to ensure type safety
    // We cannot serialize the full Project struct yet as it won't fit
    let header = ProjectHeader {
        discriminator: Project::DISCRIMINATOR.try_into().unwrap(),
        project_id,
        project_admin: ctx.accounts.project_admin.key(),
    };

    // Serialize header into the beginning of the account data
    let mut writer = &mut data[..];
    header.serialize(&mut writer)?;

    // We do NOT write the bump yet as it's at the end of the struct
    
    Ok(())
}

/// Helper struct to ensure type safety when writing the initial project header
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ProjectHeader {
    pub discriminator: [u8; 8],
    pub project_id: u64,
    pub project_admin: Pubkey,
}

/// Expand the project PDA account size (step 1.5)
/// Must be called repeatedly until full size is reached
#[derive(Accounts)]
pub struct ExpandProjectAccount<'info> {
    /// CHECK: We manually verify seeds and owner because we are expanding it
    #[account(mut)]
    pub project: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub project_admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn expand_project_account(ctx: Context<ExpandProjectAccount>) -> Result<()> {
    let project_info = ctx.accounts.project.to_account_info();
    
    // Manual verification since we use UncheckedAccount
    require_keys_eq!(*project_info.owner, crate::ID, W3SwapError::InvalidAccountOwner);

    // Verify seeds
    // We need to read project_id from the account data to verify seeds
    let data = project_info.try_borrow_data()?;
    if data.len() < 16 {
        return Err(W3SwapError::InvalidInstructionData.into());
    }
    let stored_project_id_bytes: [u8; 8] = data[8..16].try_into().unwrap();
    // stored_project_id is not needed for seeds, only bytes

    let project_admin_key = ctx.accounts.project_admin.key();
    let seeds = &[
        b"project",
        project_admin_key.as_ref(),
        &stored_project_id_bytes,
    ];
    let (pda, bump) = Pubkey::find_program_address(seeds, &crate::ID);
    require_keys_eq!(pda, ctx.accounts.project.key(), W3SwapError::InvalidAccountOwner);

    drop(data); // Release borrow

    let current_len = project_info.data_len();
    let target_len = Project::LEN;

    if current_len >= target_len {
        return Ok(());
    }

    // Expand by up to 10240 bytes
    let increase = std::cmp::min(10240, target_len - current_len);
    let new_len = current_len + increase;

    // Calculate additional rent needed
    let rent = Rent::get()?;
    let new_minimum_balance = rent.minimum_balance(new_len);
    let current_lamports = project_info.lamports();
    
    if new_minimum_balance > current_lamports {
        let diff = new_minimum_balance - current_lamports;
        transfer_sol(
            &ctx.accounts.payer.to_account_info(),
            &project_info,
            &ctx.accounts.system_program,
            diff,
        )?;
    }

    // Resize
    project_info.resize(new_len)?;

    // If we reached target size, write the bump at the end
    if new_len == target_len {
        let mut data = project_info.try_borrow_mut_data()?;
        // Bump is the last byte
        let last_idx = target_len - 1;
        data[last_idx] = bump;
    }

    Ok(())
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
    project.old_token_vault =
        Pubkey::find_program_address(&[b"old_token_vault", proj_key.as_ref()], &crate::ID).0;
    project.new_token_vault =
        Pubkey::find_program_address(&[b"new_token_vault", proj_key.as_ref()], &crate::ID).0;
    project.liquidity_vault =
        Pubkey::find_program_address(&[b"liquidity_vault", proj_key.as_ref()], &crate::ID).0;
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
    project.auto_pause_threshold_percent =
        ctx.accounts.platform_config.auto_pause_threshold_percent;
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
pub fn create_project_vaults(ctx: Context<CreateProjectVaults>) -> Result<()> {
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
pub fn fund_project(ctx: Context<FundProject>, amount: u64) -> Result<()> {
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



/// Activate a project for migrations
pub fn activate_project(ctx: Context<ActivateProject>) -> Result<()> {
    let now = current_timestamp();
    let project = &mut ctx.accounts.project;

    // Check if project start time has passed
    if now < project.migration_start {
        return Err(W3SwapError::ProjectNotReady.into());
    }

    // Check if vault has sufficient tokens
    if ctx.accounts.new_token_vault.amount == 0 {
        return Err(W3SwapError::ProjectNotFunded.into());
    }

    // Validate that we're activating at the right time
    if now > project.migration_end {
        return Err(W3SwapError::MigrationPeriodEnded.into());
    }

    let old_status = project.status.clone();

    // Update project status and timing
    project.status = ProjectStatus::Active;
    project.activated_at = now;
    // Recalculate end time based on actual activation: activated_at + duration
    project.migration_end = now + project.migration_duration;

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

/// Pause a project temporarily
pub fn pause_project(ctx: Context<PauseProject>) -> Result<()> {
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
pub fn resume_project(ctx: Context<ResumeProject>) -> Result<()> {
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
pub fn end_project(ctx: Context<EndProject>) -> Result<()> {
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
pub fn finalize_project_transfers(ctx: Context<FinalizeProjectTransfers>) -> Result<()> {
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

pub fn close_project_accounts(ctx: Context<CloseProjectAccounts>) -> Result<()> {
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


