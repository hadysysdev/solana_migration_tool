use crate::state::ProjectStatus;
use anchor_lang::prelude::*;

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

/// Migration performed event.
///
/// Amount fields are derived from on-chain state and therefore publicly disclose migration flow
/// totals. Operators concerned about business-sensitive metrics should account for that
/// transparency when configuring migrations.
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

/// Settlement completed event (LP created and lockup starts).
///
/// Settlement amounts originate from on-chain balances and are globally visible, which may reveal
/// revenue or treasury performance metrics to observers.
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

/// Swap executed via adapter (Jupiter/Meteora).
///
/// Route and amount fields expose precise trading flow on-chain; treat them as public diagnostics
/// rather than private accounting data.
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

/// Old token batch swap executed during liquidation.
///
/// Amount fields log observed vault deltas on-chain, so liquidation throughput and inventory levels
/// are inherently public when this event is emitted.
#[event]
pub struct OldTokenBatchSwapped {
    pub project_id: u64,
    pub project_pda: Pubkey,
    pub backend: String, // "Jupiter" or "Meteora"
    /// Actual old-token balance delta observed in the vault (handles fee-on-transfer tokens)
    pub amount_in: u64,
    /// Actual WSOL balance delta observed in the vault (post-fee amount received)
    pub amount_out: u64,
    pub remaining_balance: u64,
    pub slot: u64,
    pub timestamp: i64,
}

/// Old token liquidation completed.
///
/// The totals emitted here are calculated from on-chain balances, revealing liquidation outcomes
/// to the broader network; plan accordingly if this data is considered sensitive.
#[event]
pub struct OldTokenLiquidationComplete {
    pub project_id: u64,
    pub project_pda: Pubkey,
    pub total_old_sold: u64,
    pub total_wsol_received: u64,
    pub backend: String, // "Jupiter" or "Meteora"
    pub timestamp: i64,
}

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
