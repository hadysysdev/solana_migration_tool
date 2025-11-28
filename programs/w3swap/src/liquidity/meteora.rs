use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use crate::errors::W3SwapError;
use crate::state::LpConfiguration;
use super::LiquidityAdapter;
use crate::instructions::liquidity::InitializeLiquidityPool;

pub struct MeteoraLiquidityAdapter;

impl LiquidityAdapter for MeteoraLiquidityAdapter {
    fn initialize_pool<'info>(
        &self,
        ctx: &Context<'_, '_, '_, 'info, InitializeLiquidityPool<'info>>,
        lp_config: &LpConfiguration,
    ) -> Result<()> {
        // Prepare accounts for Meteora CPI
        // The `meteora_pool` (lb_pair) is explicit in the context.
        // The rest should be in `remaining_accounts`.
        
        let mut accounts = vec![
            AccountMeta::new(ctx.accounts.meteora_pool.key(), false),
        ];
        
        for acc in ctx.remaining_accounts.iter() {
            if acc.is_writable {
                accounts.push(AccountMeta::new(*acc.key, acc.is_signer));
            } else {
                accounts.push(AccountMeta::new_readonly(*acc.key, acc.is_signer));
            }
        }

        // Build instruction
        let instruction = Self::validate_and_build_initialize_pool(
            lp_config,
            ctx.accounts.project.key(), 
            ctx.accounts.meteora_program.key(),
            &accounts,
        )?;

        // Sign with Project PDA
        let project = &ctx.accounts.project;
        let seeds = crate::utils::project_seeds(&project.project_admin, project.project_id);
        let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
        let bump_slice = [project.bump];
        seed_refs.push(&bump_slice);
        let signer = &[seed_refs.as_slice()];

        // Execute CPI
        let mut account_infos = vec![
            ctx.accounts.meteora_pool.to_account_info(),
        ];
        account_infos.extend_from_slice(ctx.remaining_accounts);

        anchor_lang::solana_program::program::invoke_signed(
            &instruction,
            &account_infos,
            signer,
        ).map_err(|_| W3SwapError::CpiCallFailed)?;

        Ok(())
    }
}

impl MeteoraLiquidityAdapter {
    /// Build instruction for creating a customizable permissionless LB pair
    fn validate_and_build_initialize_pool(
        lp_config: &LpConfiguration,
        creator_key: Pubkey,
        meteora_program: Pubkey,
        accounts: &[AccountMeta],
    ) -> Result<Instruction> {
        // Discriminator for "global:create_customizable_permissionless_lb_pair"
        // sha256("global:create_customizable_permissionless_lb_pair")[..8]
        const CREATE_CUSTOMIZABLE_PERMISSIONLESS_LB_PAIR_DISCRIMINATOR: [u8; 8] = [55, 198, 230, 203, 16, 237, 240, 173];

        let args = MeteoraInitPoolArgs {
            bin_step: lp_config.bin_step,
            active_id: lp_config.initial_active_id,
            fee_bps: lp_config.base_fee,
            activation_type: lp_config.activation_type,
            activation_point: lp_config.activation_point,
            has_alpha_vault: lp_config.has_alpha_vault,
            creator_key,
            padding: [0; 32],
        };

        let mut data = Vec::with_capacity(8 + args.try_to_vec()?.len());
        data.extend_from_slice(&CREATE_CUSTOMIZABLE_PERMISSIONLESS_LB_PAIR_DISCRIMINATOR);
        data.extend_from_slice(&args.try_to_vec()?);
        
        Ok(Instruction {
            program_id: meteora_program,
            accounts: accounts.to_vec(),
            data,
        })
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct MeteoraInitPoolArgs {
    pub bin_step: u16,
    pub active_id: i32,
    pub fee_bps: u16,
    pub activation_type: u8,
    pub activation_point: u64,
    pub has_alpha_vault: bool,
    pub creator_key: Pubkey,
    pub padding: [u8; 32],
}
