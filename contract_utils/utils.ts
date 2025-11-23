import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";
import { W3swap } from "../artifacts/w3swap";
import idl from "../artifacts/w3swap.json";


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






export const customGetKeypairFromEnvironment = (
  variableName: string,
) : Keypair => {
  const secretKeyString = process.env[variableName];
  if (!secretKeyString) {
    throw new Error(`Please set '${variableName}' in environment.`);
  }
  // Try the shorter base58 format first
  let decodedSecretKey;
  try {
    decodedSecretKey = bs58.decode(secretKeyString);
    return Keypair.fromSecretKey(decodedSecretKey);
  } catch (throwObject: any) {
    if (!throwObject.message.includes("Non-base58 character")) {
      throw new Error(
        `Invalid secret key in environment variable '${variableName}'!`
      );
    }
  }
  // Try the longer JSON format
  try {
    decodedSecretKey = Uint8Array.from(JSON.parse(secretKeyString));
  } catch (error) {
    throw new Error(
      `Invalid secret key in environment variable '${variableName}'!`
    );
  }
  return Keypair.fromSecretKey(decodedSecretKey);
};


// Get program instance
export const getProgram = (provider: AnchorProvider): Program<W3swap> => {
  return new Program<W3swap>(idl as W3swap, provider);
};



function  findPlatformConfigPda(programID:PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      programID
    );
  }


 function  findProjectPda(programID:PublicKey, projectAdmin: PublicKey, projectId: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
    [
      Buffer.from('project'),
      projectAdmin.toBuffer(),
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(projectId)]).buffer)),
    ],
    programID
  );
  }

  function findProjectVault(seed:string, programID:PublicKey, projectPDA:PublicKey) : [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from(seed), projectPDA.toBuffer()], programID);
  }



  export class W3SwapClient {
    private program: Program<W3swap>;
    private provider: AnchorProvider;

      constructor(
        connection: Connection,
        wallet: Wallet
      ) {
        this.provider = new AnchorProvider(connection, wallet, {
          commitment: "confirmed",
        });
        this.program = getProgram(this.provider)
      }


async callInitializePlatform(feeDestination: PublicKey) {
  const minSolCommitment = new BN(1_000_000_000);
  const autoPausePercent = 10;

  const txSignature = await this.program.methods
    .initializePlatform(
      feeDestination,
      minSolCommitment,
      autoPausePercent,
    )
    .accounts({
      superAdmin: this.provider.wallet.publicKey,
    })
    .rpc(
        {
            commitment: "confirmed",
        }
    );
    return txSignature
}


async callManageProjectAdmin(
  adminToManage: PublicKey,
  action: "add" | "remove"
) {
  // 1. Format the Enum argument
  const actionArg = action === "add" ? { add: {} } : { remove: {} };

  try {
    const txSignature = await this.program.methods
      .manageProjectAdmin(
        adminToManage,
        actionArg, // Pass the enum object
      )
      .accounts({
        // Anchor automatically finds this PDA
        superAdmin: this.provider.wallet.publicKey,
      })
      .rpc(
                {
            commitment: "confirmed",
        }
      );
    return txSignature

  } catch (err) {
     throw err;
  }
}

async  allocateProjectAccount(
  projectId: number,
) {
  const [projectPda] = findProjectPda(this.program.programId, this.provider.wallet.publicKey, projectId)

  const [platformConfigPda] = findPlatformConfigPda(this.program.programId)

  const tx = await (this.program.methods as any)
    .allocateProjectAccount(projectId as any)
    .accounts({
      platformConfig: platformConfigPda,
      projectAdmin: this.provider.wallet.publicKey,
      project: projectPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc(
                        {
            commitment: "confirmed",
        }
    );
  return projectPda;
}

async  createProjectInit(
  params: CreateProjectParams,
) {
  const [projectPda] = findProjectPda(this.program.programId, this.provider.wallet.publicKey, params.projectId)

  const [platformConfigPda] = findPlatformConfigPda(this.program.programId)
  const platformConfigData = await this.fetchPlatformConfig()

  const tx = await  (this.program.methods as any)
    .createProjectInit(params as any)
    .accounts({
      platformConfig: platformConfigPda,
      project: projectPda,
      oldTokenMint: params.oldTokenMint,
      newTokenMint: params.newTokenMint,
      oldTokenProgram: params.oldTokenProgram,
      newTokenProgram: params.newTokenProgram,
      projectAdmin: this.provider.publicKey,
      feeDestination: platformConfigData.feeDestinationWallet,
      systemProgram: SystemProgram.programId,
    })
    .rpc(
                                {
            commitment: "confirmed",
        }
    );

  console.log('Project initialized:', tx);
  return projectPda;
}

async  createProjectVaults(
    projectPda: PublicKey,
    oldTokenMint: PublicKey,
    newTokenMint: PublicKey,
    oldTokenProgram: PublicKey,
    newTokenProgram: PublicKey,
  ){

    const [oldTokenVaultPda] = findProjectVault('old_token_vault', projectPda, this.program.programId);
    const [newTokenVaultPda] = findProjectVault('new_token_vault', projectPda, this.program.programId);
    const [liquidityVaultPda] = findProjectVault('liquidity_vault', projectPda, this.program.programId);

    try {
      const builder = (this.program.methods as any)
        .createProjectVaults()
        .accounts({
          project: projectPda,
          oldTokenVault: oldTokenVaultPda,
          newTokenVault: newTokenVaultPda,
          liquidityVault: liquidityVaultPda,
          oldTokenMint: oldTokenMint,
          newTokenMint: newTokenMint,
          oldTokenProgram: oldTokenProgram,
          newTokenProgram: newTokenProgram,
          projectAdmin: this.provider.publicKey,
        });


      const txSig = await builder.rpc();
      return txSig;
    } catch (error) {
      throw error;
    }
  }




async  fetchPlatformConfig() {
    const [platformConfigPda] = findPlatformConfigPda(this.program.programId)
    try {
      return await this.program.account.platformConfig.fetch(platformConfigPda);
    } catch (error) {
      throw error;
    }
  }


  async  fetchProject(projectPda: PublicKey): Promise<any | null> {
    try {
      return await this.program.account.project.fetch(projectPda);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Account does not exist")) {
        console.log("Project account not found:", projectPda.toBase58());
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetches and deserializes a Project account data.
   */
  async  fetchProjects(): Promise<any | null> {
    try {
      return await this.program.account.project.all();
    } catch (error) {
      throw error;
    }
  }


}