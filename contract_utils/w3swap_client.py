from typing import List, Optional, Union, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import asyncio
import json

from solana.rpc.async_api import AsyncClient
from solana.publickey import PublicKey
from solana.keypair import Keypair
from solana.transaction import Transaction
from solana.system_program import SYS_PROGRAM_ID
from anchorpy import Provider, Program, Context, Idl
from anchorpy.program.namespace import ProgramNamespace
import borsh_construct as borsh
from spl.token.constants import TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
from spl.token.async_client import AsyncToken
from spl.token.instructions import create_associated_token_account
from spl.token._layouts import ACCOUNT_LAYOUT


class AdminAction(Enum):
    ADD = "add"
    REMOVE = "remove"


@dataclass
class CreateProjectParams:
    project_id: int
    project_name: str
    old_token_mint: PublicKey
    new_token_mint: PublicKey
    old_token_program: PublicKey
    new_token_program: PublicKey
    migration_start: int
    migration_end: int
    exchange_ratio_numerator: int
    exchange_ratio_denominator: int
    sol_commitment_amount: int
    special_ratio_enabled: bool
    special_ratio_wallets: List[PublicKey]
    allowlist_enabled: bool
    denylist_enabled: bool
    allowlist: List[PublicKey]
    denylist: List[PublicKey]


@dataclass
class GenericAccountMeta:
    pubkey: PublicKey
    is_signer: bool
    is_writable: bool


@dataclass
class GenericInstruction:
    program_id: PublicKey
    accounts: List[GenericAccountMeta]
    data: bytes


class W3SwapClient:
    """Python client for interacting with the w3swap Solana program"""
    
    def __init__(
        self,
        program_id: PublicKey,
        provider: Provider,
        idl: Optional[Idl] = None
    ):
        self.program_id = program_id
        self.provider = provider
        
        if idl:
            self.program = Program(idl, program_id, provider)
        else:
            # Load IDL from file if not provided
            with open("../target/idl/w3swap.json", "r") as f:
                idl_data = json.load(f)
            self.program = Program(idl_data, program_id, provider)
    
    # PDA Derivation Helpers
    @staticmethod
    def get_platform_config_pda(program_id: PublicKey) -> Tuple[PublicKey, int]:
        """Get the platform config PDA and bump"""
        return PublicKey.find_program_address(
            [b"platform_config"],
            program_id
        )
    
    @staticmethod
    def get_project_pda(
        project_admin: PublicKey,
        project_id: int,
        program_id: PublicKey
    ) -> Tuple[PublicKey, int]:
        """Get the project PDA and bump"""
        return PublicKey.find_program_address(
            [
                b"project",
                bytes(project_admin),
                project_id.to_bytes(8, "little")
            ],
            program_id
        )
    
    @staticmethod
    def get_vault_pda(
        seed_prefix: str,
        project: PublicKey,
        program_id: PublicKey
    ) -> Tuple[PublicKey, int]:
        """Get a vault PDA and bump"""
        return PublicKey.find_program_address(
            [seed_prefix.encode(), bytes(project)],
            program_id
        )
    
    @staticmethod
    def get_user_migration_pda(
        project: PublicKey,
        user: PublicKey,
        program_id: PublicKey
    ) -> Tuple[PublicKey, int]:
        """Get the user migration PDA and bump"""
        return PublicKey.find_program_address(
            [b"user_migration", bytes(project), bytes(user)],
            program_id
        )
    
    # Platform Management Instructions
    async def initialize_platform(
        self,
        super_admin: PublicKey,
        fee_destination_wallet: PublicKey,
        min_sol_commitment: int,
        auto_pause_threshold_percent: int,
    ) -> str:
        """Initialize the platform with super admin and fee destination"""
        platform_config, _ = self.get_platform_config_pda(self.program_id)
        
        return await self.program.rpc["initialize_platform"](
            fee_destination_wallet,
            min_sol_commitment,
            auto_pause_threshold_percent,
            ctx=Context(
                accounts={
                    "platform_config": platform_config,
                    "super_admin": super_admin,
                    "system_program": SYS_PROGRAM_ID,
                }
            )
        )
    
    async def manage_project_admin(
        self,
        admin: PublicKey,
        action: AdminAction
    ) -> str:
        """Add or remove a project admin"""
        platform_config, _ = self.get_platform_config_pda(self.program_id)
        
        action_dict = {"add": {}} if action == AdminAction.ADD else {"remove": {}}
        
        return await self.program.rpc["manage_project_admin"](
            admin,
            action_dict,
            ctx=Context(
                accounts={
                    "platform_config": platform_config,
                    "super_admin": self.provider.wallet.public_key,
                }
            )
        )
    
    async def update_fee_destination_wallet(
        self,
        new_fee_destination_wallet: PublicKey
    ) -> str:
        """Update the fee destination wallet"""
        platform_config, _ = self.get_platform_config_pda(self.program_id)
        
        return await self.program.rpc["update_fee_destination_wallet"](
            new_fee_destination_wallet,
            ctx=Context(
                accounts={
                    "platform_config": platform_config,
                    "super_admin": self.provider.wallet.public_key,
                }
            )
        )

    async def update_platform_config(
        self,
        allowed_swap_programs: Optional[List[PublicKey]] = None,
        min_sol_commitment: Optional[int] = None,
        auto_pause_threshold_percent: Optional[int] = None,
        platform_fee_sol: Optional[int] = None,
        settlement_fee_percent: Optional[int] = None,
        min_migration_days: Optional[int] = None,
        max_migration_days: Optional[int] = None,
        min_lp_lock_days: Optional[int] = None,
    ) -> str:
        """Update platform config values with optional params"""
        platform_config, _ = self.get_platform_config_pda(self.program_id)
        # Anchorpy passes None for Option<T>
        return await self.program.rpc["update_platform_config"](
            allowed_swap_programs,
            min_sol_commitment,
            auto_pause_threshold_percent,
            platform_fee_sol,
            settlement_fee_percent,
            min_migration_days,
            max_migration_days,
            min_lp_lock_days,
            ctx=Context(
                accounts={
                    "platform_config": platform_config,
                    "super_admin": self.provider.wallet.public_key,
                }
            )
        )
    
    # Project Lifecycle Instructions
    async def create_project_init(self, params: CreateProjectParams) -> str:
        """Create project step 1: initialize account/fields and charge platform fee"""
        platform_config, _ = self.get_platform_config_pda(self.program_id)
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            params.project_id,
            self.program_id,
        )

        # Fetch platform config to get fee destination
        platform_config_account = await self.program.account["PlatformConfig"].fetch(platform_config)

        params_dict = {
            "project_id": params.project_id,
            "project_name": params.project_name,
            "old_token_mint": params.old_token_mint,
            "new_token_mint": params.new_token_mint,
            "old_token_program": params.old_token_program,
            "new_token_program": params.new_token_program,
            "migration_start": params.migration_start,
            "migration_end": params.migration_end,
            "exchange_ratio_numerator": params.exchange_ratio_numerator,
            "exchange_ratio_denominator": params.exchange_ratio_denominator,
            "sol_commitment_amount": params.sol_commitment_amount,
            "special_ratio_enabled": params.special_ratio_enabled,
            "special_ratio_wallets": params.special_ratio_wallets,
            "allowlist_enabled": params.allowlist_enabled,
            "denylist_enabled": params.denylist_enabled,
            "allowlist": params.allowlist,
            "denylist": params.denylist,
        }

        return await self.program.rpc["create_project_init"](
            params_dict,
            ctx=Context(
                accounts={
                    "platform_config": platform_config,
                    "project": project,
                    "old_token_mint": params.old_token_mint,
                    "new_token_mint": params.new_token_mint,
                    "old_token_program": params.old_token_program,
                    "new_token_program": params.new_token_program,
                    "project_admin": self.provider.wallet.public_key,
                    "fee_destination": platform_config_account.fee_destination_wallet,
                    "system_program": SYS_PROGRAM_ID,
                }
            ),
        )

    async def create_project_vaults(self, project_id: int) -> str:
        """Create project step 2: initialize vaults and fund SOL commitment"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id,
        )
        project_account = await self.program.account["Project"].fetch(project)
        old_token_vault, _ = self.get_vault_pda("old_token_vault", project, self.program_id)
        new_token_vault, _ = self.get_vault_pda("new_token_vault", project, self.program_id)
        liquidity_vault, _ = self.get_vault_pda("liquidity_vault", project, self.program_id)

        return await self.program.rpc["create_project_vaults"](
            ctx=Context(
                accounts={
                    "project": project,
                    "old_token_vault": old_token_vault,
                    "new_token_vault": new_token_vault,
                    "liquidity_vault": liquidity_vault,
                    "old_token_mint": project_account.old_token_mint,
                    "new_token_mint": project_account.new_token_mint,
                    "old_token_program": project_account.old_token_program,
                    "new_token_program": project_account.new_token_program,
                    "project_admin": self.provider.wallet.public_key,
                    "system_program": SYS_PROGRAM_ID,
                }
            ),
        )

    # Convenience wrapper for backwards compatibility
    async def create_project(self, params: CreateProjectParams) -> str:
        await self.create_project_init(params)
        return await self.create_project_vaults(params.project_id)
    
    async def fund_project(self, project_id: int, amount: int) -> str:
        """Fund a project with new tokens"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id
        )
        
        project_account = await self.program.account["Project"].fetch(project)
        
        # Get associated token account for project admin
        project_admin_token_account = AsyncToken.get_associated_token_address(
            self.provider.wallet.public_key,
            project_account.new_token_mint,
            project_account.new_token_program
        )
        
        return await self.program.rpc["fund_project"](
            amount,
            ctx=Context(
                accounts={
                    "project": project,
                    "new_token_vault": project_account.new_token_vault,
                    "new_token_mint": project_account.new_token_mint,
                    "project_admin_token_account": project_admin_token_account,
                    "project_admin": self.provider.wallet.public_key,
                    "new_token_program": project_account.new_token_program,
                }
            )
        )

    async def finalize_project_transfers(self, project_id: int, lp_mint: PublicKey) -> str:
        """Finalize step 1: transfer LP tokens and remaining new tokens, close LP escrow"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id,
        )
        project_account = await self.program.account["Project"].fetch(project)
        admin_lp_token_account = AsyncToken.get_associated_token_address(
            self.provider.wallet.public_key,
            lp_mint,
        )
        admin_new_token_account = AsyncToken.get_associated_token_address(
            self.provider.wallet.public_key,
            project_account.new_token_mint,
            project_account.new_token_program,
        )

        return await self.program.rpc["finalize_project_transfers"](
            ctx=Context(
                accounts={
                    "project": project,
                    "lp_escrow_vault": project_account.lp_escrow_vault,
                    "new_token_vault": project_account.new_token_vault,
                    "old_token_vault": project_account.old_token_vault,
                    "admin_lp_token_account": admin_lp_token_account,
                    "admin_new_token_account": admin_new_token_account,
                    "lp_mint": lp_mint,
                    "new_token_mint": project_account.new_token_mint,
                    "new_token_program": project_account.new_token_program,
                    "lp_token_program": TOKEN_PROGRAM_ID,
                    "project_admin": self.provider.wallet.public_key,
                    "system_program": SYS_PROGRAM_ID,
                }
            ),
        )

    async def close_project_accounts(self, project_id: int) -> str:
        """Finalize step 2: close vaults and reclaim rent, then close project"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id,
        )
        project_account = await self.program.account["Project"].fetch(project)
        liquidity_vault, _ = self.get_vault_pda("liquidity_vault", project, self.program_id)

        return await self.program.rpc["close_project_accounts"](
            ctx=Context(
                accounts={
                    "project": project,
                    "new_token_vault": project_account.new_token_vault,
                    "old_token_vault": project_account.old_token_vault,
                    "liquidity_vault": liquidity_vault,
                    "project_admin": self.provider.wallet.public_key,
                    "new_token_program": project_account.new_token_program,
                    "old_token_program": project_account.old_token_program,
                    "system_program": SYS_PROGRAM_ID,
                }
            ),
        )
    
    async def activate_project(self, project_id: int) -> str:
        """Activate a funded project"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id
        )
        
        project_account = await self.program.account["Project"].fetch(project)
        
        return await self.program.rpc["activate_project"](
            ctx=Context(
                accounts={
                    "project": project,
                    "new_token_vault": project_account.new_token_vault,
                    "project_admin": self.provider.wallet.public_key,
                }
            )
        )
    
    async def pause_project(self, project_id: int) -> str:
        """Pause an active project"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id
        )
        
        return await self.program.rpc["pause_project"](
            ctx=Context(
                accounts={
                    "project": project,
                    "project_admin": self.provider.wallet.public_key,
                }
            )
        )
    
    async def resume_project(self, project_id: int) -> str:
        """Resume a paused project"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id
        )
        
        return await self.program.rpc["resume_project"](
            ctx=Context(
                accounts={
                    "project": project,
                    "project_admin": self.provider.wallet.public_key,
                }
            )
        )
    
    async def end_project(self, project_id: int) -> str:
        """End a project migration period"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id
        )
        
        return await self.program.rpc["end_project"](
            ctx=Context(
                accounts={
                    "project": project,
                    "project_admin": self.provider.wallet.public_key,
                }
            )
        )
    
    # User Migration
    async def migrate(self, project: PublicKey, amount: int) -> str:
        """Migrate tokens for a user"""
        project_account = await self.program.account["Project"].fetch(project)
        user_migration, _ = self.get_user_migration_pda(
            project,
            self.provider.wallet.public_key,
            self.program_id
        )
        
        # Get user's token accounts
        user_old_token_account = AsyncToken.get_associated_token_address(
            self.provider.wallet.public_key,
            project_account.old_token_mint,
            project_account.old_token_program
        )
        
        user_new_token_account = AsyncToken.get_associated_token_address(
            self.provider.wallet.public_key,
            project_account.new_token_mint,
            project_account.new_token_program
        )
        
        return await self.program.rpc["migrate"](
            amount,
            ctx=Context(
                accounts={
                    "project": project,
                    "user_migration": user_migration,
                    "old_token_vault": project_account.old_token_vault,
                    "new_token_vault": project_account.new_token_vault,
                    "user_old_token_account": user_old_token_account,
                    "user_new_token_account": user_new_token_account,
                    "old_token_mint": project_account.old_token_mint,
                    "new_token_mint": project_account.new_token_mint,
                    "old_token_program": project_account.old_token_program,
                    "new_token_program": project_account.new_token_program,
                    "user": self.provider.wallet.public_key,
                    "associated_token_program": ASSOCIATED_TOKEN_PROGRAM_ID,
                    "system_program": SYS_PROGRAM_ID,
                }
            )
        )
    
    # Finalization
    async def finalize_and_execute_route(
        self,
        project_id: int,
        project_admin: PublicKey,
        route: List[GenericInstruction],
        min_out: int,
        remaining_accounts: List[Any]
    ) -> str:
        """Finalize project and execute swap route"""
        platform_config, _ = self.get_platform_config_pda(self.program_id)
        project, _ = self.get_project_pda(project_admin, project_id, self.program_id)
        project_account = await self.program.account["Project"].fetch(project)
        liquidity_vault, _ = self.get_vault_pda("liquidity_vault", project, self.program_id)
        
        # Convert route to proper format
        route_data = []
        for instruction in route:
            route_data.append({
                "program_id": instruction.program_id,
                "accounts": [
                    {
                        "pubkey": acc.pubkey,
                        "is_signer": acc.is_signer,
                        "is_writable": acc.is_writable
                    }
                    for acc in instruction.accounts
                ],
                "data": list(instruction.data)
            })
        
        return await self.program.rpc["finalize_and_execute_route"](
            route_data,
            min_out,
            ctx=Context(
                accounts={
                    "platform_config": platform_config,
                    "project": project,
                    "liquidity_vault": liquidity_vault,
                    "new_token_vault": project_account.new_token_vault,
                    "new_token_mint": project_account.new_token_mint,
                    "new_token_program": project_account.new_token_program,
                    "project_admin": self.provider.wallet.public_key,
                    "system_program": SYS_PROGRAM_ID,
                },
                remaining_accounts=remaining_accounts
            )
        )
    
    # LP Management
    async def mark_lp_created(self, project_id: int) -> str:
        """Mark LP as created for a project"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id
        )
        
        return await self.program.rpc["mark_lp_created"](
            ctx=Context(
                accounts={
                    "project": project,
                    "project_admin": self.provider.wallet.public_key,
                }
            )
        )
    
    async def deposit_lp(
        self,
        project_id: int,
        lp_mint: PublicKey,
        amount: int
    ) -> str:
        """Deposit LP tokens to escrow"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id
        )
        lp_escrow_vault, _ = self.get_vault_pda("lp_escrow_vault", project, self.program_id)
        
        project_admin_lp_account = AsyncToken.get_associated_token_address(
            self.provider.wallet.public_key,
            lp_mint
        )
        
        return await self.program.rpc["deposit_lp"](
            amount,
            ctx=Context(
                accounts={
                    "project": project,
                    "lp_escrow_vault": lp_escrow_vault,
                    "project_admin_lp_account": project_admin_lp_account,
                    "lp_mint": lp_mint,
                    "token_program": TOKEN_PROGRAM_ID,
                    "project_admin": self.provider.wallet.public_key,
                    "system_program": SYS_PROGRAM_ID,
                }
            )
        )

    async def withdraw_lp(
        self,
        project_id: int,
        lp_mint: PublicKey,
        amount: int
    ) -> str:
        """Withdraw LP tokens from escrow"""
        project, _ = self.get_project_pda(
            self.provider.wallet.public_key,
            project_id,
            self.program_id
        )
        project_account = await self.program.account["Project"].fetch(project)
        
        project_admin_lp_account = AsyncToken.get_associated_token_address(
            self.provider.wallet.public_key,
            lp_mint
        )
        
        return await self.program.rpc["withdraw_lp"](
            amount,
            ctx=Context(
                accounts={
                    "project": project,
                    "lp_escrow_vault": project_account.lp_escrow_vault,
                    "project_admin_lp_account": project_admin_lp_account,
                    "lp_mint": lp_mint,
                    "token_program": TOKEN_PROGRAM_ID,
                    "project_admin": self.provider.wallet.public_key,
                }
            )
        )

    # ---------- WSOL vault helper ----------
    async def ensure_wsol_vault_ata(self, project: PublicKey) -> Optional[str]:
        """Ensure the project PDA has a WSOL ATA created. Returns tx signature if created."""
        WSOL_MINT = PublicKey("So11111111111111111111111111111111111111112")
        ata, _ = PublicKey.find_program_address(
            [bytes(self.provider.wallet.public_key)],  # dummy to keep lints happy
            self.program.program_id,
        )
        # Compute ATA deterministically
        ata = PublicKey.find_program_address(
            [
                b"ata",
                bytes(ASSOCIATED_TOKEN_PROGRAM_ID),
                bytes(TOKEN_PROGRAM_ID),
                bytes(WSOL_MINT),
                bytes(project),
            ],
            ASSOCIATED_TOKEN_PROGRAM_ID,
        )[0]
        info = await self.provider.connection.get_account_info(ata)
        if info.value:
            return None
        ix = create_associated_token_account(
            payer=self.provider.wallet.public_key,
            owner=project,
            mint=WSOL_MINT
        )
        tx = Transaction().add(ix)
        sig = await self.provider.send(tx)
        return sig

    async def ensure_fee_destination_wsol_ata(self, fee_destination_wallet: PublicKey) -> Optional[str]:
        """Ensure the fee destination wallet has a WSOL ATA. Returns tx signature if created."""
        WSOL_MINT = PublicKey("So11111111111111111111111111111111111111112")
        ix = create_associated_token_account(
            payer=self.provider.wallet.public_key,
            owner=fee_destination_wallet,
            mint=WSOL_MINT,
        )
        # Derive ATA and check
        ata = AsyncToken.get_associated_token_address(
            fee_destination_wallet,
            WSOL_MINT,
        )
        info = await self.provider.connection.get_account_info(ata)
        if info.value:
            return None
        tx = Transaction().add(ix)
        sig = await self.provider.send(tx)
        return sig

    # ---------- Adapters ----------
    async def execute_meteora_swap(
        self,
        project_id: int,
        amount_in: int,
        min_out_wsol: int,
        route_program: PublicKey,
        ix_data: bytes,
        remaining_accounts: List[Dict[str, Any]],
        project_admin: Optional[PublicKey] = None,
    ) -> str:
        admin = project_admin or self.provider.wallet.public_key
        platform_config, _ = self.get_platform_config_pda(self.program_id)
        project, _ = self.get_project_pda(admin, project_id, self.program_id)
        project_account = await self.program.account["Project"].fetch(project)
        # ensure WSOL ATA exists off-chain (optional here)
        # Prepend route program as first remaining account per on-chain adapter expectation
        remaining_with_prog = [
            {"pubkey": route_program, "is_signer": False, "is_writable": False},
            *remaining_accounts,
        ]

        return await self.program.rpc["execute_meteora_swap"](
            amount_in,
            min_out_wsol,
            list(ix_data),
            ctx=Context(
                accounts={
                    "platform_config": platform_config,
                    "project": project,
                    "old_token_vault": project_account.old_token_vault,
                    "wsol_vault": project_account.wsol_vault,
                    "token_program": TOKEN_PROGRAM_ID,
                    "route_program": route_program,
                    "payer": self.provider.wallet.public_key,
                },
                remaining_accounts=remaining_with_prog,
            ),
        )

    async def execute_jupiter_swap(
        self,
        project_id: int,
        amount_in: int,
        min_out_wsol: int,
        route_program: PublicKey,
        ix_data: bytes,
        remaining_accounts: List[Dict[str, Any]],
        project_admin: Optional[PublicKey] = None,
    ) -> str:
        admin = project_admin or self.provider.wallet.public_key
        platform_config, _ = self.get_platform_config_pda(self.program_id)
        project, _ = self.get_project_pda(admin, project_id, self.program_id)
        project_account = await self.program.account["Project"].fetch(project)
        remaining_with_prog = [
            {"pubkey": route_program, "is_signer": False, "is_writable": False},
            *remaining_accounts,
        ]
        return await self.program.rpc["execute_jupiter_swap"](
            amount_in,
            min_out_wsol,
            list(ix_data),
            ctx=Context(
                accounts={
                    "platform_config": platform_config,
                    "project": project,
                    "old_token_vault": project_account.old_token_vault,
                    "wsol_vault": project_account.wsol_vault,
                    "token_program": TOKEN_PROGRAM_ID,
                    "route_program": route_program,
                    "payer": self.provider.wallet.public_key,
                },
                remaining_accounts=remaining_with_prog,
            ),
        )

    async def finalize_settlement(
        self,
        project_id: int,
        route_program: PublicKey,
        lp_add_ix_data: bytes,
        remaining_accounts: List[Dict[str, Any]],
        fee_destination_wallet: PublicKey,
        lp_mint: PublicKey,
        project_admin: Optional[PublicKey] = None,
    ) -> str:
        admin = project_admin or self.provider.wallet.public_key
        platform_config, _ = self.get_platform_config_pda(self.program_id)
        project, _ = self.get_project_pda(admin, project_id, self.program_id)
        project_account = await self.program.account["Project"].fetch(project)
        # Derive fee destination WSOL ATA off-chain
        # Simplified: pass as account; creation should be done by backend
        fee_destination_token_account = AsyncToken.get_associated_token_address(
            fee_destination_wallet,
            PublicKey("So11111111111111111111111111111111111111112")
        )
        remaining_with_prog = [
            {"pubkey": route_program, "is_signer": False, "is_writable": False},
            *remaining_accounts,
        ]
        return await self.program.rpc["finalize_settlement"](
            list(lp_add_ix_data),
            ctx=Context(
                accounts={
                    "platform_config": platform_config,
                    "project": project,
                    "wsol_vault": project_account.wsol_vault,
                    "lp_escrow_vault": project_account.lp_escrow_vault,
                    "lp_mint": lp_mint,
                    "wsol_mint": PublicKey("So11111111111111111111111111111111111111112"),
                    "fee_destination_token_account": fee_destination_token_account,
                    "token_program": TOKEN_PROGRAM_ID,
                    "route_program": route_program,
                    "payer": self.provider.wallet.public_key,
                },
                remaining_accounts=remaining_with_prog,
            ),
        )
    
    # Account Fetching
    async def get_platform_config(self) -> Any:
        """Fetch the platform config account"""
        platform_config, _ = self.get_platform_config_pda(self.program_id)
        return await self.program.account["PlatformConfig"].fetch(platform_config)
    
    async def get_project(self, project_id: int, project_admin: PublicKey) -> Any:
        """Fetch a project account"""
        project, _ = self.get_project_pda(project_admin, project_id, self.program_id)
        return await self.program.account["Project"].fetch(project)
    
    async def get_user_migration(self, project: PublicKey, user: PublicKey) -> Any:
        """Fetch a user migration account"""
        user_migration, _ = self.get_user_migration_pda(project, user, self.program_id)
        return await self.program.account["UserMigration"].fetch(user_migration)


# Example usage
async def example():
    # Setup connection
    client = AsyncClient("https://api.devnet.solana.com")
    
    # Load wallet from keypair
    with open("~/.config/solana/id.json") as f:
        keypair_data = json.load(f)
    wallet = Keypair.from_bytes(keypair_data)
    
    # Create provider
    provider = Provider(client, wallet)
    
    # Initialize client
    program_id = PublicKey("YOUR_PROGRAM_ID")
    w3swap = W3SwapClient(program_id, provider)
    
    # Initialize platform
    super_admin = wallet.public_key
    fee_destination = PublicKey("FEE_DESTINATION_PUBKEY")
    tx = await w3swap.initialize_platform(super_admin, fee_destination)
    print(f"Platform initialized: {tx}")
    
    # Create project
    import time
    params = CreateProjectParams(
        project_id=1,
        project_name="My Token Migration",
        old_token_mint=PublicKey("OLD_TOKEN_MINT"),
        new_token_mint=PublicKey("NEW_TOKEN_MINT"),
        old_token_program=TOKEN_PROGRAM_ID,
        new_token_program=TOKEN_PROGRAM_ID,
        migration_start=int(time.time()),
        migration_end=int(time.time()) + 7 * 24 * 60 * 60,  # 7 days
        exchange_ratio_numerator=1,
        exchange_ratio_denominator=1,
        sol_commitment_amount=1_000_000_000,  # 1 SOL
        recovery_delay_seconds=7 * 24 * 60 * 60,  # 7 days
        special_ratio_enabled=False,
        special_ratio_wallets=[],
        allowlist_enabled=False,
        denylist_enabled=False,
        allowlist=[],
        denylist=[]
    )
    
    tx = await w3swap.create_project(params)
    print(f"Project created: {tx}")
    
    # Fund project
    tx = await w3swap.fund_project(1, 1000000)
    print(f"Project funded: {tx}")
    
    # Activate project
    tx = await w3swap.activate_project(1)
    print(f"Project activated: {tx}")
    
    # Get project details
    project = await w3swap.get_project(1, wallet.public_key)
    print(f"Project details: {project}")
    
    # Migrate tokens (as user)
    tx = await w3swap.migrate(project.pubkey, 100)
    print(f"Tokens migrated: {tx}")


if __name__ == "__main__":
    asyncio.run(example())
