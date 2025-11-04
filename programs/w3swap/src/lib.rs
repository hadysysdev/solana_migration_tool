use anchor_lang::prelude::*;

pub mod adapters;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;
use state::{AdminAction, CreateProjectParams, LpConfiguration};

declare_id!("9qPx5xbqg4xZp3BWbtCNGy3GVfZ4WeaeraMUvLBSdcKh");

/// W3Swap Migration Platform
/// 
/// A secure token migration platform on Solana that enables:
/// - Secure token swaps with admin controls
/// - Optional migration protection with SOL commitments
/// - LP token management and escrow
/// - Configurable refund mechanisms
/// - Multi-role access control (Super Admin, Project Admins)
#[program]
pub mod w3swap {
    use super::*;

    /// Initialize the platform with super admin
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        fee_destination_wallet: Pubkey,
        min_sol_commitment: u64,
        auto_pause_threshold_percent: u8,
    ) -> Result<()> {
        instructions::initialize_platform(ctx, fee_destination_wallet, min_sol_commitment, auto_pause_threshold_percent)
    }

    /// Manage project admin list (add/remove)
    pub fn manage_project_admin(
        ctx: Context<ManageProjectAdmin>,
        admin: Pubkey,
        action: AdminAction,
    ) -> Result<()> {
        instructions::manage_project_admin(ctx, admin, action)
    }

    /// Update platform configuration
    pub fn update_platform_config(
        ctx: Context<UpdatePlatformConfig>,
        allowed_swap_programs: Option<Vec<Pubkey>>,
        min_sol_commitment: Option<u64>,
        auto_pause_threshold_percent: Option<u8>,
        platform_fee_sol: Option<u8>,
        settlement_fee_percent: Option<u8>,
        min_migration_days: Option<u8>,
        max_migration_days: Option<u8>,
        min_lp_lock_days: Option<u8>,
    ) -> Result<()> {
        instructions::update_platform_config(
            ctx,
            allowed_swap_programs,
            min_sol_commitment,
            auto_pause_threshold_percent,
            platform_fee_sol,
            settlement_fee_percent,
            min_migration_days,
            max_migration_days,
            min_lp_lock_days,
        )
    }

    /// Update fee destination wallet
    pub fn update_fee_destination_wallet(
        ctx: Context<UpdateFeeDestinationWallet>,
        new_fee_destination: Pubkey,
    ) -> Result<()> {
        instructions::update_fee_destination_wallet(ctx, new_fee_destination)
    }

    /// Create project (step 1): initialize account and fields
    pub fn create_project_init(
        ctx: Context<CreateProjectInit>,
        params: CreateProjectParams,
    ) -> Result<()> {
        instructions::create_project_init(ctx, params)
    }

    /// Create project (step 2): initialize vaults + fund SOL commitment
    pub fn create_project_vaults(
        ctx: Context<CreateProjectVaults>,
    ) -> Result<()> {
        instructions::create_project_vaults(ctx)
    }

    /// Fund a project with new tokens
    pub fn fund_project(
        ctx: Context<FundProject>,
        amount: u64,
    ) -> Result<()> {
        instructions::fund_project(ctx, amount)
    }

    /// Activate a project for migrations and create initial LP
    pub fn activate_project(
        ctx: Context<ActivateProject>,
        lp_config: LpConfiguration,
    ) -> Result<()> {
        instructions::activate_project(ctx, lp_config)
    }

    /// Pause a project temporarily
    pub fn pause_project(
        ctx: Context<PauseProject>,
    ) -> Result<()> {
        instructions::pause_project(ctx)
    }

    /// Resume a paused project
    pub fn resume_project(
        ctx: Context<ResumeProject>,
    ) -> Result<()> {
        instructions::resume_project(ctx)
    }

    /// End a project migration period
    pub fn end_project(
        ctx: Context<EndProject>,
    ) -> Result<()> {
        instructions::end_project(ctx)
    }

    /// Complete settlement and start LP lockup period
    pub fn complete_settlement(
        ctx: Context<CompleteSettlement>,
        total_sol_from_sales: u64,
        lp_tokens_escrowed: u64,
    ) -> Result<()> {
        instructions::complete_settlement(ctx, total_sol_from_sales, lp_tokens_escrowed)
    }

    /// Finalize project step 1: transfer LP/new tokens out and close LP escrow
    pub fn finalize_project_transfers(
        ctx: Context<FinalizeProjectTransfers>,
    ) -> Result<()> {
        instructions::finalize_project_transfers(ctx)
    }

    /// Finalize project step 2: close remaining accounts and reclaim rent
    pub fn close_project_accounts(
        ctx: Context<CloseProjectAccounts>,
    ) -> Result<()> {
        instructions::close_project_accounts(ctx)
    }

    /// Migrate old tokens for new tokens
    pub fn migrate(
        ctx: Context<Migrate>,
        amount: u64,
    ) -> Result<()> {
        instructions::migrate(ctx, amount)
    }


    /// Mark LP as created
    pub fn mark_lp_created(
        ctx: Context<MarkLpCreated>,
    ) -> Result<()> {
        instructions::mark_lp_created(ctx)
    }

    /// Deposit LP tokens to escrow
    pub fn deposit_lp(
        ctx: Context<DepositLp>,
        amount: u64,
    ) -> Result<()> {
        instructions::deposit_lp(ctx, amount)
    }

    /// Withdraw LP tokens from escrow
    pub fn withdraw_lp(
        ctx: Context<WithdrawLp>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_lp(ctx, amount)
    }

    /// Execute a Meteora swap route (devnet/testing)
    pub fn execute_meteora_swap(
        ctx: Context<ExecuteMeteoraSwap>,
        amount_in: u64,
        min_out_wsol: u64,
        ix_data: Vec<u8>,
    ) -> Result<()> {
        crate::utils::validate_amount_not_zero(amount_in)?;

        // Route program is expected as the first remaining account
        let (first_prog, rest_accounts) = ctx
            .remaining_accounts
            .split_first()
            .ok_or(error!(errors::W3SwapError::InvalidInstructionData))?;
        // Allowlist check
        if !ctx
            .accounts
            .platform_config
            .allowed_swap_programs
            .contains(&first_prog.key())
        {
            return Err(errors::W3SwapError::ProgramNotAllowedForRoutes.into());
        }

        // Initialize WSOL vault address on first use if unset
        if ctx.accounts.project.wsol_vault == Pubkey::default() {
            ctx.accounts.project.wsol_vault = ctx.accounts.wsol_vault.key();
        }

        let pre = ctx.accounts.wsol_vault.amount;

        // Project signer seeds
        let seeds = crate::utils::project_seeds(&ctx.accounts.project.project_admin, ctx.accounts.project.project_id);
        let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
        let bump_slice = [ctx.accounts.project.bump];
        seed_refs.push(&bump_slice);
        let signer = &[seed_refs.as_slice()];

        // Build CPI instruction
        let metas: Vec<anchor_lang::solana_program::instruction::AccountMeta> = rest_accounts
            .iter()
            .map(|acc| if acc.is_writable { anchor_lang::solana_program::instruction::AccountMeta::new(*acc.key, acc.is_signer) } else { anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*acc.key, acc.is_signer) })
            .collect();
        let ix = anchor_lang::solana_program::instruction::Instruction {
            program_id: first_prog.key(),
            accounts: metas,
            data: ix_data,
        };
        anchor_lang::solana_program::program::invoke_signed(&ix, &ctx.remaining_accounts, signer)
            .map_err(|_| error!(errors::W3SwapError::CpiCallFailed))?;

        let post = ctx.accounts.wsol_vault.amount;
        let out = post
            .checked_sub(pre)
            .ok_or(errors::W3SwapError::ArithmeticOverflow)?;
        if out < min_out_wsol {
            return Err(errors::W3SwapError::MinimumOutputNotMet.into());
        }

        emit!(events::SwapExecuted {
            project_id: ctx.accounts.project.project_id,
            project_pda: ctx.accounts.project.key(),
            route_program: first_prog.key(),
            amount_in,
            min_out_wsol,
            amount_out_wsol: out,
            wsol_balance_after: post,
            timestamp: utils::current_timestamp(),
        });
        Ok(())
    }

    /// Execute a Jupiter swap route (mainnet)
    pub fn execute_jupiter_swap(
        ctx: Context<ExecuteJupiterSwap>,
        amount_in: u64,
        min_out_wsol: u64,
        ix_data: Vec<u8>,
    ) -> Result<()> {
        crate::utils::validate_amount_not_zero(amount_in)?;
        let (first_prog, rest_accounts) = ctx
            .remaining_accounts
            .split_first()
            .ok_or(error!(errors::W3SwapError::InvalidInstructionData))?;
        if !ctx
            .accounts
            .platform_config
            .allowed_swap_programs
            .contains(&first_prog.key())
        {
            return Err(errors::W3SwapError::ProgramNotAllowedForRoutes.into());
        }
        if ctx.accounts.project.wsol_vault == Pubkey::default() {
            ctx.accounts.project.wsol_vault = ctx.accounts.wsol_vault.key();
        }
        let pre = ctx.accounts.wsol_vault.amount;
        let seeds = crate::utils::project_seeds(&ctx.accounts.project.project_admin, ctx.accounts.project.project_id);
        let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
        let bump_slice = [ctx.accounts.project.bump];
        seed_refs.push(&bump_slice);
        let signer = &[seed_refs.as_slice()];

        let metas: Vec<anchor_lang::solana_program::instruction::AccountMeta> = rest_accounts
            .iter()
            .map(|acc| if acc.is_writable { anchor_lang::solana_program::instruction::AccountMeta::new(*acc.key, acc.is_signer) } else { anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*acc.key, acc.is_signer) })
            .collect();
        let ix = anchor_lang::solana_program::instruction::Instruction {
            program_id: first_prog.key(),
            accounts: metas,
            data: ix_data,
        };
        anchor_lang::solana_program::program::invoke_signed(&ix, &ctx.remaining_accounts, signer)
            .map_err(|_| error!(errors::W3SwapError::CpiCallFailed))?;

        let post = ctx.accounts.wsol_vault.amount;
        let out = post
            .checked_sub(pre)
            .ok_or(errors::W3SwapError::ArithmeticOverflow)?;
        if out < min_out_wsol {
            return Err(errors::W3SwapError::MinimumOutputNotMet.into());
        }
        emit!(events::SwapExecuted {
            project_id: ctx.accounts.project.project_id,
            project_pda: ctx.accounts.project.key(),
            route_program: first_prog.key(),
            amount_in,
            min_out_wsol,
            amount_out_wsol: out,
            wsol_balance_after: post,
            timestamp: utils::current_timestamp(),
        });
        Ok(())
    }

    /// Finalize settlement: skim fee and add remaining WSOL to LP
    pub fn finalize_settlement(
        ctx: Context<FinalizeSettlement>,
        lp_add_ix_data: Vec<u8>,
    ) -> Result<()> {
        let platform = &ctx.accounts.platform_config;
        let project = &mut ctx.accounts.project;

        let (first_prog, rest_accounts) = ctx
            .remaining_accounts
            .split_first()
            .ok_or(error!(errors::W3SwapError::InvalidInstructionData))?;
        if !platform.allowed_swap_programs.contains(&first_prog.key()) {
            return Err(errors::W3SwapError::ProgramNotAllowedForRoutes.into());
        }

        let bal = ctx.accounts.wsol_vault.amount;
        let fee = (bal as u128)
            .checked_mul(platform.settlement_fee_percent as u128)
            .ok_or(errors::W3SwapError::ArithmeticOverflow)?
            .checked_div(100)
            .ok_or(errors::W3SwapError::ArithmeticOverflow)? as u64;

        let seeds = crate::utils::project_seeds(&project.project_admin, project.project_id);
        let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
        let bump_slice = [project.bump];
        seed_refs.push(&bump_slice);
        let signer = &[seed_refs.as_slice()];

        if fee > 0 {
            crate::utils::transfer_tokens_checked(
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

        let metas: Vec<anchor_lang::solana_program::instruction::AccountMeta> = rest_accounts
            .iter()
            .map(|acc| if acc.is_writable { anchor_lang::solana_program::instruction::AccountMeta::new(*acc.key, acc.is_signer) } else { anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*acc.key, acc.is_signer) })
            .collect();
        let ix = anchor_lang::solana_program::instruction::Instruction {
            program_id: first_prog.key(),
            accounts: metas,
            data: lp_add_ix_data,
        };
        anchor_lang::solana_program::program::invoke_signed(&ix, &ctx.remaining_accounts, signer)
            .map_err(|_| error!(errors::W3SwapError::CpiCallFailed))?;

        let now = utils::current_timestamp();
        let lock_seconds = utils::days_to_seconds(platform.min_lp_lock_days as u64);
        project.lp_lock_end = now + lock_seconds;
        project.status = state::ProjectStatus::Finalized;

        emit!(events::SettlementCompleted {
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

    // Refund and sweep instructions removed
}
