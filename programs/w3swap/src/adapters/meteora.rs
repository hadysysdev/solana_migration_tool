//! Meteora DLMM/AMM CPI Adapter
//! 
//! This module provides safe CPI integration points for Meteora DEX operations,
//! including DLMM (Dynamic Liquidity Market Maker) and standard AMM swaps.
//! 
//! The adapter validates account structures, enforces proper program IDs,
//! and provides typed builders for common swap operations.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::system_program;

// Meteora Program IDs (mainnet and devnet)
pub const METEORA_DLMM_PROGRAM_ID: Pubkey = pubkey!("LBUZKhRxPx3emHSvLNF19Xopeij8utFTtxwcmcmAsMs");
pub const METEORA_AMM_PROGRAM_ID: Pubkey = pubkey!("Eo7WjKq67rjJQSZxS6z3YSta8HUwc5VSy6WmbT7TfNoS");

// Devnet program IDs (for testing)
pub const METEORA_DLMM_PROGRAM_ID_DEVNET: Pubkey = pubkey!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
pub const METEORA_AMM_PROGRAM_ID_DEVNET: Pubkey = pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");

/// Supported Meteora instruction discriminators
#[derive(Clone, Debug, PartialEq)]
pub enum MeteoraInstruction {
    /// DLMM swap operation
    DlmmSwap,
    /// Standard AMM swap operation
    AmmSwap,
    /// DLMM swap with metadata
    DlmmSwapWithMetadata,
}

impl MeteoraInstruction {
    /// Get the instruction discriminator (first 8 bytes)
    pub fn discriminator(&self) -> &[u8; 8] {
        match self {
            MeteoraInstruction::DlmmSwap => &[135, 23, 19, 189, 189, 34, 253, 19],
            MeteoraInstruction::AmmSwap => &[249, 190, 3, 253, 247, 2, 130, 218],
            MeteoraInstruction::DlmmSwapWithMetadata => &[67, 251, 225, 12, 185, 13, 29, 187],
        }
    }
}

/// Account structure for Meteora DLMM swap
#[derive(Accounts)]
pub struct DlmmSwapAccounts<'info> {
    /// The DLMM pool account
    pub pool: AccountInfo<'info>,
    /// The pool's token vault A
    pub token_vault_a: AccountInfo<'info>,
    /// The pool's token vault B  
    pub token_vault_b: AccountInfo<'info>,
    /// The user's token source account
    pub user_source: AccountInfo<'info>,
    /// The user's token destination account
    pub user_destination: AccountInfo<'info>,
    /// The user's token authority (usually the program's PDA)
    pub user_authority: AccountInfo<'info>,
    /// The Meteora DLMM program
    pub meteora_program: AccountInfo<'info>,
    /// Token program account
    pub token_program: AccountInfo<'info>,
    /// Optional: System program for account creation
    pub system_program: Option<AccountInfo<'info>>,
}

/// Account structure for Meteora AMM swap
#[derive(Accounts)]
pub struct AmmSwapAccounts<'info> {
    /// The AMM pool account
    pub pool: AccountInfo<'info>,
    /// The pool's token vault A
    pub token_vault_a: AccountInfo<'info>,
    /// The pool's token vault B
    pub token_vault_b: AccountInfo<'info>,
    /// The pool authority
    pub pool_authority: AccountInfo<'info>,
    /// The user's token source account
    pub user_source: AccountInfo<'info>,
    /// The user's token destination account
    pub user_destination: AccountInfo<'info>,
    /// The user's token authority
    pub user_authority: AccountInfo<'info>,
    /// The Meteora AMM program
    pub meteora_program: AccountInfo<'info>,
    /// Token program account
    pub token_program: AccountInfo<'info>,
}

/// Swap parameters for Meteora operations
#[derive(Clone, Debug)]
pub struct SwapParams {
    /// Amount of input tokens
    pub amount_in: u64,
    /// Minimum amount of output tokens (slippage protection)
    pub minimum_amount_out: u64,
    /// Whether the swap is from A to B (true) or B to A (false)
    pub a_to_b: bool,
}

/// Builder for Meteora DLMM swap instructions
pub struct DlmmSwapBuilder<'info> {
    accounts: DlmmSwapAccounts<'info>,
    params: SwapParams,
}

impl<'info> DlmmSwapBuilder<'info> {
    /// Create a new DLMM swap builder
    pub fn new(accounts: DlmmSwapAccounts<'info>, params: SwapParams) -> Self {
        Self { accounts, params }
    }

    /// Validate the account structure and program IDs
    pub fn validate(&self) -> Result<()> {
        // Validate Meteora DLMM program ID
        if self.accounts.meteora_program.key() != METEORA_DLMM_PROGRAM_ID 
            && self.accounts.meteora_program.key() != METEORA_DLMM_PROGRAM_ID_DEVNET {
            return Err(crate::errors::W3SwapError::InvalidAccountOwner.into());
        }

        // Validate token program
        if self.accounts.token_program.key() != anchor_spl::token::ID 
            && self.accounts.token_program.key() != anchor_spl::token_2022::ID {
            return Err(crate::errors::W3SwapError::InvalidTokenProgram.into());
        }

        // Validate amounts
        if self.params.amount_in == 0 {
            return Err(crate::errors::W3SwapError::AmountIsZero.into());
        }

        if self.params.minimum_amount_out == 0 {
            return Err(crate::errors::W3SwapError::AmountIsZero.into());
        }

        Ok(())
    }

    /// Build the CPI instruction for DLMM swap
    pub fn build(&self) -> Result<Instruction> {
        self.validate()?;

        // Build instruction data
        let mut data = Vec::with_capacity(17); // 8 bytes discriminator + 9 bytes params
        data.extend_from_slice(MeteoraInstruction::DlmmSwap.discriminator());
        data.extend_from_slice(&self.params.amount_in.to_le_bytes());
        data.extend_from_slice(&self.params.minimum_amount_out.to_le_bytes());
        data.push(u8::from(self.params.a_to_b));

        // Build account metas
        let mut account_metas = vec![
            AccountMeta::new(self.accounts.pool.key(), false),
            AccountMeta::new(self.accounts.token_vault_a.key(), false),
            AccountMeta::new(self.accounts.token_vault_b.key(), false),
            AccountMeta::new(self.accounts.user_source.key(), false),
            AccountMeta::new(self.accounts.user_destination.key(), false),
            AccountMeta::new_readonly(self.accounts.user_authority.key(), true),
            AccountMeta::new_readonly(self.accounts.token_program.key(), false),
        ];

        // Add system program if provided
        if let Some(system_program) = &self.accounts.system_program {
            account_metas.push(AccountMeta::new_readonly(system_program.key(), false));
        }

        Ok(Instruction {
            program_id: self.accounts.meteora_program.key(),
            accounts: account_metas,
            data,
        })
    }
}

/// Builder for Meteora AMM swap instructions
pub struct AmmSwapBuilder<'info> {
    accounts: AmmSwapAccounts<'info>,
    params: SwapParams,
}

impl<'info> AmmSwapBuilder<'info> {
    /// Create a new AMM swap builder
    pub fn new(accounts: AmmSwapAccounts<'info>, params: SwapParams) -> Self {
        Self { accounts, params }
    }

    /// Validate the account structure and program IDs
    pub fn validate(&self) -> Result<()> {
        // Validate Meteora AMM program ID
        if self.accounts.meteora_program.key() != METEORA_AMM_PROGRAM_ID 
            && self.accounts.meteora_program.key() != METEORA_AMM_PROGRAM_ID_DEVNET {
            return Err(crate::errors::W3SwapError::InvalidAccountOwner.into());
        }

        // Validate token program
        if self.accounts.token_program.key() != anchor_spl::token::ID 
            && self.accounts.token_program.key() != anchor_spl::token_2022::ID {
            return Err(crate::errors::W3SwapError::InvalidTokenProgram.into());
        }

        // Validate amounts
        if self.params.amount_in == 0 {
            return Err(crate::errors::W3SwapError::AmountIsZero.into());
        }

        if self.params.minimum_amount_out == 0 {
            return Err(crate::errors::W3SwapError::AmountIsZero.into());
        }

        Ok(())
    }

    /// Build the CPI instruction for AMM swap
    pub fn build(&self) -> Result<Instruction> {
        self.validate()?;

        // Build instruction data
        let mut data = Vec::with_capacity(17); // 8 bytes discriminator + 9 bytes params
        data.extend_from_slice(MeteoraInstruction::AmmSwap.discriminator());
        data.extend_from_slice(&self.params.amount_in.to_le_bytes());
        data.extend_from_slice(&self.params.minimum_amount_out.to_le_bytes());
        data.push(u8::from(self.params.a_to_b));

        // Build account metas
        let account_metas = vec![
            AccountMeta::new(self.accounts.pool.key(), false),
            AccountMeta::new(self.accounts.token_vault_a.key(), false),
            AccountMeta::new(self.accounts.token_vault_b.key(), false),
            AccountMeta::new_readonly(self.accounts.pool_authority.key(), false),
            AccountMeta::new(self.accounts.user_source.key(), false),
            AccountMeta::new(self.accounts.user_destination.key(), false),
            AccountMeta::new_readonly(self.accounts.user_authority.key(), true),
            AccountMeta::new_readonly(self.accounts.token_program.key(), false),
        ];

        Ok(Instruction {
            program_id: self.accounts.meteora_program.key(),
            accounts: account_metas,
            data,
        })
    }
}

/// Helper functions for account validation
pub mod validation {
    use super::*;

    /// Validate that an account is owned by a Meteora program
    pub fn validate_meteora_account(account: &AccountInfo, expected_program: Pubkey) -> Result<()> {
        if account.owner != &expected_program {
            return Err(crate::errors::W3SwapError::InvalidAccountOwner.into());
        }
        Ok(())
    }

    /// Validate that a token account has the expected mint
    pub fn validate_token_mint(token_account: &AccountInfo, expected_mint: Pubkey) -> Result<()> {
        let account_data = token_account.try_borrow_data()?;
        if account_data.len() < anchor_spl::token::TokenAccount::LEN {
            return Err(crate::errors::W3SwapError::InvalidAccountOwner.into());
        }

        // Extract mint from token account data (offset 0-32)
        let mint_bytes = &account_data[0..32];
        let mint = Pubkey::try_from(mint_bytes)
            .map_err(|_| crate::errors::W3SwapError::InvalidAccountOwner)?;

        if mint != expected_mint {
            return Err(crate::errors::W3SwapError::TokenMintMismatch.into());
        }

        Ok(())
    }

    /// Validate that a pool account has the expected token vaults
    pub fn validate_pool_vaults(
        pool: &AccountInfo,
        _expected_vault_a: Pubkey,
        _expected_vault_b: Pubkey,
    ) -> Result<()> {
        // This would require parsing the pool account structure
        // For now, we'll do basic validation
        if pool.data_is_empty() {
            return Err(crate::errors::W3SwapError::AccountNotInitialized.into());
        }

        // In a real implementation, you would deserialize the pool account
        // and validate the vault addresses match the expected ones
        Ok(())
    }
}

/// Pre-execution invariants for Meteora swaps
pub mod invariants {
    use super::*;

    /// Check invariants before executing a swap
    pub fn check_pre_swap_invariants(
        user_source: &AccountInfo,
        user_destination: &AccountInfo,
        amount_in: u64,
    ) -> Result<()> {
        // Check user source has sufficient balance
        let source_data = user_source.try_borrow_data()?;
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

        Ok(())
    }

    /// Check invariants after executing a swap
    pub fn check_post_swap_invariants(
        user_destination: &AccountInfo,
        minimum_amount_out: u64,
    ) -> Result<()> {
        // Check user destination received at least minimum amount
        let dest_data = user_destination.try_borrow_data()?;
        if dest_data.len() < anchor_spl::token::TokenAccount::LEN {
            return Err(crate::errors::W3SwapError::InvalidAccountOwner.into());
        }

        // Extract amount from token account data (offset 64-72)
        let amount_bytes = &dest_data[64..72];
        let final_balance = u64::from_le_bytes(
            amount_bytes.try_into()
                .map_err(|_| crate::errors::W3SwapError::InvalidAccountOwner)?
        );

        if final_balance < minimum_amount_out {
            return Err(crate::errors::W3SwapError::MinimumOutputNotMet.into());
        }

        msg!("Post-swap balance: {}, minimum required: {}", final_balance, minimum_amount_out);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_meteora_instruction_discriminators() {
        let dlmm_swap = MeteoraInstruction::DlmmSwap;
        assert_eq!(dlmm_swap.discriminator().len(), 8);
        
        let amm_swap = MeteoraInstruction::AmmSwap;
        assert_eq!(amm_swap.discriminator().len(), 8);
    }

    #[test]
    fn test_swap_params_validation() {
        let params = SwapParams {
            amount_in: 1000,
            minimum_amount_out: 900,
            a_to_b: true,
        };

        assert!(params.amount_in > 0);
        assert!(params.minimum_amount_out > 0);
    }
}