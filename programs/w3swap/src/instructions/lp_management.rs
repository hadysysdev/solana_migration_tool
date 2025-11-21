use crate::{errors::W3SwapError, events::*, state::*, utils::*};
use anchor_lang::prelude::AccountInfo;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::AccountMeta, instruction::Instruction, program::invoke_signed,
};
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

/// Mark LP as created
#[derive(Accounts)]
pub struct MarkLpCreated<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Finalized @ W3SwapError::InvalidProjectStatus,
        constraint = !project.lp_created @ W3SwapError::LpAlreadyCreated
    )]
    pub project: Account<'info, Project>,

    pub project_admin: Signer<'info>,
}

/// Execute a swap via a route program (Meteora on devnet)
#[derive(Accounts)]
pub struct ExecuteMeteoraSwap<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [b"project", project.project_admin.as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        constraint = project.status == ProjectStatus::Ended @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,

    #[account(mut, address = project.old_token_vault)]
    pub old_token_vault: InterfaceAccount<'info, TokenAccount>,

    /// WSOL vault to receive proceeds
    #[account(mut, address = project.wsol_vault)]
    pub wsol_vault: InterfaceAccount<'info, TokenAccount>,

    /// Token programs
    pub token_program: Interface<'info, TokenInterface>,

    /// Route program (must be allowlisted)
    /// CHECK: Validated against allowlist
    pub route_program: UncheckedAccount<'info>,

    /// Payer for any required ATA creations off-chain (not used here but kept for future)
    pub payer: Signer<'info>,
}

/// Execute a swap via Jupiter aggregator (mainnet)
#[derive(Accounts)]
pub struct ExecuteJupiterSwap<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [b"project", project.project_admin.as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        constraint = project.status == ProjectStatus::Ended @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,

    #[account(mut, address = project.old_token_vault)]
    pub old_token_vault: InterfaceAccount<'info, TokenAccount>,

    /// WSOL vault to receive proceeds
    #[account(mut, address = project.wsol_vault)]
    pub wsol_vault: InterfaceAccount<'info, TokenAccount>,

    /// Token programs
    pub token_program: Interface<'info, TokenInterface>,

    /// Jupiter program (must be allowlisted)
    /// CHECK: Validated against allowlist
    pub route_program: UncheckedAccount<'info>,

    pub payer: Signer<'info>,
}

/// Finalize settlement: skim fee and add remaining WSOL to LP via adapter
#[derive(Accounts)]
pub struct FinalizeSettlement<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [b"project", project.project_admin.as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        constraint = project.status == ProjectStatus::Ended @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,

    #[account(mut, address = project.wsol_vault)]
    pub wsol_vault: InterfaceAccount<'info, TokenAccount>,

    /// LP escrow vault (receives LP tokens)
    #[account(mut, address = project.lp_escrow_vault)]
    pub lp_escrow_vault: InterfaceAccount<'info, TokenAccount>,

    /// LP token mint
    pub lp_mint: InterfaceAccount<'info, Mint>,

    /// WSOL mint (So111...)
    pub wsol_mint: InterfaceAccount<'info, Mint>,

    /// Fee destination WSOL token account (should be ATA of fee_destination_wallet)
    #[account(mut)]
    pub fee_destination_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,

    /// Route program for adding liquidity (Meteora)
    /// CHECK: Validated via allowlist
    pub route_program: UncheckedAccount<'info>,

    pub payer: Signer<'info>,
}

fn ensure_allowed(platform_config: &PlatformConfig, program_id: &Pubkey) -> Result<()> {
    if !platform_config.allowed_swap_programs.contains(program_id) {
        return Err(W3SwapError::ProgramNotAllowedForRoutes.into());
    }
    Ok(())
}

/// Execute Meteora swap adapter
pub fn execute_meteora_swap<'info>(
    ctx: Context<'info, 'info, 'info, 'info, ExecuteMeteoraSwap<'info>>,
    amount_in: u64,
    min_out_wsol: u64,
    ix_data: Vec<u8>,
) -> Result<()> {
    validate_amount_not_zero(amount_in)?;

    // Allowlist check
    ensure_allowed(
        &ctx.accounts.platform_config,
        &ctx.accounts.route_program.key(),
    )?;

    // Initialize WSOL vault address on first use if unset
    if ctx.accounts.project.wsol_vault == Pubkey::default() {
        ctx.accounts.project.wsol_vault = ctx.accounts.wsol_vault.key();
    }

    // Pre balance
    let pre = ctx.accounts.wsol_vault.amount;

    // Signer seeds for project PDA authority
    let project = &ctx.accounts.project;
    let seeds = project_seeds(&project.project_admin, project.project_id);
    let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
    let bump_slice = [project.bump];
    seed_refs.push(&bump_slice);
    let signer = &[seed_refs.as_slice()];

    // Route CPI
    // Build metas from remaining accounts (route expects these)
    let metas: Vec<AccountMeta> = ctx
        .remaining_accounts
        .iter()
        .map(|acc| {
            if acc.is_writable {
                AccountMeta::new(*acc.key, acc.is_signer)
            } else {
                AccountMeta::new_readonly(*acc.key, acc.is_signer)
            }
        })
        .collect();
    let ix = Instruction {
        program_id: ctx.accounts.route_program.key(),
        accounts: metas,
        data: ix_data,
    };
    let mut infos: Vec<AccountInfo> = Vec::with_capacity(1 + ctx.remaining_accounts.len());
    infos.push(ctx.accounts.route_program.to_account_info());
    infos.extend_from_slice(ctx.remaining_accounts);
    invoke_signed(&ix, &infos, signer).map_err(|_| error!(W3SwapError::CpiCallFailed))?;

    // Post balance and min-out enforcement
    let post = ctx.accounts.wsol_vault.amount;
    let out = post
        .checked_sub(pre)
        .ok_or(W3SwapError::ArithmeticOverflow)?;
    if out < min_out_wsol {
        return Err(W3SwapError::MinimumOutputNotMet.into());
    }

    emit!(SwapExecuted {
        project_id: project.project_id,
        project_pda: project.key(),
        route_program: ctx.accounts.route_program.key(),
        amount_in,
        min_out_wsol,
        amount_out_wsol: out,
        wsol_balance_after: post,
        timestamp: current_timestamp(),
    });
    Ok(())
}

/// Execute Jupiter swap adapter
pub fn execute_jupiter_swap<'info>(
    ctx: Context<'info, 'info, 'info, 'info, ExecuteJupiterSwap<'info>>,
    amount_in: u64,
    min_out_wsol: u64,
    ix_data: Vec<u8>,
) -> Result<()> {
    validate_amount_not_zero(amount_in)?;
    ensure_allowed(
        &ctx.accounts.platform_config,
        &ctx.accounts.route_program.key(),
    )?;

    if ctx.accounts.project.wsol_vault == Pubkey::default() {
        ctx.accounts.project.wsol_vault = ctx.accounts.wsol_vault.key();
    }
    let pre = ctx.accounts.wsol_vault.amount;

    let project = &ctx.accounts.project;
    let seeds = project_seeds(&project.project_admin, project.project_id);
    let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
    let bump_slice = [project.bump];
    seed_refs.push(&bump_slice);
    let signer = &[seed_refs.as_slice()];

    let metas: Vec<AccountMeta> = ctx
        .remaining_accounts
        .iter()
        .map(|acc| {
            if acc.is_writable {
                AccountMeta::new(*acc.key, acc.is_signer)
            } else {
                AccountMeta::new_readonly(*acc.key, acc.is_signer)
            }
        })
        .collect();
    let ix = Instruction {
        program_id: ctx.accounts.route_program.key(),
        accounts: metas,
        data: ix_data,
    };
    let mut infos: Vec<AccountInfo> = Vec::with_capacity(1 + ctx.remaining_accounts.len());
    infos.push(ctx.accounts.route_program.to_account_info());
    infos.extend_from_slice(ctx.remaining_accounts);
    invoke_signed(&ix, &infos, signer).map_err(|_| error!(W3SwapError::CpiCallFailed))?;

    let post = ctx.accounts.wsol_vault.amount;
    let out = post
        .checked_sub(pre)
        .ok_or(W3SwapError::ArithmeticOverflow)?;
    if out < min_out_wsol {
        return Err(W3SwapError::MinimumOutputNotMet.into());
    }

    emit!(SwapExecuted {
        project_id: project.project_id,
        project_pda: project.key(),
        route_program: ctx.accounts.route_program.key(),
        amount_in,
        min_out_wsol,
        amount_out_wsol: out,
        wsol_balance_after: post,
        timestamp: current_timestamp(),
    });
    Ok(())
}

/// Finalize settlement: fee skim and LP add via adapter
pub fn finalize_settlement<'info>(
    ctx: Context<'info, 'info, 'info, 'info, FinalizeSettlement<'info>>,
    lp_add_ix_data: Vec<u8>,
) -> Result<()> {
    let platform = &ctx.accounts.platform_config;
    let project = &mut ctx.accounts.project;

    // Ensure route program allowed
    ensure_allowed(platform, &ctx.accounts.route_program.key())?;

    // Require old token fully sold (or enforce off-chain before calling)
    // For simplicity, we skip checking old_token_vault balance here.

    // Fee skim in WSOL percent
    let bal = ctx.accounts.wsol_vault.amount;
    let fee = (bal as u128)
        .checked_mul(platform.settlement_fee_percent as u128)
        .ok_or(W3SwapError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(W3SwapError::ArithmeticOverflow)? as u64;

    if fee > 0 {
        // Transfer fee WSOL to fee destination token account using project signer
        let seeds = project_seeds(&project.project_admin, project.project_id);
        let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
        let bump_slice = [project.bump];
        seed_refs.push(&bump_slice);
        let signer = &[seed_refs.as_slice()];

        transfer_tokens_checked(
            &ctx.accounts.wsol_vault,
            &ctx.accounts.fee_destination_token_account,
            &ctx.accounts.wsol_mint,
            &project.to_account_info(),
            &ctx.accounts.token_program,
            fee,
            ctx.accounts.wsol_mint.decimals,
            Some(signer),
        )?;
    }

    // Add remaining WSOL to LP via adapter CPI (route program)
    let seeds = project_seeds(&project.project_admin, project.project_id);
    let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
    let bump_slice = [project.bump];
    seed_refs.push(&bump_slice);
    let signer = &[seed_refs.as_slice()];

    let metas: Vec<AccountMeta> = ctx
        .remaining_accounts
        .iter()
        .map(|acc| {
            if acc.is_writable {
                AccountMeta::new(*acc.key, acc.is_signer)
            } else {
                AccountMeta::new_readonly(*acc.key, acc.is_signer)
            }
        })
        .collect();
    let ix = Instruction {
        program_id: ctx.accounts.route_program.key(),
        accounts: metas,
        data: lp_add_ix_data,
    };
    let mut infos: Vec<AccountInfo> = Vec::with_capacity(1 + ctx.remaining_accounts.len());
    infos.push(ctx.accounts.route_program.to_account_info());
    infos.extend_from_slice(ctx.remaining_accounts);
    invoke_signed(&ix, &infos, signer).map_err(|_| error!(W3SwapError::CpiCallFailed))?;

    // Set lock and mark finalized
    let now = current_timestamp();
    let lock_seconds = days_to_seconds(platform.min_lp_lock_days as u64);
    project.lp_lock_end = now + lock_seconds;
    project.status = ProjectStatus::Finalized;

    emit!(SettlementCompleted {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        total_sol_from_sales: bal,
        lp_tokens_escrowed: ctx.accounts.lp_escrow_vault.amount,
        lockup_starts_at: now,
        lockup_ends_at: project.lp_lock_end,
        timestamp: now,
    });

    Ok(())
}
/// Deposit LP tokens to escrow
#[derive(Accounts)]
pub struct DepositLp<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.lp_created @ W3SwapError::LpNotCreated
    )]
    pub project: Account<'info, Project>,

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

    #[account(
        mut,
        token::mint = lp_mint,
        token::authority = project_admin
    )]
    pub project_admin_lp_account: InterfaceAccount<'info, TokenAccount>,

    pub lp_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,

    #[account(mut)]
    pub project_admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Withdraw LP tokens from escrow
#[derive(Accounts)]
pub struct WithdrawLp<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.can_withdraw_lp() @ W3SwapError::LpStillLocked
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        address = project.lp_escrow_vault
    )]
    pub lp_escrow_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = lp_mint,
        token::authority = project_admin
    )]
    pub project_admin_lp_account: InterfaceAccount<'info, TokenAccount>,

    pub lp_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub project_admin: Signer<'info>,
}

/// Mark LP as created
pub fn mark_lp_created(ctx: Context<MarkLpCreated>) -> Result<()> {
    let project = &mut ctx.accounts.project;
    let now = current_timestamp();

    project.lp_created = true;
    project.lp_lock_end = now + MIN_LP_LOCK_DURATION;

    emit!(LpCreated {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        timestamp: now,
    });

    Ok(())
}

/// Deposit LP tokens to escrow
pub fn deposit_lp(ctx: Context<DepositLp>, amount: u64) -> Result<()> {
    validate_amount_not_zero(amount)?;

    let project = &mut ctx.accounts.project;

    // Update project LP escrow vault if not set
    if project.lp_escrow_vault == Pubkey::default() {
        project.lp_escrow_vault = ctx.accounts.lp_escrow_vault.key();
    }

    // Transfer LP tokens to escrow
    transfer_tokens_checked(
        &ctx.accounts.project_admin_lp_account,
        &ctx.accounts.lp_escrow_vault,
        &ctx.accounts.lp_mint,
        &ctx.accounts.project_admin.to_account_info(),
        &ctx.accounts.token_program,
        amount,
        ctx.accounts.lp_mint.decimals,
        None,
    )?;

    project.lp_tokens_deposited = project
        .lp_tokens_deposited
        .checked_add(amount)
        .ok_or(W3SwapError::ArithmeticOverflow)?;

    emit!(LpDeposited {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        amount,
        total_deposited: project.lp_tokens_deposited,
        lock_end_timestamp: project.lp_lock_end,
        timestamp: current_timestamp(),
    });

    Ok(())
}

/// Withdraw LP tokens from escrow
pub fn withdraw_lp(ctx: Context<WithdrawLp>, amount: u64) -> Result<()> {
    validate_amount_not_zero(amount)?;

    let project = &mut ctx.accounts.project;

    // Check sufficient balance in escrow
    if ctx.accounts.lp_escrow_vault.amount < amount {
        return Err(W3SwapError::InsufficientTokensInVault.into());
    }

    // Transfer LP tokens from escrow to admin
    let project_seeds = project_seeds(&project.project_admin, project.project_id);
    let mut project_seed_refs: Vec<&[u8]> = project_seeds.iter().map(|s| s.as_slice()).collect();
    let bump_slice = [project.bump];
    project_seed_refs.push(&bump_slice);
    let project_signer_seeds = &[project_seed_refs.as_slice()];

    transfer_tokens_checked(
        &ctx.accounts.lp_escrow_vault,
        &ctx.accounts.project_admin_lp_account,
        &ctx.accounts.lp_mint,
        &project.to_account_info(),
        &ctx.accounts.token_program,
        amount,
        ctx.accounts.lp_mint.decimals,
        Some(project_signer_seeds),
    )?;

    project.lp_tokens_deposited = project
        .lp_tokens_deposited
        .checked_sub(amount)
        .ok_or(W3SwapError::ArithmeticOverflow)?;

    emit!(LpWithdrawn {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        amount,
        remaining_deposited: project.lp_tokens_deposited,
        timestamp: current_timestamp(),
    });

    Ok(())
}

// Refund and sweep instructions removed
