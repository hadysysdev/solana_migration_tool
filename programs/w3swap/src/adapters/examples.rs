//! Example usage of Meteora and Jupiter adapters
//! 
//! This module demonstrates how to use the adapters in the context of
//! batched old-token liquidation operations.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use crate::adapters::*;
use crate::state::Project;

/// Example function showing how to integrate Meteora adapter
/// with swap_old_token_batch instruction
pub fn execute_meteora_batch_swap<'info>(
    project: &Account<Project>,
    remaining_accounts: &[AccountInfo<'info>],
    amount_in: u64,
    minimum_amount_out: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    // Example: Swap token A for WSOL using Meteora DLMM
    // remaining_accounts should be ordered as:
    // [meteora_program, pool, token_vault_a, token_vault_b, user_source, user_destination, 
    //  project_authority, token_program, (optional) system_program]
    
    if remaining_accounts.len() < 8 {
        return Err(crate::errors::W3SwapError::InvalidInstructionData.into());
    }

    // Build swap parameters
    let swap_params = SwapParams {
        amount_in,
        minimum_amount_out,
        a_to_b: true, // Assume swapping from token A to token B (WSOL)
    };

    // Create DLMM swap accounts structure from remaining_accounts
    let dlmm_accounts = DlmmSwapAccounts {
        pool: remaining_accounts[1].clone(),
        token_vault_a: remaining_accounts[2].clone(),
        token_vault_b: remaining_accounts[3].clone(),
        user_source: remaining_accounts[4].clone(), // User's old token account
        user_destination: remaining_accounts[5].clone(), // User's new token/WSOL account
        user_authority: remaining_accounts[6].clone(), // Project authority
        meteora_program: remaining_accounts[0].clone(),
        token_program: remaining_accounts[7].clone(),
        system_program: if remaining_accounts.len() > 8 {
            Some(remaining_accounts[8].clone())
        } else {
            None
        },
    };

    // Create and validate the swap instruction
    let builder = DlmmSwapBuilder::new(dlmm_accounts, swap_params);
    let instruction = builder.build()?;

    // Execute the CPI with project signer
    anchor_lang::solana_program::program::invoke_signed(
        &instruction,
        remaining_accounts,
        signer_seeds,
    ).map_err(|_| crate::errors::W3SwapError::CpiCallFailed)?;

    Ok(())
}

/// Example function showing how to integrate Jupiter adapter
/// with swap_old_token_batch instruction
pub fn execute_jupiter_batch_swap<'info>(
    project: &Account<Project>,
    remaining_accounts: &[AccountInfo<'info>],
    amount_in: u64,
    minimum_amount_out: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    // Example: Multi-hop route using Jupiter
    // remaining_accounts should be ordered as:
    // [jupiter_program, user_source, user_source_owner, user_destination, 
    //  user_destination_owner, token_program, system_program, 
    //  (optional) jupiter_program_state, ...route_accounts...]
    
    if remaining_accounts.len() < 7 {
        return Err(crate::errors::W3SwapError::InvalidInstructionData.into());
    }

    // Build Jupiter swap parameters
    let jupiter_params = JupiterSwapParams {
        amount_in,
        minimum_amount_out,
        mode: JupiterMode::ExactIn,
    };

    // Create Jupiter route accounts structure from remaining_accounts
    let jupiter_accounts = JupiterRouteAccounts {
        jupiter_program: remaining_accounts[0].clone(),
        user_source: remaining_accounts[1].clone(), // User's old token account
        user_source_owner: remaining_accounts[2].clone(), // User authority
        user_destination: remaining_accounts[3].clone(), // User's new token/WSOL account
        user_destination_owner: remaining_accounts[4].clone(), // User authority
        token_program: remaining_accounts[5].clone(),
        system_program: remaining_accounts[6].clone(),
        jupiter_program_state: if remaining_accounts.len() > 7 && remaining_accounts[7].owner == &JUPITER_PROGRAM_ID {
            Some(remaining_accounts[7].clone())
        } else {
            None
        },
        route_accounts: if remaining_accounts.len() > 7 {
            let start_idx = if remaining_accounts[7].owner == &JUPITER_PROGRAM_ID { 8 } else { 7 };
            remaining_accounts[start_idx..].to_vec()
        } else {
            vec![]
        },
    };

    // Create and validate the Jupiter instruction
    let instruction_type = if jupiter_accounts.jupiter_program_state.is_some() {
        JupiterInstruction::SwapV6
    } else {
        JupiterInstruction::Swap
    };
    
    let builder = JupiterRouteBuilder::new(
        jupiter_accounts,
        jupiter_params,
        instruction_type,
    );
    
    let instruction = builder.build()?;

    // Execute the CPI with project signer
    anchor_lang::solana_program::program::invoke_signed(
        &instruction,
        remaining_accounts,
        signer_seeds,
    ).map_err(|_| crate::errors::W3SwapError::CpiCallFailed)?;

    Ok(())
}

/// Example validation function for batch swap operations
pub fn validate_batch_swap_preconditions(
    project: &Account<Project>,
    user_source_account: &AccountInfo,
    amount_in: u64,
    minimum_amount_out: u64,
) -> Result<()> {
    // Check project status allows swaps
    if project.status != crate::state::ProjectStatus::Active {
        return Err(crate::errors::W3SwapError::InvalidProjectStatus.into());
    }

    // Check migration period is active
    let current_time = crate::utils::current_timestamp();
    if current_time < project.migration_start || current_time > project.migration_end {
        return Err(crate::errors::W3SwapError::MigrationNotActive.into());
    }

    // Validate user has sufficient balance
    let source_data = user_source_account.try_borrow_data()?;
    if source_data.len() < anchor_spl::token::TokenAccount::LEN {
        return Err(crate::errors::W3SwapError::InvalidAccountOwner.into());
    }

    // Extract amount from token account data (offset 64-72)
    let amount_bytes = &source_data[64..72];
    let current_balance = u64::from_le_bytes(
        amount_bytes.try_into()
            .map_err(|_| crate::errors::W3SwapError::InvalidAccountOwner)?
    );

    if current_balance < amount_in {
        return Err(crate::errors::W3SwapError::InsufficientTokensInVault.into());
    }

    // Validate amounts are reasonable
    if amount_in == 0 || minimum_amount_out == 0 {
        return Err(crate::errors::W3SwapError::AmountIsZero.into());
    }

    // Check slippage tolerance (e.g., minimum_out should be at least 90% of amount_in)
    let expected_minimum = amount_in
        .checked_mul(90)
        .ok_or(crate::errors::W3SwapError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(crate::errors::W3SwapError::ArithmeticOverflow)?;

    if minimum_amount_out < expected_minimum {
        return Err(crate::errors::W3SwapError::SlippageToleranceExceeded.into());
    }

    Ok(())
}

/// Example of how to structure remaining_accounts for Meteora swap
/// 
/// The remaining_accounts should be ordered as follows:
/// 1. Meteora DLMM program
/// 2. Pool account
/// 3. Pool token vault A
/// 4. Pool token vault B
/// 5. Project authority (PDA)
/// 6. Token program
/// 7. (Optional) System program
pub fn get_meteora_remaining_accounts_structure() -> Vec<&'static str> {
    vec![
        "meteora_program",
        "pool",
        "token_vault_a", 
        "token_vault_b",
        "project_authority",
        "token_program",
        "system_program (optional)",
    ]
}

/// Example of how to structure remaining_accounts for Jupiter swap
/// 
/// The remaining_accounts should be ordered as follows:
/// 1. Jupiter program
/// 2. User source token account
/// 3. User source authority
/// 4. User destination token account
/// 5. User destination authority
/// 6. Token program
/// 7. System program
/// 8. (Optional) Jupiter program state (for v6)
/// 9..N Route-specific accounts (pools, vaults, authorities)
pub fn get_jupiter_remaining_accounts_structure() -> Vec<&'static str> {
    vec![
        "jupiter_program",
        "user_source",
        "user_source_owner",
        "user_destination", 
        "user_destination_owner",
        "token_program",
        "system_program",
        "jupiter_program_state (v6 only)",
        "route_account_1 (pool/vault/authority)",
        "route_account_2 (pool/vault/authority)",
        "... (additional route accounts)",
    ]
}

/// Example of batch swap execution with error handling
pub fn execute_batch_swap_with_fallback<'info>(
    project: &Account<Project>,
    remaining_accounts: &[AccountInfo<'info>],
    amount_in: u64,
    minimum_amount_out: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    // Validate preconditions - need to extract user source from remaining_accounts
    let user_source_account = if remaining_accounts.len() >= 4 {
        &remaining_accounts[4] // For Meteora: user_source is at index 4
    } else if remaining_accounts.len() >= 2 {
        &remaining_accounts[1] // For Jupiter: user_source is at index 1
    } else {
        return Err(crate::errors::W3SwapError::InvalidInstructionData.into());
    };

    validate_batch_swap_preconditions(
        project,
        user_source_account,
        amount_in,
        minimum_amount_out,
    )?;

    // Try Meteora first (if available)
    if remaining_accounts.len() >= 8 {
        let first_program = remaining_accounts[0].key();
        if first_program == METEORA_DLMM_PROGRAM_ID || first_program == METEORA_AMM_PROGRAM_ID {
            match execute_meteora_batch_swap(
                project,
                remaining_accounts,
                amount_in,
                minimum_amount_out,
                signer_seeds,
            ) {
                Ok(()) => return Ok(()),
                Err(_) => {
                    // Fall back to Jupiter if Meteora fails
                }
            }
        }
    }

    // Try Jupiter as fallback or primary
    if remaining_accounts.len() >= 7 {
        let first_program = remaining_accounts[0].key();
        if first_program == JUPITER_PROGRAM_ID {
            return execute_jupiter_batch_swap(
                project,
                remaining_accounts,
                amount_in,
                minimum_amount_out,
                signer_seeds,
            );
        }
    }

    // No supported program found
    Err(crate::errors::W3SwapError::ProgramNotAllowedForRoutes.into())
}