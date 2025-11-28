use anchor_lang::prelude::*;
use crate::state::LpConfiguration;

pub mod meteora;

pub trait LiquidityAdapter {
    fn initialize_pool<'info>(
        &self,
        ctx: &Context<'_, '_, '_, 'info, crate::instructions::liquidity::InitializeLiquidityPool<'info>>,
        lp_config: &LpConfiguration,
    ) -> Result<()>;
}
