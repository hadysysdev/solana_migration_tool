import { Keypair } from "@solana/web3.js";

import bs58 from "bs58";

export const customGetKeypairFromEnvironment = (
  variableName: string,
): Keypair => {
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


