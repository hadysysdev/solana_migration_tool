"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-3xl',
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const iconSize = size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-12 w-12'
  
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* Icon container with gradient background */}
      <div className={cn(
        'flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500',
        'relative overflow-hidden',
        iconSize
      )}>
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-purple-500 to-cyan-600 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        
        {/* W3 graphic inside */}
        <div className="relative z-10 flex items-center justify-center">
          <span className={cn(
            'font-bold text-white',
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'
          )}>
            w3
          </span>
        </div>
      </div>

      {/* Text branding */}
      {showText && (
        <span className={cn(
          'font-bold tracking-tight',
          sizeClasses[size]
        )}>
          S
          <span className="relative inline-block mx-0.5">
            <span className="text-gradient-primary relative z-10">w3</span>
            {/* Decorative underline/border for w3 */}
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-60 -z-0" />
          </span>
          p
        </span>
      )}
    </div>
  )
}

// Alternative version with more graphical elements
export function LogoGraphical({ className, size = 'md' }: LogoProps) {
  const textSize = sizeClasses[size]
  
  return (
    <div className={cn('flex items-center', className)}>
      {/* Text with enhanced styling - w3Swap in same container */}
      <span className={cn('font-bold tracking-tight', textSize)}>
        <span className="relative inline-block">
          <span className="relative z-10">
            <span className="text-gradient-primary font-extrabold tracking-tighter">w3Swap</span>
            {/* Multiple decorative elements for w3 Swap */}
            <span className="absolute -top-1 -left-1 -right-1 -bottom-1 border border-cyan-500/30 rounded-sm -z-0 blur-[1px]" />
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent rounded-full -z-0" />
          </span>
        </span>
      </span>
    </div>
  )
}

