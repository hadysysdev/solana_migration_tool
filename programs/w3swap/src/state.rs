use anchor_lang::prelude::*;

/// Maximum number of project admins allowed
pub const MAX_PROJECT_ADMINS: usize = 50;

/// Maximum number of allowed swap programs
pub const MAX_ALLOWED_SWAP_PROGRAMS: usize = 20;

/// Maximum number of allow/deny list entries per project
pub const MAX_ALLOWLIST_ENTRIES: usize = 1000;

/// Platform fee amount in lamports (1 SOL)
pub const PLATFORM_FEE_LAMPORTS: u64 = 2_000_000_000;

/// Maximum migration duration in seconds (90 days)
pub const MAX_MIGRATION_DURATION: i64 = 90 * 24 * 60 * 60;

/// Preset migration duration options
pub const MIGRATION_DURATION_30_DAYS: i64 = 30 * 24 * 60 * 60;
pub const MIGRATION_DURATION_60_DAYS: i64 = 60 * 24 * 60 * 60;
pub const MIGRATION_DURATION_90_DAYS: i64 = 90 * 24 * 60 * 60;

/// Minimum recovery delay in seconds (7 days)
pub const MIN_RECOVERY_DELAY: i64 = 7 * 24 * 60 * 60;

/// Maximum recovery delay in seconds (30 days)
pub const MAX_RECOVERY_DELAY: i64 = 30 * 24 * 60 * 60;

/// Minimum LP lock duration in seconds (30 days)
pub const MIN_LP_LOCK_DURATION: i64 = 30 * 24 * 60 * 60;

/// Minimum LP creation deadline in days (1 day)
pub const MIN_LP_CREATION_DEADLINE_DAYS: u8 = 1;

/// Maximum LP creation deadline in days (30 days)
pub const MAX_LP_CREATION_DEADLINE_DAYS: u8 = 30;

/// Minimum protection percentage (50%)
pub const MIN_PROTECTION_PERCENTAGE: u8 = 50;

/// Maximum protection percentage (100%)
pub const MAX_PROTECTION_PERCENTAGE: u8 = 100;

/// Platform configuration PDA
/// Seeds: ["platform_config"]
#[account]
pub struct PlatformConfig {
    /// Super admin who can manage everything
    pub super_admin: Pubkey,

    /// List of project admins who can create projects
    pub project_admins: Vec<Pubkey>,

    /// Wallet to receive platform fees
    pub fee_destination_wallet: Pubkey,

    /// Programs allowed for finalization routes
    pub allowed_swap_programs: Vec<Pubkey>,

    /// Minimum SOL commitment required for LP creation (in lamports)
    pub min_sol_commitment: u64,

    /// Auto-pause threshold percentage (e.g., 10 = 10% of one token)
    pub auto_pause_threshold_percent: u8,

    /// Platform fee charged (in lamports). Configured via a simple SOL integer input
    /// and converted to lamports on-chain.
    pub platform_fee_lamports: u64,

    /// Settlement fee in whole percent (0-100). For example, 1 = 1%.
    pub settlement_fee_percent: u8,

    /// Minimum migration duration in days (simple input)
    pub min_migration_days: u8,

    /// Maximum migration duration in days (simple input)
    pub max_migration_days: u8,

    /// Minimum LP lock duration in days (simple input)
    pub min_lp_lock_days: u8,

    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl PlatformConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // super_admin
        4 + (32 * MAX_PROJECT_ADMINS) + // project_admins vector
        32 + // fee_destination_wallet  
        4 + (32 * MAX_ALLOWED_SWAP_PROGRAMS) + // allowed_swap_programs vector
        8 + // min_sol_commitment
        1 + // auto_pause_threshold_percent
        8 + // platform_fee_lamports
        1 + // settlement_fee_percent
        1 + // min_migration_days
        1 + // max_migration_days
        1 + // min_lp_lock_days
        1; // bump
}

/// Migration project PDA
/// Seeds: ["project", project_admin.key(), project_id]
#[account]
pub struct Project {
    /// Unique project identifier
    pub project_id: u64,

    /// Admin who created and manages this project
    pub project_admin: Pubkey,

    /// Old token mint to migrate from
    pub old_token_mint: Pubkey,

    /// New token mint to migrate to
    pub new_token_mint: Pubkey,

    /// Token program for old token (SPL or Token-2022)
    pub old_token_program: Pubkey,

    /// Token program for new token (SPL or Token-2022)
    pub new_token_program: Pubkey,

    /// Vault holding old tokens
    pub old_token_vault: Pubkey,

    /// Vault holding new tokens for distribution
    pub new_token_vault: Pubkey,

    /// Vault holding SOL/WSOL commitment for LP
    pub liquidity_vault: Pubkey,

    /// Vault holding WSOL proceeds from swaps
    pub wsol_vault: Pubkey,

    /// LP token escrow vault
    pub lp_escrow_vault: Pubkey,

    /// Current project status
    pub status: ProjectStatus,

    /// Migration start timestamp
    pub migration_start: i64,

    /// Migration end timestamp (dynamically calculated)
    pub migration_end: i64,

    /// Migration duration in seconds (as specified by admin)
    pub migration_duration: i64,

    /// Total pause duration in seconds (accumulated)
    pub total_pause_duration: i64,

    /// Last pause timestamp (0 if not paused)
    pub last_pause_start: i64,

    /// Actual activation timestamp (when project became active)
    pub activated_at: i64,

    /// Exchange ratio numerator (0 = 1:1 ratio)
    pub exchange_ratio_numerator: u64,

    /// Exchange ratio denominator (0 = 1:1 ratio)
    pub exchange_ratio_denominator: u64,

    /// Auto-pause threshold percent copied from platform at creation
    pub auto_pause_threshold_percent: u8,

    // Protection removed
    /// Project display name
    pub project_name: String,

    /// Total old tokens migrated
    pub total_old_migrated: u64,

    /// Total new tokens distributed
    pub total_new_distributed: u64,

    /// Total SOL committed for protection
    pub total_sol_committed: u64,

    /// LP created flag
    pub lp_created: bool,

    /// LP tokens deposited to escrow
    pub lp_tokens_deposited: u64,

    /// LP lock end timestamp
    pub lp_lock_end: i64,

    /// Meteora LP pool address (created at activation)
    pub meteora_pool: Pubkey,

    /// LP configuration used for pool creation
    pub lp_config: Option<LpConfiguration>,

    /// Special ratio enabled for certain wallets
    pub special_ratio_enabled: bool,

    /// Special ratio wallets (who get special exchange rate)
    pub special_ratio_wallets: Vec<Pubkey>,

    /// Allow list enabled
    pub allowlist_enabled: bool,

    /// Deny list enabled  
    pub denylist_enabled: bool,

    /// Allow list entries (only allocated if enabled)
    pub allowlist: Option<Vec<Pubkey>>,

    /// Deny list entries (only allocated if enabled)
    pub denylist: Option<Vec<Pubkey>>,

    /// Total old tokens sold during liquidation
    pub total_old_sold: u64,

    /// Total WSOL received from liquidation
    pub total_wsol_received: u64,

    /// Liquidation backend being used
    pub liquidation_backend: Option<SwapBackend>,

    /// Last slot where liquidation was processed
    pub last_liquidation_slot: u64,

    /// Flag to prevent reentrant liquidation calls
    pub liquidation_in_progress: bool,

    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Project {
    pub const LEN: usize = 8 + // discriminator
        8 + // project_id
        32 + // project_admin
        32 + // old_token_mint
        32 + // new_token_mint
        32 + // old_token_program
        32 + // new_token_program
        32 + // old_token_vault
        32 + // new_token_vault
        32 + // liquidity_vault
        32 + // wsol_vault
        32 + // lp_escrow_vault
        1 + // status enum
        8 + // migration_start
        8 + // migration_end
        8 + // migration_duration
        8 + // total_pause_duration
        8 + // last_pause_start
        8 + // activated_at
        8 + // exchange_ratio_numerator
        8 + // exchange_ratio_denominator
        1 + // auto_pause_threshold_percent
        // protection removed - no bytes allocated
        4 + 32 + // project_name (String: 4 bytes length + 32 bytes max content)
        8 + // total_old_migrated
        8 + // total_new_distributed
        8 + // total_sol_committed
        1 + // lp_created
        8 + // lp_tokens_deposited
        8 + // lp_lock_end
        32 + // meteora_pool
        1 + 36 + // lp_config (Option + LpConfiguration size)
        1 + // special_ratio_enabled
        4 + (32 * MAX_ALLOWLIST_ENTRIES) + // special_ratio_wallets
        1 + // allowlist_enabled
        1 + // denylist_enabled
        1 + 4 + (32 * MAX_ALLOWLIST_ENTRIES) + // allowlist (Option + Vec)
        1 + 4 + (32 * MAX_ALLOWLIST_ENTRIES) + // denylist (Option + Vec)
        8 + // total_old_sold
        8 + // total_wsol_received
        1 + 1 + // liquidation_backend (Option + SwapBackend)
        8 + // last_liquidation_slot
        1 + // liquidation_in_progress
        1; // bump

    /// Calculate current end time including pause extensions
    pub fn calculate_current_end_time(&self) -> i64 {
        if self.activated_at == 0 {
            // Not activated yet, return original estimate
            return self.migration_end;
        }

        // Calculate dynamic end time: activated_at + duration + total_pause_time
        self.activated_at + self.migration_duration + self.total_pause_duration
    }

    /// Check if migration is currently active
    pub fn is_migration_active(&self) -> bool {
        let now = Clock::get().unwrap().unix_timestamp;
        // NOTE: `now` reflects the Solana cluster clock, which can drift by roughly ±25 seconds
        // from wall-clock time. Operators should consider that window when interpreting
        // start/end comparisons for migration activity.
        let current_end_time = self.calculate_current_end_time();

        self.status == ProjectStatus::Active
            && now >= self.migration_start
            && now <= current_end_time
    }

    /// Update pause tracking when pausing
    pub fn start_pause(&mut self) -> Result<()> {
        let now = Clock::get().unwrap().unix_timestamp;

        if self.last_pause_start != 0 {
            return Err(ProgramError::InvalidArgument.into()); // Already paused
        }

        self.last_pause_start = now;
        Ok(())
    }

    /// Update pause tracking when resuming
    pub fn end_pause(&mut self) -> Result<()> {
        let now = Clock::get().unwrap().unix_timestamp;

        if self.last_pause_start == 0 {
            return Err(ProgramError::InvalidArgument.into()); // Not paused
        }

        // Add this pause duration to total
        let pause_duration = now - self.last_pause_start;
        self.total_pause_duration += pause_duration;

        // Update end time to account for this pause
        self.migration_end = self.calculate_current_end_time();

        // Reset pause start
        self.last_pause_start = 0;

        Ok(())
    }

    /// Check if user is allowed to migrate
    pub fn is_user_allowed(&self, user: &Pubkey) -> bool {
        // If deny list is enabled, check user is not on it
        if self.denylist_enabled {
            if let Some(ref denylist) = self.denylist {
                if denylist.contains(user) {
                    return false;
                }
            }
        }

        // If allow list is enabled, check user is on it
        if self.allowlist_enabled {
            if let Some(ref allowlist) = self.allowlist {
                return allowlist.contains(user);
            }
            return false; // Allow list enabled but empty means no one allowed
        }

        // If no lists enabled, all users allowed
        true
    }

    /// Check if user gets special exchange ratio
    pub fn is_special_ratio_user(&self, user: &Pubkey) -> bool {
        self.special_ratio_enabled && self.special_ratio_wallets.contains(user)
    }

    /// Calculate new tokens to receive for old tokens
    pub fn calculate_new_tokens(&self, old_amount: u64, user: &Pubkey) -> Result<u64> {
        // Check if user gets special ratio
        if self.is_special_ratio_user(user) {
            // Special ratio users get the special exchange rate
            if self.exchange_ratio_numerator == 0 || self.exchange_ratio_denominator == 0 {
                return Err(ProgramError::InvalidArgument.into()); // Should not happen if validation works
            }

            let new_amount = (old_amount as u128)
                .checked_mul(self.exchange_ratio_numerator as u128)
                .ok_or(ProgramError::ArithmeticOverflow)?
                .checked_div(self.exchange_ratio_denominator as u128)
                .ok_or(ProgramError::ArithmeticOverflow)?;

            Ok(new_amount as u64)
        } else {
            // Default 1:1 ratio for all other users
            Ok(old_amount)
        }
    }

    /// Check if LP can be withdrawn (lockup period ended after settlement)
    pub fn can_withdraw_lp(&self) -> bool {
        let now = Clock::get().unwrap().unix_timestamp;
        // LP must be created, settlement complete (status = Finalized), and lockup period ended
        self.lp_created
        && self.status == ProjectStatus::Finalized
        && self.lp_lock_end > 0 // Lockup period was set (settlement completed)
        && now >= self.lp_lock_end
    }

    // Protection/refund timing removed
}

/// Swap backend selection for liquidation
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum SwapBackend {
    Meteora,
    Jupiter,
}

/// Pool type selection for LP creation
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum PoolType {
    MeteoraDlmm,
    // Future support:
    // OrcaWhirlpool,
    // RaydiumAmm,
}

/// Project status enumeration
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProjectStatus {
    /// Project created but not yet funded
    Created,
    /// Project funded but not active
    Funded,
    /// Project active for migrations
    Active,
    /// Project temporarily paused
    Paused,
    /// Project migration period ended
    Ended,
    /// Project migration completed, ready for liquidation
    Migrated,
    /// Project liquidation in progress
    Liquidating,
    /// Project liquidation completed
    LiquidationComplete,
    /// Project finalized (LP created)
    Finalized,
}

/// Admin action for managing project admins
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum AdminAction {
    Add,
    Remove,
}

/// Parameters for creating a new project
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateProjectParams {
    /// Unique project identifier
    pub project_id: u64,

    /// Project display name
    pub project_name: String,

    /// Old token mint to migrate from
    pub old_token_mint: Pubkey,

    /// New token mint to migrate to
    pub new_token_mint: Pubkey,

    /// Token program for old token
    pub old_token_program: Pubkey,

    /// Token program for new token
    pub new_token_program: Pubkey,

    /// Migration start timestamp
    pub migration_start: i64,

    /// Migration end timestamp
    pub migration_end: i64,

    /// Exchange ratio numerator (0 for 1:1)
    pub exchange_ratio_numerator: u64,

    /// Exchange ratio denominator (0 for 1:1)
    pub exchange_ratio_denominator: u64,

    /// SOL commitment amount for LP creation (in lamports)
    pub sol_commitment_amount: u64,

    /// Enable special ratio for certain wallets
    pub special_ratio_enabled: bool,

    /// Wallets that get special exchange ratio
    pub special_ratio_wallets: Vec<Pubkey>,

    /// Enable allow list
    pub allowlist_enabled: bool,

    /// Enable deny list
    pub denylist_enabled: bool,

    /// Allow list entries
    pub allowlist: Vec<Pubkey>,

    /// Deny list entries
    pub denylist: Vec<Pubkey>,
}

/// LP Configuration for initial liquidity creation
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct LpConfiguration {
    /// Initial price for new token (in SOL per token)
    pub initial_price: u64, // Scaled by 1e9 for precision

    /// Amount of new tokens to allocate for LP
    pub token_allocation: u64,

    /// Meteora bin step (price precision in basis points)
    pub bin_step: u16,

    /// Base trading fee in basis points
    pub base_fee: u16,

    /// Price range for concentrated liquidity
    pub price_range_min: u64, // Scaled by 1e9
    pub price_range_max: u64, // Scaled by 1e9

    /// Initial active bin ID (calculated off-chain from price)
    pub initial_active_id: i32,

    /// Activation type (0 = Slot, 1 = Timestamp)
    pub activation_type: u8,

    /// Activation point (slot or timestamp)
    pub activation_point: u64,

    /// Enable alpha vault
    pub has_alpha_vault: bool,
}

/// User migration record PDA
/// Seeds: ["user_migration", project.key(), user.key()]
#[account]
pub struct UserMigration {
    /// Project this migration belongs to
    pub project: Pubkey,

    /// User who performed the migration
    pub user: Pubkey,

    /// Total old tokens migrated by user
    pub old_tokens_migrated: u64,

    /// Total new tokens received by user
    pub new_tokens_received: u64,

    /// SOL committed for protection
    pub sol_committed: u64,

    /// Refund claimed flag
    pub refund_claimed: bool,

    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl UserMigration {
    pub const LEN: usize = 8 + // discriminator
        32 + // project
        32 + // user
        8 + // old_tokens_migrated
        8 + // new_tokens_received
        8 + // sol_committed
        1 + // refund_claimed
        1; // bump
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn project_len_covers_runtime_struct() {
        let runtime = 8 + core::mem::size_of::<Project>();
        assert!(Project::LEN >= runtime);
    }

    #[test]
    fn test_project_offsets() {
        // Verify that project_id is at offset 8 (after discriminator)
        // and project_admin is at offset 16 (after project_id)
        // This ensures that our partial serialization in allocate_project_account is safe
        
        // We can't easily check offsets of fields in Rust without unsafe or mem::transmute tricks
        // or by serializing a dummy struct. Let's use serialization.
        
        let dummy_pubkey = Pubkey::new_unique();
        let project = Project {
            project_id: 0x1234567890ABCDEF,
            project_admin: dummy_pubkey,
            // Fill rest with defaults/zeros
            old_token_mint: Pubkey::default(),
            new_token_mint: Pubkey::default(),
            old_token_program: Pubkey::default(),
            new_token_program: Pubkey::default(),
            old_token_vault: Pubkey::default(),
            new_token_vault: Pubkey::default(),
            liquidity_vault: Pubkey::default(),
            wsol_vault: Pubkey::default(),
            lp_escrow_vault: Pubkey::default(),
            status: ProjectStatus::Created,
            migration_start: 0,
            migration_end: 0,
            migration_duration: 0,
            total_pause_duration: 0,
            last_pause_start: 0,
            activated_at: 0,
            exchange_ratio_numerator: 0,
            exchange_ratio_denominator: 0,
            auto_pause_threshold_percent: 0,
            project_name: "".to_string(),
            total_old_migrated: 0,
            total_new_distributed: 0,
            total_sol_committed: 0,
            lp_created: false,
            lp_tokens_deposited: 0,
            lp_lock_end: 0,
            meteora_pool: Pubkey::default(),
            lp_config: None,
            special_ratio_enabled: false,
            special_ratio_wallets: vec![],
            allowlist_enabled: false,
            denylist_enabled: false,
            allowlist: None,
            denylist: None,
            total_old_sold: 0,
            total_wsol_received: 0,
            liquidation_backend: None,
            last_liquidation_slot: 0,
            liquidation_in_progress: false,
            bump: 0,
        };
        
        let mut data = Vec::new();
        // Anchor accounts have an 8-byte discriminator that is NOT part of the struct fields
        // when using #[account]. However, when we serialize the struct manually (if it derived AnchorSerialize),
        // it wouldn't include the discriminator unless we added it.
        // But Project uses #[account], so `try_to_vec` might behave differently depending on context.
        // Actually, #[account] implements AnchorSerialize/Deserialize which DOES NOT include the discriminator.
        // The discriminator is handled by the Account wrapper.
        
        project.serialize(&mut data).unwrap();
        
        // In the serialized data of the STRUCT (without account discriminator):
        // offset 0 should be project_id (u64)
        // offset 8 should be project_admin (Pubkey)
        
        let id_bytes: [u8; 8] = data[0..8].try_into().unwrap();
        let id = u64::from_le_bytes(id_bytes);
        assert_eq!(id, 0x1234567890ABCDEF);
        
        let admin_bytes: [u8; 32] = data[8..40].try_into().unwrap();
        let admin = Pubkey::new_from_array(admin_bytes);
        assert_eq!(admin, dummy_pubkey);
        
        // This confirms that:
        // Account Data [0..8] = Discriminator
        // Account Data [8..16] = project_id
        // Account Data [16..48] = project_admin
        // Which matches our manual writing in allocate_project_account
    }
}
