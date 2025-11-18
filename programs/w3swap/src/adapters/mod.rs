//! CPI Adapters Module
//!
//! This module provides safe CPI integration points for external DEX protocols
//! used in token liquidation and migration operations.
//!
//! The adapters include:
//! - Meteora: Direct CPI integration for DLMM/AMM swaps
//! - Jupiter: Off-chain route construction with on-chain execution

pub mod jupiter;
pub mod meteora;

// Re-export commonly used types and functions
pub use meteora::{
    AmmSwapAccounts, AmmSwapBuilder, DlmmSwapAccounts, DlmmSwapBuilder, MeteoraAdapter,
    MeteoraInstruction, SwapParams, METEORA_AMM_PROGRAM_ID, METEORA_AMM_PROGRAM_ID_DEVNET,
    METEORA_DLMM_PROGRAM_ID, METEORA_DLMM_PROGRAM_ID_DEVNET,
};

pub use jupiter::{
    JupiterAdapter, JupiterInstruction, JupiterMode, JupiterRouteAccounts, JupiterRouteBuilder,
    JupiterSwapParams, JUPITER_PROGRAM_ID, JUPITER_PROGRAM_ID_DEVNET,
};

// Common validation utilities
pub mod common {
    use anchor_lang::prelude::*;
    use anchor_lang::solana_program::instruction::AccountMeta;

    /// Validate program ID against allowed list
    pub fn validate_program_id(program_id: Pubkey, allowed_programs: &[Pubkey]) -> Result<()> {
        if !allowed_programs.contains(&program_id) {
            return Err(crate::errors::W3SwapError::ProgramNotAllowedForRoutes.into());
        }
        Ok(())
    }

    /// Create AccountMeta from AccountInfo with proper writability flags
    pub fn create_account_meta(
        account_info: &AccountInfo,
        is_writable: bool,
        is_signer: bool,
    ) -> AccountMeta {
        if is_writable {
            AccountMeta::new(account_info.key(), is_signer)
        } else {
            AccountMeta::new_readonly(account_info.key(), is_signer)
        }
    }

    /// Validate that remaining accounts follow expected order
    pub fn validate_remaining_accounts_order(
        remaining_accounts: &[AccountInfo],
        expected_count: usize,
    ) -> Result<()> {
        if remaining_accounts.len() != expected_count {
            return Err(crate::errors::W3SwapError::InvalidInstructionData.into());
        }
        Ok(())
    }

    /// Extract signer seeds for project PDA
    pub fn get_project_signer_seeds(
        project_admin: Pubkey,
        project_id: u64,
        bump: u8,
    ) -> Vec<Vec<u8>> {
        let seeds = crate::utils::project_seeds(&project_admin, project_id);
        let mut seed_refs: Vec<Vec<u8>> = seeds.iter().map(|s| s.clone()).collect();
        seed_refs.push(vec![bump]);
        seed_refs
    }
}

#[cfg(test)]
mod tests;

/// Example usage documentation
pub mod examples;
