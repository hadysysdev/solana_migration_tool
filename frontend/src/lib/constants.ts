import { PublicKey } from '@solana/web3.js';

// Contract Configuration
export const W3SWAP_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_W3SWAP_PROGRAM_ID || '9qPx5xbqg4xZp3BWbtCNGy3GVfZ4WeaeraMUvLBSdcKh');

// Network Configuration
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Token Standards
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Meteora DLMM
export const METEORA_DLMM_PROGRAM_ID = new PublicKey('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo');

// System Programs
export const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
export const RENT_PROGRAM_ID = new PublicKey('SysvarRent111111111111111111111111111111111');

// PDA Seeds
export const PROJECT_SEED = 'project';
export const USER_MIGRATION_SEED = 'user_migration';
export const LIQUIDITY_VAULT_SEED = 'liquidity_vault';

// Default values
export const DEFAULT_SLIPPAGE = 0.5; // 0.5%
export const DEFAULT_LP_LOCK_DURATION = 90; // 90 days
export const MIN_SOL_COMMITMENT = 0.1; // 0.1 SOL minimum
export const MAX_SOL_COMMITMENT = 10000; // 10,000 SOL maximum

// UI Constants
export const ITEMS_PER_PAGE = 10;
export const REFRESH_INTERVAL = 30000; // 30 seconds
