use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use crate::errors::W3SwapError;

/// Meteora adapter for liquidation swaps
pub struct MeteoraAdapter;

impl MeteoraAdapter {
    /// Validate Meteora swap accounts and build CPI instruction
    pub fn validate_and_build_swap(
        _amount_in: u64,
        remaining_accounts: &[AccountInfo],
    ) -> Result<Instruction> {
        // First account should be Meteora DLMM program
        if remaining_accounts.is_empty() {
            return Err(W3SwapError::InvalidLiquidationAccounts.into());
        }

        let meteora_program = remaining_accounts[0].key();
        
        // Validate Meteora program ID
        const METEORA_DLMM_PROGRAM_ID: Pubkey = pubkey!("Eo7WjKq67rjJQSZxS6z3LStQTw2d3DpyzJMzvJ4w5eK");
        if meteora_program != METEORA_DLMM_PROGRAM_ID {
            return Err(W3SwapError::InvalidSwapBackend.into());
        }

        // Build instruction with remaining accounts
        let metas: Vec<anchor_lang::solana_program::instruction::AccountMeta> = remaining_accounts
            .iter()
            .skip(1) // Skip program_id
            .map(|acc| {
                if acc.is_writable {
                    anchor_lang::solana_program::instruction::AccountMeta::new(*acc.key, acc.is_signer)
                } else {
                    anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*acc.key, acc.is_signer)
                }
            })
            .collect();

        // Meteora swap instruction data should be passed in from caller
        // This would contain the bin array, amounts, etc.
        Ok(Instruction {
            program_id: meteora_program,
            accounts: metas,
            data: vec![], // Will be populated by caller
        })
    }

    /// Execute Meteora swap with signed CPI
    pub fn execute_swap(
        instruction: Instruction,
        remaining_accounts: &[AccountInfo],
        signer_seeds: &[&[&[u8]]],
    ) -> Result<()> {
        anchor_lang::solana_program::program::invoke_signed(
            &instruction,
            remaining_accounts,
            signer_seeds,
        ).map_err(|_| W3SwapError::CpiCallFailed)?;
        Ok(())
    }
}