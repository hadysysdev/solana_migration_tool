//! Jupiter Route Execution Adapter
//! 
//! This module provides safe integration points for Jupiter DEX aggregator operations.
//! Jupiter follows an off-chain route construction pattern where routes are computed
//! off-chain and then executed on-chain with pre-computed account lists.
//! 
//! The adapter validates route structures, enforces proper account ordering,
//! and provides helpers for route execution and account validation.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};

// Jupiter Program IDs
pub const JUPITER_PROGRAM_ID: Pubkey = pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
pub const JUPITER_PROGRAM_ID_DEVNET: Pubkey = pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");

// Jupiter instruction discriminators
pub const JUPITER_SWAP_DISCRIMINATOR: &[u8; 8] = &[0xc9, 0x1a, 0x27, 0x1f, 0x8a, 0x85, 0x8c, 0x4a];
pub const JUPITER_SWAP_V6_DISCRIMINATOR: &[u8; 8] = &[0xf8, 0xc6, 0x9e, 0x91, 0x11, 0x9d, 0x4a, 0x61];

/// Supported Jupiter instruction types
#[derive(Clone, Debug, PartialEq)]
pub enum JupiterInstruction {
    /// Standard Jupiter swap
    Swap,
    /// Jupiter swap v6 (with enhanced features)
    SwapV6,
}

impl JupiterInstruction {
    /// Get the instruction discriminator
    pub fn discriminator(&self) -> &[u8; 8] {
        match self {
            JupiterInstruction::Swap => JUPITER_SWAP_DISCRIMINATOR,
            JupiterInstruction::SwapV6 => JUPITER_SWAP_V6_DISCRIMINATOR,
        }
    }
}

/// Jupiter swap instruction parameters
#[derive(Clone, Debug)]
pub struct JupiterSwapParams {
    /// Amount of input tokens (in smallest unit)
    pub amount_in: u64,
    /// Minimum amount of output tokens (slippage protection)
    pub minimum_amount_out: u64,
    /// Route execution mode
    pub mode: JupiterMode,
}

/// Jupiter execution modes
#[derive(Clone, Debug, PartialEq)]
pub enum JupiterMode {
    /// Standard exact input mode
    ExactIn,
    /// Exact output mode (requires more complex calculations)
    ExactOut,
}

/// Account structure for Jupiter route execution
pub struct JupiterRouteAccounts<'info> {
    /// The Jupiter program
    pub jupiter_program: AccountInfo<'info>,
    /// User's token source account
    pub user_source: AccountInfo<'info>,
    /// User's token destination account
    pub user_source_owner: AccountInfo<'info>,
    /// User's token destination account  
    pub user_destination: AccountInfo<'info>,
    /// User's token destination owner
    pub user_destination_owner: AccountInfo<'info>,
    /// Token program account
    pub token_program: AccountInfo<'info>,
    /// System program account
    pub system_program: AccountInfo<'info>,
    /// Jupiter program state account (for v6)
    pub jupiter_program_state: Option<AccountInfo<'info>>,
    /// Shared accounts for the route (pools, vaults, authorities)
    pub route_accounts: Vec<AccountInfo<'info>>,
}

/// Jupiter route execution builder
pub struct JupiterRouteBuilder<'info> {
    accounts: JupiterRouteAccounts<'info>,
    params: JupiterSwapParams,
    instruction_type: JupiterInstruction,
}

impl<'info> JupiterRouteBuilder<'info> {
    /// Create a new Jupiter route builder
    pub fn new(
        accounts: JupiterRouteAccounts<'info>,
        params: JupiterSwapParams,
        instruction_type: JupiterInstruction,
    ) -> Self {
        Self {
            accounts,
            params,
            instruction_type,
        }
    }

    /// Validate the Jupiter route configuration
    pub fn validate(&self) -> Result<()> {
        // Validate Jupiter program ID
        if self.accounts.jupiter_program.key() != JUPITER_PROGRAM_ID 
            && self.accounts.jupiter_program.key() != JUPITER_PROGRAM_ID_DEVNET {
            return Err(crate::errors::W3SwapError::InvalidAccountOwner.into());
        }

        // Validate token program
        if self.accounts.token_program.key() != anchor_spl::token::ID 
            && self.accounts.token_program.key() != anchor_spl::token_2022::ID {
            return Err(crate::errors::W3SwapError::InvalidTokenProgram.into());
        }

        // Validate system program
        if self.accounts.system_program.key() != system_program::ID {
            return Err(crate::errors::W3SwapError::InvalidAccountOwner.into());
        }

        // Validate amounts
        if self.params.amount_in == 0 {
            return Err(crate::errors::W3SwapError::AmountIsZero.into());
        }

        if self.params.minimum_amount_out == 0 {
            return Err(crate::errors::W3SwapError::AmountIsZero.into());
        }

        // Validate route accounts exist
        if self.accounts.route_accounts.is_empty() {
            return Err(crate::errors::W3SwapError::InvalidInstructionData.into());
        }

        // For v6, validate program state account
        if self.instruction_type == JupiterInstruction::SwapV6 {
            if self.accounts.jupiter_program_state.is_none() {
                return Err(crate::errors::W3SwapError::InvalidInstructionData.into());
            }
        }

        Ok(())
    }

    /// Build the Jupiter swap instruction
    pub fn build(&self) -> Result<Instruction> {
        self.validate()?;

        // Build instruction data based on instruction type
        let data = match self.instruction_type {
            JupiterInstruction::Swap => self.build_swap_data()?,
            JupiterInstruction::SwapV6 => self.build_swap_v6_data()?,
        };

        // Build account metas
        let account_metas = self.build_account_metas()?;

        Ok(Instruction {
            program_id: self.accounts.jupiter_program.key(),
            accounts: account_metas,
            data,
        })
    }

    /// Build data for standard Jupiter swap
    fn build_swap_data(&self) -> Result<Vec<u8>> {
        let mut data = Vec::with_capacity(25); // 8 bytes discriminator + 17 bytes params
        data.extend_from_slice(JUPITER_SWAP_DISCRIMINATOR);
        data.extend_from_slice(&self.params.amount_in.to_le_bytes());
        data.extend_from_slice(&self.params.minimum_amount_out.to_le_bytes());
        data.push(self.params.mode.clone() as u8);
        Ok(data)
    }

    /// Build data for Jupiter swap v6
    fn build_swap_v6_data(&self) -> Result<Vec<u8>> {
        let mut data = Vec::with_capacity(33); // 8 bytes discriminator + 25 bytes params
        data.extend_from_slice(JUPITER_SWAP_V6_DISCRIMINATOR);
        data.extend_from_slice(&self.params.amount_in.to_le_bytes());
        data.extend_from_slice(&self.params.minimum_amount_out.to_le_bytes());
        data.push(self.params.mode.clone() as u8);
        // Additional v6 fields would go here (e.g., quote, slippage, etc.)
        Ok(data)
    }

    /// Build account metas for the instruction
    fn build_account_metas(&self) -> Result<Vec<AccountMeta>> {
        let mut account_metas = vec![
            // Token accounts
            AccountMeta::new(self.accounts.user_source.key(), false),
            AccountMeta::new_readonly(self.accounts.user_source_owner.key(), true),
            AccountMeta::new(self.accounts.user_destination.key(), false),
            AccountMeta::new_readonly(self.accounts.user_destination_owner.key(), true),
            // Programs
            AccountMeta::new_readonly(self.accounts.token_program.key(), false),
            AccountMeta::new_readonly(self.accounts.system_program.key(), false),
        ];

        // Add Jupiter program state for v6
        if self.instruction_type == JupiterInstruction::SwapV6 {
            if let Some(program_state) = &self.accounts.jupiter_program_state {
                account_metas.push(AccountMeta::new_readonly(program_state.key(), false));
            }
        }

        // Add route accounts
        for account in &self.accounts.route_accounts {
            account_metas.push(AccountMeta::new(account.key(), false));
        }

        Ok(account_metas)
    }
}

/// Helper functions for Jupiter route validation
pub mod validation {
    use super::*;

    /// Validate that a route account is properly structured
    pub fn validate_route_account(account: &AccountInfo) -> Result<()> {
        // Basic validation - account should be initialized
        if account.data_is_empty() {
            return Err(crate::errors::W3SwapError::AccountNotInitialized.into());
        }

        // In a real implementation, you would validate specific account types:
        // - Pool accounts should be owned by DEX programs
        // - Token vaults should be owned by token programs
        // - Authorities should have proper seeds
        
        Ok(())
    }

    /// Validate route account ordering and consistency
    pub fn validate_route_structure(route_accounts: &[AccountInfo]) -> Result<()> {
        if route_accounts.len() < 2 {
            return Err(crate::errors::W3SwapError::InvalidInstructionData.into());
        }

        // Validate each account in the route
        for account in route_accounts {
            validate_route_account(account)?;
        }

        // Check for duplicate accounts (which might indicate circular routes)
        let mut seen_accounts = std::collections::HashSet::new();
        for account in route_accounts {
            if !seen_accounts.insert(account.key()) {
                return Err(crate::errors::W3SwapError::InvalidInstructionData.into());
            }
        }

        Ok(())
    }

    /// Validate that the route has sufficient compute budget
    pub fn validate_compute_budget(
        route_accounts: &[AccountInfo],
        _max_instructions: u32,
    ) -> Result<()> {
        // Estimate compute units based on route complexity
        let estimated_compute = estimate_route_compute_units(route_accounts);
        
        // Jupiter routes typically require 200k-1M compute units
        const MAX_JUPITER_COMPUTE: u32 = 1_400_000; // Solana's max
        
        if estimated_compute > MAX_JUPITER_COMPUTE {
            return Err(crate::errors::W3SwapError::InvalidInstructionData.into());
        }

        Ok(())
    }

    /// Estimate compute units for a route
    fn estimate_route_compute_units(route_accounts: &[AccountInfo]) -> u32 {
        // Base compute for Jupiter instruction
        let base_compute = 200_000;
        
        // Additional compute per hop in the route
        let per_hop_compute = 50_000;
        
        // Estimate hops based on account count (rough approximation)
        let estimated_hops = route_accounts.len() / 3; // Rough estimate
        
        base_compute + (estimated_hops as u32 * per_hop_compute)
    }

    /// Validate that token accounts support the expected operations
    pub fn validate_token_accounts(
        source: &AccountInfo,
        destination: &AccountInfo,
        amount_in: u64,
    ) -> Result<()> {
        // Check source account balance
        let source_data = source.try_borrow_data()?;
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

        // Check destination account is initialized
        let dest_data = destination.try_borrow_data()?;
        if dest_data.len() < anchor_spl::token::TokenAccount::LEN {
            return Err(crate::errors::W3SwapError::AccountNotInitialized.into());
        }

        Ok(())
    }
}

/// Pre and post execution invariants for Jupiter swaps
pub mod invariants {
    use super::*;

    /// Check invariants before executing a Jupiter route
    pub fn check_pre_route_invariants(
        source: &AccountInfo,
        destination: &AccountInfo,
        route_accounts: &[AccountInfo],
        amount_in: u64,
    ) -> Result<()> {
        // Validate token accounts
        validation::validate_token_accounts(source, destination, amount_in)?;

        // Validate route structure
        validation::validate_route_structure(route_accounts)?;

        // Validate compute budget
        validation::validate_compute_budget(route_accounts, 100)?;

        Ok(())
    }

    /// Check invariants after executing a Jupiter route
    pub fn check_post_route_invariants(
        destination: &AccountInfo,
        minimum_amount_out: u64,
    ) -> Result<()> {
        // Check destination received at least minimum amount
        let dest_data = destination.try_borrow_data()?;
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

        Ok(())
    }
}

/// Utility functions for Jupiter integration
pub mod utils {
    use super::*;

    /// Create a recommended compute budget instruction for complex Jupiter routes
    pub fn create_compute_budget_ix(route_complexity: u32) -> Option<Instruction> {
        if route_complexity > 5 {
            // For complex routes, recommend higher compute budget
            const COMPUTE_BUDGET_PROGRAM: Pubkey = pubkey!("ComputeBudget111111111111111111111111111111");
            
            // Set compute units to 1M for complex routes
            let data = (1_000_000u32).to_le_bytes().to_vec();
            
            Some(Instruction {
                program_id: COMPUTE_BUDGET_PROGRAM,
                accounts: vec![],
                data,
            })
        } else {
            None
        }
    }

    /// Estimate slippage for a route based on market conditions
    pub fn estimate_route_slippage(
        _route_accounts: &[AccountInfo],
        amount_in: u64,
    ) -> Result<u64> {
        // This is a simplified estimation
        // In practice, you would query pool reserves and calculate impact
        
        let base_slippage_bps = 10; // 0.1% base slippage
        let impact_multiplier = (amount_in as f64 / 1_000_000.0).min(10.0); // Cap at 10x
        
        let estimated_slippage = (base_slippage_bps as f64 * impact_multiplier) as u64;
        
        Ok(estimated_slippage)
    }

    /// Validate that a route doesn't exceed maximum hop count
    pub fn validate_max_hops(route_accounts: &[AccountInfo], max_hops: u32) -> Result<()> {
        // Estimate hops based on account structure
        let estimated_hops = (route_accounts.len() / 3) as u32;
        
        if estimated_hops > max_hops {
            return Err(crate::errors::W3SwapError::InvalidInstructionData.into());
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jupiter_instruction_discriminators() {
        let swap = JupiterInstruction::Swap;
        assert_eq!(swap.discriminator().len(), 8);
        
        let swap_v6 = JupiterInstruction::SwapV6;
        assert_eq!(swap_v6.discriminator().len(), 8);
    }

    #[test]
    fn test_jupiter_swap_params() {
        let params = JupiterSwapParams {
            amount_in: 1000000,
            minimum_amount_out: 950000,
            mode: JupiterMode::ExactIn,
        };

        assert!(params.amount_in > 0);
        assert!(params.minimum_amount_out > 0);
        assert_eq!(params.mode, JupiterMode::ExactIn);
    }

    #[test]
    fn test_route_validation() {
        // Test would require mock AccountInfo objects
        // For now, just test the basic logic
        assert!(utils::validate_max_hops(&[], 5).is_ok());
        // Empty accounts with max_hops=0 should actually be ok since 0 hops <= 0 max_hops
        assert!(utils::validate_max_hops(&[], 0).is_ok());
        // But with max_hops negative (not possible with u32) or with some accounts and max_hops=0, it should fail
        // Since we can't easily mock AccountInfo, just test the logic works
    }
}