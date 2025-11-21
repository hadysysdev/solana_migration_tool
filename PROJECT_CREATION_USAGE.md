# Project Creation Usage Guide

## Overview

Project creation in W3Swap now requires **three steps** to work around Solana's 10,240 byte reallocation limit for inner instructions:

1. **Allocate Project Account** - Pre-allocates the project PDA with full space
2. **Initialize Project Data** - Initializes the project fields
3. **Create Project Vaults** - Creates the token vaults and liquidity vault

## Why the Change?

The `Project` struct in W3Swap is very large (~96KB) due to its Vec fields for allowlists, denylists, and special ratio wallets. When using Anchor's `init` constraint, it attempts to reallocate the account during initialization, but Solana enforces a 10KB limit on reallocation within inner instructions (CPI calls).

By splitting the allocation and initialization into separate instructions, we:
- Allocate the full space upfront in step 1 (no reallocation)
- Initialize the data in step 2 (writes to pre-allocated space)
- Create vaults in step 3 (unchanged)

## Client Implementation

### TypeScript/JavaScript Example

```typescript
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';

// Step 1: Allocate the project PDA
async function allocateProjectAccount(
  program: Program,
  projectId: number,
  projectAdmin: PublicKey,
  payerKeypair: Keypair
) {
  const [projectPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('project'),
      projectAdmin.toBuffer(),
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(projectId)]).buffer)),
    ],
    program.programId
  );

  const [platformConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    program.programId
  );

  const tx = await program.methods
    .allocateProjectAccount(projectId)
    .accounts({
      platformConfig: platformConfigPda,
      projectAdmin: projectAdmin,
      project: projectPda,
      systemProgram: SystemProgram.programId,
    })
    .signers([payerKeypair])
    .rpc();

  console.log('Project account allocated:', tx);
  return projectPda;
}

// Step 2: Initialize the project data
async function createProjectInit(
  program: Program,
  params: CreateProjectParams,
  projectAdmin: PublicKey,
  payerKeypair: Keypair
) {
  const [projectPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('project'),
      projectAdmin.toBuffer(),
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(params.projectId)]).buffer)),
    ],
    program.programId
  );

  const [platformConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    program.programId
  );

  const tx = await program.methods
    .createProjectInit(params)
    .accounts({
      platformConfig: platformConfigPda,
      project: projectPda,
      oldTokenMint: params.oldTokenMint,
      newTokenMint: params.newTokenMint,
      oldTokenProgram: params.oldTokenProgram,
      newTokenProgram: params.newTokenProgram,
      projectAdmin: projectAdmin,
      feeDestination: feeDestinationWallet,
      systemProgram: SystemProgram.programId,
    })
    .signers([payerKeypair])
    .rpc();

  console.log('Project initialized:', tx);
  return projectPda;
}

// Step 3: Create project vaults (unchanged)
async function createProjectVaults(
  program: Program,
  projectPda: PublicKey,
  oldTokenMint: PublicKey,
  newTokenMint: PublicKey,
  oldTokenProgram: PublicKey,
  newTokenProgram: PublicKey,
  projectAdmin: PublicKey,
  payerKeypair: Keypair
) {
  const [oldTokenVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('old_token_vault'), projectPda.toBuffer()],
    program.programId
  );

  const [newTokenVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('new_token_vault'), projectPda.toBuffer()],
    program.programId
  );

  const [liquidityVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('liquidity_vault'), projectPda.toBuffer()],
    program.programId
  );

  const tx = await program.methods
    .createProjectVaults()
    .accounts({
      project: projectPda,
      oldTokenVault: oldTokenVault,
      newTokenVault: newTokenVault,
      liquidityVault: liquidityVault,
      oldTokenMint: oldTokenMint,
      newTokenMint: newTokenMint,
      oldTokenProgram: oldTokenProgram,
      newTokenProgram: newTokenProgram,
      projectAdmin: projectAdmin,
      systemProgram: SystemProgram.programId,
    })
    .signers([payerKeypair])
    .rpc();

  console.log('Project vaults created:', tx);
}

// Complete flow
async function createProject(
  program: Program,
  params: CreateProjectParams,
  projectAdmin: PublicKey,
  payerKeypair: Keypair
) {
  // Step 1: Allocate
  console.log('Step 1: Allocating project account...');
  const projectPda = await allocateProjectAccount(
    program,
    params.projectId,
    projectAdmin,
    payerKeypair
  );

  // Step 2: Initialize
  console.log('Step 2: Initializing project data...');
  await createProjectInit(
    program,
    params,
    projectAdmin,
    payerKeypair
  );

  // Step 3: Create vaults
  console.log('Step 3: Creating vaults...');
  await createProjectVaults(
    program,
    projectPda,
    params.oldTokenMint,
    params.newTokenMint,
    params.oldTokenProgram,
    params.newTokenProgram,
    projectAdmin,
    payerKeypair
  );

  console.log('Project creation complete!');
  return projectPda;
}
```

## Rust Client Example

```rust
use anchor_client::solana_sdk::signature::{Keypair, Signer};
use anchor_client::solana_sdk::system_program;
use anchor_client::{Client, Program};

// Step 1: Allocate project account
pub fn allocate_project_account(
    program: &Program,
    project_id: u64,
    project_admin: &Keypair,
) -> Result<Pubkey> {
    let (project_pda, _) = Pubkey::find_program_address(
        &[
            b"project",
            project_admin.pubkey().as_ref(),
            &project_id.to_le_bytes(),
        ],
        &program.id(),
    );

    let (platform_config_pda, _) = Pubkey::find_program_address(
        &[b"platform_config"],
        &program.id(),
    );

    program
        .request()
        .accounts(w3swap::accounts::AllocateProjectAccount {
            platform_config: platform_config_pda,
            project_admin: project_admin.pubkey(),
            project: project_pda,
            system_program: system_program::id(),
        })
        .args(w3swap::instruction::AllocateProjectAccount { project_id })
        .signer(project_admin)
        .send()?;

    Ok(project_pda)
}

// Step 2: Initialize project data
pub fn create_project_init(
    program: &Program,
    params: CreateProjectParams,
    project_admin: &Keypair,
    // ... other parameters
) -> Result<()> {
    // Similar to step 1, but call create_project_init
    // ...
}

// Step 3: Create project vaults (unchanged)
pub fn create_project_vaults(
    program: &Program,
    project_pda: Pubkey,
    project_admin: &Keypair,
    // ... other parameters
) -> Result<()> {
    // Existing implementation
    // ...
}
```

## Important Notes

1. **Order Matters**: You MUST call `allocateProjectAccount` before `createProjectInit`
2. **Same Transaction**: You can combine all three instructions in a single transaction if desired
3. **Idempotency**: `allocateProjectAccount` will fail if the account already exists
4. **Space Calculation**: The account is allocated with `Project::LEN` bytes (~96KB)
5. **Rent**: The payer must have enough SOL to cover rent-exemption for the large account

## Error Handling

- `ProjectAlreadyAllocated` - The project PDA already exists
- `InvalidAccountOwner` - The PDA is owned by the wrong program
- Other standard Anchor/Solana errors for insufficient funds, invalid signatures, etc.
