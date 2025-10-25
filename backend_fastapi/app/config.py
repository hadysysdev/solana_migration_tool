from dataclasses import dataclass
import os


@dataclass
class Settings:
    rpc_url: str
    program_id: str
    admin_keypair: str
    fee_destination: str
    meteora_program_id: str | None = None
    jupiter_program_id: str | None = None
    supabase_url: str | None = None
    supabase_key: str | None = None
    cors_origins: list[str] | None = None


def load_settings() -> Settings:
    return Settings(
        rpc_url=os.getenv("RPC_URL", "https://api.devnet.solana.com"),
        program_id=os.getenv("PROGRAM_ID", ""),
        admin_keypair=os.getenv("ADMIN_KEYPAIR", os.path.expanduser("~/.config/solana/id.json")),
        fee_destination=os.getenv("FEE_DESTINATION", ""),
        meteora_program_id=os.getenv("METEORA_PROGRAM_ID"),
        jupiter_program_id=os.getenv("JUPITER_PROGRAM_ID"),
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_key=os.getenv("SUPABASE_KEY"),
        cors_origins=[s.strip() for s in os.getenv("CORS_ORIGINS", "*").split(",")],
    )
