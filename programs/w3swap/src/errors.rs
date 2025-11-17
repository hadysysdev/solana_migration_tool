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

    // General utility errors
    #[msg("Amount must be greater than zero")]
    AmountIsZero,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Invalid instruction data provided")]
    InvalidInstructionData,

    #[msg("Invalid token program for the given account")]
    InvalidTokenProgram,

    #[msg("Invalid account owner")]
    InvalidAccountOwner,

    #[msg("Token mint mismatch")]
    TokenMintMismatch,

    #[msg("Cross-program invocation failed")]
    CpiCallFailed,

    #[msg("Insufficient tokens available in vault")]
    InsufficientTokensInVault,

    #[msg("Minimum output requirement not met")]
    MinimumOutputNotMet,

    #[msg("Slippage tolerance exceeded")]
    SlippageToleranceExceeded,

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

    #[msg("Insufficient SOL commitment for project")]
    InsufficientSolCommitment,

    #[msg("Insufficient SOL provided for protection")]
    InsufficientSolForProtection,

    #[msg("Allow list is full")]
    AllowListFull,

    #[msg("Deny list is full")]
    DenyListFull,

    #[msg("Special ratio list is full")]
    SpecialRatioListFull,

    #[msg("Special ratio list cannot be empty")]
    EmptySpecialRatioList,

    #[msg("Invalid special ratio configuration")]
    InvalidSpecialRatioConfig,

    #[msg("Project not in correct status")]
    InvalidProjectStatus,

    #[msg("Migration not active")]
    MigrationNotActive,

    #[msg("Migration period has ended")]
    MigrationPeriodEnded,

    #[msg("User not allowed to migrate")]
    UserNotAllowedToMigrate,

    #[msg("Migration already completed")]
    MigrationAlreadyCompleted,

    #[msg("Migration expired")]
    MigrationExpired,

    #[msg("Invalid migration amount")]
    InvalidMigrationAmount,

    #[msg("Insufficient token balance for migration")]
    InsufficientTokenBalance,

    #[msg("New token account not provided")]
    NewTokenAccountNotProvided,

    #[msg("Old token account not provided")]
    OldTokenAccountNotProvided,

    #[msg("Invalid token account owner")]
    InvalidTokenAccountOwner,

    #[msg("Token account is frozen")]
    TokenAccountFrozen,

    #[msg("Invalid exchange rate")]
    InvalidExchangeRate,

    #[msg("Exchange rate already set")]
    ExchangeRateAlreadySet,

    #[msg("Exchange rate not set")]
    ExchangeRateNotSet,

    #[msg("Invalid LP creation deadline (1-30 days)")]
    InvalidLpCreationDeadline,

    #[msg("LP already created")]
    LpAlreadyCreated,

    #[msg("LP not created yet")]
    LpNotCreated,

    #[msg("LP tokens are still locked")]
    LpStillLocked,

    #[msg("Lockup period has not ended")]
    LockupPeriodNotEnded,

    #[msg("Project not funded")]
    ProjectNotFunded,

    #[msg("Project cannot be activated before start time")]
    ProjectNotReady,

    #[msg("Invalid auto-pause threshold percentage")]
    InvalidThresholdPercent,

    #[msg("Invalid SOL commitment amount")]
    InvalidSolCommitment,

    #[msg("Vault balance too low to resume - please top up vault")]
    InsufficientVaultBalanceToResume,

    // Route-related errors (from routing feature)
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

    // Liquidation-related errors (from liquidation feature)
    #[msg("Liquidation not allowed - project not in correct status")]
    LiquidationNotAllowed,

    #[msg("Liquidation already in progress - reentrancy not allowed")]
    LiquidationInProgress,

    #[msg("No old tokens remaining to liquidate")]
    NoOldTokensRemaining,

    #[msg("Invalid swap backend specified")]
    InvalidSwapBackend,

    #[msg("Liquidation already completed")]
    LiquidationAlreadyCompleted,

    #[msg("Invalid remaining accounts for liquidation")]
    InvalidLiquidationAccounts,

    #[msg("Liquidation amount exceeds available balance")]
    LiquidationAmountExceedsBalance,

    #[msg("Slippage protection triggered during liquidation")]
    LiquidationSlippageExceeded,

    #[msg("Invalid liquidation account configuration")]
    InvalidLiquidationAccountConfig,

    #[msg("Program not allowed for routing operations")]
    ProgramNotAllowedForRoutes,

    #[msg("User migration account already initialized")]
    UserMigrationAlreadyInitialized,

    #[msg("User migration account does not match expected project or user")]
    UserMigrationAccountMismatch,
}
