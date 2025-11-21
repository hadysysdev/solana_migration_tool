use crate::{errors::W3SwapError, events::*, state::*, utils::*};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

/// Migrate old tokens for new tokens
///
/// SECURITY NOTE: The user_migration PDA is initialized using a custom helper to prevent
/// reinitialization attacks. Unlike init_if_needed, which can be exploited if an attacker
/// closes and recreates the account, our approach ensures the account can only be created
/// once and will be safely reused for subsequent migrations by the same user.
#[derive(Accounts)]
pub struct Migrate<'info> {
    #[account(
        mut,
        seeds = [b"project", project.project_admin.as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        constraint = project.is_migration_active() @ W3SwapError::MigrationNotActive
    )]
    pub project: Account<'info, Project>,

    /// CHECK: Validated and initialized in ensure_user_migration_initialized helper
    #[account(
        mut,
        seeds = [b"user_migration", project.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_migration: AccountInfo<'info>,

    #[account(
        mut,
        address = project.old_token_vault
    )]
    pub old_token_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        address = project.new_token_vault
    )]
    pub new_token_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = project.old_token_mint,
        token::authority = user
    )]
    pub user_old_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        token::mint = new_token_mint,
        token::authority = user,
        token::token_program = new_token_program
    )]
    pub user_new_token_account: InterfaceAccount<'info, TokenAccount>,

    pub old_token_mint: InterfaceAccount<'info, Mint>,
    pub new_token_mint: InterfaceAccount<'info, Mint>,

    pub old_token_program: Interface<'info, TokenInterface>,
    pub new_token_program: Interface<'info, TokenInterface>,

    #[account(
        mut,
        constraint = project.is_user_allowed(&user.key()) @ W3SwapError::UserNotAllowedToMigrate
    )]
    pub user: Signer<'info>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Migrate old tokens for new tokens
pub fn migrate(ctx: Context<Migrate>, amount: u64) -> Result<()> {
    validate_amount_not_zero(amount)?;

    let project = &mut ctx.accounts.project;

    // Check user is allowed to migrate
    if !project.is_user_allowed(&ctx.accounts.user.key()) {
        return Err(W3SwapError::UserNotAllowedToMigrate.into());
    }

    let project_key = project.key();
    let user_key = ctx.accounts.user.key();
    let bump = ctx.bumps.user_migration;

    let is_new_account = ensure_user_migration_initialized(
        ctx.program_id,
        &ctx.accounts.user_migration,
        &ctx.accounts.user.to_account_info(),
        &ctx.accounts.system_program,
        &[b"user_migration", project_key.as_ref(), user_key.as_ref()],
        bump,
        UserMigration::LEN,
    )?;

    let mut user_migration_data = ctx.accounts.user_migration.try_borrow_mut_data()?;
    let mut user_migration = if is_new_account {
        UserMigration {
            project: project_key,
            user: user_key,
            old_tokens_migrated: 0,
            new_tokens_received: 0,
            sol_committed: 0,
            refund_claimed: false,
            bump,
        }
    } else {
        let deser_migration = UserMigration::try_deserialize(&mut &user_migration_data[..])?;
        require!(
            deser_migration.project == project_key && deser_migration.user == user_key,
            W3SwapError::UserMigrationAccountMismatch
        );
        require!(
            deser_migration.bump == bump,
            W3SwapError::UserMigrationAccountMismatch
        );
        deser_migration
    };

    // Calculate new tokens to receive (pass user key for special ratio check)
    let new_tokens_amount = project.calculate_new_tokens(amount, &ctx.accounts.user.key())?;

    // Check if vault has sufficient new tokens
    if ctx.accounts.new_token_vault.amount < new_tokens_amount {
        // Auto-pause if insufficient tokens
        project.status = ProjectStatus::Paused;

        emit!(ProjectStatusChanged {
            project_id: project.project_id,
            project_admin: project.project_admin,
            project_pda: project.key(),
            old_status: ProjectStatus::Active,
            new_status: ProjectStatus::Paused,
            timestamp: current_timestamp(),
        });

        emit!(VaultBalanceLow {
            project_id: project.project_id,
            project_admin: project.project_admin,
            project_pda: project.key(),
            remaining_balance: ctx.accounts.new_token_vault.amount,
            required_amount: new_tokens_amount,
            timestamp: current_timestamp(),
        });

        return Err(W3SwapError::InsufficientTokensInVault.into());
    }

    // NOTE: Protection SOL is funded by admin at project creation, not by users
    // Users do not pay any SOL during migration according to PRD

    // Transfer old tokens from user to vault
    transfer_tokens_checked(
        &ctx.accounts.user_old_token_account,
        &ctx.accounts.old_token_vault,
        &ctx.accounts.old_token_mint,
        &ctx.accounts.user.to_account_info(),
        &ctx.accounts.old_token_program,
        amount,
        ctx.accounts.old_token_mint.decimals,
        None,
    )?;

    // Transfer new tokens from vault to user
    let project_seeds = project_seeds(&project.project_admin, project.project_id);
    let mut project_seed_refs: Vec<&[u8]> = project_seeds.iter().map(|s| s.as_slice()).collect();
    let bump_slice = [project.bump];
    project_seed_refs.push(&bump_slice);
    let project_signer_seeds = &[project_seed_refs.as_slice()];

    transfer_tokens_checked(
        &ctx.accounts.new_token_vault,
        &ctx.accounts.user_new_token_account,
        &ctx.accounts.new_token_mint,
        &project.to_account_info(),
        &ctx.accounts.new_token_program,
        new_tokens_amount,
        ctx.accounts.new_token_mint.decimals,
        Some(project_signer_seeds),
    )?;

    // Update project totals
    project.total_old_migrated = project
        .total_old_migrated
        .checked_add(amount)
        .ok_or(W3SwapError::ArithmeticOverflow)?;

    project.total_new_distributed = project
        .total_new_distributed
        .checked_add(new_tokens_amount)
        .ok_or(W3SwapError::ArithmeticOverflow)?;

    // Update user migration record
    user_migration.old_tokens_migrated = user_migration
        .old_tokens_migrated
        .checked_add(amount)
        .ok_or(W3SwapError::ArithmeticOverflow)?;

    user_migration.new_tokens_received = user_migration
        .new_tokens_received
        .checked_add(new_tokens_amount)
        .ok_or(W3SwapError::ArithmeticOverflow)?;

    // Persist updated user migration data
    let serialized_user_migration = user_migration.try_to_vec()?;
    let data_len = serialized_user_migration.len();
    user_migration_data[..data_len].copy_from_slice(&serialized_user_migration);
    drop(user_migration_data);

    // Note: Users don't commit SOL during migration per PRD

    emit!(MigrationPerformed {
        project_id: project.project_id,
        project_pda: project.key(),
        user: ctx.accounts.user.key(),
        old_tokens_amount: amount,
        new_tokens_amount,
        total_old_migrated: project.total_old_migrated,
        total_new_distributed: project.total_new_distributed,
        timestamp: current_timestamp(),
    });

    // Check if vault balance is below auto-pause threshold after migration
    let decimals = ctx.accounts.new_token_mint.decimals;
    let one_token = 10u64.pow(decimals as u32);
    let auto_pause_percent = project.auto_pause_threshold_percent as u64;
    let threshold_amount = one_token
        .checked_mul(auto_pause_percent)
        .ok_or(W3SwapError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(W3SwapError::ArithmeticOverflow)?;

    if ctx.accounts.new_token_vault.amount < threshold_amount {
        // Auto-pause project due to low balance
        project.status = ProjectStatus::Paused;

        emit!(ProjectStatusChanged {
            project_id: project.project_id,
            project_admin: project.project_admin,
            project_pda: project.key(),
            old_status: ProjectStatus::Active,
            new_status: ProjectStatus::Paused,
            timestamp: current_timestamp(),
        });

        emit!(VaultBalanceLow {
            project_id: project.project_id,
            project_admin: project.project_admin,
            project_pda: project.key(),
            remaining_balance: ctx.accounts.new_token_vault.amount,
            required_amount: threshold_amount,
            timestamp: current_timestamp(),
        });
    }

    Ok(())
}
