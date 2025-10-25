from __future__ import annotations
from typing import List
from solana.publickey import PublicKey
from anchorpy import Context
from .clients import Clients


async def run_settlement_job(clients: Clients, project_id: int, project_admin: PublicKey, use_meteora: bool = True):
    """
    Example settlement job: repeatedly swap old->WSOL in batches via adapter, then finalize settlement.
    NOTE: This uses placeholders for route ix data and remaining accounts; integrate real SDKs to build them.
    """
    w3 = clients.w3
    program = w3.program
    project, _ = w3.get_project_pda(project_admin, project_id, w3.program_id)
    project_acc = await program.account["Project"].fetch(project)

    # Ensure WSOL ATA exists (optional)
    try:
        await w3.ensure_wsol_vault_ata(project)
    except Exception:
        pass

    # Dummy batches
    for _ in range(3):
        amount_in = int(10_000 * 1e9)
        min_out = int(9_000 * 1e9)
        ix_data = bytes()
        remaining: List[dict] = []
        if use_meteora:
            await w3.execute_meteora_swap(
                project_id=project_id,
                amount_in=amount_in,
                min_out_wsol=min_out,
                route_program=PublicKey(program.program_id),  # TODO: replace with METEORA id
                ix_data=ix_data,
                remaining_accounts=remaining,
                project_admin=project_admin,
            )
        else:
            await w3.execute_jupiter_swap(
                project_id=project_id,
                amount_in=amount_in,
                min_out_wsol=min_out,
                route_program=PublicKey(program.program_id),  # TODO: replace with Jupiter id
                ix_data=ix_data,
                remaining_accounts=remaining,
                project_admin=project_admin,
            )

    # Finalize: ensure fee destination WSOL ATA exists, then finalize settlement
    await w3.ensure_fee_destination_wsol_ata(PublicKey(clients.settings.fee_destination))
    lp_add_ix_data = bytes()
    remaining: List[dict] = []
    await w3.finalize_settlement(
        project_id=project_id,
        route_program=PublicKey(program.program_id),  # TODO replace
        lp_add_ix_data=lp_add_ix_data,
        remaining_accounts=remaining,
        fee_destination_wallet=PublicKey(clients.settings.fee_destination),
        lp_mint=project_acc.meteora_pool,  # pass actual LP mint
        project_admin=project_admin,
    )
