// NOTE: Legacy client kept for reference. The on-chain API has been
// refactored and split (create_project_init/create_project_vaults,
// finalize_project_transfers/close_project_accounts, execute_* adapters).
// Prefer using contract_utils/w3swap_client_v2.ts which matches the current IDL.
import * as anchor from "@coral-xyz/anchor";
import { Program, BN, web3 } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { W3swap } from "../target/types/w3swap";

export class W3SwapClient {
  private program: Program<W3swap>;
  private provider: anchor.AnchorProvider;

  constructor(
    connection: web3.Connection,
    wallet: anchor.Wallet,
    programId: PublicKey
  ) {
    this.provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    this.program = new Program<W3swap>(
      require("../target/idl/w3swap.json"),
      programId,
      this.provider
    );
  }

  // PDA derivation helpers
  async getPlatformConfigPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      this.program.programId
    );
  }

  async getProjectPDA(
    projectAdmin: PublicKey,
    projectId: BN
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("project"),
        projectAdmin.toBuffer(),
        projectId.toArrayLike(Buffer, "le", 8),
      ],
      this.program.programId
    );
  }

  async getVaultPDA(
    seedPrefix: string,
    project: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(seedPrefix), project.toBuffer()],
      this.program.programId
    );
  }

  async getUserMigrationPDA(
    project: PublicKey,
    user: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("user_migration"), project.toBuffer(), user.toBuffer()],
      this.program.programId
    );
  }

  // Platform Management Instructions
  async initializePlatform(
    superAdmin: PublicKey,
    feeDestinationWallet: PublicKey
  ): Promise<string> {
    const [platformConfig] = await this.getPlatformConfigPDA();

    const tx = await this.program.methods
      .initializePlatform()
      .accounts({
        platformConfig,
        superAdmin,
        feeDestinationWallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async manageProjectAdmin(
    admin: PublicKey,
    action: { add: {} } | { remove: {} }
  ): Promise<string> {
    const [platformConfig] = await this.getPlatformConfigPDA();

    const tx = await this.program.methods
      .manageProjectAdmin(admin, action)
      .accounts({
        platformConfig,
        superAdmin: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  async updateFeeDestinationWallet(
    newFeeDestinationWallet: PublicKey
  ): Promise<string> {
    const [platformConfig] = await this.getPlatformConfigPDA();

    const tx = await this.program.methods
      .updateFeeDestinationWallet(newFeeDestinationWallet)
      .accounts({
        platformConfig,
        superAdmin: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Project Creation
  async createProject(params: {
    projectId: BN;
    projectName: string;
    oldTokenMint: PublicKey;
    newTokenMint: PublicKey;
    oldTokenProgram: PublicKey;
    newTokenProgram: PublicKey;
    migrationStart: BN;
    migrationEnd: BN;
    exchangeRatioNumerator: BN;
    exchangeRatioDenominator: BN;
    solCommitmentAmount: BN;
    recoveryDelaySeconds: BN;
    specialRatioEnabled: boolean;
    specialRatioWallets: PublicKey[];
    allowlistEnabled: boolean;
    denylistEnabled: boolean;
    allowlist: PublicKey[];
    denylist: PublicKey[];
  }): Promise<string> {
    const [platformConfig] = await this.getPlatformConfigPDA();
    const [project] = await this.getProjectPDA(
      this.provider.wallet.publicKey,
      params.projectId
    );
    const [oldTokenVault] = await this.getVaultPDA("old_token_vault", project);
    const [newTokenVault] = await this.getVaultPDA("new_token_vault", project);
    const [liquidityVault] = await this.getVaultPDA("liquidity_vault", project);

    const platformConfigAccount = await this.program.account.platformConfig.fetch(
      platformConfig
    );

    const tx = await this.program.methods
      .createProject({
        projectId: params.projectId,
        projectName: params.projectName,
        oldTokenMint: params.oldTokenMint,
        newTokenMint: params.newTokenMint,
        oldTokenProgram: params.oldTokenProgram,
        newTokenProgram: params.newTokenProgram,
        migrationStart: params.migrationStart,
        migrationEnd: params.migrationEnd,
        exchangeRatioNumerator: params.exchangeRatioNumerator,
        exchangeRatioDenominator: params.exchangeRatioDenominator,
        solCommitmentAmount: params.solCommitmentAmount,
        recoveryDelaySeconds: params.recoveryDelaySeconds,
        specialRatioEnabled: params.specialRatioEnabled,
        specialRatioWallets: params.specialRatioWallets,
        allowlistEnabled: params.allowlistEnabled,
        denylistEnabled: params.denylistEnabled,
        allowlist: params.allowlist,
        denylist: params.denylist,
      })
      .accounts({
        platformConfig,
        project,
        oldTokenVault,
        newTokenVault,
        liquidityVault,
        oldTokenMint: params.oldTokenMint,
        newTokenMint: params.newTokenMint,
        oldTokenProgram: params.oldTokenProgram,
        newTokenProgram: params.newTokenProgram,
        projectAdmin: this.provider.wallet.publicKey,
        feeDestination: platformConfigAccount.feeDestinationWallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  // Fund Project
  async fundProject(
    projectId: BN,
    amount: BN
  ): Promise<string> {
    const [project] = await this.getProjectPDA(
      this.provider.wallet.publicKey,
      projectId
    );
    
    const projectAccount = await this.program.account.project.fetch(project);
    
    const projectAdminTokenAccount = await getAssociatedTokenAddress(
      projectAccount.newTokenMint,
      this.provider.wallet.publicKey,
      false,
      projectAccount.newTokenProgram
    );

    const tx = await this.program.methods
      .fundProject(amount)
      .accounts({
        project,
        newTokenVault: projectAccount.newTokenVault,
        newTokenMint: projectAccount.newTokenMint,
        projectAdminTokenAccount,
        projectAdmin: this.provider.wallet.publicKey,
        newTokenProgram: projectAccount.newTokenProgram,
      })
      .rpc();

    return tx;
  }

  // Activate Project with LP Configuration
  async activateProject(
    projectId: BN,
    lpConfig: {
      initialPrice: number;
      tokenAllocation: number;
      binStep: number;
      baseFee: number;
      priceRange: { min: number; max: number };
    },
    meteoraPoolAddress?: PublicKey,
    lpMintAddress?: PublicKey
  ): Promise<string> {
    const [project] = await this.getProjectPDA(
      this.provider.wallet.publicKey,
      projectId
    );
    
    const projectAccount = await this.program.account.project.fetch(project);
    const [liquidityVault] = await this.getVaultPDA("liquidity_vault", project);
    const [lpEscrowVault] = await this.getVaultPDA("lp_escrow_vault", project);

    // Convert configuration to blockchain format
    const blockchainConfig = {
      initialPrice: new BN(lpConfig.initialPrice * 1e9), // Scale to 1e9 precision
      tokenAllocation: new BN(lpConfig.tokenAllocation),
      binStep: lpConfig.binStep,
      baseFee: lpConfig.baseFee,
      priceRangeMin: new BN(lpConfig.priceRange.min * 1e9),
      priceRangeMax: new BN(lpConfig.priceRange.max * 1e9),
    };

    const tx = await this.program.methods
      .activateProject(blockchainConfig)
      .accounts({
        project,
        newTokenVault: projectAccount.newTokenVault,
        liquidityVault,
        lpEscrowVault,
        meteoraPool: meteoraPoolAddress || new PublicKey("11111111111111111111111111111111"), // Placeholder
        lpMint: lpMintAddress || new PublicKey("11111111111111111111111111111111"), // Placeholder
        newTokenMint: projectAccount.newTokenMint,
        newTokenProgram: projectAccount.newTokenProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
        projectAdmin: this.provider.wallet.publicKey,
        meteoraProgram: new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"), // Meteora DLMM program
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  // Pause/Resume Project
  async pauseProject(projectId: BN): Promise<string> {
    const [project] = await this.getProjectPDA(
      this.provider.wallet.publicKey,
      projectId
    );

    const tx = await this.program.methods
      .pauseProject()
      .accounts({
        project,
        projectAdmin: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  async resumeProject(projectId: BN): Promise<string> {
    const [project] = await this.getProjectPDA(
      this.provider.wallet.publicKey,
      projectId
    );

    const tx = await this.program.methods
      .resumeProject()
      .accounts({
        project,
        projectAdmin: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // End Project
  async endProject(projectId: BN): Promise<string> {
    const [project] = await this.getProjectPDA(
      this.provider.wallet.publicKey,
      projectId
    );

    const tx = await this.program.methods
      .endProject()
      .accounts({
        project,
        projectAdmin: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // User Migration
  async migrate(
    project: PublicKey,
    amount: BN
  ): Promise<string> {
    const projectAccount = await this.program.account.project.fetch(project);
    const [userMigration] = await this.getUserMigrationPDA(
      project,
      this.provider.wallet.publicKey
    );

    const userOldTokenAccount = await getAssociatedTokenAddress(
      projectAccount.oldTokenMint,
      this.provider.wallet.publicKey,
      false,
      projectAccount.oldTokenProgram
    );

    const userNewTokenAccount = await getAssociatedTokenAddress(
      projectAccount.newTokenMint,
      this.provider.wallet.publicKey,
      false,
      projectAccount.newTokenProgram
    );

    const tx = await this.program.methods
      .migrate(amount)
      .accounts({
        project,
        userMigration,
        oldTokenVault: projectAccount.oldTokenVault,
        newTokenVault: projectAccount.newTokenVault,
        userOldTokenAccount,
        userNewTokenAccount,
        oldTokenMint: projectAccount.oldTokenMint,
        newTokenMint: projectAccount.newTokenMint,
        oldTokenProgram: projectAccount.oldTokenProgram,
        newTokenProgram: projectAccount.newTokenProgram,
        user: this.provider.wallet.publicKey,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  // Finalize and Execute Route
  async finalizeAndExecuteRoute(
    projectId: BN,
    projectAdmin: PublicKey,
    route: any[],
    minOut: BN,
    remainingAccounts: web3.AccountMeta[]
  ): Promise<string> {
    const [platformConfig] = await this.getPlatformConfigPDA();
    const [project] = await this.getProjectPDA(projectAdmin, projectId);
    const projectAccount = await this.program.account.project.fetch(project);
    const [liquidityVault] = await this.getVaultPDA("liquidity_vault", project);

    const tx = await this.program.methods
      .finalizeAndExecuteRoute(route, minOut)
      .accounts({
        platformConfig,
        project,
        liquidityVault,
        newTokenVault: projectAccount.newTokenVault,
        newTokenMint: projectAccount.newTokenMint,
        newTokenProgram: projectAccount.newTokenProgram,
        projectAdmin: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts(remainingAccounts)
      .rpc();

    return tx;
  }

  // Mark LP Created
  async markLpCreated(
    projectId: BN
  ): Promise<string> {
    const [project] = await this.getProjectPDA(
      this.provider.wallet.publicKey,
      projectId
    );

    const tx = await this.program.methods
      .markLpCreated()
      .accounts({
        project,
        projectAdmin: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Deposit LP Tokens
  async depositLp(
    projectId: BN,
    lpMint: PublicKey,
    amount: BN
  ): Promise<string> {
    const [project] = await this.getProjectPDA(
      this.provider.wallet.publicKey,
      projectId
    );
    const [lpEscrowVault] = await this.getVaultPDA("lp_escrow_vault", project);
    
    const projectAdminLpAccount = await getAssociatedTokenAddress(
      lpMint,
      this.provider.wallet.publicKey
    );

    const tx = await this.program.methods
      .depositLp(amount)
      .accounts({
        project,
        lpEscrowVault,
        projectAdminLpAccount,
        lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        projectAdmin: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  // Withdraw LP Tokens
  async withdrawLp(
    projectId: BN,
    lpMint: PublicKey,
    amount: BN
  ): Promise<string> {
    const [project] = await this.getProjectPDA(
      this.provider.wallet.publicKey,
      projectId
    );
    const projectAccount = await this.program.account.project.fetch(project);
    
    const projectAdminLpAccount = await getAssociatedTokenAddress(
      lpMint,
      this.provider.wallet.publicKey
    );

    const tx = await this.program.methods
      .withdrawLp(amount)
      .accounts({
        project,
        lpEscrowVault: projectAccount.lpEscrowVault,
        projectAdminLpAccount,
        lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        projectAdmin: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Admin Recover Unclaimed Tokens
  async adminRecoverUnclaimedTokens(
    projectId: BN
  ): Promise<string> {
    const [project] = await this.getProjectPDA(
      this.provider.wallet.publicKey,
      projectId
    );
    const projectAccount = await this.program.account.project.fetch(project);
    
    const projectAdminTokenAccount = await getAssociatedTokenAddress(
      projectAccount.newTokenMint,
      this.provider.wallet.publicKey,
      false,
      projectAccount.newTokenProgram
    );

    const tx = await this.program.methods
      .adminRecoverUnclaimedTokens()
      .accounts({
        project,
        newTokenVault: projectAccount.newTokenVault,
        projectAdminTokenAccount,
        newTokenMint: projectAccount.newTokenMint,
        newTokenProgram: projectAccount.newTokenProgram,
        projectAdmin: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  // Fetch account data
  async getPlatformConfig(): Promise<any> {
    const [platformConfig] = await this.getPlatformConfigPDA();
    return await this.program.account.platformConfig.fetch(platformConfig);
  }

  async getProject(projectId: BN, projectAdmin: PublicKey): Promise<any> {
    const [project] = await this.getProjectPDA(projectAdmin, projectId);
    return await this.program.account.project.fetch(project);
  }

  async getUserMigration(project: PublicKey, user: PublicKey): Promise<any> {
    const [userMigration] = await this.getUserMigrationPDA(project, user);
    return await this.program.account.userMigration.fetch(userMigration);
  }
}

// Example usage
async function example() {
  // Setup
  const connection = new web3.Connection("https://api.devnet.solana.com");
  const wallet = anchor.Wallet.local(); // Or use any wallet provider
  const programId = new PublicKey("YOUR_PROGRAM_ID");
  
  const client = new W3SwapClient(connection, wallet, programId);

  // Initialize platform
  const superAdmin = wallet.publicKey;
  const feeDestination = new PublicKey("FEE_DESTINATION_PUBKEY");
  await client.initializePlatform(superAdmin, feeDestination);

  // Create a project
  const projectParams = {
    projectId: new BN(1),
    projectName: "My Token Migration",
    oldTokenMint: new PublicKey("OLD_TOKEN_MINT"),
    newTokenMint: new PublicKey("NEW_TOKEN_MINT"),
    oldTokenProgram: TOKEN_PROGRAM_ID,
    newTokenProgram: TOKEN_PROGRAM_ID,
    migrationStart: new BN(Math.floor(Date.now() / 1000)),
    migrationEnd: new BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60), // 7 days
    exchangeRatioNumerator: new BN(1),
    exchangeRatioDenominator: new BN(1),
    solCommitmentAmount: new BN(1_000_000_000), // 1 SOL for LP creation
    recoveryDelaySeconds: new BN(7 * 24 * 60 * 60), // 7 days
    specialRatioEnabled: false,
    specialRatioWallets: [],
    allowlistEnabled: false,
    denylistEnabled: false,
    allowlist: [],
    denylist: [],
  };
  
  await client.createProject(projectParams);

  // Fund project with new tokens
  await client.fundProject(new BN(1), new BN(1000000));

  // Activate project with LP configuration
  const lpConfig = {
    initialPrice: 0.001,        // 1 new token = 0.001 SOL
    tokenAllocation: 500000,    // 500k new tokens for LP
    binStep: 20,                // 0.2% price precision
    baseFee: 25,                // 0.25% trading fee
    priceRange: { min: 0.0005, max: 0.002 }
  };
  await client.activateProject(new BN(1), lpConfig);

  // User migrates tokens
  const project = await client.getProject(new BN(1), wallet.publicKey);
  await client.migrate(project.publicKey, new BN(100));
}
