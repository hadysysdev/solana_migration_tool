import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction, VersionedTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { getConnection, getProjectPDA } from './anchor';
import { getProgram } from './anchor';
import type { useWalletUi } from '@wallet-ui/react';

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

export type CreateProjectForm = {
  projectId?: number; // optional; default from timestamp
  name: string;
  oldTokenMint: string;
  newTokenMint: string;
  newIsToken2022: boolean;
  startTime?: number; // seconds
  endTime?: number;   // seconds
  exchangeOld: number; // numerator
  exchangeNew: number; // denominator
  solCommitment: string; // as string SOL amount
  allowList: string[];
  denyList: string[];
  specialRatios: { address: string; oldAmount: number; newAmount: number }[];
};

export async function createProjectInitFromForm(
  account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
  wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
  form: CreateProjectForm
) {
  const provider = createAnchorProviderFromWalletUi(account, wallet);
  const program = getProgram(provider);
  const [platformConfig] = PublicKey.findProgramAddressSync([Buffer.from('platform_config')], program.programId);
  const projectId = form.projectId ?? Math.floor(Date.now() / 1000);
  const [project] = getProjectPDA(provider.wallet.publicKey, projectId);

  const oldTokenMint = new PublicKey(form.oldTokenMint);
  const newTokenMint = new PublicKey(form.newTokenMint);
  const oldTokenProgram = TOKEN_PROGRAM_ID; // old always SPL
  const newTokenProgram = form.newIsToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

  const now = Math.floor(Date.now() / 1000);
  const migrationStart = new BN(form.startTime ?? now + 60);
  const migrationEnd = new BN(form.endTime ?? (form.startTime ?? now + 60) + 24 * 60 * 60);

  const solCommitmentAmount = new BN(Math.floor(parseFloat(form.solCommitment || '0') * LAMPORTS_PER_SOL));

  const params = {
    projectId: new BN(projectId),
    projectName: form.name,
    oldTokenMint,
    newTokenMint,
    oldTokenProgram,
    newTokenProgram,
    migrationStart,
    migrationEnd,
    exchangeRatioNumerator: new BN(form.exchangeOld || 0),
    exchangeRatioDenominator: new BN(form.exchangeNew || 0),
    solCommitmentAmount,
    specialRatioEnabled: form.specialRatios.length > 0,
    specialRatioWallets: form.specialRatios.map((s) => new PublicKey(s.address)),
    allowlistEnabled: form.allowList.length > 0,
    denylistEnabled: form.denyList.length > 0,
    allowlist: form.allowList.map((a) => new PublicKey(a)),
    denylist: form.denyList.map((a) => new PublicKey(a)),
  } as any;

  const platform = await program.account.platformConfig.fetch(platformConfig);

  return program.methods
    .createProjectInit(params)
    .accounts({
      platformConfig,
      project,
      oldTokenMint,
      newTokenMint,
      oldTokenProgram,
      newTokenProgram,
      projectAdmin: provider.wallet.publicKey,
      feeDestination: platform.feeDestinationWallet,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

export async function createProjectVaults(
  account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
  wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
  projectId: number
) {
  const provider = createAnchorProviderFromWalletUi(account, wallet);
  const program = getProgram(provider);
  const [project] = getProjectPDA(provider.wallet.publicKey, projectId);
  const projectAcc = await program.account.project.fetch(project);
  const [oldTokenVault] = PublicKey.findProgramAddressSync([Buffer.from('old_token_vault'), project.toBuffer()], program.programId);
  const [newTokenVault] = PublicKey.findProgramAddressSync([Buffer.from('new_token_vault'), project.toBuffer()], program.programId);
  const [liquidityVault] = PublicKey.findProgramAddressSync([Buffer.from('liquidity_vault'), project.toBuffer()], program.programId);

  return program.methods
    .createProjectVaults()
    .accounts({
      project,
      oldTokenVault,
      newTokenVault,
      liquidityVault,
      oldTokenMint: projectAcc.oldTokenMint,
      newTokenMint: projectAcc.newTokenMint,
      oldTokenProgram: projectAcc.oldTokenProgram,
      newTokenProgram: projectAcc.newTokenProgram,
      projectAdmin: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

export async function fundProject(
  account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
  wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
  projectId: number,
  amountBaseUnits: string
) {
  const provider = createAnchorProviderFromWalletUi(account, wallet);
  const program = getProgram(provider);
  const [project] = getProjectPDA(provider.wallet.publicKey, projectId);
  const projectAcc = await program.account.project.fetch(project);
  const adminNewTokenAccount = await getAssociatedTokenAddress(
    projectAcc.newTokenMint,
    provider.wallet.publicKey,
    false,
    projectAcc.newTokenProgram,
  );
  return program.methods
    .fundProject(new BN(amountBaseUnits))
    .accounts({
      project,
      newTokenVault: projectAcc.newTokenVault,
      newTokenMint: projectAcc.newTokenMint,
      projectAdminTokenAccount: adminNewTokenAccount,
      projectAdmin: provider.wallet.publicKey,
      newTokenProgram: projectAcc.newTokenProgram,
    } as any)
    .rpc();
}

export type ActivateProjectParams = {
  projectId: number;
  initialPrice: string; // e.g. '0.001' scaled by 1e9
  tokenAllocation: string; // base units
  binStep: number;
  baseFee: number;
  priceRangeMin: string; // e.g. '0.0005' scaled by 1e9
  priceRangeMax: string; // e.g. '0.002' scaled by 1e9
  meteoraPool: string;
  lpMint: string;
};

export async function activateProject(
  account: NonNullable<ReturnType<typeof useWalletUi>['account']>,
  wallet: NonNullable<ReturnType<typeof useWalletUi>['wallet']>,
  p: ActivateProjectParams
) {
  const provider = createAnchorProviderFromWalletUi(account, wallet);
  const program = getProgram(provider);
  const [project] = getProjectPDA(provider.wallet.publicKey, p.projectId);
  const projectAcc = await program.account.project.fetch(project);
  const [lpEscrowVault] = PublicKey.findProgramAddressSync([Buffer.from('lp_escrow_vault'), project.toBuffer()], program.programId);
  const scale1e9 = (v: string) => new BN(Math.floor(parseFloat(v) * 1e9));
  return program.methods
    .activateProject({
      initialPrice: scale1e9(p.initialPrice),
      tokenAllocation: new BN(p.tokenAllocation),
      binStep: p.binStep,
      baseFee: p.baseFee,
      priceRangeMin: scale1e9(p.priceRangeMin),
      priceRangeMax: scale1e9(p.priceRangeMax),
    } as any)
    .accounts({
      project,
      newTokenVault: projectAcc.newTokenVault,
      liquidityVault: projectAcc.liquidityVault,
      lpEscrowVault,
      meteoraPool: new PublicKey(p.meteoraPool),
      lpMint: new PublicKey(p.lpMint),
      newTokenMint: projectAcc.newTokenMint,
      newTokenProgram: projectAcc.newTokenProgram,
      tokenProgram: TOKEN_PROGRAM_ID,
      projectAdmin: provider.wallet.publicKey,
      meteoraProgram: new PublicKey(p.meteoraPool),
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

// Export aliases for backward compatibility
export const fundProjectIx = fundProject;
export const activateProjectIx = activateProject;
