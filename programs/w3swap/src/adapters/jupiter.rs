use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use crate::errors::W3SwapError;

/// Jupiter adapter for liquidation swaps
pub struct JupiterAdapter;

impl JupiterAdapter {
    /// Validate Jupiter swap accounts and build CPI instruction
    pub fn validate_and_build_swap(
        _amount_in: u64,
        remaining_accounts: &[AccountInfo],
    ) -> Result<Instruction> {
        // First account should be Jupiter program
        if remaining_accounts.is_empty() {
            return Err(W3SwapError::InvalidLiquidationAccounts.into());
        }

        let jupiter_program = remaining_accounts[0].key();
        
        // Validate Jupiter program ID (mainnet)
        const JUPITER_PROGRAM_ID: Pubkey = pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
        if jupiter_program != JUPITER_PROGRAM_ID {
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

        // Jupiter swap instruction data should be passed in from caller
        // This is a simplified validation - in practice, the instruction data
        // would contain the actual swap route and parameters
        Ok(Instruction {
            program_id: jupiter_program,
            accounts: metas,
            data: vec![], // Will be populated by caller
        })
    }

    /// Execute Jupiter swap with signed CPI
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