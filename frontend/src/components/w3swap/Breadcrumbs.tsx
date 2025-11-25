"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items

    // Don't show breadcrumbs on home page
    if (pathname === "/") return []

    const paths = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/" },
    ]

    let currentPath = ""
    paths.forEach((path, index) => {
      currentPath += `/${path}`
      const label = path
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
      breadcrumbs.push({
        label,
        href: currentPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("py-4 px-4 sm:px-6 lg:px-8", className)}
    >
      <ol className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          const isHome = crumb.href === "/"

          return (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
              {isLast ? (
                <span
                  className={cn(
                    "font-medium",
                    isLast ? "text-white" : "text-slate-400"
                  )}
                  aria-current="page"
                >
                  {isHome && <Home className="w-4 h-4 inline-block mr-1" />}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
                >
                  {isHome && <Home className="w-4 h-4" />}
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

