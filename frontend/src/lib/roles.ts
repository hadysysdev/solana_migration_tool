import { useEffect, useState } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getConnection, getProgram } from './anchor';

// Detects whether the connected wallet is a platform admin (super admin or in project_admins)
export function useIsPlatformAdmin() {
  const wallet = useAnchorWallet();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!wallet?.publicKey) { setIsAdmin(false); return; }
        const connection = getConnection();
        const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
        const program = getProgram(provider);
        const [platformConfigPda] = PublicKey.findProgramAddressSync([Buffer.from('platform_config')], program.programId);
        const cfg: any = await program.account.platformConfig.fetch(platformConfigPda);
        const me = wallet.publicKey.toBase58();
        const superAdmin = (cfg.superAdmin as PublicKey).toBase58?.() ?? String(cfg.superAdmin);
        const admins: string[] = (cfg.projectAdmins || []).map((pk: PublicKey) => pk.toBase58?.() ?? String(pk));
        const ok = me === superAdmin || admins.includes(me);
        if (!cancelled) setIsAdmin(ok);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [wallet?.publicKey?.toBase58()]);

  return isAdmin;
}

// For per-project admin checks, prefer using the project row's project_admin for UI gating
// and re-check on-chain before privileged actions. This hook is provided for convenience.
export function useIsProjectAdmin(projectAdmin?: string) {
  const wallet = useAnchorWallet();
  const me = wallet?.publicKey?.toBase58();
  return !!me && !!projectAdmin && me === projectAdmin;
}

