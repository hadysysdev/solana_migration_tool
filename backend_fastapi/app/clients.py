import json
from typing import Optional
from solana.rpc.async_api import AsyncClient
from solana.publickey import PublicKey
from solana.keypair import Keypair
from anchorpy import Provider, Program
from .config import Settings

# Reuse our contract_utils Python client
from ...contract_utils.w3swap_client import W3SwapClient
from .supabase_store import SupabaseStore


class Clients:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._solana: Optional[AsyncClient] = None
        self._provider: Optional[Provider] = None
        self._program: Optional[Program] = None
        self._w3: Optional[W3SwapClient] = None
        self._sb: Optional[SupabaseStore] = None

    async def start(self):
        self._solana = AsyncClient(self.settings.rpc_url)
        with open(self.settings.admin_keypair, "r") as f:
            kp = Keypair.from_secret_key(bytes(json.load(f)))
        self._provider = Provider(self._solana, kp)
        # Program instance created inside W3SwapClient
        self._w3 = W3SwapClient(PublicKey(self.settings.program_id), self._provider)
        # Supabase store
        self._sb = SupabaseStore(self.settings.supabase_url, self.settings.supabase_key)

    @property
    def solana(self) -> AsyncClient:
        assert self._solana
        return self._solana

    @property
    def provider(self) -> Provider:
        assert self._provider
        return self._provider

    @property
    def w3(self) -> W3SwapClient:
        assert self._w3
        return self._w3

    @property
    def sb(self) -> Optional[SupabaseStore]:
        return self._sb
