use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use crate::errors::W3SwapError;

pub const METEORA_DLMM_PROGRAM_ID: Pubkey = pubkey!("Eo7WjKq67rjJQSZxS6z3LStQTw2d3DpyzJMzvJ4w5eK");
pub const METEORA_AMM_PROGRAM_ID: Pubkey = pubkey!("9PSWcv16Mo3MHuvb6jVWeNseyX2VVaodui6Tn6Pvx93w");
pub const METEORA_DLMM_PROGRAM_ID_DEVNET: Pubkey = pubkey!("6kGxC9y1yvE4s46HoPazTA7kGEXUXMaLLq5yRvCNrPjX");
pub const METEORA_AMM_PROGRAM_ID_DEVNET: Pubkey = pubkey!("Cq4HqeUbmJsteVEhDWUpAJZciVYjX4jG3Ejj6mUeJ8Vf");

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MeteoraInstruction {
    DlmmSwap,
    AmmSwap,
    DlmmSwapWithMetadata,
}

impl MeteoraInstruction {
    pub fn discriminator(&self) -> [u8; 8] {
        match self {
            Self::DlmmSwap => *b"MTRADLMM",
            Self::AmmSwap => *b"MTRAAMM!",
            Self::DlmmSwapWithMetadata => *b"MTRAMETA",
        }
    }
}

#[derive(Clone, Debug)]
pub struct SwapParams {
    pub amount_in: u64,
    pub minimum_amount_out: u64,
    pub a_to_b: bool,
}

#[derive(Clone)]
pub struct DlmmSwapAccounts<'info> {
    pub meteora_program: AccountInfo<'info>,
    pub pool: AccountInfo<'info>,
    pub token_vault_a: AccountInfo<'info>,
    pub token_vault_b: AccountInfo<'info>,
    pub user_source: AccountInfo<'info>,
    pub user_destination: AccountInfo<'info>,
    pub user_authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Option<AccountInfo<'info>>,
}

#[derive(Clone)]
pub struct AmmSwapAccounts<'info> {
    pub meteora_program: AccountInfo<'info>,
    pub pool: AccountInfo<'info>,
    pub user_source: AccountInfo<'info>,
    pub user_destination: AccountInfo<'info>,
    pub user_authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Option<AccountInfo<'info>>,
}

pub struct DlmmSwapBuilder<'info> {
    accounts: DlmmSwapAccounts<'info>,
    params: SwapParams,
    instruction: MeteoraInstruction,
}

pub struct AmmSwapBuilder<'info> {
    accounts: AmmSwapAccounts<'info>,
    params: SwapParams,
    instruction: MeteoraInstruction,
}

impl<'info> DlmmSwapBuilder<'info> {
    pub fn new(accounts: DlmmSwapAccounts<'info>, params: SwapParams) -> Self {
        Self {
            accounts,
            params,
            instruction: MeteoraInstruction::DlmmSwap,
        }
    }

    pub fn build(&self) -> Result<Instruction> {
        let program_id = self.accounts.meteora_program.key();
        let mut metas = Vec::new();
        metas.push(AccountMeta::new(self.accounts.pool.key(), false));
        metas.push(AccountMeta::new(self.accounts.token_vault_a.key(), false));
        metas.push(AccountMeta::new(self.accounts.token_vault_b.key(), false));
        metas.push(AccountMeta::new(
            self.accounts.user_source.key(),
            self.accounts.user_source.is_signer,
        ));
        metas.push(AccountMeta::new(
            self.accounts.user_destination.key(),
            self.accounts.user_destination.is_signer,
        ));
        metas.push(AccountMeta::new_readonly(
            self.accounts.user_authority.key(),
            self.accounts.user_authority.is_signer,
        ));
        metas.push(AccountMeta::new_readonly(self.accounts.token_program.key(), false));
        if let Some(system_program) = &self.accounts.system_program {
            metas.push(AccountMeta::new_readonly(system_program.key(), false));
        }

        let mut data = self.instruction.discriminator().to_vec();
        data.extend_from_slice(&self.params.amount_in.to_le_bytes());
        data.extend_from_slice(&self.params.minimum_amount_out.to_le_bytes());
        data.push(self.params.a_to_b as u8);

        Ok(Instruction { program_id, accounts: metas, data })
    }
}

impl<'info> AmmSwapBuilder<'info> {
    pub fn new(accounts: AmmSwapAccounts<'info>, params: SwapParams) -> Self {
        Self {
            accounts,
            params,
            instruction: MeteoraInstruction::AmmSwap,
        }
    }

    pub fn build(&self) -> Result<Instruction> {
        let program_id = self.accounts.meteora_program.key();
        let mut metas = Vec::new();
        metas.push(AccountMeta::new(self.accounts.pool.key(), false));
        metas.push(AccountMeta::new(
            self.accounts.user_source.key(),
            self.accounts.user_source.is_signer,
        ));
        metas.push(AccountMeta::new(
            self.accounts.user_destination.key(),
            self.accounts.user_destination.is_signer,
        ));
        metas.push(AccountMeta::new_readonly(
            self.accounts.user_authority.key(),
            self.accounts.user_authority.is_signer,
        ));
        metas.push(AccountMeta::new_readonly(self.accounts.token_program.key(), false));
        if let Some(system_program) = &self.accounts.system_program {
            metas.push(AccountMeta::new_readonly(system_program.key(), false));
        }

        let mut data = self.instruction.discriminator().to_vec();
        data.extend_from_slice(&self.params.amount_in.to_le_bytes());
        data.extend_from_slice(&self.params.minimum_amount_out.to_le_bytes());
        data.push(self.params.a_to_b as u8);

        Ok(Instruction { program_id, accounts: metas, data })
    }
}

/// Meteora adapter for liquidation swaps
pub struct MeteoraAdapter;

impl MeteoraAdapter {
    /// Validate Meteora swap accounts and build CPI instruction
    pub fn validate_and_build_swap(
        amount_in: u64,
        remaining_accounts: &[AccountInfo],
    ) -> Result<Instruction> {
        if remaining_accounts.is_empty() {
            return Err(W3SwapError::InvalidLiquidationAccounts.into());
        }

        let meteora_program = remaining_accounts[0].key();

        if meteora_program != METEORA_DLMM_PROGRAM_ID && meteora_program != METEORA_AMM_PROGRAM_ID {
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
            program_id: meteora_program,
            accounts: metas,
            data: Vec::new(),
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
        )
        .map_err(|_| W3SwapError::CpiCallFailed)?;
        Ok(())
    }
}
