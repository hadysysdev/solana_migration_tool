'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  Package,
  Coins,
  Users,
  Settings,
  Shield,
  Activity,
  FileText,
  LogOut,
  ChevronRight,
  Rocket
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Projects',
    href: '/admin/projects',
    icon: Package,
    children: [
      { name: 'All Projects', href: '/admin/projects' },
      { name: 'My Projects', href: '/admin/my-projects' },
      { name: 'Create Project', href: '/admin/projects/create' },
      { name: 'Pending Activation', href: '/admin/projects/pending' },
    ],
  },
  {
    name: 'Token Creation',
    href: '/admin/token/create',
    icon: Coins,
  },
  {
    name: 'Migrations',
    href: '/admin/migrations',
    icon: Users,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: Activity,
  },
  {
    name: 'Security',
    href: '/admin/security',
    icon: Shield,
  },
  {
    name: 'Documentation',
    href: '/admin/docs',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-surface border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
          <Rocket className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold">W3Swap Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.children && item.children.some(child => pathname === child.href));
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-foreground-muted hover:bg-surface-2 hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.name}</span>
                {item.children && (
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    isActive && "rotate-90"
                  )} />
                )}
              </Link>
              
              {/* Submenu */}
              {item.children && isActive && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                        pathname === child.href
                          ? 'bg-surface-2 text-foreground'
                          : 'text-foreground-muted hover:bg-surface-2 hover:text-foreground'
                      )}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-primary-400 font-semibold">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-foreground-muted">admin@w3swap.io</p>
          </div>
        </div>
        <button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
