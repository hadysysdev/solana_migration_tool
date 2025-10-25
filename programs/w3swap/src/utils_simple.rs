use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Token, Mint};
use crate::errors::W3SwapError;

/// Validates that an account is a valid token program
pub fn validate_token_program(program_id: &Pubkey) -> Result<()> {
    if program_id != &anchor_spl::token::ID {
        return Err(W3SwapError::InvalidTokenProgram.into());
    }
    Ok(())
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

/// Validates token account belongs to the expected mint and owner
pub fn validate_token_account(
    token_account: &Account<TokenAccount>,
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

/// Validates mint account
pub fn validate_mint_account(
    mint: &Account<Mint>,
    token_program: &Program<Token>,
) -> Result<()> {
    if mint.to_account_info().owner != token_program.key {
        return Err(W3SwapError::InvalidAccountOwner.into());
    }
    
    Ok(())
}

/// Transfers tokens using CPI
pub fn transfer_tokens<'info>(
    from: &Account<'info, TokenAccount>,
    to: &Account<'info, TokenAccount>,
    authority: &AccountInfo<'info>,
    token_program: &Program<'info, Token>,
    amount: u64,
    authority_seeds: Option<&[&[&[u8]]]>,
) -> Result<()> {
    let cpi_accounts = anchor_spl::token::Transfer {
        from: from.to_account_info(),
        to: to.to_account_info(),
        authority: authority.clone(),
    };
    
    let cpi_ctx = if let Some(seeds) = authority_seeds {
        CpiContext::new_with_signer(token_program.to_account_info(), cpi_accounts, seeds)
    } else {
        CpiContext::new(token_program.to_account_info(), cpi_accounts)
    };
    
    anchor_spl::token::transfer(cpi_ctx, amount)?;
    Ok(())
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