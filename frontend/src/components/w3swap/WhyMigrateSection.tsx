"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Users, Building2, Shield, TrendingUp, Coins, Lock, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import Lottie from "lottie-react"

const holderBenefits = [
  {
    icon: Shield,
    text: "Migrate safely and instantly to the new token.",
  },
  {
    icon: TrendingUp,
    text: "Maintain trading continuity with no downtime.",
  },
  {
    icon: Coins,
    text: "Receive fair exchange ratios and transparent settlement.",
  },
]

const projectBenefits = [
  {
    icon: Lock,
    text: "Regain full ownership of LP and trading fees.",
  },
  {
    icon: Coins,
    text: "Recover SOL from abandoned or locked liquidity.",
  },
  {
    icon: Building2,
    text: "Capture un-migrated tokens for treasury, marketing, or rewards.",
  },
]

// Function to modify colors in Lottie animation data
function modifyLottieColors(animationData: any, targetColor: [number, number, number], intensity: number = 0.7): any {
  if (!animationData) return animationData
  
  const modified = JSON.parse(JSON.stringify(animationData)) // Deep clone
  const [targetR, targetG, targetB] = targetColor
  
  // Recursively traverse and modify colors
  function traverseAndModify(obj: any): void {
    if (!obj || typeof obj !== 'object') return
    
    // Handle color arrays [R, G, B, A] (normalized 0-1)
    if (Array.isArray(obj)) {
      // Check if it's a color array
      if (obj.length >= 3 && obj.length <= 4) {
        const [r, g, b, a = 1] = obj
        // Check if values are normalized colors (0-1 range)
        if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1 && 
            typeof r === 'number' && typeof g === 'number' && typeof b === 'number') {
          // Blend with target color based on intensity
          // Higher intensity = more of target color, lower = more original
          const originalBrightness = (r + g + b) / 3
          const targetBrightness = (targetR + targetG + targetB) / 3 / 255
          
          // Preserve brightness but shift hue toward target
          const blendR = (r * (1 - intensity) + (targetR / 255) * intensity)
          const blendG = (g * (1 - intensity) + (targetG / 255) * intensity)
          const blendB = (b * (1 - intensity) + (targetB / 255) * intensity)
          
          // Adjust brightness to match original
          const currentBrightness = (blendR + blendG + blendB) / 3
          const brightnessFactor = originalBrightness / (currentBrightness || 0.001)
          
          obj[0] = Math.max(0, Math.min(1, blendR * brightnessFactor))
          obj[1] = Math.max(0, Math.min(1, blendG * brightnessFactor))
          obj[2] = Math.max(0, Math.min(1, blendB * brightnessFactor))
          if (obj.length === 4) obj[3] = a // Preserve alpha
        }
      } else {
        // Process array elements recursively
        obj.forEach((item: any) => {
          if (typeof item === 'object') {
            traverseAndModify(item)
          }
        })
      }
    }
    
    // Recursively process all object properties
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        traverseAndModify(obj[key])
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverseAndModify(obj[key])
      }
    }
  }
  
  traverseAndModify(modified)
  return modified
}

// Preload animation data immediately when module loads
let animationDataPromise: Promise<any> | null = null
if (typeof window !== 'undefined') {
  // Preload the JSON file
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'fetch'
  link.href = '/animations/3D Hologram.json'
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
  
  // Start fetching immediately
  animationDataPromise = fetch("/animations/3D Hologram.json", { cache: 'force-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`)
      return res.json()
    })
    .catch((err) => {
      console.error("Failed to preload hologram animation:", err)
      return null
    })
}

export default function WhyMigrateSection() {
  const [hologramAnimationData, setHologramAnimationData] = useState<any>(null)
  const [oldTokenAnimationData, setOldTokenAnimationData] = useState<any>(null)
  const [newTokenAnimationData, setNewTokenAnimationData] = useState<any>(null)

  useEffect(() => {
    // Use the preloaded promise if available, otherwise fetch
    const loadPromise = animationDataPromise || fetch("/animations/3D Hologram.json", { cache: 'force-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`)
        return res.json()
      })
    
    loadPromise.then((data) => {
      if (!data) return
      
      setHologramAnimationData(data)
      
      // Create purple-tinted version for old token - darker, more muted
      // Using darker purple (purple-600: rgb(147, 51, 234)) with high intensity
      const purpleVersion = modifyLottieColors(data, [147, 51, 234], 0.85)
      setOldTokenAnimationData(purpleVersion)
      
      // Create cyan-tinted version for new token - brighter, more vibrant
      // Using bright cyan (cyan-400: rgb(34, 211, 238)) with high intensity
      const cyanVersion = modifyLottieColors(data, [34, 211, 238], 0.85)
      setNewTokenAnimationData(cyanVersion)
    }).catch((err) => console.error("Failed to load hologram animation:", err))
  }, [])

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-black via-slate-950/50 to-black relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

      {/* Floating orbs */}
      <div 
        className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" 
        style={{ willChange: "opacity", animation: "pulse 4s ease-in-out infinite", transform: "translateZ(0)" }} 
      />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"
        style={{ willChange: "opacity", animation: "pulse 4s ease-in-out infinite 1s", transform: "translateZ(0)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance mb-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
            Why Migrate?
          </h2>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Token migrations realign incentives between projects and their communities. 
            They restore control of liquidity, reactivate trading volume, and reward both holders and builders.
          </p>
        </motion.div>

        {/* Layout: Animation + Benefits */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Animation Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex justify-center items-center"
          >
            <div className="relative w-full max-w-[600px]">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-teal-500/20 rounded-full blur-3xl opacity-60 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-teal-500/10 rounded-full blur-2xl" />
              
              {/* Migration Flow Visualization */}
              <div className="relative w-full flex items-center justify-center gap-4 md:gap-6 py-8 overflow-visible">
                {oldTokenAnimationData && newTokenAnimationData ? (
                  <>
                    {/* Old Token LP - Purple tones - Darker, muted, "old" feel */}
                    <div className="relative flex-1 flex flex-col items-center max-w-[200px] z-10">
                      <div className="relative w-full aspect-square">
                        {/* Darker purple glow background */}
                        <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-2xl" />
                        <Lottie
                          animationData={oldTokenAnimationData}
                          loop={true}
                          autoplay={true}
                          className="w-full h-full relative z-10"
                          style={{ 
                            filter: "drop-shadow(0 0 30px rgba(147, 51, 234, 0.6)) brightness(0.85) contrast(1.1) saturate(0.9)",
                          }}
                        />
                      </div>
                      <div className="mt-3 px-3 py-1.5 rounded-full bg-purple-600/30 border border-purple-500/50">
                        <span className="text-xs font-semibold text-purple-300">OLD TOKEN LP</span>
                      </div>
                    </div>

                    {/* Migration Animation - Curved Path with Dots - spans from center to center */}
                    <div 
                      className="absolute pointer-events-none"
                      style={{ 
                        top: '35%',
                        left: 'calc((100% - 400px - 2rem) / 2 + 100px)',
                        right: 'calc((100% - 400px - 2rem) / 2 + 100px)',
                        height: '120px',
                        transform: 'translateY(-50%)',
                        zIndex: 5,
                      }}
                    >
                      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="migrationGradient-main" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#9333ea" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.4" />
                          </linearGradient>
                          <linearGradient id="tokenGradient-main" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#14b8a6" />
                          </linearGradient>
                          <filter id="blur-main">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
                          </filter>
                          <filter id="glow-main">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        {/* Path for the line */}
                        <path
                          id="path-curve-main"
                          d="M 0 50 Q 50 20 100 50"
                          fill="none"
                          stroke="url(#migrationGradient-main)"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                        {/* Animated dots following the path - color transitions from purple to cyan */}
                        {[...Array(4)].map((_, i) => {
                          const beginTime = `${i * 0.5}s`
                          return (
                            <g key={i}>
                              {/* Blur effect layer - color transitions */}
                              <circle r="3" opacity="0.3" filter="url(#blur-main)">
                                <animate
                                  attributeName="fill"
                                  values="#9333ea;#a855f7;#22d3ee;#14b8a6"
                                  dur="2.5s"
                                  repeatCount="indefinite"
                                  begin={beginTime}
                                />
                                <animateMotion
                                  dur="2.5s"
                                  repeatCount="indefinite"
                                  begin={beginTime}
                                  calcMode="linear"
                                >
                                  <mpath href="#path-curve-main" />
                                </animateMotion>
                              </circle>
                              {/* Main circle - color transitions from purple to cyan */}
                              <circle r="3" filter="url(#glow-main)">
                                <animate
                                  attributeName="fill"
                                  values="#9333ea;#a855f7;#22d3ee;#14b8a6"
                                  dur="2.5s"
                                  repeatCount="indefinite"
                                  begin={beginTime}
                                />
                                <animateMotion
                                  dur="2.5s"
                                  repeatCount="indefinite"
                                  begin={beginTime}
                                  calcMode="linear"
                                >
                                  <mpath href="#path-curve-main" />
                                </animateMotion>
                              </circle>
                            </g>
                          )
                        })}
                      </svg>
                    </div>

                    {/* New Token LP - Cyan/Teal tones - Bright, vibrant, "new" feel */}
                    <div className="relative flex-1 flex flex-col items-center max-w-[200px] z-10">
                      <div className="relative w-full aspect-square">
                        {/* Bright cyan glow background */}
                        <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-2xl animate-pulse" />
                        <Lottie
                          animationData={newTokenAnimationData}
                          loop={true}
                          autoplay={true}
                          className="w-full h-full relative z-10"
                          style={{ 
                            filter: "drop-shadow(0 0 35px rgba(34, 211, 238, 0.7)) brightness(1.2) contrast(1.15) saturate(1.3)",
                          }}
                        />
                      </div>
                      <div className="mt-3 px-3 py-1.5 rounded-full bg-cyan-400/30 border border-cyan-400/60 shadow-lg shadow-cyan-400/20">
                        <span className="text-xs font-semibold text-cyan-300">NEW TOKEN LP</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center py-16">
                    <div className="w-24 h-24 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right: Two-column benefit cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* For Holders Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-[3px] rounded-lg z-0 pointer-events-none">
                <GlowingEffect
                  disabled={false}
                  proximity={200}
                  spread={60}
                  variant="neon"
                  glow={false}
                  blur={0}
                  borderWidth={2.5}
                  inactiveZone={0.3}
                  movementDuration={1.5}
                />
              </div>
              <Card className="glass-card p-6 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 group h-full relative">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 group-hover:from-cyan-500/30 group-hover:to-cyan-500/20 transition-colors">
                      <Users className="h-6 w-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-cyan-400">For Holders</h3>
                  </div>
                  <ul className="space-y-3">
                    {holderBenefits.map((benefit, index) => {
                      const Icon = benefit.icon
                      return (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: 10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                          viewport={{ once: true }}
                          className="flex items-start gap-2 text-slate-300"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <Icon className="h-4 w-4 text-cyan-400/70" />
                          </div>
                          <span className="text-sm leading-relaxed">{benefit.text}</span>
                        </motion.li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* For Projects Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-[3px] rounded-lg z-0 pointer-events-none">
                <GlowingEffect
                  disabled={false}
                  proximity={200}
                  spread={60}
                  variant="neon"
                  glow={false}
                  blur={0}
                  borderWidth={2.5}
                  inactiveZone={0.3}
                  movementDuration={1.5}
                />
              </div>
              <Card className="glass-card p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 group h-full relative">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 group-hover:from-purple-500/30 group-hover:to-purple-500/20 transition-colors">
                      <Building2 className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-purple-400">For Projects</h3>
                  </div>
                  <ul className="space-y-3">
                    {projectBenefits.map((benefit, index) => {
                      const Icon = benefit.icon
                      return (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: 10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                          viewport={{ once: true }}
                          className="flex items-start gap-2 text-slate-300"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <Icon className="h-4 w-4 text-purple-400/70" />
                          </div>
                          <span className="text-sm leading-relaxed">{benefit.text}</span>
                        </motion.li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/docs">
              <Button className="btn-brand inline-flex items-center gap-2 text-lg px-8 py-6 group">
                Learn How Migration Works
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/faq">
              <Button 
                variant="outline" 
                className="border-cyan-500/50 text-cyan-400 hover:border-cyan-500/80 hover:bg-cyan-500/10 inline-flex items-center gap-2 text-lg px-8 py-6 group"
              >
                <HelpCircle className="w-5 h-5" />
                FAQ
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

