use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenInterface, TokenAccount, Mint};
use crate::errors::W3SwapError;
use crate::state::{MIGRATION_DURATION_30_DAYS, MIGRATION_DURATION_60_DAYS, MIGRATION_DURATION_90_DAYS};

/// Token program IDs
pub const SPL_TOKEN_ID: Pubkey = anchor_spl::token::ID;
pub const TOKEN_2022_ID: Pubkey = anchor_spl::token_2022::ID;

/// Validates that an account is a valid token program (SPL or Token-2022)
pub fn validate_token_program(program_id: &Pubkey) -> Result<()> {
    if program_id != &SPL_TOKEN_ID && program_id != &TOKEN_2022_ID {
        return Err(W3SwapError::InvalidTokenProgram.into());
    }
    Ok(())
}

/// Determines if the token program is Token-2022
pub fn is_token_2022(program_id: &Pubkey) -> bool {
    program_id == &TOKEN_2022_ID
}

/// Creates a PDA seed array for platform config
pub fn platform_config_seeds() -> [&'static [u8]; 1] {
    [b"platform_config"]
}

/// Creates a PDA seed array for project
pub fn project_seeds(project_admin: &Pubkey, project_id: u64) -> Vec<Vec<u8>> {
    vec![
        b"project".to_vec(),
        project_admin.to_bytes().to_vec(),
        project_id.to_le_bytes().to_vec(),
    ]
}

/// Creates a PDA seed array for old token vault
pub fn old_token_vault_seeds(project: &Pubkey) -> Vec<Vec<u8>> {
    vec![
        b"old_token_vault".to_vec(),
        project.to_bytes().to_vec(),
    ]
}

/// Creates a PDA seed array for new token vault
pub fn new_token_vault_seeds(project: &Pubkey) -> Vec<Vec<u8>> {
    vec![
        b"new_token_vault".to_vec(),
        project.to_bytes().to_vec(),
    ]
}

/// Creates a PDA seed array for protection vault
pub fn protection_vault_seeds(project: &Pubkey) -> Vec<Vec<u8>> {
    vec![
        b"protection_vault".to_vec(),
        project.to_bytes().to_vec(),
    ]
}

/// Creates a PDA seed array for LP escrow vault
pub fn lp_escrow_vault_seeds(project: &Pubkey) -> Vec<Vec<u8>> {
    vec![
        b"lp_escrow_vault".to_vec(),
        project.to_bytes().to_vec(),
    ]
}

/// Creates a PDA seed array for user migration
pub fn user_migration_seeds(project: &Pubkey, user: &Pubkey) -> Vec<Vec<u8>> {
    vec![
        b"user_migration".to_vec(),
        project.to_bytes().to_vec(),
        user.to_bytes().to_vec(),
    ]
}

/// Generic token account validation using token interface
pub fn validate_token_account_generic(
    token_account: &InterfaceAccount<TokenAccount>,
    expected_mint: &Pubkey,
    expected_owner: &Pubkey,
) -> Result<()> {
    if token_account.mint != *expected_mint {
        return Err(W3SwapError::TokenMintMismatch.into());
    }
    
    if token_account.owner != *expected_owner {
        return Err(W3SwapError::InvalidAccountOwner.into());
    }
    
    Ok(())
}

/// Transfers tokens using Anchor's token interface CPI
pub fn transfer_tokens<'info>(
    from: &InterfaceAccount<'info, TokenAccount>,
    to: &InterfaceAccount<'info, TokenAccount>,
    authority: &AccountInfo<'info>,
    token_program: &Interface<'info, TokenInterface>,
    amount: u64,
    authority_seeds: Option<&[&[&[u8]]]>,
) -> Result<()> {
    use anchor_spl::token_interface::{transfer, Transfer};
    
    let cpi_accounts = Transfer {
        from: from.to_account_info(),
        to: to.to_account_info(),
        authority: authority.clone(),
    };
    
    if let Some(seeds) = authority_seeds {
        let cpi_ctx = CpiContext::new_with_signer(token_program.to_account_info(), cpi_accounts, seeds);
        transfer(cpi_ctx, amount)
    } else {
        let cpi_ctx = CpiContext::new(token_program.to_account_info(), cpi_accounts);
        transfer(cpi_ctx, amount)
    }
}

/// Transfers tokens with checked transfer for safety
pub fn transfer_tokens_checked<'info>(
    from: &InterfaceAccount<'info, TokenAccount>,
    to: &InterfaceAccount<'info, TokenAccount>,
    mint: &InterfaceAccount<'info, Mint>,
    authority: &AccountInfo<'info>,
    token_program: &Interface<'info, TokenInterface>,
    amount: u64,
    decimals: u8,
    authority_seeds: Option<&[&[&[u8]]]>,
) -> Result<()> {
    use anchor_spl::token_interface::{transfer_checked, TransferChecked};
    
    let cpi_accounts = TransferChecked {
        from: from.to_account_info(),
        mint: mint.to_account_info(),
        to: to.to_account_info(),
        authority: authority.clone(),
    };
    
    if let Some(seeds) = authority_seeds {
        let cpi_ctx = CpiContext::new_with_signer(token_program.to_account_info(), cpi_accounts, seeds);
        transfer_checked(cpi_ctx, amount, decimals)
    } else {
        let cpi_ctx = CpiContext::new(token_program.to_account_info(), cpi_accounts);
        transfer_checked(cpi_ctx, amount, decimals)
    }
}

/// Close token account using Anchor's token interface CPI
pub fn close_token_account<'info>(
    account: &InterfaceAccount<'info, TokenAccount>,
    destination: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    token_program: &Interface<'info, TokenInterface>,
    authority_seeds: Option<&[&[&[u8]]]>,
) -> Result<()> {
    use anchor_spl::token_interface::{close_account, CloseAccount};
    
    let cpi_accounts = CloseAccount {
        account: account.to_account_info(),
        destination: destination.clone(),
        authority: authority.clone(),
    };
    
    if let Some(seeds) = authority_seeds {
        let cpi_ctx = CpiContext::new_with_signer(token_program.to_account_info(), cpi_accounts, seeds);
        close_account(cpi_ctx)
    } else {
        let cpi_ctx = CpiContext::new(token_program.to_account_info(), cpi_accounts);
        close_account(cpi_ctx)
    }
}

/// Transfers SOL between accounts
pub fn transfer_sol<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
    amount: u64,
) -> Result<()> {
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: from.clone(),
        to: to.clone(),
    };
    
    let cpi_ctx = CpiContext::new(system_program.to_account_info(), cpi_accounts);
    anchor_lang::system_program::transfer(cpi_ctx, amount)?;
    Ok(())
}

/// Validates that a pubkey is not the default/null pubkey
pub fn validate_not_default_pubkey(pubkey: &Pubkey) -> Result<()> {
    if pubkey == &Pubkey::default() {
        return Err(ProgramError::InvalidArgument.into());
    }
    Ok(())
}

/// Validates that amount is not zero
pub fn validate_amount_not_zero(amount: u64) -> Result<()> {
    if amount == 0 {
        return Err(W3SwapError::AmountIsZero.into());
    }
    Ok(())
}

/// Calculates the required SOL for protection based on percentage
pub fn calculate_protection_sol(total_new_tokens: u64, protection_percentage: u8) -> Result<u64> {
    let protection_amount = (total_new_tokens as u128)
        .checked_mul(protection_percentage as u128)
        .ok_or(W3SwapError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(W3SwapError::ArithmeticOverflow)?;
    
    Ok(protection_amount as u64)
}

/// Gets current timestamp
pub fn current_timestamp() -> i64 {
    Clock::get().unwrap().unix_timestamp
}

/// Validates migration duration is one of the preset options
pub fn validate_migration_duration(duration_seconds: i64) -> Result<()> {
    match duration_seconds {
        MIGRATION_DURATION_30_DAYS | MIGRATION_DURATION_60_DAYS | MIGRATION_DURATION_90_DAYS => Ok(()),
        _ => Err(W3SwapError::InvalidMigrationDuration.into()),
    }
}

/// Converts days to seconds for migration duration
pub fn days_to_seconds(days: u64) -> i64 {
    (days * 24 * 60 * 60) as i64
}

/// Validates swap backend (Jupiter or Meteora)
pub fn validate_swap_backend(backend: &str, program_id: &Pubkey) -> Result<()> {
    match backend {
        "Jupiter" => {
            const JUPITER_PROGRAM_ID: Pubkey = pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
            if program_id != &JUPITER_PROGRAM_ID {
                return Err(W3SwapError::InvalidSwapBackend.into());
            }
        }
        "Meteora" => {
            const METEORA_DLMM_PROGRAM_ID: Pubkey = pubkey!("Eo7WjKq67rjJQSZxS6z3LStQTw2d3DpyzJMzvJ4w5eK");
            if program_id != &METEORA_DLMM_PROGRAM_ID {
                return Err(W3SwapError::InvalidSwapBackend.into());
            }
        }
        _ => return Err(W3SwapError::InvalidSwapBackend.into()),
    }
    Ok(())
}

/// Creates seeds for liquidation state PDA (if needed in future)
pub fn liquidation_state_seeds(project: &Pubkey) -> Vec<Vec<u8>> {
    vec![
        b"liquidation_state".to_vec(),
        project.to_bytes().to_vec(),
    ]
}

