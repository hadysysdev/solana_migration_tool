'use client';

import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WalletButton } from '@/components/wallet/wallet-button';
import { useIsPlatformAdmin } from '@/lib/roles';

export function AdminHeader() {
  const { theme, setTheme } = useTheme();
  const isAdmin = useIsPlatformAdmin();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 overflow-x-auto min-w-0">
      {/* Search */}
      <div className="relative flex-1 max-w-md min-w-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <Input
          type="search"
          placeholder="Search projects, users, transactions..."
          className="pl-9 bg-surface"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Quick Nav */}
        <Button asChild variant="ghost">
          <a href="/">Home</a>
        </Button>
        <Button asChild variant="ghost">
          <a href="/migrate">Migrate</a>
        </Button>
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
            3
          </Badge>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Wallet Connection */}
        <WalletButton />

        {/* Role + Network Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
            <div className={"h-2 w-2 rounded-full " + (isAdmin ? 'bg-warning-400' : 'bg-foreground-muted')} />
            <span className="text-xs font-medium">{isAdmin ? 'Admin' : 'User'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-success-400 animate-pulse" />
            <span className="text-sm font-medium">Devnet</span>
          </div>
        </div>
      </div>
    </header>
  );
}
