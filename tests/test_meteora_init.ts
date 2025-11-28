import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { W3SwapClient, PoolType, LpConfiguration } from "../contract_utils/w3SwapClient";
import { readFileSync } from "fs";
import { homedir } from "os";
import * as path from "path";

async function main() {
    // 1. Setup Connection and Wallet
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    // Load wallet from standard location or use a hardcoded one for testing
    const walletPath = path.join(homedir(), ".config", "solana", "id.json");
    const walletKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(readFileSync(walletPath, "utf-8")))
    );

    console.log("Wallet:", walletKeypair.publicKey.toBase58());

    // 2. Initialize Client
    const client = new W3SwapClient(connection, walletKeypair);

    // 3. Define Project Parameters
    // Use a random project ID to avoid collisions
    const projectId = new BN(Math.floor(Math.random() * 1000000));
    console.log("Project ID:", projectId.toString());

    // Mints - we need valid mints for Meteora. 
    // For testing, we can use existing mints on devnet or create new ones.
    // Let's assume we create new ones or use known ones.
    // For this test, let's try to use the client to create the project which creates mints?
    // No, createProject expects mints to be passed in.

    // We need to create two mints first.
    // Since we don't have a mint creation helper in the client, we'll assume the user has them or we'd need to add mint creation logic here.
    // For simplicity, let's use some dummy mints or create them if we can.
    // Actually, `createProject` takes `oldTokenMint` and `newTokenMint`.
    // The contract validates them.

    // Let's just create dummy mints for the test.
    // We can use `spl-token` CLI or library if available, but we might not have it installed in this context.
    // We can use the `createMint` from `@solana/spl-token` if we import it.

    // Let's assume we have them. I'll use placeholders for now and we can fill them in or use a script that creates them.
    // Or better, I'll add a helper to create mints in this script.

    // 4. Create Project
    // ... (Project creation logic)

    // 5. Initialize Liquidity Pool (Meteora)
    const lpConfig: LpConfiguration = {
        poolType: PoolType.MeteoraDlmm,
        binStep: new BN(10), // 10 basis points
        feeBps: new BN(30),  // 0.3%
        initialPrice: new BN(1000000), // 1.0 USDC per token (scaled)
        minPrice: new BN(100000),
        maxPrice: new BN(10000000),
        activationType: 0,
        activationPoint: null,
        hasAlphaVault: false
    };

    console.log("Initializing Meteora Liquidity Pool...");

    // We need the project PDA
    // const projectPda = ...

    // await client.initializeLiquidityPool(projectPda, PoolType.MeteoraDlmm, lpConfig, SystemProgram.programId);

    console.log("Done!");
}

main().catch(console.error);
