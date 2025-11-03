'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsPlatformAdmin } from '@/lib/roles';
import { LogoGraphical } from '@/components/ui/logo';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  ArrowLeftRight, 
  FileText,
  Github,
  Twitter,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';

const navigationItems = [
  {
    name: 'Home',
    href: '/',
    icon: null,
  },
  {
    name: 'Migrate',
    href: '/migrate',
    icon: ArrowLeftRight,
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: LayoutDashboard,
    requiresWallet: true,
    requiresAdmin: true, // Only show if user is admin
  },
  {
    name: 'Docs',
    href: '/docs',
    icon: FileText,
  },
];

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/w3swap',
    icon: Github,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/w3swap',
    icon: Twitter,
  },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const isAdmin = useIsPlatformAdmin();
  const { theme, setTheme } = useTheme();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <LogoGraphical size="md" />
            </Link>
            <Badge variant="primary" size="sm">
              Beta
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              // Skip admin link if wallet not connected and it requires wallet
              if (item.requiresWallet && !connected) {
                return null;
              }

              // Skip admin link if user is not an admin (but wallet is connected)
              if (item.requiresAdmin && (!isAdmin || !connected)) {
                return null;
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'text-primary-400'
                      : 'text-foreground-muted hover:text-foreground'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Social Links */}
            <div className="flex items-center space-x-2">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Button
                    key={link.name}
                    variant="ghost"
                    size="icon-sm"
                    asChild
                  >
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.name}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </Button>
                );
              })}
            </div>

            {/* Network Indicator */}
            <Badge variant="outline" size="sm">
              {process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}
            </Badge>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Wallet Connection */}
            <WalletMultiButton className="!bg-primary-500 hover:!bg-primary-600 !h-10 !text-sm" />
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                // Skip admin link if wallet not connected and it requires wallet
                if (item.requiresWallet && !connected) {
                  return null;
                }

                // Skip admin link if user is not an admin (but wallet is connected)
                if (item.requiresAdmin && (!isAdmin || !connected)) {
                  return null;
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-foreground-muted hover:bg-surface hover:text-foreground'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Social Links */}
              <div className="pt-4 border-t border-border/40">
                <div className="flex items-center space-x-2 px-3">
                  {socialLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Button
                        key={link.name}
                        variant="ghost"
                        size="icon-sm"
                        asChild
                      >
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={link.name}
                        >
                          <Icon className="h-4 w-4" />
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Network & Wallet */}
              <div className="px-3 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-muted">Network:</span>
                  <Badge variant="outline" size="sm">
                    {process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}
                  </Badge>
                </div>
                {/* Mobile Theme Toggle */}
                <Button
                  variant="ghost"
                  className="w-full justify-start relative"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 mr-2 left-3 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span>Toggle Theme</span>
                </Button>
                <WalletMultiButton className="!bg-primary-500 hover:!bg-primary-600 !h-10 !text-sm !w-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}