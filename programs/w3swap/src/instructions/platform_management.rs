use crate::{errors::W3SwapError, events::*, state::*, utils::*};
use anchor_lang::prelude::*;

/// Initialize the platform with super admin
#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = super_admin,
        space = PlatformConfig::LEN,
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub super_admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Manage project admin (add/remove)
#[derive(Accounts)]
#[instruction(admin: Pubkey, action: AdminAction)]
pub struct ManageProjectAdmin<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        has_one = super_admin @ W3SwapError::NotSuperAdmin
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub super_admin: Signer<'info>,
}

/// Update platform configuration
#[derive(Accounts)]
pub struct UpdatePlatformConfig<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        has_one = super_admin @ W3SwapError::NotSuperAdmin
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub super_admin: Signer<'info>,
}

/// Update fee destination wallet
#[derive(Accounts)]
pub struct UpdateFeeDestinationWallet<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        has_one = super_admin @ W3SwapError::NotSuperAdmin
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub super_admin: Signer<'info>,
}

/// Initialize the platform with super admin
pub fn initialize_platform(
    ctx: Context<InitializePlatform>,
    fee_destination_wallet: Pubkey,
    min_sol_commitment: u64,
    auto_pause_threshold_percent: u8,
) -> Result<()> {
    validate_not_default_pubkey(&fee_destination_wallet)?;

    // Validate threshold percent is reasonable (1-50%)
    if auto_pause_threshold_percent == 0 || auto_pause_threshold_percent > 50 {
        return Err(W3SwapError::InvalidThresholdPercent.into());
    }

    let platform_config = &mut ctx.accounts.platform_config;

    platform_config.super_admin = ctx.accounts.super_admin.key();
    platform_config.project_admins = Vec::new();
    platform_config.fee_destination_wallet = fee_destination_wallet;
    platform_config.allowed_swap_programs = Vec::new();
    platform_config.min_sol_commitment = min_sol_commitment;
    platform_config.auto_pause_threshold_percent = auto_pause_threshold_percent;
    // Defaults: 2 SOL platform fee, 1% settlement fee
    platform_config.platform_fee_lamports = 2_000_000_000; // 2 SOL
    platform_config.settlement_fee_percent = 1; // 1%
                                                // Defaults for durations: min 30 days, max 90 days, LP lock 30 days
    platform_config.min_migration_days = 30;
    platform_config.max_migration_days = 90;
    platform_config.min_lp_lock_days = 30;
    platform_config.bump = ctx.bumps.platform_config;

    emit!(PlatformInitialized {
        super_admin: ctx.accounts.super_admin.key(),
        fee_destination_wallet,
        timestamp: current_timestamp(),
    });

    Ok(())
}

/// Manage project admin list (add/remove)
pub fn manage_project_admin(
    ctx: Context<ManageProjectAdmin>,
    admin: Pubkey,
    action: AdminAction,
) -> Result<()> {
    validate_not_default_pubkey(&admin)?;

    let platform_config = &mut ctx.accounts.platform_config;

    match action {
        AdminAction::Add => {
            // Check if admin already exists
            if platform_config.project_admins.contains(&admin) {
                return Err(W3SwapError::ProjectAdminAlreadyExists.into());
            }

            // Check if list is full
            if platform_config.project_admins.len() >= MAX_PROJECT_ADMINS {
                return Err(W3SwapError::ProjectAdminListFull.into());
            }

            platform_config.project_admins.push(admin);

            emit!(ProjectAdminManaged {
                super_admin: ctx.accounts.super_admin.key(),
                admin,
                action: "added".to_string(),
                timestamp: current_timestamp(),
            });
        }
        AdminAction::Remove => {
            // Find and remove admin
            if let Some(pos) = platform_config
                .project_admins
                .iter()
                .position(|&x| x == admin)
            {
                platform_config.project_admins.remove(pos);

                emit!(ProjectAdminManaged {
                    super_admin: ctx.accounts.super_admin.key(),
                    admin,
                    action: "removed".to_string(),
                    timestamp: current_timestamp(),
                });
            } else {
                return Err(W3SwapError::ProjectAdminNotFound.into());
            }
        }
    }

    Ok(())
}

/// Update platform configuration
#[allow(clippy::too_many_arguments)]
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
    let platform_config = &mut ctx.accounts.platform_config;

    if let Some(programs) = allowed_swap_programs {
        // Validate program list size
        if programs.len() > MAX_ALLOWED_SWAP_PROGRAMS {
            return Err(W3SwapError::AllowedSwapProgramsListFull.into());
        }

        // Validate no default pubkeys
        for program in &programs {
            validate_not_default_pubkey(program)?;
        }

        platform_config.allowed_swap_programs = programs;
    }

    if let Some(min_commitment) = min_sol_commitment {
        // Validate minimum is reasonable (at least 0.1 SOL)
        if min_commitment < 100_000_000 {
            return Err(W3SwapError::InvalidSolCommitment.into());
        }
        platform_config.min_sol_commitment = min_commitment;
    }

    if let Some(threshold_percent) = auto_pause_threshold_percent {
        // Validate threshold percent is reasonable (1-50%)
        if threshold_percent == 0 || threshold_percent > 50 {
            return Err(W3SwapError::InvalidThresholdPercent.into());
        }
        platform_config.auto_pause_threshold_percent = threshold_percent;
    }

    if let Some(fee_sol) = platform_fee_sol {
        // Accept whole-SOL input and convert to lamports
        // Allow 0-100 SOL to keep it sane for config
        let fee_sol_u64 = fee_sol as u64;
        if fee_sol_u64 > 100 {
            return Err(W3SwapError::InvalidInstructionData.into());
        }
        platform_config.platform_fee_lamports = fee_sol_u64.saturating_mul(1_000_000_000);
    }

    if let Some(percent) = settlement_fee_percent {
        // Whole percent 0-100
        if percent > 100 {
            return Err(W3SwapError::InvalidInstructionData.into());
        }
        platform_config.settlement_fee_percent = percent;
    }

    if let Some(min_days) = min_migration_days {
        // Accept 1-180 days for dev flexibility
        if min_days == 0 || min_days > 180 {
            return Err(W3SwapError::InvalidInstructionData.into());
        }
        platform_config.min_migration_days = min_days;
    }

    if let Some(max_days) = max_migration_days {
        if max_days == 0 {
            return Err(W3SwapError::InvalidInstructionData.into());
        }
        platform_config.max_migration_days = max_days;
    }

    // Ensure min <= max when both are set (or using existing values)
    if platform_config.min_migration_days as u16 > platform_config.max_migration_days as u16 {
        return Err(W3SwapError::InvalidInstructionData.into());
    }

    if let Some(lock_days) = min_lp_lock_days {
        if lock_days == 0 {
            return Err(W3SwapError::InvalidInstructionData.into());
        }
        platform_config.min_lp_lock_days = lock_days;
    }

    emit!(PlatformConfigUpdated {
        super_admin: ctx.accounts.super_admin.key(),
        allowed_swap_programs_count: platform_config.allowed_swap_programs.len() as u8,
        timestamp: current_timestamp(),
    });

    Ok(())
}

/// Update fee destination wallet
pub fn update_fee_destination_wallet(
    ctx: Context<UpdateFeeDestinationWallet>,
    new_fee_destination: Pubkey,
) -> Result<()> {
    validate_not_default_pubkey(&new_fee_destination)?;

    let platform_config = &mut ctx.accounts.platform_config;
    let old_fee_destination = platform_config.fee_destination_wallet;

    platform_config.fee_destination_wallet = new_fee_destination;

    emit!(FeeDestinationWalletUpdated {
        super_admin: ctx.accounts.super_admin.key(),
        old_fee_destination,
        new_fee_destination,
        timestamp: current_timestamp(),
    });

    Ok(())
}
