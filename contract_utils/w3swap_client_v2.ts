import * as anchor from "@coral-xyz/anchor";
import { Program, BN, web3 } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  ComputeBudgetProgram,
  AccountMeta,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { W3swap } from "../target/types/w3swap";
import * as fs from "fs";
import * as path from "path";

const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

export type LpConfiguration = {
  initialPrice: BN; // scaled by 1e9
  tokenAllocation: BN;
  binStep: number; // u16
  baseFee: number; // u16
  priceRangeMin: BN; // scaled by 1e9
  priceRangeMax: BN; // scaled by 1e9
};

export class W3SwapClientV2 {
  readonly program?: Program<W3swap>;
  readonly provider: anchor.AnchorProvider;
  readonly idl: any;
  readonly coder: any;
  readonly programId: PublicKey;

  constructor(connection: web3.Connection, wallet: anchor.Wallet, programId: PublicKey) {
    this.provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    this.programId = programId;

    const resolveIdl = (): any => {
      // Allow override via env var
      const envPath = process.env.W3SWAP_IDL_PATH;
      const candidates = [
        envPath,
        path.join(__dirname, "../target/idl/w3swap.json"),
        path.join(process.cwd(), "target/idl/w3swap.json"),
        path.join(process.cwd(), "frontend/src/idl/w3swap.json"),
      ].filter(Boolean) as string[];
      for (const p of candidates) {
        try {
          if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, "utf8");
            return JSON.parse(raw);
          }
        } catch {
          // continue
        }
      }
      try { return require("../target/idl/w3swap.json"); } catch {}
      throw new Error(
        "W3Swap IDL not found. Provide W3SWAP_IDL_PATH or ensure target/idl/w3swap.json (or frontend/src/idl/w3swap.json) exists inside the container."
      );
    };

    const idl = JSON.parse(JSON.stringify(resolveIdl()));
    // Anchor@0.32 may throw when building Account namespace if IDL accounts
    // are missing type.size metadata. We don't need account clients here,
    // so clear the accounts array to bypass AccountClient construction.
    (idl as any).accounts = [];
    this.idl = idl;
    const BorshCoder = (anchor as any).BorshCoder || (anchor as any).Coder; // fallback
    this.coder = new BorshCoder(idl as any);
    try {
      this.program = new Program<W3swap>(idl as any, programId as any, this.provider as any, this.coder as any);
    } catch (e) {
      // Fallback mode: operate without Program namespace
      console.warn("Anchor Program namespace build failed; using fallback coder mode.");
      this.program = undefined;
    }
  }

  private method(nameCamel: string, nameSnake: string): any {
    if (!this.program) return undefined;
    const anyMethods = (this.program.methods as any) ?? {};
    const fn = anyMethods[nameCamel] ?? anyMethods[nameSnake];
    if (!fn) throw new Error(`IDL method not found: ${nameCamel}/${nameSnake}`);
    return fn;
  }

  private buildIx(name: string, accounts: Record<string, PublicKey>, args: any[]): web3.TransactionInstruction {
    const ixIdl = (this.idl.instructions as any[]).find((i) => i.name === name);
    if (!ixIdl) throw new Error(`IDL instruction not found: ${name}`);
    const data = this.coder.instruction.encode(name, args);
    const metas = ixIdl.accounts.map((acc: any) => {
      const pk = accounts[acc.name];
      if (!pk) throw new Error(`Missing account '${acc.name}' for instruction '${name}'`);
      return { pubkey: pk, isSigner: !!acc.signer, isWritable: !!acc.writable } as web3.AccountMeta;
    });
    return new web3.TransactionInstruction({ programId: this.programId, keys: metas, data });
  }

  private async sendIx(ix: web3.TransactionInstruction): Promise<string> {
    const tx = new web3.Transaction().add(ix);
    const payer = (this.provider.wallet as any).payer;
    return web3.sendAndConfirmTransaction(this.provider.connection, tx, [payer]);
  }

  // ---------- PDA helpers ----------
  getPlatformConfigPda() {
    return PublicKey.findProgramAddressSync([Buffer.from("platform_config")], this.programId);
  }

  getProjectPda(projectAdmin: PublicKey, projectId: BN) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("project"), projectAdmin.toBuffer(), projectId.toArrayLike(Buffer, "le", 8)],
      this.programId
    );
  }

  getVaultPda(seed: string, project: PublicKey) {
    return PublicKey.findProgramAddressSync([Buffer.from(seed), project.toBuffer()], this.programId);
  }

  // Deterministic ATAs
  async getProjectWsolVaultAta(projectPda: PublicKey): Promise<PublicKey> {
    return getAssociatedTokenAddress(WSOL_MINT, projectPda, true);
  }
  async getFeeDestinationWsolAta(feeDestinationWallet: PublicKey): Promise<PublicKey> {
    return getAssociatedTokenAddress(WSOL_MINT, feeDestinationWallet, false);
  }

  // ---------- Compute budget helpers ----------
  withComputeBudget(units: number = 1_000_000, microLamports: number = 0): TransactionInstruction[] {
    const ixs: TransactionInstruction[] = [ComputeBudgetProgram.setComputeUnitLimit({ units })];
    if (microLamports > 0) {
      ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports }));
    }
    return ixs;
  }

  // ---------- Platform management ----------
  async initializePlatform(args: {
    superAdmin?: PublicKey; // defaults to wallet
    feeDestinationWallet: PublicKey;
    minSolCommitment: BN; // lamports
    autoPauseThresholdPercent: number; // u8 1-50
  }): Promise<string> {
    const [platformConfig] = this.getPlatformConfigPda();
    const superAdmin = args.superAdmin ?? this.provider.wallet.publicKey;
    const m = this.method("initializePlatform", "initialize_platform");
    if (m) {
      return m(args.feeDestinationWallet, new BN(args.minSolCommitment), args.autoPauseThresholdPercent)
        .accounts({ platformConfig, superAdmin, systemProgram: SystemProgram.programId } as any)
        .rpc();
    }
    const ix = this.buildIx("initialize_platform", {
      platform_config: platformConfig,
      super_admin: superAdmin,
      system_program: SystemProgram.programId,
    } as any, [args.feeDestinationWallet, new BN(args.minSolCommitment), args.autoPauseThresholdPercent]);
    return this.sendIx(ix);
  }

  async manageProjectAdmin(admin: PublicKey, action: { add: {} } | { remove: {} }): Promise<string> {
    const [platformConfig] = this.getPlatformConfigPda();
    const m = this.method("manageProjectAdmin", "manage_project_admin");
    if (m) {
      return m(admin, action as any)
        .accounts({ platformConfig, superAdmin: this.provider.wallet.publicKey } as any)
        .rpc();
    }
    const ix = this.buildIx("manage_project_admin", {
      platform_config: platformConfig,
      super_admin: this.provider.wallet.publicKey,
    } as any, [admin, action as any]);
    return this.sendIx(ix);
  }

  async updatePlatformConfig(params: {
    allowedSwapPrograms?: PublicKey[];
    minSolCommitment?: BN;
    autoPauseThresholdPercent?: number; // u8
    platformFeeSol?: number; // u8
    settlementFeePercent?: number; // u8
    minMigrationDays?: number; // u8
    maxMigrationDays?: number; // u8
    minLpLockDays?: number; // u8
  }): Promise<string> {
    const [platformConfig] = this.getPlatformConfigPda();
    // Anchor can’t pass undefined in Options cleanly; ensure null for omitted
    const o = (v: any) => (v === undefined ? null : v);
    const args = [
      o(params.allowedSwapPrograms ?? null),
      o(params.minSolCommitment ?? null),
      o(params.autoPauseThresholdPercent ?? null),
      o(params.platformFeeSol ?? null),
      o(params.settlementFeePercent ?? null),
      o(params.minMigrationDays ?? null),
      o(params.maxMigrationDays ?? null),
      o(params.minLpLockDays ?? null),
    ];
    const m = this.method("updatePlatformConfig", "update_platform_config");
    if (m) {
      return (m as any)(...args)
        .accounts({ platformConfig, superAdmin: this.provider.wallet.publicKey } as any)
        .rpc();
    }
    const ix = this.buildIx("update_platform_config", {
      platform_config: platformConfig,
      super_admin: this.provider.wallet.publicKey,
    } as any, args);
    return this.sendIx(ix);
  }

  async updateFeeDestinationWallet(newFeeDestination: PublicKey): Promise<string> {
    const [platformConfig] = this.getPlatformConfigPda();
    return this.program.methods
      .updateFeeDestinationWallet(newFeeDestination)
      .accounts({ platformConfig, superAdmin: this.provider.wallet.publicKey } as any)
      .rpc();
  }

  // ---------- Project lifecycle ----------
  async createProjectInit(args: {
    projectId: BN;
    projectName: string;
    oldTokenMint: PublicKey;
    newTokenMint: PublicKey;
    oldTokenProgram?: PublicKey; // defaults SPL
    newTokenProgram?: PublicKey; // defaults SPL
    migrationStart: BN; // epoch seconds
    migrationEnd: BN; // epoch seconds
    exchangeRatioNumerator: BN; // 0 for 1:1
    exchangeRatioDenominator: BN; // 0 for 1:1
    solCommitmentAmount: BN; // lamports
    specialRatioEnabled?: boolean;
    specialRatioWallets?: PublicKey[];
    allowlistEnabled?: boolean;
    denylistEnabled?: boolean;
    allowlist?: PublicKey[];
    denylist?: PublicKey[];
  }): Promise<string> {
    const [platformConfig] = this.getPlatformConfigPda();
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, args.projectId);

    const params = {
      projectId: args.projectId,
      projectName: args.projectName,
      oldTokenMint: args.oldTokenMint,
      newTokenMint: args.newTokenMint,
      oldTokenProgram: args.oldTokenProgram ?? TOKEN_PROGRAM_ID,
      newTokenProgram: args.newTokenProgram ?? TOKEN_PROGRAM_ID,
      migrationStart: args.migrationStart,
      migrationEnd: args.migrationEnd,
      exchangeRatioNumerator: args.exchangeRatioNumerator,
      exchangeRatioDenominator: args.exchangeRatioDenominator,
      solCommitmentAmount: args.solCommitmentAmount,
      specialRatioEnabled: args.specialRatioEnabled ?? false,
      specialRatioWallets: args.specialRatioWallets ?? [],
      allowlistEnabled: args.allowlistEnabled ?? false,
      denylistEnabled: args.denylistEnabled ?? false,
      allowlist: args.allowlist ?? [],
      denylist: args.denylist ?? [],
    };

    return this.program.methods
      .createProjectInit(params as any)
      .accounts({
        platformConfig,
        project,
        oldTokenMint: params.oldTokenMint,
        newTokenMint: params.newTokenMint,
        oldTokenProgram: params.oldTokenProgram,
        newTokenProgram: params.newTokenProgram,
        projectAdmin: this.provider.wallet.publicKey,
        feeDestination: (await this.program.account.platformConfig.fetch(platformConfig)).feeDestinationWallet,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
  }

  async createProjectVaults(projectId: BN): Promise<string> {
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, projectId);
    const projectAcc = await this.program.account.project.fetch(project);
    const [oldTokenVault] = this.getVaultPda("old_token_vault", project);
    const [newTokenVault] = this.getVaultPda("new_token_vault", project);
    const [liquidityVault] = this.getVaultPda("liquidity_vault", project);

    return this.program.methods
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
        projectAdmin: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
  }
  
  async fundProject(projectId: BN, amount: BN): Promise<string> {
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, projectId);
    const projectAcc = await this.program.account.project.fetch(project);
    const adminNewTokenAccount = await getAssociatedTokenAddress(
      projectAcc.newTokenMint,
      this.provider.wallet.publicKey,
      false,
      projectAcc.newTokenProgram,
    );
    return this.program.methods
      .fundProject(amount)
      .accounts({
        project,
        newTokenVault: projectAcc.newTokenVault,
        newTokenMint: projectAcc.newTokenMint,
        projectAdminTokenAccount: adminNewTokenAccount,
        projectAdmin: this.provider.wallet.publicKey,
        newTokenProgram: projectAcc.newTokenProgram,
      } as any)
      .rpc();
  }

  async activateProject(projectId: BN, lpConfig: LpConfiguration, meteoraPool: PublicKey, lpMint: PublicKey): Promise<string> {
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, projectId);
    const projectAcc = await this.program.account.project.fetch(project);
    const [lpEscrowVault] = this.getVaultPda("lp_escrow_vault", project);
    return this.program.methods
      .activateProject({
        initialPrice: lpConfig.initialPrice,
        tokenAllocation: lpConfig.tokenAllocation,
        binStep: lpConfig.binStep,
        baseFee: lpConfig.baseFee,
        priceRangeMin: lpConfig.priceRangeMin,
        priceRangeMax: lpConfig.priceRangeMax,
      } as any)
      .accounts({
        project,
        newTokenVault: projectAcc.newTokenVault,
        liquidityVault: projectAcc.liquidityVault,
        lpEscrowVault,
        meteoraPool,
        lpMint,
        newTokenMint: projectAcc.newTokenMint,
        newTokenProgram: projectAcc.newTokenProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
        projectAdmin: this.provider.wallet.publicKey,
        meteoraProgram: meteoraPool,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
  }

  pauseProject(projectId: BN) {
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, projectId);
    return this.program.methods
      .pauseProject()
      .accounts({ project, projectAdmin: this.provider.wallet.publicKey } as any)
      .rpc();
  }

  async resumeProject(projectId: BN): Promise<string> {
    const [platformConfig] = this.getPlatformConfigPda();
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, projectId);
    const projectAcc = await this.program.account.project.fetch(project);
    return this.program.methods
      .resumeProject()
      .accounts({
        platformConfig,
        project,
        newTokenVault: projectAcc.newTokenVault,
        newTokenMint: projectAcc.newTokenMint,
        projectAdmin: this.provider.wallet.publicKey,
      } as any)
      .rpc();
  }

  endProject(projectId: BN) {
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, projectId);
    return this.program.methods
      .endProject()
      .accounts({ project, projectAdmin: this.provider.wallet.publicKey } as any)
      .rpc();
  }

  async finalizeProjectTransfers(projectId: BN, lpMint: PublicKey): Promise<string> {
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, projectId);
    const projectAcc = await this.program.account.project.fetch(project);
    const adminLpTokenAccount = await getAssociatedTokenAddress(lpMint, this.provider.wallet.publicKey);
    const adminNewTokenAccount = await getAssociatedTokenAddress(
      projectAcc.newTokenMint,
      this.provider.wallet.publicKey,
      false,
      projectAcc.newTokenProgram,
    );
    return this.program.methods
      .finalizeProjectTransfers()
      .accounts({
        project,
        lpEscrowVault: projectAcc.lpEscrowVault,
        newTokenVault: projectAcc.newTokenVault,
        oldTokenVault: projectAcc.oldTokenVault,
        adminLpTokenAccount,
        adminNewTokenAccount,
        lpMint,
        newTokenMint: projectAcc.newTokenMint,
        newTokenProgram: projectAcc.newTokenProgram,
        lpTokenProgram: TOKEN_PROGRAM_ID,
        projectAdmin: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
  }

  async closeProjectAccounts(projectId: BN): Promise<string> {
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, projectId);
    const projectAcc = await this.program.account.project.fetch(project);
    const [liquidityVault] = this.getVaultPda("liquidity_vault", project);
    return this.program.methods
      .closeProjectAccounts()
      .accounts({
        project,
        newTokenVault: projectAcc.newTokenVault,
        oldTokenVault: projectAcc.oldTokenVault,
        liquidityVault,
        projectAdmin: this.provider.wallet.publicKey,
        newTokenProgram: projectAcc.newTokenProgram,
        oldTokenProgram: projectAcc.oldTokenProgram,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
  }

  async depositLp(projectId: BN, lpMint: PublicKey, amount: BN) {
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, projectId);
    const [lpEscrowVault] = this.getVaultPda("lp_escrow_vault", project);
    const adminLpAta = await getAssociatedTokenAddress(lpMint, this.provider.wallet.publicKey);
    return this.program.methods
      .depositLp(amount)
      .accounts({
        project,
        lpEscrowVault,
        projectAdminLpAccount: adminLpAta,
        lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        projectAdmin: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
  }

  async withdrawLp(projectId: BN, lpMint: PublicKey, amount: BN) {
    const [project] = this.getProjectPda(this.provider.wallet.publicKey, projectId);
    const projectAcc = await this.program.account.project.fetch(project);
    const adminLpAta = await getAssociatedTokenAddress(lpMint, this.provider.wallet.publicKey);
    return this.program.methods
      .withdrawLp(amount)
      .accounts({
        project,
        lpEscrowVault: projectAcc.lpEscrowVault,
        projectAdminLpAccount: adminLpAta,
        lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        projectAdmin: this.provider.wallet.publicKey,
      } as any)
      .rpc();
  }

  // ---------- Adapters: swaps and finalization ----------
  async ensureWsolVaultAta(project: PublicKey): Promise<string | null> {
    const ata = await this.getProjectWsolVaultAta(project);
    const info = await this.provider.connection.getAccountInfo(ata);
    if (info) return null;
    const ix = createAssociatedTokenAccountInstruction(
      this.provider.wallet.publicKey,
      ata,
      project,
      WSOL_MINT,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const tx = new web3.Transaction().add(ix);
    return web3.sendAndConfirmTransaction(this.provider.connection, tx, [
      (this.provider.wallet as any).payer,
    ]);
  }

  async ensureFeeDestinationWsolAta(feeDestinationWallet: PublicKey): Promise<string | null> {
    const ata = await this.getFeeDestinationWsolAta(feeDestinationWallet);
    const info = await this.provider.connection.getAccountInfo(ata);
    if (info) return null;
    const ix = createAssociatedTokenAccountInstruction(
      this.provider.wallet.publicKey,
      ata,
      feeDestinationWallet,
      WSOL_MINT,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const tx = new web3.Transaction().add(ix);
    return web3.sendAndConfirmTransaction(this.provider.connection, tx, [
      (this.provider.wallet as any).payer,
    ]);
  }

  async executeMeteoraSwap(args: {
    projectId: BN;
    projectAdmin?: PublicKey; // defaults wallet
    amountIn: BN;
    minOutWsol: BN;
    routeProgram: PublicKey; // Meteora program id
    ixData: Buffer; // serialized route ix
    remainingAccounts: AccountMeta[]; // route accounts
  }): Promise<string> {
    const admin = args.projectAdmin ?? this.provider.wallet.publicKey;
    const [platformConfig] = this.getPlatformConfigPda();
    const [project] = this.getProjectPda(admin, args.projectId);
    const projectAcc = await this.program.account.project.fetch(project);
    await this.ensureWsolVaultAta(project);
    const remaining = [
      { pubkey: args.routeProgram, isSigner: false, isWritable: false } as AccountMeta,
      ...args.remainingAccounts,
    ];
    return this.program.methods
      .executeMeteoraSwap(args.amountIn, args.minOutWsol, Buffer.from(args.ixData))
      .accounts({
        platformConfig,
        project,
        oldTokenVault: projectAcc.oldTokenVault,
        wsolVault: projectAcc.wsolVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        routeProgram: args.routeProgram,
        payer: this.provider.wallet.publicKey,
      } as any)
      .remainingAccounts(remaining)
      .preInstructions(this.withComputeBudget(1_000_000))
      .rpc();
  }

  async executeJupiterSwap(args: {
    projectId: BN;
    projectAdmin?: PublicKey;
    amountIn: BN;
    minOutWsol: BN;
    routeProgram: PublicKey; // Jupiter program id
    ixData: Buffer;
    remainingAccounts: AccountMeta[];
  }): Promise<string> {
    const admin = args.projectAdmin ?? this.provider.wallet.publicKey;
    const [platformConfig] = this.getPlatformConfigPda();
    const [project] = this.getProjectPda(admin, args.projectId);
    const projectAcc = await this.program.account.project.fetch(project);
    await this.ensureWsolVaultAta(project);
    const remaining = [
      { pubkey: args.routeProgram, isSigner: false, isWritable: false } as AccountMeta,
      ...args.remainingAccounts,
    ];
    return this.program.methods
      .executeJupiterSwap(args.amountIn, args.minOutWsol, Buffer.from(args.ixData))
      .accounts({
        platformConfig,
        project,
        oldTokenVault: projectAcc.oldTokenVault,
        wsolVault: projectAcc.wsolVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        routeProgram: args.routeProgram,
        payer: this.provider.wallet.publicKey,
      } as any)
      .remainingAccounts(remaining)
      .preInstructions(this.withComputeBudget(1_400_000))
      .rpc();
  }

  async finalizeSettlement(args: {
    projectId: BN;
    projectAdmin?: PublicKey;
    routeProgram: PublicKey; // Meteora program id
    lpAddIxData: Buffer; // serialized LP add ix
    remainingAccounts: AccountMeta[]; // DLMM add-liquidity accounts
    feeDestinationWallet: PublicKey; // wallet pubkey for fee skim
    lpMint: PublicKey;
  }): Promise<string> {
    const admin = args.projectAdmin ?? this.provider.wallet.publicKey;
    const [platformConfig] = this.getPlatformConfigPda();
    const [project] = this.getProjectPda(admin, args.projectId);
    const projectAcc = await this.program.account.project.fetch(project);
    const feeDestinationTokenAccount = await getAssociatedTokenAddress(WSOL_MINT, args.feeDestinationWallet);
    const remaining = [
      { pubkey: args.routeProgram, isSigner: false, isWritable: false } as AccountMeta,
      ...args.remainingAccounts,
    ];
    return this.program.methods
      .finalizeSettlement(Buffer.from(args.lpAddIxData))
      .accounts({
        platformConfig,
        project,
        wsolVault: projectAcc.wsolVault,
        lpEscrowVault: projectAcc.lpEscrowVault,
        lpMint: args.lpMint,
        wsolMint: WSOL_MINT,
        feeDestinationTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        routeProgram: args.routeProgram,
        payer: this.provider.wallet.publicKey,
      } as any)
      .remainingAccounts(remaining)
      .preInstructions(this.withComputeBudget(1_200_000))
      .rpc();
  }

  // ---------- Events & listeners ----------
  addEventListeners(handlers: {
    onPlatformInitialized?: (e: any) => void;
    onProjectCreated?: (e: any) => void;
    onProjectFunded?: (e: any) => void;
    onProjectStatusChanged?: (e: any) => void;
    onMigrationPerformed?: (e: any) => void;
    onLpCreated?: (e: any) => void;
    onLpDeposited?: (e: any) => void;
    onLpWithdrawn?: (e: any) => void;
    onSwapExecuted?: (e: any) => void;
    onSettlementCompleted?: (e: any) => void;
    onProjectFinalized?: (e: any) => void;
    onVaultBalanceLow?: (e: any) => void;
  }) {
    const ids: number[] = [];
    const add = (name: string, cb?: (e: any) => void) => {
      if (!cb) return;
      const id = this.program.addEventListener(name as any, cb);
      ids.push(id as unknown as number);
    };
    add("PlatformInitialized", handlers.onPlatformInitialized);
    add("ProjectCreated", handlers.onProjectCreated);
    add("ProjectFunded", handlers.onProjectFunded);
    add("ProjectStatusChanged", handlers.onProjectStatusChanged);
    add("MigrationPerformed", handlers.onMigrationPerformed);
    add("LpCreated", handlers.onLpCreated);
    add("LpDeposited", handlers.onLpDeposited);
    add("LpWithdrawn", handlers.onLpWithdrawn);
    add("SwapExecuted", handlers.onSwapExecuted);
    add("SettlementCompleted", handlers.onSettlementCompleted);
    add("ProjectFinalized", handlers.onProjectFinalized);
    add("VaultBalanceLow", handlers.onVaultBalanceLow);
    return () => ids.forEach((id) => this.program.removeEventListener(id));
  }
}
