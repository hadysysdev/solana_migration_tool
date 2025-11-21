use crate::errors::W3SwapError;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};

pub const JUPITER_PROGRAM_ID: Pubkey = pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
pub const JUPITER_PROGRAM_ID_DEVNET: Pubkey = JUPITER_PROGRAM_ID;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum JupiterInstruction {
    Swap,
    SwapV6,
}

impl JupiterInstruction {
    pub fn discriminator(&self) -> [u8; 8] {
        match self {
            Self::Swap => *b"JUPISWAP",
            Self::SwapV6 => *b"JUPISWV6",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum JupiterMode {
    ExactIn,
    ExactOut,
}

#[derive(Clone, Debug)]
pub struct JupiterSwapParams {
    pub amount_in: u64,
    pub minimum_amount_out: u64,
    pub mode: JupiterMode,
}

#[derive(Clone)]
pub struct JupiterRouteAccounts<'info> {
    pub jupiter_program: AccountInfo<'info>,
    pub user_source: AccountInfo<'info>,
    pub user_source_owner: AccountInfo<'info>,
    pub user_destination: AccountInfo<'info>,
    pub user_destination_owner: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub jupiter_program_state: Option<AccountInfo<'info>>,
    pub route_accounts: Vec<AccountInfo<'info>>,
}

pub struct JupiterRouteBuilder<'info> {
    accounts: JupiterRouteAccounts<'info>,
    params: JupiterSwapParams,
    instruction: JupiterInstruction,
}

#[allow(clippy::vec_init_then_push)]
impl<'info> JupiterRouteBuilder<'info> {
    pub fn new(
        accounts: JupiterRouteAccounts<'info>,
        params: JupiterSwapParams,
        instruction: JupiterInstruction,
    ) -> Self {
        Self {
            accounts,
            params,
            instruction,
        }
    }

    pub fn build(&self) -> Result<Instruction> {
        let program_id = self.accounts.jupiter_program.key();
        let mut metas = Vec::new();
        metas.push(AccountMeta::new(
            self.accounts.user_source.key(),
            self.accounts.user_source.is_signer,
        ));
        metas.push(AccountMeta::new_readonly(
            self.accounts.user_source_owner.key(),
            self.accounts.user_source_owner.is_signer,
        ));
        metas.push(AccountMeta::new(
            self.accounts.user_destination.key(),
            self.accounts.user_destination.is_signer,
        ));
        metas.push(AccountMeta::new_readonly(
            self.accounts.user_destination_owner.key(),
            self.accounts.user_destination_owner.is_signer,
        ));
        metas.push(AccountMeta::new_readonly(
            self.accounts.token_program.key(),
            false,
        ));
        metas.push(AccountMeta::new_readonly(
            self.accounts.system_program.key(),
            false,
        ));
        if let Some(state) = &self.accounts.jupiter_program_state {
            metas.push(AccountMeta::new_readonly(state.key(), false));
        }
        for acc in &self.accounts.route_accounts {
            if acc.is_writable {
                metas.push(AccountMeta::new(*acc.key, acc.is_signer));
            } else {
                metas.push(AccountMeta::new_readonly(*acc.key, acc.is_signer));
            }
        }

        let mut data = self.instruction.discriminator().to_vec();
        data.extend_from_slice(&self.params.amount_in.to_le_bytes());
        data.extend_from_slice(&self.params.minimum_amount_out.to_le_bytes());
        data.push(match self.params.mode {
            JupiterMode::ExactIn => 0,
            JupiterMode::ExactOut => 1,
        });

        Ok(Instruction {
            program_id,
            accounts: metas,
            data,
        })
    }
}

/// Jupiter adapter for liquidation swaps
pub struct JupiterAdapter;

impl JupiterAdapter {
    /// Validate Jupiter swap accounts and build CPI instruction
    pub fn validate_and_build_swap(
        amount_in: u64,
        remaining_accounts: &[AccountInfo],
    ) -> Result<Instruction> {
        if remaining_accounts.is_empty() {
            return Err(W3SwapError::InvalidLiquidationAccounts.into());
        }

        let jupiter_program = remaining_accounts[0].key();

        if jupiter_program != JUPITER_PROGRAM_ID && jupiter_program != JUPITER_PROGRAM_ID_DEVNET {
            return Err(W3SwapError::InvalidSwapBackend.into());
        }

        if amount_in == 0 {
            return Err(W3SwapError::AmountIsZero.into());
        }

        let metas: Vec<AccountMeta> = remaining_accounts
            .iter()
            .skip(1)
            .map(|acc| {
                if acc.is_writable {
                    AccountMeta::new(*acc.key, acc.is_signer)
                } else {
                    AccountMeta::new_readonly(*acc.key, acc.is_signer)
                }
            })
            .collect();

        Ok(Instruction {
            program_id: jupiter_program,
            accounts: metas,
            data: Vec::new(),
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
        )
        .map_err(|_| W3SwapError::CpiCallFailed)?;
        Ok(())
    }
}
