'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import WalletButton from '@/components/w3swap/WalletButton';
import { useIsPlatformAdmin } from '@/lib/roles';

export function AdminHeader() {
  const { isAdmin } = useIsPlatformAdmin();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-slate-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60 px-6 overflow-x-auto min-w-0">
      {/* Search */}
      <div className="relative flex-1 max-w-md min-w-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="Search projects, users, transactions..."
          className="pl-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Quick Nav */}
        <a 
          href="/" 
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Home
        </a>
        <a 
          href="/migrate" 
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Migrate
        </a>

        {/* Wallet Connection */}
        <WalletButton />

        {/* Role + Network Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-slate-900/50 px-3 py-1.5 border border-slate-800">
            <div className={`h-2 w-2 rounded-full ${isAdmin ? 'bg-yellow-400' : 'bg-slate-400'}`} />
            <span className="text-xs font-medium text-white">{isAdmin ? 'Admin' : 'User'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-900/50 px-3 py-1.5 border border-slate-800">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-white">Devnet</span>
          </div>
        </div>
      </div>
    </header>
  );
}

