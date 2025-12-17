import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token';
import type { W3swap } from '../../../target/types/w3swap';
import { CreateProjectParams, findPlatformConfigPda, findProjectPda, findProjectVault, getConnection, getProgram, } from './anchor';
import type { useWalletUi } from '@wallet-ui/react';


export type CreateProjectForm = {
  projectId: BN; // optional; default from timestamp
  name: string;
  oldTokenMint: string;
  oldIsToken2022: boolean;
  newTokenMint: string;
  newIsToken2022: boolean;
  startTime?: number; // seconds
  endTime?: number;   // seconds
  exchangeOld: number; // numerator
  exchangeNew: number; // denominator
  solCommitment: number; // as SOL amount
  allowList: string[];
  denyList: string[];
  specialRatios: { address: string; oldAmount: number; newAmount: number }[];
};

export async function createProjectFromForm(
  account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
  wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
  form: CreateProjectForm
) {

  const provider = createAnchorProviderFromWalletUi(account, wallet);
  const oldTokenMint = new PublicKey(form.oldTokenMint);
  const newTokenMint = new PublicKey(form.newTokenMint);
  const oldTokenProgram = form.oldIsToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const newTokenProgram = form.newIsToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const solCommitmentAmount = new BN(Math.floor(form.solCommitment * LAMPORTS_PER_SOL));

  const params: CreateProjectParams = {
    projectId: form.projectId,
    projectName: form.name,
    oldTokenMint,
    newTokenMint,
    oldTokenProgram,
    newTokenProgram,
    migrationStart: new BN(form.startTime ?? 0),
    migrationEnd: new BN(form.endTime ?? 0),
    exchangeRatioNumerator: new BN(form.exchangeOld || 0),
    exchangeRatioDenominator: new BN(form.exchangeNew || 0),
    solCommitmentAmount,
    specialRatioEnabled: form.specialRatios.length > 0,
    specialRatioWallets: form.specialRatios.map((s) => new PublicKey(s.address)),
    allowlistEnabled: form.allowList.length > 0,
    denylistEnabled: form.denyList.length > 0,
    allowlist: form.allowList.map((a) => new PublicKey(a)),
    denylist: form.denyList.map((a) => new PublicKey(a)),
  };

  return createProject(provider, params);
}


// Adapter to convert @wallet-ui/react account to AnchorProvider-compatible wallet
export function createAnchorProviderFromWalletUi(
  account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
  wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>
): AnchorProvider {
  const connection = getConnection();

  // Create a wallet adapter that implements the required interface
  const walletAdapter = {
    publicKey: new PublicKey(account.address),
    signTransaction: async (tx: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> => {
      if (tx instanceof VersionedTransaction) {
        // For versioned transactions, use the wallet's sign method
        const signed = await (wallet as any).signTransaction(tx);
        return signed;
      } else {
        // For legacy transactions, convert and sign
        const signed = await (wallet as any).signTransaction(tx);
        return signed;
      }
    },
    signAllTransactions: async (txs: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]> => {
      return Promise.all(txs.map(tx => walletAdapter.signTransaction(tx)));
    },
  };

  return new AnchorProvider(connection, walletAdapter as any, { commitment: 'confirmed' });
}



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


export async function fundProject(
  account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
  wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
  projectId: number,
  amountBaseUnits: number
) {
  const provider = createAnchorProviderFromWalletUi(account, wallet);
  const program = getProgram(provider);
  const [project] = findProjectPda(program.programId, provider.wallet.publicKey, projectId);
  const projectAcc = await program.account.project.fetch(project);
  const adminNewTokenAccount = await getAssociatedTokenAddress(
    projectAcc.newTokenMint,
    provider.wallet.publicKey,
    false,
    projectAcc.newTokenProgram,
  );

  // GET Token Data to know its decimals
  const tokenData = await getMint(provider.connection, projectAcc.newTokenMint);
  const decimals = tokenData.decimals;
  const amountBaseUnitsWithDecimals = amountBaseUnits * 10 ** decimals;

  const fundProjectIx = await (program.methods as any)
    .fundProject(new BN(amountBaseUnitsWithDecimals))
    .accounts({
      project,
      newTokenVault: projectAcc.newTokenVault,
      newTokenMint: projectAcc.newTokenMint,
      projectAdminTokenAccount: adminNewTokenAccount,
      projectAdmin: provider.wallet.publicKey,
      newTokenProgram: projectAcc.newTokenProgram,
    })
    .instruction();

  const txSig = await provider.sendAndConfirm(new Transaction().add(fundProjectIx), [], {
    commitment: "confirmed",
    skipPreflight: false,
  });

  return { transactionSignature: txSig, projectPda: project };
}


export async function activateProject(
  account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
  wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
  projectId: BN
) {
  const provider = createAnchorProviderFromWalletUi(account, wallet);
  const program = getProgram(provider);
  const [project] = findProjectPda(program.programId, provider.wallet.publicKey, projectId);

  const activateProjectIx = await (program.methods as any)
            .activateProject()
            .accounts({
                project,
                projectAdmin: provider.wallet.publicKey,
            })
            .instruction();

  const txSig = await provider.sendAndConfirm(new Transaction().add(activateProjectIx), [], {
    commitment: "confirmed",
    skipPreflight: false,
  });

  return { transactionSignature: txSig, projectPda: project };
}


// // Adapter to convert @wallet-ui/react account to AnchorProvider-compatible wallet
// export function createAnchorProviderFromWalletUi(
//   account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
//   wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>
// ): AnchorProvider {
//   const connection = getConnection();
  
//   // Create a wallet adapter that implements the required interface
//   const walletAdapter = {
//     publicKey: new PublicKey(account.address),
//     signTransaction: async (tx: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> => {
//       if (tx instanceof VersionedTransaction) {
//         // For versioned transactions, use the wallet's sign method
//         const signed = await (wallet as any).signTransaction(tx);
//         return signed;
//       } else {
//         // For legacy transactions, convert and sign
//         const signed = await (wallet as any).signTransaction(tx);
//         return signed;
//       }
//     },
//     signAllTransactions: async (txs: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]> => {
//       return Promise.all(txs.map(tx => walletAdapter.signTransaction(tx)));
//     },
//   };

//   return new AnchorProvider(connection, walletAdapter as any, { commitment: 'confirmed' });
// }

// export type CreateProjectForm = {
//   projectId?: number; // optional; default from timestamp
//   name: string;
//   oldTokenMint: string;
//   newTokenMint: string;
//   newIsToken2022: boolean;
//   startTime?: number; // seconds
//   endTime?: number;   // seconds
//   exchangeOld: number; // numerator
//   exchangeNew: number; // denominator
//   solCommitment: string; // as string SOL amount
//   allowList: string[];
//   denyList: string[];
//   specialRatios: { address: string; oldAmount: number; newAmount: number }[];
// };

// export async function createProjectInitFromForm(
//   account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
//   wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
//   form: CreateProjectForm
// ) {
//   const provider = createAnchorProviderFromWalletUi(account, wallet);
//   const program = getProgram(provider);
//   const [platformConfig] = PublicKey.findProgramAddressSync([Buffer.from('platform_config')], program.programId);
//   const projectId = form.projectId ?? Math.floor(Date.now() / 1000);
//   const [project] = getProjectPDA(provider.wallet.publicKey, projectId);

//   const oldTokenMint = new PublicKey(form.oldTokenMint);
//   const newTokenMint = new PublicKey(form.newTokenMint);
//   const oldTokenProgram = TOKEN_PROGRAM_ID; // old always SPL
//   const newTokenProgram = form.newIsToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

//   const now = Math.floor(Date.now() / 1000);
//   const migrationStart = new BN(form.startTime ?? now + 60);
//   const migrationEnd = new BN(form.endTime ?? (form.startTime ?? now + 60) + 24 * 60 * 60);

//   const solCommitmentAmount = new BN(Math.floor(parseFloat(form.solCommitment || '0') * LAMPORTS_PER_SOL));

//   const params = {
//     projectId: new BN(projectId),
//     projectName: form.name,
//     oldTokenMint,
//     newTokenMint,
//     oldTokenProgram,
//     newTokenProgram,
//     migrationStart,
//     migrationEnd,
//     exchangeRatioNumerator: new BN(form.exchangeOld || 0),
//     exchangeRatioDenominator: new BN(form.exchangeNew || 0),
//     solCommitmentAmount,
//     specialRatioEnabled: form.specialRatios.length > 0,
//     specialRatioWallets: form.specialRatios.map((s) => new PublicKey(s.address)),
//     allowlistEnabled: form.allowList.length > 0,
//     denylistEnabled: form.denyList.length > 0,
//     allowlist: form.allowList.map((a) => new PublicKey(a)),
//     denylist: form.denyList.map((a) => new PublicKey(a)),
//   } as any;

//   const platform = await program.account.platformConfig.fetch(platformConfig);

//   return program.methods
//     .createProjectInit(params)
//     .accounts({
//       platformConfig,
//       project,
//       oldTokenMint,
//       newTokenMint,
//       oldTokenProgram,
//       newTokenProgram,
//       projectAdmin: provider.wallet.publicKey,
//       feeDestination: platform.feeDestinationWallet,
//       systemProgram: SystemProgram.programId,
//     } as any)
//     .rpc();
// }

// export async function createProjectVaults(
//   account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
//   wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
//   projectId: number
// ) {
//   const provider = createAnchorProviderFromWalletUi(account, wallet);
//   const program = getProgram(provider);
//   const [project] = getProjectPDA(provider.wallet.publicKey, projectId);
//   const projectAcc = await program.account.project.fetch(project);
//   const [oldTokenVault] = PublicKey.findProgramAddressSync([Buffer.from('old_token_vault'), project.toBuffer()], program.programId);
//   const [newTokenVault] = PublicKey.findProgramAddressSync([Buffer.from('new_token_vault'), project.toBuffer()], program.programId);
//   const [liquidityVault] = PublicKey.findProgramAddressSync([Buffer.from('liquidity_vault'), project.toBuffer()], program.programId);

//   return program.methods
//     .createProjectVaults()
//     .accounts({
//       project,
//       oldTokenVault,
//       newTokenVault,
//       liquidityVault,
//       oldTokenMint: projectAcc.oldTokenMint,
//       newTokenMint: projectAcc.newTokenMint,
//       oldTokenProgram: projectAcc.oldTokenProgram,
//       newTokenProgram: projectAcc.newTokenProgram,
//       projectAdmin: provider.wallet.publicKey,
//       systemProgram: SystemProgram.programId,
//     } as any)
//     .rpc();
// }

// export async function fundProject(
//   account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
//   wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
//   projectId: number,
//   amountBaseUnits: string
// ) {
//   const provider = createAnchorProviderFromWalletUi(account, wallet);
//   const program = getProgram(provider);
//   const [project] = getProjectPDA(provider.wallet.publicKey, projectId);
//   const projectAcc = await program.account.project.fetch(project);
//   const adminNewTokenAccount = await getAssociatedTokenAddress(
//     projectAcc.newTokenMint,
//     provider.wallet.publicKey,
//     false,
//     projectAcc.newTokenProgram,
//   );
//   return program.methods
//     .fundProject(new BN(amountBaseUnits))
//     .accounts({
//       project,
//       newTokenVault: projectAcc.newTokenVault,
//       newTokenMint: projectAcc.newTokenMint,
//       projectAdminTokenAccount: adminNewTokenAccount,
//       projectAdmin: provider.wallet.publicKey,
//       newTokenProgram: projectAcc.newTokenProgram,
//     } as any)
//     .rpc();
// }

// export type ActivateProjectParams = {
//   projectId: number;
//   initialPrice: string; // e.g. '0.001' scaled by 1e9
//   tokenAllocation: string; // base units
//   binStep: number;
//   baseFee: number;
//   priceRangeMin: string; // e.g. '0.0005' scaled by 1e9
//   priceRangeMax: string; // e.g. '0.002' scaled by 1e9
//   meteoraPool: string;
//   lpMint: string;
// };

// export async function activateProject(
//   account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
//   wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
//   p: ActivateProjectParams
// ) {
//   const provider = createAnchorProviderFromWalletUi(account, wallet);
//   const program = getProgram(provider);
//   const [project] = getProjectPDA(provider.wallet.publicKey, p.projectId);
//   const projectAcc = await program.account.project.fetch(project);
//   const [lpEscrowVault] = PublicKey.findProgramAddressSync([Buffer.from('lp_escrow_vault'), project.toBuffer()], program.programId);
//   const scale1e9 = (v: string) => new BN(Math.floor(parseFloat(v) * 1e9));
//   return program.methods
//     .activateProject({
//       initialPrice: scale1e9(p.initialPrice),
//       tokenAllocation: new BN(p.tokenAllocation),
//       binStep: p.binStep,
//       baseFee: p.baseFee,
//       priceRangeMin: scale1e9(p.priceRangeMin),
//       priceRangeMax: scale1e9(p.priceRangeMax),
//     } as any)
//     .accounts({
//       project,
//       newTokenVault: projectAcc.newTokenVault,
//       liquidityVault: projectAcc.liquidityVault,
//       lpEscrowVault,
//       meteoraPool: new PublicKey(p.meteoraPool),
//       lpMint: new PublicKey(p.lpMint),
//       newTokenMint: projectAcc.newTokenMint,
//       newTokenProgram: projectAcc.newTokenProgram,
//       tokenProgram: TOKEN_PROGRAM_ID,
//       projectAdmin: provider.wallet.publicKey,
//       meteoraProgram: new PublicKey(p.meteoraPool),
//       systemProgram: SystemProgram.programId,
//     } as any)
//     .rpc();
// }

// // Export aliases for backward compatibility
// export const fundProjectIx = fundProject;
// export const activateProjectIx = activateProject;