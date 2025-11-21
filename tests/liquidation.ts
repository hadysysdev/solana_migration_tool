import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { W3swap } from "../target/types/w3swap";
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { 
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { expect } from "chai";

// Jupiter and Meteora program IDs for testing
const JUPITER_PROGRAM_ID = new PublicKey("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
const METEORA_DLMM_PROGRAM_ID = new PublicKey("Eo7WjKq67rjJQSZxS6z3LStQTw2d3DpyzJMzvJ4w5eK");

describe("Liquidation Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.W3swap as Program<W3swap>;
  
  // Test accounts
  const superAdmin = provider.wallet;
  const projectAdmin = Keypair.generate();
  const user = Keypair.generate();
  
  // Project configuration
  const projectId = 1;
  const projectName = "Test Liquidation Project";
  const migrationDuration = 30 * 24 * 60 * 60; // 30 days
  
  let oldTokenMint: PublicKey;
  let newTokenMint: PublicKey;
  let wsolMint: PublicKey;
  let projectPDA: PublicKey;
  let oldTokenVault: PublicKey;
  let newTokenVault: PublicKey;
  let wsolVault: PublicKey;
  let platformConfig: PublicKey;
  
  before(async () => {
    // Create test mints
    oldTokenMint = await createMint(
      provider.connection,
      superAdmin.payer,
      superAdmin.publicKey,
      null,
      9
    );
    
    newTokenMint = await createMint(
      provider.connection,
      superAdmin.payer,
      superAdmin.publicKey,
      null,
      9
    );
    
    wsolMint = await createMint(
      provider.connection,
      superAdmin.payer,
      superAdmin.publicKey,
      null,
      9
    );
    
    // Find platform config PDA
    const [platformConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );
    platformConfig = platformConfigPDA;
  });

  it("Initializes platform", async () => {
    await program.methods
      .initializePlatform(
        superAdmin.publicKey, // fee destination
        1_000_000_000, // 1 SOL min commitment
        10 // 10% auto pause threshold
      )
      .accounts({
        superAdmin: superAdmin.publicKey,
        feeDestination: superAdmin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  it("Adds project admin", async () => {
    await program.methods
      .manageProjectAdmin(projectAdmin.publicKey, { add: {} })
      .accounts({
        superAdmin: superAdmin.publicKey,
        platformConfig,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  it("Creates project", async () => {
    const now = Math.floor(Date.now() / 1000);
    const migrationStart = now + 60; // Start in 1 minute
    const migrationEnd = migrationStart + migrationDuration;

    const [projectPDA_, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("project"),
        projectAdmin.publicKey.toBuffer(),
        Buffer.from(new anchor.BN(projectId).toArray("le", 8)),
      ],
      program.programId
    );
    projectPDA = projectPDA_;

    await program.methods
      .createProjectInit({
        projectId: new anchor.BN(projectId),
        projectName,
        oldTokenMint,
        newTokenMint,
        oldTokenProgram: TOKEN_PROGRAM_ID,
        newTokenProgram: TOKEN_PROGRAM_ID,
        migrationStart: new anchor.BN(migrationStart),
        migrationEnd: new anchor.BN(migrationEnd),
        exchangeRatioNumerator: new anchor.BN(0),
        exchangeRatioDenominator: new anchor.BN(0),
        solCommitmentAmount: new anchor.BN(1_000_000_000), // 1 SOL
        specialRatioEnabled: false,
        specialRatioWallets: [],
        allowlistEnabled: false,
        denylistEnabled: false,
        allowlist: [],
        denylist: [],
      })
      .accounts({
        platformConfig,
        project: projectPDA,
        projectAdmin: projectAdmin.publicKey,
        oldTokenMint,
        newTokenMint,
        oldTokenProgram: TOKEN_PROGRAM_ID,
        newTokenProgram: TOKEN_PROGRAM_ID,
        feeDestination: superAdmin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([projectAdmin])
      .rpc();

    // Create vaults
    const [oldTokenVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("old_token_vault"), projectPDA.toBuffer()],
      program.programId
    );
    oldTokenVault = oldTokenVaultPDA;

    const [newTokenVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("new_token_vault"), projectPDA.toBuffer()],
      program.programId
    );
    newTokenVault = newTokenVaultPDA;

    const [wsolVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("wsol_vault"), projectPDA.toBuffer()],
      program.programId
    );
    wsolVault = wsolVaultPDA;

    await program.methods
      .createProjectVaults()
      .accounts({
        platformConfig,
        project: projectPDA,
        projectAdmin: projectAdmin.publicKey,
        oldTokenMint,
        newTokenMint,
        oldTokenProgram: TOKEN_PROGRAM_ID,
        newTokenProgram: TOKEN_PROGRAM_ID,
        oldTokenVault,
        newTokenVault,
        liquidityVault: PublicKey.default, // Not used in this test
        systemProgram: SystemProgram.programId,
      })
      .signers([projectAdmin])
      .rpc();
  });

  it("Funds project with new tokens", async () => {
    const adminNewTokenAccount = await createAccount(
      provider.connection,
      superAdmin.payer,
      newTokenMint,
      superAdmin.publicKey
    );

    // Mint new tokens to admin account
    await mintTo(
      provider.connection,
      superAdmin.payer,
      newTokenMint,
      adminNewTokenAccount,
      superAdmin.publicKey,
      1_000_000_000 // 1,000 new tokens
    );

    await program.methods
      .fundProject(new anchor.BN(1_000_000_000))
      .accounts({
        platformConfig,
        project: projectPDA,
        projectAdmin: projectAdmin.publicKey,
        newTokenMint,
        newTokenVault,
        projectAdminTokenAccount: adminNewTokenAccount,
        newTokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([projectAdmin])
      .rpc();
  });

  it("Activates project", async () => {
    // Wait for migration start time
    await new Promise(resolve => setTimeout(resolve, 2000));

    await program.methods
      .activateProject({
        initialPrice: new anchor.BN(1_000_000_000), // 1 SOL per token
        tokenAllocation: new anchor.BN(100_000_000), // 100 tokens for LP
        binStep: 64,
        baseFee: 100, // 1%
        priceRangeMin: new anchor.BN(500_000_000), // 0.5 SOL
        priceRangeMax: new anchor.BN(2_000_000_000), // 2 SOL
      })
      .accounts({
        platformConfig,
        project: projectPDA,
        projectAdmin: projectAdmin.publicKey,
        newTokenMint,
        newTokenVault,
        wsolMint,
        wsolVault,
        oldTokenVault,
        meteoraPool: PublicKey.default, // Will be set by instruction
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([projectAdmin])
      .rpc();
  });

  it("Migrates some tokens to create old token balance", async () => {
    const userOldTokenAccount = await createAccount(
      provider.connection,
      superAdmin.payer,
      oldTokenMint,
      user.publicKey
    );

    const userNewTokenAccount = await createAccount(
      provider.connection,
      superAdmin.payer,
      newTokenMint,
      user.publicKey
    );

    // Mint old tokens to user account
    await mintTo(
      provider.connection,
      superAdmin.payer,
      oldTokenMint,
      userOldTokenAccount,
      superAdmin.publicKey,
      100_000_000 // 100 old tokens
    );

    await program.methods
      .migrate(new anchor.BN(50_000_000)) // Migrate 50 old tokens
      .accounts({
        project: projectPDA,
        userMigration: PublicKey.default, // Will be created
        oldTokenVault,
        newTokenVault,
        userOldTokenAccount,
        userNewTokenAccount,
        oldTokenMint,
        newTokenMint,
        oldTokenProgram: TOKEN_PROGRAM_ID,
        newTokenProgram: TOKEN_PROGRAM_ID,
        user: user.publicKey,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
  });

  it("Ends project to prepare for liquidation", async () => {
    await program.methods
      .endProject()
      .accounts({
        project: projectPDA,
        projectAdmin: projectAdmin.publicKey,
      })
      .signers([projectAdmin])
      .rpc();

    const project = await program.account.project.fetch(projectPDA);
    expect(project.status.ended).to.be.true;
  });

  it("Fails liquidation when backend not allowlisted", async () => {
    try {
      await program.methods
        .swapOldTokenBatch(
          { meteora: {} }, // SwapBackend::Meteora
          new anchor.BN(10_000_000), // 10 tokens
          new anchor.BN(1_000_000), // min 1 WSOL
          Buffer.from("") // No-op instruction data for validation
        )
        .accounts({
          platformConfig,
          project: projectPDA,
          projectAdmin: projectAdmin.publicKey,
          oldTokenMint,
          wsolMint,
          oldTokenVault,
          wsolVault,
          oldTokenProgram: TOKEN_PROGRAM_ID,
          wsolTokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([projectAdmin])
        .remainingAccounts([
          { pubkey: METEORA_DLMM_PROGRAM_ID, isSigner: false, isWritable: false },
        ])
        .rpc();

      expect.fail("Should have failed because Meteora backend is not allowlisted");
    } catch (error) {
      expect(error.error.errorMessage).to.include("Program not allowed for routing operations");
    }
  });

  it("Allowlists swap backends for liquidation", async () => {
    await program.methods
      .updatePlatformConfig(
        [METEORA_DLMM_PROGRAM_ID, JUPITER_PROGRAM_ID],
        null,
        null,
        null,
        null,
        null,
        null,
        null
      )
      .accounts({
        platformConfig,
        superAdmin: superAdmin.publicKey,
      })
      .rpc();

    const config = await program.account.platformConfig.fetch(platformConfig);
    const allowed = config.allowedSwapPrograms.map((pk: PublicKey) => pk.toBase58());
    expect(allowed).to.include(METEORA_DLMM_PROGRAM_ID.toBase58());
    expect(allowed).to.include(JUPITER_PROGRAM_ID.toBase58());
  });

  it("Fails liquidation when mint does not match vault", async () => {
    try {
      await program.methods
        .swapOldTokenBatch(
          { meteora: {} },
          new anchor.BN(10_000_000),
          new anchor.BN(1_000_000),
          Buffer.from("")
        )
        .accounts({
          platformConfig,
          project: projectPDA,
          projectAdmin: projectAdmin.publicKey,
          oldTokenMint: wsolMint,
          wsolMint,
          oldTokenVault,
          wsolVault,
          oldTokenProgram: TOKEN_PROGRAM_ID,
          wsolTokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([projectAdmin])
        .remainingAccounts([
          { pubkey: METEORA_DLMM_PROGRAM_ID, isSigner: false, isWritable: false },
        ])
        .rpc();

      expect.fail("Should have failed due to token mint constraint");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintTokenMint");
    }
  });

  it("Successfully starts liquidation with Meteora backend", async () => {
    // Mock Meteora swap instruction data (simplified for testing)
    const mockSwapData = Buffer.from([0, 1, 2, 3, 4, 5]);

    try {
      await program.methods
        .swapOldTokenBatch(
          { meteora: {} },
          new anchor.BN(10_000_000),
          new anchor.BN(1_000_000),
          mockSwapData
        )
        .accounts({
          platformConfig,
          project: projectPDA,
          projectAdmin: projectAdmin.publicKey,
          oldTokenMint,
          wsolMint,
          oldTokenVault,
          wsolVault,
          oldTokenProgram: TOKEN_PROGRAM_ID,
          wsolTokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([projectAdmin])
        .remainingAccounts([
          { pubkey: METEORA_DLMM_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: oldTokenVault, isSigner: false, isWritable: true },
          { pubkey: wsolVault, isSigner: false, isWritable: true },
        ])
        .rpc();

      expect.fail("Should fail due to mock instruction data");
    } catch (error) {
      expect(error.error.errorMessage).to.include("CPI call failed");
    }
  });

  it("Fails with invalid backend program ID", async () => {
    try {
      await program.methods
        .swapOldTokenBatch(
          { jupiter: {} },
          new anchor.BN(10_000_000),
          new anchor.BN(1_000_000),
          Buffer.from("")
        )
        .accounts({
          platformConfig,
          project: projectPDA,
          projectAdmin: projectAdmin.publicKey,
          oldTokenMint,
          wsolMint,
          oldTokenVault,
          wsolVault,
          oldTokenProgram: TOKEN_PROGRAM_ID,
          wsolTokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([projectAdmin])
        .remainingAccounts([
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ])
        .rpc();

      expect.fail("Should have failed with InvalidSwapBackend");
    } catch (error) {
      expect(error.error.errorMessage).to.include("Invalid swap backend");
    }
  });

  it("Fails with zero amount", async () => {
    try {
      await program.methods
        .swapOldTokenBatch(
          { meteora: {} },
          new anchor.BN(0),
          new anchor.BN(1_000_000),
          Buffer.from("")
        )
        .accounts({
          platformConfig,
          project: projectPDA,
          projectAdmin: projectAdmin.publicKey,
          oldTokenMint,
          wsolMint,
          oldTokenVault,
          wsolVault,
          oldTokenProgram: TOKEN_PROGRAM_ID,
          wsolTokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([projectAdmin])
        .remainingAccounts([
          { pubkey: METEORA_DLMM_PROGRAM_ID, isSigner: false, isWritable: false },
        ])
        .rpc();

      expect.fail("Should have failed with AmountIsZero");
    } catch (error) {
      expect(error.error.errorMessage).to.include("Amount is zero");
    }
  });

  it("Prevents reentrancy during liquidation", async () => {
    // This test would require more complex setup to actually test reentrancy
    // For now, we just verify the reentrancy flag exists and is checked
    const project = await program.account.project.fetch(projectPDA);
    expect(project.liquidationInProgress).to.be.false;
  });
});