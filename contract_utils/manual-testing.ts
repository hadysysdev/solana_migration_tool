import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN, Wallet, web3 } from "@coral-xyz/anchor";
import {W3swap} from "../artifacts/w3swap"
import * as dotenv from "dotenv";
import path from "path";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { customGetKeypairFromEnvironment, getProgram, W3SwapClient } from "./utils";

dotenv.config({path:  path.resolve(__dirname, '.env.local')});





export type CreateProjectParams = {
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
  specialRatioEnabled: boolean;
  specialRatioWallets: PublicKey[];
  allowlistEnabled: boolean;
  denylistEnabled: boolean;
  allowlist: PublicKey[];
  denylist: PublicKey[];
};




// --- Setup ---

// Your Program ID from the IDL
const PROGRAM_ID = new PublicKey("9qPx5xbqg4xZp3BWbtCNGy3GVfZ4WeaeraMUvLBSdcKh");

// 1. Set up the Connection
const connection = new Connection(web3.clusterApiUrl("devnet"), "confirmed");

// Super Admin interface 
const superAdminKeyPair: Keypair = customGetKeypairFromEnvironment('superAdmin')
const superAdminWallet = new Wallet(superAdminKeyPair);
const superAdminProgramClient : W3SwapClient = new W3SwapClient(connection,superAdminWallet)

// const superAdminProgramInterface: Program<W3swap> = getProgram(superAdminProvider)


//ProjectAdminInterface
const projectAdminKeyPair: Keypair = customGetKeypairFromEnvironment('projectAdmin')
const projectAdminWallet = new Wallet(projectAdminKeyPair);
const projectAdminProgramClient : W3SwapClient = new W3SwapClient(connection,projectAdminWallet)
// const projectAdminProvider = new AnchorProvider(connection, projectAdminWallet, {
//   commitment: "confirmed",
// });
// const projectAdminProgramInterface: Program<W3swap> = getProgram(projectAdminProvider)




// // --- Function Definitions (Modified) ---

// async function callInitializePlatform(program: Program<W3swap>, feeDestination: PublicKey) {
//   const minSolCommitment = new BN(1_000_000_000);
//   const autoPausePercent = 10;

//   const txSignature = await program.methods
//     .initializePlatform(
//       feeDestination,
//       minSolCommitment,
//       autoPausePercent,
//     )
//     .accounts({
//       // superAdmin is the provider's wallet, so it's handled.
//       // We can specify it for clarity, but it's often automatic.
//       superAdmin: superAdminProvider.wallet.publicKey,
//     })
//     // No need for .signers() if the *only* signer
//     // is the one in the provider.
//     .rpc(
//         {
//             commitment: "confirmed",
//         }
//     );

//   console.log("Platform Initialized! Signature:", txSignature);
// }

// async function callUpdatePlatformConfig() {
//   // Let's update some values and leave others as 'None'

//   // Some(Vec<Pubkey>)
//   const newSwapPrograms = [
//     new PublicKey("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoiGnkV2TcgK"), // Jupiter
//     new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"), // Jupiter
//   ];

//   // Some(u64)
//   const newMinSol = new BN(500_000_000); // 0.5 SOL

//   // Some(u8)
//   const newSettlementFee = 5; // 5%

//   try {
//     const txSignature = await superAdminProgramInterface.methods
//       .updatePlatformConfig(
//         newSwapPrograms, // allowed_swap_programs: Option<Vec<Pubkey>>
//         null,           // min_sol_commitment: Option<u64>
//         null,            // auto_pause_threshold_percent: Option<u8>
//         null,            // platform_fee_sol: Option<u8>
//         null,            // settlement_fee_percent: Option<u8>
//         null,            // min_migration_days: Option<u8>
//         null,            // max_migration_days: Option<u8>
//         null,            // min_lp_lock_days: Option<u8>
//       )
//       .accounts({
//         // Anchor automatically finds this PDA
//         superAdmin: superAdminProvider.wallet.publicKey,
//       })
//       .rpc(
//                 {
//             commitment: "confirmed",
//         }
//       );

//     console.log("Platform Config Updated! Signature:", txSignature);
//   } catch (err) {
//     console.error("Error updating config:", err);
//   }
// }

// async function callManageProjectAdmin(
//   adminToManage: PublicKey,
//   action: "add" | "remove"
// ) {
//   // 1. Format the Enum argument
//   const actionArg = action === "add" ? { add: {} } : { remove: {} };

//   try {
//     const txSignature = await superAdminProgramInterface.methods
//       .manageProjectAdmin(
//         adminToManage,
//         actionArg, // Pass the enum object
//       )
//       .accounts({
//         // Anchor automatically finds this PDA
//         superAdmin: superAdminProvider.wallet.publicKey,
//       })
//       .rpc(
//                 {
//             commitment: "confirmed",
//         }
//       );
//     console.log(`Project Admin ${action}ed! Signature:`, txSignature);
//   } catch (err) {
//     console.error("Error managing project admin:", err);
//   }
// }



// async function createProject(params: CreateProjectParams) {


//     // Fetch platform config to get fee destination (this is an auto-resolved account)
//       const platformConfigData = await fetchPlatformConfig();
//       if (!platformConfigData) {
//         throw new Error("Platform config not found or initialized.");
//       }

//       const [projectPda] = await findProjectPda(projectAdminWallet.publicKey, params.projectId);
//       const existingProject = await fetchProject(projectPda);

//       if (existingProject) {
//         throw new Error(`Project with ID ${params.projectId.toString()} already exists.`);
//       }
//       console.log(`Creating project with PDA: ${projectPda.toBase58()}`);


//       try {

//       const builder = (projectAdminProgramInterface.methods as any)
//         .createProjectInit(params as any)
//         .accounts({
//           project: projectPda, 
//           oldTokenMint: params.oldTokenMint,
//           newTokenMint: params.newTokenMint,1
//           oldTokenProgram: params.oldTokenProgram,
//           newTokenProgram: params.newTokenProgram,
//           projectAdmin: projectAdminWallet.publicKey,
//           feeDestination: platformConfigData.feeDestinationWallet,
//         });

//         builder.signers([projectAdminKeyPair]);

//       const txSignature = await builder.rpc();
//       console.log("Project created! Signature:", txSignature);
//       console.log("Now Creating Project vaults", txSignature);
//       const projectVaultTxSig = await createProjectVaults(projectPda,
//         params.oldTokenMint,
//         params.newTokenMint,
//         params.oldTokenProgram,
//         params.newTokenProgram
//        )
//        console.log("Project vaults created! Signature:", projectVaultTxSig);
//       } catch (error) {
//         console.error("Error initializing project (step 1):", error);
//       }
// }


// async function createProjectVaults(
//     projectPda: PublicKey,
//     oldTokenMint: PublicKey,
//     newTokenMint: PublicKey,
//     oldTokenProgram: PublicKey,
//     newTokenProgram: PublicKey,
//     projectAdminSigner?: Keypair,

//   ){
//     const [oldTokenVaultPda] = this.findOldTokenVaultPda(projectPda);
//     const [newTokenVaultPda] = this.findNewTokenVaultPda(projectPda);
//     const [liquidityVaultPda] = this.findLiquidityVaultPda(projectPda);

//     console.log(`Creating vaults for project ${projectPda.toBase58()}`);
//     try {
//       const builder = (projectAdminProgramInterface.methods as any)
//         .createProjectVaults()
//         .accounts({
//           project: projectPda,
//           oldTokenVault: oldTokenVaultPda,
//           newTokenVault: newTokenVaultPda,
//           liquidityVault: liquidityVaultPda,
//           oldTokenMint: oldTokenMint,
//           newTokenMint: newTokenMint,
//           oldTokenProgram: oldTokenProgram,
//           newTokenProgram: newTokenProgram,
//           projectAdmin: projectAdminWallet.publicKey,
//         });

//       if (projectAdminSigner) {
//         builder.signers([projectAdminSigner]);
//       }

//       const txSig = await builder.rpc();
//       console.log("Project vaults created (step 2) successfully:", txSig);
//       return txSig;
//     } catch (error) {
//       console.error("Error creating project vaults (step 2):", error);
//       throw error;
//     }
//   }




//   /**
//    * Fetches and deserializes a Project account data.
//    */
//   async function fetchProject(projectPda: PublicKey): Promise<any | null> {
//     console.log("Fetching Project PDA:", projectPda.toBase58());
//     try {
//       return await superAdminProgramInterface.account.project.fetch(projectPda);
//     } catch (error) {
//       if (error instanceof Error && error.message.includes("Account does not exist")) {
//         console.log("Project account not found:", projectPda.toBase58());
//         return null;
//       }
//       console.error("Error fetching project:", error);
//       throw error;
//     }
//   }

//   /**
//    * Fetches and deserializes a Project account data.
//    */
//   async function fetchProjects(): Promise<any | null> {
//     try {
//       return await superAdminProgramInterface.account.project.all();
//     } catch (error) {
//       console.error("Error fetching project:", error);
//       throw error;
//     }
//   }


// async function fetchPlatformConfig(): Promise<any | null> {
//     const [pda] = findPlatformConfigPda();
//     console.log("Platform Config PDA:", pda.toBase58());
//     try {
//       // account name is camelCase
//       return await superAdminProgramInterface.account.platformConfig.fetch(pda);
//     } catch (error) {
//       if ((error as Error).message.includes("Account does not exist")) {
//         return null;
//       }
//       console.error("Error fetching platform config:", error);
//       throw error;
//     }
//   }

// --- Example Main Function ---
async function main() {
  // await callInitializePlatform(provider.wallet.publicKey);
  // await callUpdatePlatformConfig();
  // await callManageProjectAdmin(new PublicKey('GMdfpwFvVjzMMvvVkWqtjcx6xhXdU477ZBnaxzDk9eMH'), "add");
  // await callManageProjectAdmin(new PublicKey('8YBJdbnwSM5LDu7L9rfHfp1fSnY9JFjUxnX9qgBzBQG1'), "add");
  
      // --- 3b. Fetch Platform Config ---
  const config = await superAdminProgramClient.fetchPlatformConfig()
  console.log("Fetched Platform Config:", JSON.stringify(config, null, 2));

  // const projects = await fetchProjects()
  // console.log("Fetched Platform Config:", JSON.stringify(projects, null, 2));

    const projectId = new BN(1);
    const oldTokenMint = new PublicKey('ApjJJZZfHLZebNt3zmYRhFQUjuhZvBkJASEvwdzKBdBr');
    const newTokenMint = new PublicKey('6weUArd9B1n3zHZvQoCYnjq6k1k5zsVSj7eGEqBee2U2');

      const projectParams: CreateProjectParams = {
      projectId: projectId, // use timestamp for uniqueness
      projectName: "My Test Project",
      oldTokenMint: oldTokenMint,
      newTokenMint: newTokenMint,
      oldTokenProgram: TOKEN_2022_PROGRAM_ID,
      newTokenProgram: TOKEN_2022_PROGRAM_ID,
      migrationStart: new BN(Math.floor(Date.now() / 1000) + 60), // 1 min from now
      migrationEnd: new BN(Math.floor(Date.now() / 1000) + 172800), // 2 day from now
      exchangeRatioNumerator: new BN(1),
      exchangeRatioDenominator: new BN(1),
      solCommitmentAmount: new BN(2_000_000_000), // No SOL commitment
      specialRatioEnabled: false,
      specialRatioWallets: [],
      allowlistEnabled: false,
      denylistEnabled: false,
      allowlist: [],
      denylist: [],
    };

    // await createProject(projectParams);
    
  // const projects = await fetchProjects()
  // console.log("Fetched Platform Config:", JSON.stringify(projects, null, 2));

}

main();