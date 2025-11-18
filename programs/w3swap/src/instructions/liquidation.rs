use crate::{errors::W3SwapError, events::*, state::*, utils::*};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

/// Swap old tokens in batches via Jupiter or Meteora
#[derive(Accounts)]
#[instruction(backend: SwapBackend)]
pub struct SwapOldTokenBatch<'info> {
    #[account(
        mut,
        seeds = [b"project", project_admin.key().as_ref(), project.project_id.to_le_bytes().as_ref()],
        bump = project.bump,
        has_one = project_admin @ W3SwapError::NotProjectAdmin,
        constraint = project.status == ProjectStatus::Ended || project.status == ProjectStatus::Migrated || project.status == ProjectStatus::Liquidating @ W3SwapError::LiquidationNotAllowed,
        constraint = !project.liquidation_in_progress @ W3SwapError::LiquidationInProgress
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        address = project.old_token_vault
    )]
    pub old_token_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        address = project.wsol_vault
    )]
    pub wsol_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = wsol_mint,
        token::authority = project_admin
    )]
    pub admin_wsol_account: InterfaceAccount<'info, TokenAccount>,

    pub old_token_mint: InterfaceAccount<'info, Mint>,
    pub wsol_mint: InterfaceAccount<'info, Mint>,

    pub old_token_program: Interface<'info, TokenInterface>,
    pub wsol_token_program: Interface<'info, TokenInterface>,

    #[account(mut)]
    pub project_admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Swap old tokens in batches via Jupiter or Meteora
pub fn swap_old_token_batch(
    ctx: Context<SwapOldTokenBatch>,
    backend: SwapBackend,
    amount_in: u64,
    min_out: u64,
    ix_data: Vec<u8>,
) -> Result<()> {
    validate_amount_not_zero(amount_in)?;

    let project = &mut ctx.accounts.project;
    let old_token_vault = &ctx.accounts.old_token_vault;
    let wsol_vault = &ctx.accounts.wsol_vault;
    let backend_for_event = backend.clone();

    // Check if there are old tokens to liquidate
    let available_balance = old_token_vault.amount;
    if available_balance == 0 {
        return Err(W3SwapError::NoOldTokensRemaining.into());
    }

    // Cap amount to available balance
    let actual_amount_in = std::cmp::min(amount_in, available_balance);
    if actual_amount_in == 0 {
        return Err(W3SwapError::NoOldTokensRemaining.into());
    }

    let should_set_backend = match project.liquidation_backend.as_ref() {
        None => true,
        Some(existing) if *existing == backend_for_event => false,
        Some(_) => return Err(W3SwapError::InvalidSwapBackend.into()),
    };

    let status_transition = match project.status {
        ProjectStatus::Ended => Some(ProjectStatus::Migrated),
        ProjectStatus::Migrated => Some(ProjectStatus::Liquidating),
        _ => None,
    };

    let old_token_balance_before = old_token_vault.amount;
    let wsol_balance_before = wsol_vault.amount;

    project.liquidation_in_progress = true;

    let swap_execution = (|| -> Result<()> {
        match backend {
            SwapBackend::Jupiter => {
                if ctx.remaining_accounts.is_empty() {
                    return Err(W3SwapError::InvalidLiquidationAccounts.into());
                }

                const JUPITER_PROGRAM_ID: Pubkey =
                    pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
                let jupiter_program = ctx.remaining_accounts[0].key();
                if jupiter_program != JUPITER_PROGRAM_ID {
                    return Err(W3SwapError::InvalidSwapBackend.into());
                }

                let metas: Vec<anchor_lang::solana_program::instruction::AccountMeta> = ctx
                    .remaining_accounts
                    .iter()
                    .skip(1)
                    .map(|acc| {
                        if acc.is_writable {
                            anchor_lang::solana_program::instruction::AccountMeta::new(
                                *acc.key,
                                acc.is_signer,
                            )
                        } else {
                            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                                *acc.key,
                                acc.is_signer,
                            )
                        }
                    })
                    .collect();

                let ix = anchor_lang::solana_program::instruction::Instruction {
                    program_id: jupiter_program,
                    accounts: metas,
                    data: ix_data,
                };

                let seeds = project_seeds(&project.project_admin, project.project_id);
                let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
                let bump_slice = [project.bump];
                seed_refs.push(&bump_slice);
                let signer = &[seed_refs.as_slice()];

                anchor_lang::solana_program::program::invoke_signed(
                    &ix,
                    &ctx.remaining_accounts,
                    signer,
                )
                .map_err(|_| W3SwapError::CpiCallFailed)?;
                Ok(())
            }
            SwapBackend::Meteora => {
                if ctx.remaining_accounts.is_empty() {
                    return Err(W3SwapError::InvalidLiquidationAccounts.into());
                }

                const METEORA_DLMM_PROGRAM_ID: Pubkey =
                    pubkey!("Eo7WjKq67rjJQSZxS6z3LStQTw2d3DpyzJMzvJ4w5eK");
                let meteora_program = ctx.remaining_accounts[0].key();
                if meteora_program != METEORA_DLMM_PROGRAM_ID {
                    return Err(W3SwapError::InvalidSwapBackend.into());
                }

                let metas: Vec<anchor_lang::solana_program::instruction::AccountMeta> = ctx
                    .remaining_accounts
                    .iter()
                    .skip(1)
                    .map(|acc| {
                        if acc.is_writable {
                            anchor_lang::solana_program::instruction::AccountMeta::new(
                                *acc.key,
                                acc.is_signer,
                            )
                        } else {
                            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                                *acc.key,
                                acc.is_signer,
                            )
                        }
                    })
                    .collect();

                let ix = anchor_lang::solana_program::instruction::Instruction {
                    program_id: meteora_program,
                    accounts: metas,
                    data: ix_data,
                };

                let seeds = project_seeds(&project.project_admin, project.project_id);
                let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
                let bump_slice = [project.bump];
                seed_refs.push(&bump_slice);
                let signer = &[seed_refs.as_slice()];

                anchor_lang::solana_program::program::invoke_signed(
                    &ix,
                    &ctx.remaining_accounts,
                    signer,
                )
                .map_err(|_| W3SwapError::CpiCallFailed)?;
                Ok(())
            }
        }
    })();

    project.liquidation_in_progress = false;

    swap_execution?;

    // Post-swap balance verification
    let old_token_balance_after = old_token_vault.amount;
    let wsol_balance_after = wsol_vault.amount;

    // Calculate actual amounts swapped (account for fees)
    let old_tokens_swapped = old_token_balance_before
        .checked_sub(old_token_balance_after)
        .ok_or(W3SwapError::ArithmeticOverflow)?;

    let wsol_received = wsol_balance_after
        .checked_sub(wsol_balance_before)
        .ok_or(W3SwapError::ArithmeticOverflow)?;

    // Validate minimum output (slippage protection)
    if wsol_received < min_out {
        return Err(W3SwapError::LiquidationSlippageExceeded.into());
    }

    if let Some(next_status) = status_transition {
        project.status = next_status;
    }

    if should_set_backend {
        project.liquidation_backend = Some(backend_for_event.clone());
    }

    // Update liquidation tracking
    project.total_old_sold = project
        .total_old_sold
        .checked_add(old_tokens_swapped)
        .ok_or(W3SwapError::ArithmeticOverflow)?;
    project.total_wsol_received = project
        .total_wsol_received
        .checked_add(wsol_received)
        .ok_or(W3SwapError::ArithmeticOverflow)?;
    project.last_liquidation_slot = Clock::get()?.slot;

    // Check if liquidation is complete
    let remaining_balance = old_token_vault.amount;
    let liquidation_complete = remaining_balance == 0;

    if liquidation_complete {
        project.status = ProjectStatus::LiquidationComplete;

        emit!(OldTokenLiquidationComplete {
            project_id: project.project_id,
            project_pda: project.key(),
            total_old_sold: project.total_old_sold,
            total_wsol_received: project.total_wsol_received,
            backend: format!("{:?}", backend_for_event),
            timestamp: current_timestamp(),
        });
    } else {
        project.status = ProjectStatus::Liquidating;
    }

    // Emit batch swap event
    emit!(OldTokenBatchSwapped {
        project_id: project.project_id,
        project_pda: project.key(),
        backend: format!("{:?}", backend_for_event),
        amount_in: old_tokens_swapped,
        amount_out: wsol_received,
        remaining_balance,
        slot: project.last_liquidation_slot,
        timestamp: current_timestamp(),
    });

    Ok(())
}
