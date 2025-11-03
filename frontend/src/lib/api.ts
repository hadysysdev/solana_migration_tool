import { Connection, PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { getConnection, Project } from './anchor';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// UI-friendly Project shape derived from backend rows
type Row = any;

// API service for interacting with the W3Swap contract
export class W3SwapAPI {
  // Backend-backed fetches
  async fetchProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/projects`);
      
      // If response is not OK, return empty array (treat as no projects, not an error)
      if (!res.ok) {
        // Only treat 5xx errors as actual errors, 4xx (like 404) means no projects exist
        if (res.status >= 500) {
          throw new Error(`Backend error: ${res.status}`);
        }
        // For 4xx errors (like 404), return empty array - no projects exist
        return [];
      }
      
      const rows = await res.json();
      
      // Handle case where response might not be an array
      if (!Array.isArray(rows)) {
        return [];
      }
      
      const toPk = (s?: string) => {
        try { return s ? new PublicKey(s) : new PublicKey('11111111111111111111111111111111'); } catch { return new PublicKey('11111111111111111111111111111111'); }
      };
      return (rows || []).map((r: Row) => ({
        id: toPk(r.project_pda),
        projectId: Number(r.project_id),
        projectAdmin: r.project_admin,
        oldTokenMint: toPk(r.old_token_mint),
        newTokenMint: toPk(r.new_token_mint),
        status: r.status ?? 'Created',
        totalMigrated: Number(r.total_migrated ?? 0),
        totalUsers: Number(r.total_users ?? 0),
        exchangeRateOld: Number(r.exchange_ratio_old ?? 0),
        exchangeRateNew: Number(r.exchange_ratio_new ?? 0),
        createdAt: r.created_at ? Math.floor(new Date(r.created_at).getTime() / 1000) : 0,
      } as Project));
    } catch (error) {
      // Only throw if it's a network error or actual server error
      // For missing data or empty responses, return empty array
      if (error instanceof Error && error.message.includes('Backend error')) {
        throw error;
      }
      // For other errors (like network issues), check if it's a real error
      console.warn('Error fetching projects, returning empty array:', error);
      return [];
    }
  }

  async fetchProject(projectId: number, projectAdmin?: string): Promise<Project | null> {
    const url = new URL(`${BACKEND_URL}/projects/${projectId}`);
    if (projectAdmin) url.searchParams.set('project_admin', projectAdmin);
    const res = await fetch(url);
    if (!res.ok) return null;
    const r: Row = await res.json();
    const toPk = (s?: string) => { try { return s ? new PublicKey(s) : new PublicKey('11111111111111111111111111111111'); } catch { return new PublicKey('11111111111111111111111111111111'); } };
    return {
      id: toPk(r.project_pda),
      projectId: Number(r.project_id),
      projectAdmin: r.project_admin,
      oldTokenMint: toPk(r.old_token_mint),
      newTokenMint: toPk(r.new_token_mint),
      status: r.status ?? 'Created',
      totalMigrated: Number(r.total_migrated ?? 0),
      totalUsers: Number(r.total_users ?? 0),
      exchangeRateOld: Number(r.exchange_ratio_old ?? 0),
      exchangeRateNew: Number(r.exchange_ratio_new ?? 0),
      createdAt: r.created_at ? Math.floor(new Date(r.created_at).getTime() / 1000) : 0,
    } as Project;
  }

  async fetchProjectEvents(projectId: number, eventName?: string): Promise<any[]> {
    const url = new URL(`${BACKEND_URL}/projects/${projectId}/events`);
    if (eventName) url.searchParams.set('event_name', eventName);
    const res = await fetch(url);
    return res.ok ? (await res.json()) : [];
  }

  async fetchProjectAnalytics(projectId: number, days = 30): Promise<any | null> {
    const url = new URL(`${BACKEND_URL}/analytics/projects/${projectId}`);
    url.searchParams.set('days', String(days));
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  }

  // Fetch user's migration history
  async fetchUserMigrationHistory(userAddress: PublicKey): Promise<UserMigration[]> {
    try {
      const accounts = await this.connection.getProgramAccounts(W3SWAP_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: 'user_migration',
            },
          },
          {
            memcmp: {
              offset: 8, // Offset where user pubkey would be stored
              bytes: userAddress.toBase58(),
            },
          },
        ],
      });

      const migrations: UserMigration[] = [];
      for (const account of accounts) {
        try {
          const migration = this.parseUserMigrationAccount(account.account.data);
          if (migration) {
            migrations.push(migration);
          }
        } catch (error) {
          console.error('Error parsing user migration account:', error);
        }
      }

      return migrations;
    } catch (error) {
      console.error('Error fetching user migration history:', error);
      return [];
    }
  }

  // Parse project account data
  private parseProjectAccount(data: Buffer, pubkey: PublicKey): Project | null {
    try {
      // TODO: Implement actual parsing based on the contract's account structure
      // This is a placeholder implementation
      
      // For now, return null since we don't have the actual account structure
      // Once we have the IDL, we can properly deserialize the account data
      return null;
      
      /*
      Example implementation when we have the IDL:
      
      const reader = new BinaryReader(data);
      const discriminator = reader.readBytes(8);
      
      if (!this.isProjectDiscriminator(discriminator)) {
        return null;
      }
      
      return {
        id: pubkey,
        creator: new PublicKey(reader.readBytes(32)),
        oldTokenMint: new PublicKey(reader.readBytes(32)),
        newTokenMint: new PublicKey(reader.readBytes(32)),
        exchangeRateOld: reader.readU64(),
        exchangeRateNew: reader.readU64(),
        startTime: reader.readI64(),
        endTime: reader.readI64(),
        status: this.parseProjectStatus(reader.readU8()),
        totalMigrated: reader.readU64(),
        totalUsers: reader.readU32(),
        createdAt: reader.readI64(),
        activatedAt: reader.hasMore() ? reader.readI64() : undefined,
      };
      */
    } catch (error) {
      console.error('Error parsing project account:', error);
      return null;
    }
  }

  // Parse user migration account data
  private parseUserMigrationAccount(data: Buffer): UserMigration | null {
    try {
      // TODO: Implement actual parsing based on the contract's account structure
      // This is a placeholder implementation
      return null;
    } catch (error) {
      console.error('Error parsing user migration account:', error);
      return null;
    }
  }

  // Get token metadata
  async getTokenMetadata(mintAddress: PublicKey): Promise<{
    symbol: string;
    name: string;
    decimals: number;
    supply: number;
  } | null> {
    try {
      // Fetch token mint info
      const mintInfo = await this.connection.getParsedAccountInfo(mintAddress);
      
      if (!mintInfo.value || !mintInfo.value.data || typeof mintInfo.value.data !== 'object') {
        return null;
      }

      const parsedData = mintInfo.value.data as any;
      if (parsedData.program !== 'spl-token') {
        return null;
      }

      const mintData = parsedData.parsed.info;
      
      // For now, return basic mint info
      // TODO: Fetch metadata from Token-2022 if available
      return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: mintData.decimals,
        supply: parseInt(mintData.supply),
      };
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }
}

// Create singleton instance
export const w3swapAPI = new W3SwapAPI();

// React hooks for data fetching with React Query

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => w3swapAPI.fetchProjects(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};

export const useProject = (projectId: number, projectAdmin?: string) => {
  return useQuery({
    queryKey: ['project', projectId, projectAdmin ?? ''],
    queryFn: () => w3swapAPI.fetchProject(projectId, projectAdmin),
    enabled: !!projectId,
    staleTime: 30000,
  });
};

export const useUserMigrations = (userAddress?: PublicKey) => {
  return useQuery({
    queryKey: ['userMigrations', userAddress?.toString()],
    queryFn: () => userAddress ? w3swapAPI.fetchUserMigrationHistory(userAddress) : Promise.resolve([]),
    enabled: !!userAddress,
    staleTime: 30000,
  });
};

export const useProjectEvents = (projectId: number, eventName?: string) => {
  return useQuery({
    queryKey: ['projectEvents', projectId, eventName ?? ''],
    queryFn: () => w3swapAPI.fetchProjectEvents(projectId, eventName),
    staleTime: 30000,
  });
};

export const useProjectAnalytics = (projectId: number, days = 30) => {
  return useQuery({
    queryKey: ['projectAnalytics', projectId, days],
    queryFn: () => w3swapAPI.fetchProjectAnalytics(projectId, days),
    enabled: !!projectId,
    staleTime: 30000,
  });
};

export const useTokenMetadata = (mintAddress: PublicKey) => {
  return useQuery({
    queryKey: ['tokenMetadata', mintAddress.toString()],
    queryFn: () => w3swapAPI.getTokenMetadata(mintAddress),
    staleTime: 300000, // 5 minutes - metadata doesn't change often
  });
};
