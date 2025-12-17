import { Connection, PublicKey } from "@solana/web3.js";

// ==========================================
// 1. CONFIG & CONSTANTS
// ==========================================

// Known addresses to automatically flag as LPs or Special Wallets
const KNOWN_LIQUIDITY_OWNERS = new Set([
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", // Raydium Authority V4
  // Add other manual addresses here if needed
]);

// Program IDs for major DEXs (used to detect pools automatically)
const DEX_PROGRAM_IDS = new Set([
  // RAYDIUM
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", 

  // ORCA
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", 

  // METEORA (You need all 3 of these to catch everything)
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", // DLMM (Concentrated)
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB", // Dynamic AMM (Pools Program)
  "24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS203pukCNJs5s", // Meteora Vaults Program <--- ADD THIS
]);

// ==========================================
// 2. INTERFACES
// ==========================================

export interface SnapshotResult {
  wallet: string;
  balance: number;
  balanceDisplay: number;
  tier: number;
  ratio: number;
  newTokenAmount: number;
  // New fields for LP detection
  isLiquidityPool?: boolean;
  ownerLabel?: string;
  // PDA detection
  isPDA?: boolean;
}

export interface SnapshotConfig {
  tokenMint: string;
  minThreshold: number;
  tiers: Array<{
    id: number;
    min: number;
    max?: number;
    ratio: number;
  }>;
}

export interface SnapshotMetadata {
  tokenMint: string;
  snapshotDate: string;
  minThreshold: number;
  totalHolders: number;
  totalTokens: number;
  tierConfig: SnapshotConfig["tiers"];
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
}

// Helius API Response Types
interface HeliusTokenAccount {
  address: string;
  mint: string;
  owner: string;
  amount: number;
  delegated_amount: number;
  frozen: boolean;
}

interface HeliusResponse {
  jsonrpc: string;
  result: {
    token_accounts: HeliusTokenAccount[];
    total: number;
  };
  id: string;
}

// ==========================================
// 3. CORE FUNCTIONS
// ==========================================

export function getSnapshotConnection(): Connection {
  const rpc =
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com"; // Default to public, fine for getting decimals

  return new Connection(rpc, "confirmed");
}

/**
 * HELIUS SNAPSHOT METHOD (DAS API)
 *
 * Uses Helius 'getTokenAccounts' to fetch holders efficiently using pagination.
 * 1. Gets Mint Decimals via standard RPC (cheap)
 * 2. Gets Holders via Helius DAS API (efficient, supports huge lists)
 */
export async function fetchTokenHolders(
  mintAddress: string,
  onProgress?: (count: number) => void
): Promise<Map<string, { balance: number; decimals: number }>> {
  // 1. SETUP HELIUS CONNECTION
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_HELIUS_API_KEY in environment variables. This is required for DAS snapshots."
    );
  }
  const heliusUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

  // 2. GET DECIMALS (Standard RPC is fine for this single call)
  const connection = getSnapshotConnection();
  const mintPubkey = new PublicKey(mintAddress);
  const mintInfo = await connection.getParsedAccountInfo(mintPubkey);

  if (!mintInfo.value || typeof mintInfo.value.data !== "object") {
    throw new Error("Invalid mint address or not a token");
  }

  const mintData = mintInfo.value.data as any;
  const decimals = mintData.parsed.info.decimals;

  // 3. FETCH HOLDERS LOOP
  const holders = new Map<string, { balance: number; decimals: number }>();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await fetch(heliusUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "snapshot-request",
          method: "getTokenAccounts",
          params: {
            mint: mintAddress,
            page: page,
            limit: 1000, // Helius max limit per page
            displayOptions: {
              showZeroBalance: false,
            },
          },
        }),
      });

      const data = (await response.json()) as HeliusResponse;

      if (!data.result || !data.result.token_accounts || data.result.token_accounts.length === 0) {
        hasMore = false;
        break;
      }

      const accounts = data.result.token_accounts;

      for (const acc of accounts) {
        const owner = acc.owner;
        const amount = acc.amount; // Helius returns the raw amount (integer)

        if (amount <= 0) continue;

        const prev = holders.get(owner);

        // Aggregate balances (in case user has multiple token accounts for same mint)
        holders.set(owner, {
          balance: prev ? prev.balance + amount : amount,
          decimals,
        });
      }

      // Update Progress
      if (onProgress) onProgress(holders.size);

      // Prepare next page
      page++;
    } catch (err) {
      console.error("Error fetching page " + page, err);
      throw new Error(`Snapshot failed at page ${page}. Check Helius API limits.`);
    }
  }

  return holders;
}

/**
 * LIQUIDITY POOL DETECTION
 * Checks top holders to see if they are DEX Pools.
 * Must be called AFTER processSnapshot and BEFORE export.
 */
export async function flagLiquidityPools(results: SnapshotResult[]): Promise<void> {
  const connection = getSnapshotConnection();

  // Only check top 50 to save RPC calls (LPs are always top holders)
  const topHolders = results.slice(0, 50);
  const ownersToCheck: PublicKey[] = [];

  console.log(`[LP Detection] Checking top ${topHolders.length} holders for liquidity pools`);
  console.log(`[LP Detection] Known LP addresses:`, Array.from(KNOWN_LIQUIDITY_OWNERS));
  console.log(`[LP Detection] DEX Program IDs:`, Array.from(DEX_PROGRAM_IDS));

  // 1. Check Static List
  for (const r of topHolders) {
    if (KNOWN_LIQUIDITY_OWNERS.has(r.wallet)) {
      console.log(`[LP Detection] ✓ Found known LP: ${r.wallet.slice(0, 8)}...${r.wallet.slice(-8)} (Raydium Known Auth)`);
      r.isLiquidityPool = true;
      r.ownerLabel = "Raydium (Known Auth)";
    } else {
      try {
        ownersToCheck.push(new PublicKey(r.wallet));
      } catch (err) {
        console.warn(`[LP Detection] Invalid wallet address: ${r.wallet}`, err);
      }
    }
  }

  if (ownersToCheck.length === 0) {
    console.log(`[LP Detection] No accounts to check for program ownership`);
    return;
  }

  console.log(`[LP Detection] Checking ${ownersToCheck.length} accounts for program ownership...`);

  // 2. Check Program Ownership (The accurate way)
  const infos = await connection.getMultipleAccountsInfo(ownersToCheck);

  infos.forEach((info, index) => {
    const walletStr = ownersToCheck[index].toBase58();
    const walletShort = `${walletStr.slice(0, 8)}...${walletStr.slice(-8)}`;
    
    if (!info) {
      console.log(`[LP Detection] ⚠ No account info for: ${walletShort}`);
      return;
    }
    
    const ownerProgramId = info.owner.toBase58();
    const programShort = `${ownerProgramId.slice(0, 8)}...${ownerProgramId.slice(-8)}`;

    // Match result item
    const resultItem = results.find((r) => r.wallet === walletStr);
    if (!resultItem) {
      console.log(`[LP Detection] ⚠ Could not find result item for: ${walletShort}`);
      return;
    }

    console.log(`[LP Detection] Wallet: ${walletShort} | Program: ${programShort} | Balance: ${resultItem.balanceDisplay.toLocaleString()}`);

    if (DEX_PROGRAM_IDS.has(ownerProgramId)) {
      let label = "DEX Pool";
      if (ownerProgramId.startsWith("whirLb")) label = "Orca Pool";
      else if (ownerProgramId.startsWith("LBUZ")) label = "Meteora DLMM";
      else if (ownerProgramId.startsWith("675k")) label = "Raydium Pool";
      else if (ownerProgramId.startsWith("Eo7Wj")) label = "Meteora Dynamic";
      else if (ownerProgramId.startsWith("24Uqj")) label = "Meteora Vault";
      
      console.log(`[LP Detection] ✓ FLAGGED AS LP: ${walletShort} → ${label} (Program: ${programShort})`);
      resultItem.isLiquidityPool = true;
      resultItem.ownerLabel = label;
    } else {
      console.log(`[LP Detection] ✗ Not a known DEX program: ${walletShort} (Program: ${programShort})`);
    }
  });

  const flaggedCount = results.filter(r => r.isLiquidityPool).length;
  console.log(`[LP Detection] Complete. Flagged ${flaggedCount} liquidity pools out of ${topHolders.length} top holders`);
}

// ==========================================
// 4. PROCESSING & EXPORT
// ==========================================

export async function getTokenMetadata(mintAddress: string): Promise<TokenMetadata> {
  const connection = getSnapshotConnection();
  const mint = new PublicKey(mintAddress);

  const info = await connection.getParsedAccountInfo(mint);
  const data = info.value?.data as any;

  return {
    name: "Unknown", // Standard RPC doesn't give metadata easily without Metaplex
    symbol: "UNKNOWN",
    decimals: data.parsed.info.decimals,
    supply: Number(data.parsed.info.supply),
  };
}

export function processSnapshot(
  holders: Map<string, { balance: number; decimals: number }>,
  config: SnapshotConfig
): SnapshotResult[] {
  const results: SnapshotResult[] = [];

  if (holders.size === 0) return results;

  // Safe access to decimals
  const firstEntry = Array.from(holders.values())[0];
  if (!firstEntry) return [];

  const decimals = firstEntry.decimals;
  const minRaw = config.minThreshold * Math.pow(10, decimals);

  for (const [wallet, { balance }] of holders) {
    if (balance < minRaw) continue;

    const display = balance / Math.pow(10, decimals);

    // Detect PDA: if PublicKey is NOT on curve, it's a PDA
    let isPDA = false;
    try {
      const walletKey = new PublicKey(wallet);
      isPDA = !PublicKey.isOnCurve(walletKey.toBytes());
    } catch {
      // Invalid public key, skip
      continue;
    }

    let tier = 0;
    let ratio = 1;

    for (const t of config.tiers) {
      if (display >= t.min && display < (t.max ?? Infinity)) {
        tier = t.id;
        ratio = t.ratio;
        break;
      }
    }

    results.push({
      wallet,
      balance,
      balanceDisplay: display,
      tier,
      ratio,
      newTokenAmount: display * ratio,
      isLiquidityPool: false, // Default, will be set by flagLiquidityPools
      ownerLabel: "", // Default, will be set by flagLiquidityPools
      isPDA,
    });
  }

  return results.sort((a, b) => b.balanceDisplay - a.balanceDisplay);
}

export function exportToCSV(
  results: SnapshotResult[],
  metadata: SnapshotMetadata,
  excludePDAs: boolean = true
): string {
  const lines: string[] = [];

  // Filter out PDAs if requested
  const exportResults = excludePDAs
    ? results.filter((r) => !r.isPDA)
    : results;

  lines.push(`# Token Snapshot`);
  lines.push(`# Mint: ${metadata.tokenMint}`);
  lines.push(`# Date: ${metadata.snapshotDate}`);
  lines.push(`# Total Holders: ${exportResults.length}`);
  lines.push(`# PDAs Excluded: ${excludePDAs}`);
  lines.push("");

  // Header now includes Label and PDA
  lines.push("wallet,balance,tier,ratio,new_amount,is_lp,label,is_pda");

  for (const r of exportResults) {
    lines.push(
      `${r.wallet},${r.balanceDisplay},${r.tier},${r.ratio},${r.newTokenAmount},${r.isLiquidityPool || false},${r.ownerLabel || ""},${r.isPDA || false}`
    );
  }

  return lines.join("\n");
}

export function exportToJSON(
  results: SnapshotResult[],
  metadata: SnapshotMetadata,
  excludePDAs: boolean = true
): {
  metadata: SnapshotMetadata;
  results: SnapshotResult[];
  allowList: string[];
  denyList: string[];
  ratioList: Record<string, number>;
} {
  // Filter out PDAs if requested
  const exportResults = excludePDAs
    ? results.filter((r) => !r.isPDA)
    : results;

  const ratioList: Record<string, number> = {};

  // Exclude LPs and PDAs from the ratio list
  for (const r of exportResults) {
    if (!r.isLiquidityPool && !r.isPDA) {
      ratioList[r.wallet] = r.ratio;
    }
  }

  return {
    metadata: {
      ...metadata,
      totalHolders: exportResults.length,
    },
    results: exportResults,
    allowList: exportResults.map((r) => r.wallet),
    denyList: exportResults
      .filter((r) => r.isLiquidityPool || r.isPDA)
      .map((r) => r.wallet),
    ratioList,
  };
}
