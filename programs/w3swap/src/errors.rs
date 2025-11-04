use anchor_lang::prelude::*;

#[error_code]
pub enum W3SwapError {
    #[msg("Unauthorized: Not super admin")]
    NotSuperAdmin,
    
    #[msg("Unauthorized: Not project admin")]
    NotProjectAdmin,
    
    #[msg("Project admin list is full")]
    ProjectAdminListFull,
    
    #[msg("Project admin not found")]
    ProjectAdminNotFound,
    
    #[msg("Project admin already exists")]
    ProjectAdminAlreadyExists,
    
    #[msg("Allowed swap programs list is full")]
    AllowedSwapProgramsListFull,
    
    #[msg("Invalid migration duration (must be exactly 30, 60, or 90 days)")]
    InvalidMigrationDuration,
    
    #[msg("Invalid migration period (start/end timestamps)")]
    InvalidMigrationPeriod,
    
    #[msg("Invalid exchange ratio")]
    InvalidExchangeRatio,
    
    #[msg("Invalid protection percentage (50-100%)")]
    InvalidProtectionPercentage,
    
    #[msg("Invalid recovery delay (7-30 days)")]
    InvalidRecoveryDelay,
    
    #[msg("Allow list is full")]
    AllowListFull,
    
    #[msg("Deny list is full")]
    DenyListFull,
    
    #[msg("Project not in correct status")]
    InvalidProjectStatus,
    
    #[msg("Migration not active")]
    MigrationNotActive,
    
    #[msg("User not allowed to migrate")]
    UserNotAllowed,
    
    #[msg("User is on deny list")]
    UserOnDenyList,
    
    #[msg("User not on allow list")]
    UserNotOnAllowList,
    
    #[msg("Insufficient tokens in vault")]
    InsufficientTokensInVault,
    
    #[msg("Insufficient SOL for protection")]
    InsufficientSolForProtection,
    
    #[msg("Project not funded")]
    ProjectNotFunded,
    
    #[msg("Migration period has ended")]
    MigrationPeriodEnded,
    
    #[msg("Migration period has not ended")]
    MigrationPeriodNotEnded,
    
    #[msg("LP creation deadline not reached")]
    LpCreationDeadlineNotReached,
    
    #[msg("LP already created")]
    LpAlreadyCreated,
    
    #[msg("LP not created")]
    LpNotCreated,
    
    #[msg("LP still locked")]
    LpStillLocked,
    
    #[msg("Lockup period has not ended")]
    LockupPeriodNotEnded,
    
    #[msg("Recovery period not started")]
    RecoveryPeriodNotStarted,
    
    #[msg("Refund already claimed")]
    RefundAlreadyClaimed,
    
    #[msg("No refund available")]
    NoRefundAvailable,
    
    #[msg("Protection not enabled")]
    ProtectionNotEnabled,
    
    #[msg("Program not allowed for routes")]
    ProgramNotAllowedForRoutes,
    
    #[msg("Minimum output not met")]
    MinimumOutputNotMet,
    
    #[msg("Invalid token program")]
    InvalidTokenProgram,
    
    #[msg("Amount is zero")]
    AmountIsZero,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Invalid PDA seeds")]
    InvalidPdaSeeds,
    
    #[msg("Account already initialized")]
    AccountAlreadyInitialized,
    
    #[msg("Account not initialized")]
    AccountNotInitialized,
    
    #[msg("Invalid account owner")]
    InvalidAccountOwner,
    
    #[msg("Token mint mismatch")]
    TokenMintMismatch,
    
    #[msg("Invalid vault authority")]
    InvalidVaultAuthority,
    
    #[msg("CPI call failed")]
    CpiCallFailed,
    
    #[msg("Invalid instruction data")]
    InvalidInstructionData,
    
    #[msg("Route execution failed")]
    RouteExecutionFailed,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageToleranceExceeded,
    
    #[msg("Special ratio list is empty")]
    EmptySpecialRatioList,
    
    #[msg("Special ratio list is full")]
    SpecialRatioListFull,
    
    #[msg("Invalid special ratio configuration")]
    InvalidSpecialRatioConfig,
    
    #[msg("Invalid SOL commitment amount")]
    InvalidSolCommitment,
    
    #[msg("SOL commitment is below platform minimum")]
    InsufficientSolCommitment,
    
    #[msg("Invalid LP creation deadline (1-30 days)")]
    InvalidLpCreationDeadline,
    
    #[msg("Project cannot be activated before start time")]
    ProjectNotReady,
    
    #[msg("Invalid auto-pause threshold percentage")]
    InvalidThresholdPercent,
    
    #[msg("Vault balance too low to resume - please top up vault")]
    InsufficientVaultBalanceToResume,
    
    #[msg("Invalid route account structure")]
    InvalidRouteAccount,
    
    #[msg("Route exceeds maximum hop count")]
    RouteExceedsMaxHops,
    
    #[msg("Insufficient compute budget for route")]
    InsufficientComputeBudget,
    
    #[msg("Invalid Jupiter program state")]
    InvalidJupiterProgramState,
    
    #[msg("Invalid Meteora pool configuration")]
    InvalidMeteoraPoolConfig,
}