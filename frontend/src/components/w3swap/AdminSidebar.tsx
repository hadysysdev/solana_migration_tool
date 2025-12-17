'use client';

import { useState } from 'react';
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
  Camera
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
    ],
  },
  {
    name: 'Token Creation',
    href: '/admin/token/create',
    icon: Coins,
  },
  {
    name: 'Token Snapshot',
    href: '/admin/snapshot',
    icon: Camera,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    // Initialize with Projects menu open if any child is active
    const initial: Record<string, boolean> = {};
    navigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => pathname === child.href);
        if (hasActiveChild || pathname === item.href) {
          initial[item.name] = true;
        }
      }
    });
    return initial;
  });

  const toggleMenu = (itemName: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  return (
    <div className="flex h-screen w-72 flex-col bg-black/50 border-r border-slate-800 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6 shrink-0">
        <div className="text-sm font-medium bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
          Admin
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.children && item.children.some(child => pathname === child.href));
          const isOpen = item.children ? openMenus[item.name] : false;
          const Icon = item.icon;
          
          return (
            <div key={item.name}>
              {item.children ? (
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.name}</span>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    isOpen && "rotate-90"
                  )} />
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.name}</span>
                </Link>
              )}
              
              {/* Submenu */}
              {item.children && isOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                        pathname === child.href
                          ? 'bg-slate-900/50 text-white'
                          : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
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
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-900/50 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 font-semibold">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-slate-400">admin@w3swap.io</p>
          </div>
        </div>
      </div>
    </div>
  );
}

