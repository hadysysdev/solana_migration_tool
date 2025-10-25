use anchor_lang::prelude::*;
use crate::state::ProjectStatus;

/// Platform initialized event
#[event]
pub struct PlatformInitialized {
    pub super_admin: Pubkey,
    pub fee_destination_wallet: Pubkey,
    pub timestamp: i64,
}

/// Project admin managed event
#[event]
pub struct ProjectAdminManaged {
    pub super_admin: Pubkey,
    pub admin: Pubkey,
    pub action: String, // "added" or "removed"
    pub timestamp: i64,
}

/// Platform config updated event
#[event]
pub struct PlatformConfigUpdated {
    pub super_admin: Pubkey,
    pub allowed_swap_programs_count: u8,
    pub timestamp: i64,
}

/// Fee destination wallet updated event
#[event]
pub struct FeeDestinationWalletUpdated {
    pub super_admin: Pubkey,
    pub old_fee_destination: Pubkey,
    pub new_fee_destination: Pubkey,
    pub timestamp: i64,
}

/// Project created event
#[event]
pub struct ProjectCreated {
    pub project_id: u64,
    pub project_admin: Pubkey,
    pub project_pda: Pubkey,
    pub old_token_mint: Pubkey,
    pub new_token_mint: Pubkey,
    pub migration_duration: i64,
    pub allowlist_enabled: bool,
    pub denylist_enabled: bool,
    pub timestamp: i64,
}

/// Project funded event
#[event]
pub struct ProjectFunded {
    pub project_id: u64,
    pub project_admin: Pubkey,
    pub project_pda: Pubkey,
    pub amount: u64,
    pub total_funded: u64,
    pub timestamp: i64,
}

/// Project status changed event
#[event]
pub struct ProjectStatusChanged {
    pub project_id: u64,
    pub project_admin: Pubkey,
    pub project_pda: Pubkey,
    pub old_status: ProjectStatus,
    pub new_status: ProjectStatus,
    pub timestamp: i64,
}

/// Migration performed event
#[event]
pub struct MigrationPerformed {
    pub project_id: u64,
    pub project_pda: Pubkey,
    pub user: Pubkey,
    pub old_tokens_amount: u64,
    pub new_tokens_amount: u64,
    pub total_old_migrated: u64,
    pub total_new_distributed: u64,
    pub timestamp: i64,
}

/// Settlement completed event (LP created and lockup starts)
#[event]
pub struct SettlementCompleted {
    pub project_id: u64,
    pub project_admin: Pubkey,
    pub project_pda: Pubkey,
    pub total_sol_from_sales: u64,
    pub lp_tokens_escrowed: u64,
    pub lockup_starts_at: i64,
    pub lockup_ends_at: i64,
    pub timestamp: i64,
}

/// Swap executed via adapter (Jupiter/Meteora)
#[event]
pub struct SwapExecuted {
    pub project_id: u64,
    pub project_pda: Pubkey,
    pub route_program: Pubkey,
    pub amount_in: u64,
    pub min_out_wsol: u64,
    pub amount_out_wsol: u64,
    pub wsol_balance_after: u64,
    pub timestamp: i64,
}

/// Project finalized event (after lockup - admin claims LP tokens)
#[event]
pub struct ProjectFinalized {
    pub project_id: u64,
    pub project_admin: Pubkey,
    pub project_pda: Pubkey,
    pub lp_tokens_claimed: u64,
    pub new_tokens_claimed: u64,
    pub rent_reclaimed: u64,
    pub timestamp: i64,
}

/// LP created event
#[event]
pub struct LpCreated {
    pub project_id: u64,
    pub project_admin: Pubkey,
    pub project_pda: Pubkey,
    pub timestamp: i64,
}

/// LP deposited event
#[event]
pub struct LpDeposited {
    pub project_id: u64,
    pub project_admin: Pubkey,
    pub project_pda: Pubkey,
    pub amount: u64,
    pub total_deposited: u64,
    pub lock_end_timestamp: i64,
    pub timestamp: i64,
}

/// LP withdrawn event
#[event]
pub struct LpWithdrawn {
    pub project_id: u64,
    pub project_admin: Pubkey,
    pub project_pda: Pubkey,
    pub amount: u64,
    pub remaining_deposited: u64,
    pub timestamp: i64,
}

// Refund and sweep events removed

/// Vault balance low event (triggers auto-pause)
#[event]
pub struct VaultBalanceLow {
    pub project_id: u64,
    pub project_admin: Pubkey,
    pub project_pda: Pubkey,
    pub remaining_balance: u64,
    pub required_amount: u64,
    pub timestamp: i64,
}
