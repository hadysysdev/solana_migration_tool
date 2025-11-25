"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import WalletButton from "./WalletButton"
import { LogoGraphical } from "./Logo"
import { Badge } from "@/components/ui/badge"
import { useIsPlatformAdmin } from "@/lib/roles"

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAdmin } = useIsPlatformAdmin()

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/migrate", label: "Migrate" },
    { href: "/docs", label: "Docs" },
    { href: "/faq", label: "FAQ" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Apply" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ]

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-slate-800/40 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <LogoGraphical size="md" />
            </Link>
            <Badge 
              variant="primary" 
              size="sm"
              className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-sm shadow-[0_0_8px_rgba(6,182,212,0.4)] hover:shadow-[0_0_12px_rgba(6,182,212,0.6)] transition-all duration-300"
            >
              Beta
            </Badge>
            </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-cyan-500"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:flex items-center">
            <WalletButton />
          </div>

          {/* Mobile Menu Button and Wallet */}
          <div className="md:hidden flex items-center gap-2">
            <WalletButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  pathname === item.href
                    ? "bg-cyan-500/20 text-cyan-500"
                    : "text-slate-400 hover:bg-slate-800"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="px-4 pt-2">
              <WalletButton />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

