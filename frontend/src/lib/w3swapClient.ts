import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import type { W3swap } from '../../../target/types/w3swap';
import { CreateProjectParams, findPlatformConfigPda, findProjectPda, findProjectVault, getProgram, } from './anchor';


export async function getProjects(provider: AnchorProvider) {
  const program = getProgram(provider);
  return await program.account.project.all();
}

export async function getProject(provider: AnchorProvider, projectPda: PublicKey) {
  const program = getProgram(provider);
  return await program.account.project.fetch(projectPda);
}


export async function createProject(provider: AnchorProvider, params: CreateProjectParams) {

  const program = getProgram(provider);
  const [projectPda] = findProjectPda(program.programId, provider.wallet.publicKey, params.projectId);
  const [platformConfigPda] = findPlatformConfigPda(program.programId);
  const platformConfigData = await program.account.platformConfig.fetch(platformConfigPda);

  const [oldTokenVaultPda] = findProjectVault('old_token_vault', program.programId, projectPda);
  const [newTokenVaultPda] = findProjectVault('new_token_vault', program.programId, projectPda);
  const [liquidityVaultPda] = findProjectVault('liquidity_vault', program.programId, projectPda);

  // 1. Allocate Instruction
  const allocateIx = await (program.methods as any)
    .allocateProjectAccount(params.projectId)
    .accounts({
      platformConfig: platformConfigPda,
      projectAdmin: provider.wallet.publicKey,
      project: projectPda,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  // 2. Expand Instructions
  const expandIxs = [];
  for (let i = 0; i < 9; i++) {
    const ix = await (program.methods as any)
      .expandProjectAccount()
      .accounts({
        project: projectPda,
        payer: provider.wallet.publicKey,
        projectAdmin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    expandIxs.push(ix);
  }

  // 3. Init Instruction
  const initIx = await (program.methods as any)
    .createProjectInit(params as any)
    .accounts({
      platformConfig: platformConfigPda,
      project: projectPda,
      oldTokenMint: params.oldTokenMint,
      newTokenMint: params.newTokenMint,
      oldTokenProgram: params.oldTokenProgram,
      newTokenProgram: params.newTokenProgram,
      projectAdmin: provider.publicKey,
      feeDestination: platformConfigData.feeDestinationWallet,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  // 4. Vaults Instruction
  const vaultsIx = await (program.methods as any)
    .createProjectVaults()
    .accounts({
      project: projectPda,
      oldTokenVault: oldTokenVaultPda,
      newTokenVault: newTokenVaultPda,
      liquidityVault: liquidityVaultPda,
      oldTokenMint: params.oldTokenMint,
      newTokenMint: params.newTokenMint,
      oldTokenProgram: params.oldTokenProgram,
      newTokenProgram: params.newTokenProgram,
      projectAdmin: provider.publicKey,
    })
    .instruction();

  // 5. Compute Budget Instruction
  const computeIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 800_000 });

  // 6. Build Transaction
  const tx = new Transaction();
  tx.add(computeIx);
  tx.add(allocateIx);
  expandIxs.forEach(ix => tx.add(ix));
  tx.add(initIx);
  tx.add(vaultsIx);

  const txSig = await provider.sendAndConfirm(tx, [], {
    commitment: "confirmed",
    skipPreflight: false,
  });

  return { transactionSignature: txSig, projectPda: projectPda };
}



