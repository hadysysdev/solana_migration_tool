'use client';

import { ReactNode } from 'react';
import { createSolanaDevnet, createSolanaLocalnet, createSolanaMainnet, createWalletUiConfig, WalletUi } from '@wallet-ui/react';

const mainnetRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

const config = createWalletUiConfig({
    clusters: [
        createSolanaMainnet(mainnetRpcUrl),
        createSolanaDevnet(),
        createSolanaLocalnet(),
    ],
});

export function SolanaProvider({ children }: { children: ReactNode }) {
    return <WalletUi config={config}>{children}</WalletUi>;
}

