'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Copy, ExternalLink, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { truncateAddress, copyToClipboard } from '@/lib/utils';
import { useState } from 'react';

export function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const [showDetails, setShowDetails] = useState(false);

  if (!connected || !publicKey) {
    return (
      <div className="wallet-adapter-dropdown">
        <WalletMultiButton className="!bg-primary-500 !text-white !rounded-md !px-4 !py-2 !text-sm !font-medium hover:!bg-primary-600 transition-colors" />
      </div>
    );
  }

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(publicKey.toString());
    if (success) {
      // You could add a toast notification here
      console.log('Address copied to clipboard');
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">
          {truncateAddress(publicKey.toString())}
        </span>
        <Badge variant="success" className="hidden sm:flex">
          Connected
        </Badge>
      </Button>

      {showDetails && (
        <Card className="absolute top-full right-0 mt-2 w-64 z-50 shadow-lg border">
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">Wallet Address</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-surface rounded px-2 py-1 flex-1 font-mono">
                  {truncateAddress(publicKey.toString(), 6)}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyAddress}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className="h-6 w-6 p-0"
                >
                  <a
                    href={`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-3 w-3" />
              Disconnect
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Alternative compact version for mobile
export function WalletButtonCompact() {
  const { connected, publicKey } = useWallet();

  if (!connected || !publicKey) {
    return (
      <WalletMultiButton className="!bg-primary-500 !text-white !rounded-md !px-3 !py-2 !text-sm" />
    );
  }

  return (
    <Badge variant="success" className="flex items-center gap-1">
      <Wallet className="h-3 w-3" />
      {truncateAddress(publicKey.toString(), 4)}
    </Badge>
  );
}