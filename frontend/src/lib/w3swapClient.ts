import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import type { W3swap } from '../../../target/types/w3swap';
import { getProgram, } from './anchor';



export async function getProjects(provider: AnchorProvider) {
  const program = getProgram(provider);
  return await program.account.project.all();
}

export async function getProject(provider: AnchorProvider, projectPda: PublicKey) {
  const program = getProgram(provider);
  return await program.account.project.fetch(projectPda);
}




