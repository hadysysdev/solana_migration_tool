"use client"

import Link from "next/link"
import { Mail, ArrowRight, Send } from "lucide-react"
import { FaDiscord } from "react-icons/fa"
import { LogoGraphical } from "./Logo"

// Custom X icon component (official X logo SVG)
const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Apply" },
    ],
    resources: [
      { href: "#", label: "Documentation" },
      { href: "#", label: "Security" },
      { href: "#", label: "Blog" },
      { href: "#", label: "Support" },
    ],
    legal: [
      { href: "#", label: "Privacy Policy" },
      { href: "#", label: "Terms of Service" },
      { href: "#", label: "Cookie Policy" },
    ],
  }

  const socialLinks = [
    {
      name: "X",
      href: "https://x.com/w3stream",
      icon: XIcon,
    },
    {
      name: "Discord",
      href: "https://w3stream.com/discord",
      icon: FaDiscord,
    },
    {
      name: "Telegram",
      href: "https://t.me/w3stream",
      icon: Send,
    },
    {
      name: "Email",
      href: "mailto:support@w3stream.com",
      icon: Mail,
    },
  ]

  return (
    <footer className="relative border-t border-slate-800/40 bg-gradient-to-b from-black via-slate-950/50 to-black backdrop-blur supports-[backdrop-filter]:bg-black/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <LogoGraphical size="md" />
            </Link>
            <p className="text-slate-400 text-sm max-w-xs mb-6">
              Secure, transparent token migration solutions for Solana projects. 
              Reclaim control, capture fees, and relaunch your token.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-cyan-400 transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-cyan-400 text-sm transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-cyan-400 text-sm transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-cyan-400 text-sm transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/40 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {currentYear} w3Stream, Inc. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm">
            Built on{" "}
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Solana
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

