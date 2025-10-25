import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeAccountInstruction,
  createInitializeMetadataPointerInstruction,
  getMintLen,
  getAccountLen,
  TYPE_SIZE,
  ExtensionType,
  createInitializeInstruction,
  LENGTH_SIZE,
  mintTo,
  createMintToInstruction,
  getMint,
  getAccount,
  getTokenMetadata
} from "@solana/spl-token";
import { pack, type TokenMetadata } from "@solana/spl-token-metadata";
import * as bs58 from "bs58";
import * as dotenv from "dotenv";
import { customGetKeypairFromEnvironment } from "./utils";

dotenv.config({path:'.env.local'});

const Token_METADATA_URI = "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/metadata.json"
const Token_NAME = "New Token"
const Token_SYMBOL = "NEWT"
const DECIMALS = 9
const TOTAL_SUPPLY = 2_000_000_000

// Wrap the script in an async main so top-level await is not required.
async function main() {
  // Create connection to local validator
  const connection = new Connection(clusterApiUrl("devnet"))

  // Generate the authority for the mint (also acts as fee payer)
  // const authority = Keypair.generate();
  const feePayer_Authority: Keypair = customGetKeypairFromEnvironment('projectOwner','.env.local' )
  console.log('Fee Payer Account:', feePayer_Authority.publicKey.toString())
//   console.log(bs58.encode(feePayer_Authority.secretKey))

  // Generate keypair to use as mint account
  const mint = Keypair.generate();

  // Create the metadata object
  const metadata: TokenMetadata = {
    mint: mint.publicKey,
    name: Token_NAME,
    symbol: Token_SYMBOL,
    uri: Token_METADATA_URI,
    additionalMetadata: [["description", "Only Possible On Solana"]]
  };

  // Size of metadata
  const metadataLen = pack(metadata).length;

  // Size of MetadataExtension 2 bytes for type, 2 bytes for length
  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;

  // metadata pointer extension size
  const spaceWithoutMetadataExtension = getMintLen([
    ExtensionType.MetadataPointer
  ]);

  // Calculate rent exemption
  const lamportsForMint = await connection.getMinimumBalanceForRentExemption(
    spaceWithoutMetadataExtension + metadataLen + metadataExtension
  );

  // Create account for the mint
  const createMintAccountIx = SystemProgram.createAccount({
    fromPubkey: feePayer_Authority.publicKey,
    newAccountPubkey: mint.publicKey,
    space: spaceWithoutMetadataExtension,
    lamports: lamportsForMint,
    programId: TOKEN_2022_PROGRAM_ID
  });

  // Initialize metadata pointer extension
  const initializeMetadataPointerIx = createInitializeMetadataPointerInstruction(
    mint.publicKey, // mint account
    feePayer_Authority.publicKey, // authority
    mint.publicKey, // metadata address
    TOKEN_2022_PROGRAM_ID
  );

  // Initialize mint account
  const initializeMintIx = createInitializeMintInstruction(
    mint.publicKey, // mint
    DECIMALS, // decimals
    feePayer_Authority.publicKey, // mint authority
    feePayer_Authority.publicKey, // freeze authority
    TOKEN_2022_PROGRAM_ID
  );

  // Initialize metadata extension
  const initializeMetadataIx = createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    mint: mint.publicKey,
    metadata: mint.publicKey,
    mintAuthority: feePayer_Authority.publicKey,
    name: Token_NAME,
    symbol: Token_SYMBOL,
    uri: Token_METADATA_URI,
    updateAuthority: feePayer_Authority.publicKey
  });

  // Optional: create a token account for the mint
  const tokenAccount = Keypair.generate();
  const accountLen = getAccountLen([]);
  const lamportsForAccount =
    await connection.getMinimumBalanceForRentExemption(accountLen);
  const createTokenAccountIx = SystemProgram.createAccount({
    fromPubkey: feePayer_Authority.publicKey,
    newAccountPubkey: tokenAccount.publicKey,
    space: accountLen,
    lamports: lamportsForAccount,
    programId: TOKEN_2022_PROGRAM_ID
  });
  const initializeTokenAccountIx = createInitializeAccountInstruction(
    tokenAccount.publicKey,
    mint.publicKey,
    feePayer_Authority.publicKey,
    TOKEN_2022_PROGRAM_ID
  );

  const pow10 = (d: number) => BigInt(10) ** BigInt(Math.max(0, Math.min(18, d)));
  const total_supply_amount = BigInt(Math.trunc(TOTAL_SUPPLY)) * pow10(DECIMALS);
  const supplyMintTx = 
  createMintToInstruction(
    mint.publicKey, 
    tokenAccount.publicKey, 
    feePayer_Authority.publicKey, 
    total_supply_amount,  
    [], 
    TOKEN_2022_PROGRAM_ID)

  // Build transaction
  const tx = new Transaction().add(
    createMintAccountIx,
    initializeMetadataPointerIx,
    initializeMintIx,
    initializeMetadataIx,
    createTokenAccountIx,
    initializeTokenAccountIx,
    supplyMintTx
  );

  
  // Send and confirm transaction
  const txSig = await sendAndConfirmTransaction(connection, tx, [feePayer_Authority, mint, tokenAccount]);
  console.log('txSig:', txSig);

  const chainMetadata = await getTokenMetadata(
            connection,
          mint.publicKey,
          'confirmed',
          TOKEN_2022_PROGRAM_ID)
  const mintInfo = await getMint(
          connection,
          mint.publicKey,
          'confirmed',
          TOKEN_2022_PROGRAM_ID
      )

  const tokenAccountInfo = await getAccount(
          connection,
          tokenAccount.publicKey,
            'confirmed',
          TOKEN_2022_PROGRAM_ID
        )

  const mintDataInfo = {
          mintSupply: mintInfo.supply,
          tokenAccountAmount: tokenAccountInfo.amount
      }

  console.log("Mint Supply Data:", mintDataInfo);
  console.log("On Chain Metadata:", chainMetadata);

}

// Run main and handle errors
main().catch((err) => {
  console.error(err);
  process.exit(1);
});