use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::AccountMeta;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::{errors::W3SwapError, events::*, state::*, utils::*};

#[derive(Accounts)]
pub struct InitializeLiquidityPool<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Funded @ W3SwapError::InvalidProjectStatus
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        address = project.new_token_vault
    )]
    pub new_token_vault: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Liquidity vault PDA holding committed SOL
    #[account(
        mut,
        seeds = [b"liquidity_vault", project.key().as_ref()],
        bump
    )]
    pub liquidity_vault: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = project_admin,
        token::mint = lp_mint,
        token::authority = project,
        token::token_program = token_program,
        seeds = [b"lp_escrow_vault", project.key().as_ref()],
        bump
    )]
    pub lp_escrow_vault: Option<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: Meteora DLMM pool to be created (lb_pair)
    #[account(mut)]
    pub meteora_pool: UncheckedAccount<'info>,

    /// CHECK: LP token mint from Meteora position
    pub lp_mint: UncheckedAccount<'info>,

    pub new_token_mint: InterfaceAccount<'info, Mint>,
    pub new_token_program: Interface<'info, TokenInterface>,
    pub token_program: Interface<'info, TokenInterface>,

    #[account(mut)]
    pub project_admin: Signer<'info>,

    /// CHECK: Meteora DLMM program
    pub meteora_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_liquidity_pool<'info>(
    ctx: Context<'_, '_, '_, 'info, InitializeLiquidityPool<'info>>,
    pool_type: PoolType,
    lp_config: LpConfiguration,
) -> Result<()> {
    // Check if vault has sufficient tokens
    if ctx.accounts.new_token_vault.amount == 0 {
        return Err(W3SwapError::ProjectNotFunded.into());
    }

    // Validate LP configuration
    validate_lp_configuration(&lp_config)?;

    // Check if liquidity vault has sufficient SOL for LP creation
    let liquidity_vault_balance = ctx.accounts.liquidity_vault.lamports();
    if liquidity_vault_balance == 0 {
        return Err(W3SwapError::InsufficientSolForProtection.into());
    }

    // Dispatch to the selected adapter
    use crate::liquidity::LiquidityAdapter;
    match pool_type {
        PoolType::MeteoraDlmm => {
            let adapter = crate::liquidity::meteora::MeteoraLiquidityAdapter;
            adapter.initialize_pool(&ctx, &lp_config)?;
        }
    }

    let project = &mut ctx.accounts.project;

    // Update project state
    project.lp_config = Some(lp_config.clone());
    project.lp_created = true;
    project.meteora_pool = ctx.accounts.meteora_pool.key();
    if let Some(vault) = &ctx.accounts.lp_escrow_vault {
        project.lp_escrow_vault = vault.key();
    } else {
        project.lp_escrow_vault = Pubkey::default();
    }
    project.lp_tokens_deposited = lp_config.token_allocation; 

    emit!(LpCreated {
        project_id: project.project_id,
        project_admin: project.project_admin,
        project_pda: project.key(),
        timestamp: current_timestamp(),
    });

    Ok(())
}
