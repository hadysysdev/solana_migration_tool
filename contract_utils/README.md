# W3Swap Contract Utils

This directory contains TypeScript and Python client libraries for interacting with the w3swap Solana program.

## TypeScript Client

### Installation

```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

### Usage

```typescript
import { W3SwapClient } from './w3swap_client';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

// Initialize client
const connection = new Connection("https://api.devnet.solana.com");
const wallet = anchor.Wallet.local();
const programId = new PublicKey("YOUR_PROGRAM_ID");

const client = new W3SwapClient(connection, wallet, programId);

// Use client methods
await client.initializePlatform(superAdmin, feeDestination);
```

### Available Methods

- **Platform Management:**
  - `initializePlatform(superAdmin, feeDestinationWallet)`
  - `manageProjectAdmin(admin, action)`
  - `updateFeeDestinationWallet(newWallet)`

- **Project Lifecycle:**
  - `createProject(params)`
  - `fundProject(projectId, amount)`
  - `activateProject(projectId)`
  - `pauseProject(projectId)`
  - `resumeProject(projectId)`
  - `endProject(projectId)`

- **Migration:**
  - `migrate(project, amount)`

- **Finalization:**
  - `finalizeAndExecuteRoute(projectId, projectAdmin, route, minOut, remainingAccounts)`

- **LP Management:**
  - `markLpCreated(projectId)`
  - `depositLp(projectId, lpMint, amount)`
  - `withdrawLp(projectId, lpMint, amount)`

- **Recovery:**
  - `adminRecoverUnclaimedTokens(projectId)`

- **Account Fetching:**
  - `getPlatformConfig()`
  - `getProject(projectId, projectAdmin)`
  - `getUserMigration(project, user)`

## Python Client

### Installation

```bash
pip install solana anchorpy spl-token
```

### Usage

```python
from w3swap_client import W3SwapClient, CreateProjectParams
from solana.rpc.async_api import AsyncClient
from solana.publickey import PublicKey
from solana.keypair import Keypair
from anchorpy import Provider
import asyncio

async def main():
    # Initialize client
    client = AsyncClient("https://api.devnet.solana.com")
    wallet = Keypair.from_bytes(keypair_data)
    provider = Provider(client, wallet)
    
    program_id = PublicKey("YOUR_PROGRAM_ID")
    w3swap = W3SwapClient(program_id, provider)
    
    # Use client methods
    await w3swap.initialize_platform(super_admin, fee_destination)

asyncio.run(main())
```

### Available Methods

Same as TypeScript client, with async/await pattern:

- **Platform Management:**
  - `await initialize_platform(super_admin, fee_destination_wallet)`
  - `await manage_project_admin(admin, action)`
  - `await update_fee_destination_wallet(new_wallet)`

- **Project Lifecycle:**
  - `await create_project(params)`
  - `await fund_project(project_id, amount)`
  - `await activate_project(project_id)`
  - `await pause_project(project_id)`
  - `await resume_project(project_id)`
  - `await end_project(project_id)`

- **Migration:**
  - `await migrate(project, amount)`

- **Finalization:**
  - `await finalize_and_execute_route(project_id, project_admin, route, min_out, remaining_accounts)`

- **LP Management:**
  - `await mark_lp_created(project_id)`
  - `await deposit_lp(project_id, lp_mint, amount)`
  - `await withdraw_lp(project_id, lp_mint, amount)`

- **Recovery:**
  - `await admin_recover_unclaimed_tokens(project_id)`

- **Account Fetching:**
  - `await get_platform_config()`
  - `await get_project(project_id, project_admin)`
  - `await get_user_migration(project, user)`

## PDA Derivation

Both clients include static methods for deriving Program Derived Addresses (PDAs):

- **Platform Config:** `["platform_config"]`
- **Project:** `["project", project_admin, project_id]`
- **Vaults:** `[vault_type, project]` where vault_type is:
  - `"old_token_vault"`
  - `"new_token_vault"`
  - `"liquidity_vault"`
  - `"lp_escrow_vault"`
- **User Migration:** `["user_migration", project, user]`

## Notes

1. Both clients assume the IDL file is available at `../target/idl/w3swap.json`
2. The TypeScript client uses Anchor's native types (BN for numbers)
3. The Python client uses native Python integers
4. Both clients handle account derivation and transaction building automatically
5. Remember to handle errors appropriately in production code

## Example Project Creation

### TypeScript
```typescript
const params = {
    projectId: new BN(1),
    projectName: "My Token Migration",
    oldTokenMint: new PublicKey("..."),
    newTokenMint: new PublicKey("..."),
    oldTokenProgram: TOKEN_PROGRAM_ID,
    newTokenProgram: TOKEN_PROGRAM_ID,
    migrationStart: new BN(Math.floor(Date.now() / 1000)),
    migrationEnd: new BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60),
    exchangeRatioNumerator: new BN(1),
    exchangeRatioDenominator: new BN(1),
    solCommitmentAmount: new BN(1_000_000_000), // 1 SOL
    recoveryDelaySeconds: new BN(7 * 24 * 60 * 60),
    specialRatioEnabled: false,
    specialRatioWallets: [],
    allowlistEnabled: false,
    denylistEnabled: false,
    allowlist: [],
    denylist: []
};

await client.createProject(params);
```

### Python
```python
params = CreateProjectParams(
    project_id=1,
    project_name="My Token Migration",
    old_token_mint=PublicKey("..."),
    new_token_mint=PublicKey("..."),
    old_token_program=TOKEN_PROGRAM_ID,
    new_token_program=TOKEN_PROGRAM_ID,
    migration_start=int(time.time()),
    migration_end=int(time.time()) + 7 * 24 * 60 * 60,
    exchange_ratio_numerator=1,
    exchange_ratio_denominator=1,
    sol_commitment_amount=1_000_000_000,  # 1 SOL
    recovery_delay_seconds=7 * 24 * 60 * 60,
    special_ratio_enabled=False,
    special_ratio_wallets=[],
    allowlist_enabled=False,
    denylist_enabled=False,
    allowlist=[],
    denylist=[]
)

await w3swap.create_project(params)
```