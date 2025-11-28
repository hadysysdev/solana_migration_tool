import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { BN, web3 } from "@coral-xyz/anchor";
import * as dotenv from "dotenv";
import path from "path";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { customGetKeypairFromEnvironment } from "./utils";
import { LpConfiguration, W3SwapClient, PoolType } from "./w3SwapClient";

dotenv.config({ path: path.resolve(__dirname, '.env.local') });



// --- Setup ---

// Your Program ID from the IDL
const PROGRAM_ID = new PublicKey("9qPx5xbqg4xZp3BWbtCNGy3GVfZ4WeaeraMUvLBSdcKh");

// 1. Set up the Connection
const connection = new Connection(web3.clusterApiUrl("devnet"), "confirmed");

// Super Admin interface 
const superAdminKeyPair: Keypair = customGetKeypairFromEnvironment('superAdmin')
const superAdminProgramClient: W3SwapClient = new W3SwapClient(connection, superAdminKeyPair, PROGRAM_ID)


//ProjectAdminInterface
const projectAdminKeyPair: Keypair = customGetKeypairFromEnvironment('projectAdmin')
const projectAdminProgramClient: W3SwapClient = new W3SwapClient(connection, projectAdminKeyPair, PROGRAM_ID)


// --- Example Main Function ---
async function main() {

  const projectId = new BN(8); // Increment ID for new test
  const oldTokenMint = new PublicKey('ApjJJZZfHLZebNt3zmYRhFQUjuhZvBkJASEvwdzKBdBr');
  const newTokenMint = new PublicKey('6weUArd9B1n3zHZvQoCYnjq6k1k5zsVSj7eGEqBee2U2');

  const projectParams = {
    projectId: projectId,
    projectName: "My Atomic Project Lifecycle",
    oldTokenMint: oldTokenMint,
    newTokenMint: newTokenMint,
    oldTokenProgram: TOKEN_2022_PROGRAM_ID,
    newTokenProgram: TOKEN_2022_PROGRAM_ID,
    migrationStart: new BN(Math.floor(Date.now() / 1000) + 86400), // Start in 1 day
    migrationEnd: new BN(Math.floor(Date.now() / 1000) + 86400 + 172800), // End in 3 days
    exchangeRatioNumerator: new BN(0),
    exchangeRatioDenominator: new BN(0),
    solCommitmentAmount: new BN(2 * 10 ** 9), // 2 SOL
    specialRatioEnabled: false,
    specialRatioWallets: [],
    allowlistEnabled: false,
    denylistEnabled: false,
    allowlist: [],
    denylist: [],
  };

  try {
    // const projectPda = await projectAdminProgramClient.createProject(projectParams);
    const projects = await projectAdminProgramClient.fetchProjects();

    console.log("Projects:", projects[0]);


    // // 1. Atomic Creation[]
    // console.log('--- Step 1: Atomic Project Creation ---');
    // const projectPda = await projectAdminProgramClient.createProject(projectParams);
    // console.log('Project creation complete! PDA:', projectPda.toBase58());

    // // Fetch and verify
    // let project = await projectAdminProgramClient.fetchProject(projectPda);
    // console.log("Fetched Project Status:", project.status);

    // // 2. Atomic Fund & Activate
    // console.log('\n--- Step 2: Atomic Fund & Activate ---');

    // // Meteora DLMM Configuration
    // const lpConfig: LpConfiguration = {
    //   poolType: PoolType.MeteoraDlmm, // Use the enum
    //   initialPrice: new BN(1000000), // Example price
    //   binStep: new BN(10),
    //   feeBps: new BN(100),
    //   minPrice: new BN(500000),
    //   maxPrice: new BN(2000000),
    //   // Other fields optional
    // };

    // // Random placeholder for Meteora Pool (because it's created during activation)
    // // For Meteora, we don't pass a pre-created pool address usually, but we might need to pass the mints.
    // // The client derives remaining accounts.

    // const fundAmount = new BN(1000000000); // 1 SOL equivalent
    // const lpMint = Keypair.generate().publicKey; // Placeholder, Meteora doesn't use standard LP mint in the same way but we pass something or handle it.

    // await projectAdminProgramClient.fundAndActivateProjectAtomic(
    //   projectPda,
    //   newTokenMint,
    //   TOKEN_2022_PROGRAM_ID,
    //   fundAmount,
    //   PoolType.MeteoraDlmm,
    //   lpConfig,
    //   lpMint // Placeholder
    // );
    // console.log('Fund & Activate complete!');

    // // Fetch and verify
    // project = await projectAdminProgramClient.fetchProject(projectPda);
    // console.log("Fetched Project Status after Activation:", project.status);


    // // 3. Atomic Finalize & Close
    // console.log('\n--- Step 3: Atomic Finalize & Close ---');

    // // Note: This step might fail on-chain if migration hasn't ended or settlement isn't complete.
    // // But we are testing the client method construction.
    // // We no longer pass lpMint here; it is fetched from the vault.

    // await projectAdminProgramClient.finalizeProjectTransfers(
    //   projectPda,
    //   newTokenMint,
    //   TOKEN_2022_PROGRAM_ID, // lpTokenProgram (assuming same for test)
    //   TOKEN_2022_PROGRAM_ID, // oldTokenProgram
    //   TOKEN_2022_PROGRAM_ID  // newTokenProgram
    // );
    // console.log('Finalize & Close complete!');

  } catch (error) {
    console.error("Error:", error);
  }
}

main();