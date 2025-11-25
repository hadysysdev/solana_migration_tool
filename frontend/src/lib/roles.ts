import { useEffect, useState } from 'react';
import { useWalletUi } from '@wallet-ui/react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getConnection, getProgram } from './anchor';
import { createAnchorProviderFromWalletUi } from './w3swapClient';

// Temporary: Allow bypassing admin check for development
// Set NEXT_PUBLIC_ALLOW_ALL_ADMINS=true to allow any connected wallet
const ALLOW_ALL_ADMINS = process.env.NEXT_PUBLIC_ALLOW_ALL_ADMINS === 'true';

// Detects whether the connected wallet is a platform admin (super admin or in project_admins)
export function useIsPlatformAdmin() {
  const { account, wallet, connected } = useWalletUi();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        if (!connected || !account || !wallet) { 
          if (!cancelled) {
            setIsAdmin(false); 
            setIsLoading(false);
            setError('Wallet not connected');
          }
          return; 
        }
        
        // Development bypass: allow all connected wallets if enabled
        if (ALLOW_ALL_ADMINS) {
          if (!cancelled) {
            setIsAdmin(true);
            setIsLoading(false);
            setError(null);
            setDebugInfo({
              connectedWallet: account.address,
              bypassEnabled: true,
              note: 'Admin check bypassed for development',
            });
          }
          return;
        }
        
        const connection = getConnection();
        const provider = createAnchorProviderFromWalletUi(account, wallet);
        
        try {
          const program = getProgram(provider);
          const [platformConfigPda] = PublicKey.findProgramAddressSync([Buffer.from('platform_config')], program.programId);
          
          const debug = {
            connectedWallet: account.address,
            platformConfigPda: platformConfigPda.toBase58(),
            programId: program.programId.toBase58(),
          };
          
          try {
            const cfg: any = await program.account.platformConfig.fetch(platformConfigPda);
            const me = account.address;
            const superAdmin = (cfg.superAdmin as PublicKey).toBase58?.() ?? String(cfg.superAdmin);
            const admins: string[] = (cfg.projectAdmins || []).map((pk: PublicKey) => pk.toBase58?.() ?? String(pk));
            
            const ok = me === superAdmin || admins.includes(me);
            
            if (!cancelled) {
              setIsAdmin(ok);
              setIsLoading(false);
              setError(null);
              setDebugInfo({
                ...debug,
                superAdmin,
                projectAdmins: admins,
                isSuperAdmin: me === superAdmin,
                isProjectAdmin: admins.includes(me),
                result: ok,
              });
            }
          } catch (fetchError: any) {
            if (!cancelled) {
              setIsAdmin(false);
              setIsLoading(false);
              setError(`Failed to fetch platform config: ${fetchError?.message || 'Unknown error'}`);
              setDebugInfo({
                ...debug,
                fetchError: fetchError?.message || String(fetchError),
              });
              console.error('Error fetching platform config:', fetchError);
            }
          }
        } catch (programError: any) {
          if (!cancelled) {
            setIsAdmin(false);
            setIsLoading(false);
            setError(`Failed to initialize program: ${programError?.message || 'Unknown error'}`);
            setDebugInfo({
              connectedWallet: account.address,
              programError: programError?.message || String(programError),
            });
            console.error('Error initializing program:', programError);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setIsAdmin(false);
          setIsLoading(false);
          setError(`Unexpected error: ${err?.message || 'Unknown error'}`);
          setDebugInfo({ error: err?.message || String(err) });
          console.error('Unexpected error in useIsPlatformAdmin:', err);
        }
      }
    }
    run();
    return () => { cancelled = true; };
  }, [account?.address, connected, wallet]);

  return { isAdmin, isLoading, error, debugInfo };
}

// Hook to get debug information about admin access
export function useAdminDebugInfo() {
  const { account, wallet, connected } = useWalletUi();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!connected || !account || !wallet) { 
          setDebugInfo({ connected: false });
          return; 
        }
        
        const connection = getConnection();
        const provider = createAnchorProviderFromWalletUi(account, wallet);
        
        try {
          const program = getProgram(provider);
          const [platformConfigPda] = PublicKey.findProgramAddressSync([Buffer.from('platform_config')], program.programId);
          
          try {
            const cfg: any = await program.account.platformConfig.fetch(platformConfigPda);
            const me = account.address;
            const superAdmin = (cfg.superAdmin as PublicKey).toBase58?.() ?? String(cfg.superAdmin);
            const admins: string[] = (cfg.projectAdmins || []).map((pk: PublicKey) => pk.toBase58?.() ?? String(pk));
            
            if (!cancelled) {
              setDebugInfo({
                connected: true,
                connectedWallet: me,
                platformConfigPda: platformConfigPda.toBase58(),
                programId: program.programId.toBase58(),
                superAdmin,
                projectAdmins: admins,
                isSuperAdmin: me === superAdmin,
                isProjectAdmin: admins.includes(me),
                hasAccess: me === superAdmin || admins.includes(me),
              });
              setError(null);
            }
          } catch (fetchError: any) {
            if (!cancelled) {
              setError(`Failed to fetch platform config: ${fetchError?.message || 'Unknown error'}`);
              setDebugInfo({
                connected: true,
                connectedWallet: account.address,
                platformConfigPda: platformConfigPda.toBase58(),
                programId: program.programId.toBase58(),
                fetchError: fetchError?.message || String(fetchError),
              });
            }
          }
        } catch (programError: any) {
          if (!cancelled) {
            setError(`Failed to initialize program: ${programError?.message || 'Unknown error'}`);
            setDebugInfo({
              connected: true,
              connectedWallet: account.address,
              programError: programError?.message || String(programError),
            });
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(`Unexpected error: ${err?.message || 'Unknown error'}`);
          setDebugInfo({ error: err?.message || String(err) });
        }
      }
    }
    run();
    return () => { cancelled = true; };
  }, [account?.address, connected, wallet]);

  return { debugInfo, error };
}

// For per-project admin checks, prefer using the project row's project_admin for UI gating
// and re-check on-chain before privileged actions. This hook is provided for convenience.
export function useIsProjectAdmin(projectAdmin?: string) {
  const { account } = useWalletUi();
  const me = account?.address;
  return !!me && !!projectAdmin && me === projectAdmin;
}

// Backward compatibility: return boolean instead of object
export function useIsPlatformAdminBoolean() {
  const { isAdmin } = useIsPlatformAdmin();
  return isAdmin;
}
