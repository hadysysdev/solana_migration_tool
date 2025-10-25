FastAPI backend for off-chain orchestration of W3Swap settlement.

Overview
- Subscribes to on-chain events (ProjectStatusChanged) and automatically runs settlement when a project enters Ended.
- Executes swap batches via adapter instructions (Meteora on devnet, Jupiter on mainnet) and finalizes settlement (fee skim + LP add).

Env Vars
- RPC_URL: Solana RPC endpoint (e.g., https://api.devnet.solana.com)
- PROGRAM_ID: W3Swap program id
- ADMIN_KEYPAIR: Path to keypair JSON for admin wallet
- METEORA_PROGRAM_ID: DLMM program id (devnet)
- JUPITER_PROGRAM_ID: Aggregator program id (mainnet, optional)
- FEE_DESTINATION: Pubkey to receive WSOL fee skim

Run
1) Install deps: pip install -r requirements.txt
2) Start dev server: uvicorn app.main:app --reload

Notes
- Route building (ix_data + remaining accounts) is left as a TODO; integrate Meteora/Jupiter SDKs.
- The settlement strategy uses conservative placeholders; adapt chunk sizing and slippage to your needs.

