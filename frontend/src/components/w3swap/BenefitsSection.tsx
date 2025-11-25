"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { GlowingEffect } from "@/components/ui/glowing-effect"

import { Shield, KeyRound, Zap, Layers, Sliders, Lock } from "lucide-react"

const benefits = [
  {
    icon: Shield,
    title: "Security First",
    description:
      "Advanced smart contracts with built-in protection mechanisms. SOL commitment ensures project completion and protects migrators from abandoned projects.",
    color: "cyan",
  },
  {
    icon: KeyRound,
    title: "Ownership Restored",
    description:
      "Projects regain full ownership of LP tokens and fee revenue from trading activity, removing third-party custodians and abandoned developer wallets.",
    color: "purple",
  },
  {
    icon: Zap,
    title: "Instant & Enhanced Liquidity",
    description:
      "Liquidity pools are created immediately upon project activation using Meteora DLMM. As migration completes, old tokens are automatically sold and proceeds added to the pool, creating deeper liquidity and a smoother trading experience.",
    color: "teal",
  },
  {
    icon: Layers,
    title: "Token Standards",
    description:
      "Full support for both SPL Token and Token-2022 (Token Extensions). Migrate to modern token standards with advanced features.",
    color: "yellow",
  },
  {
    icon: Sliders,
    title: "Flexible Access Controls",
    description:
      "Define who can migrate and on what terms. Configure allow/deny lists, ratios, or incentives for specific holder groups through a single on-chain setup.",
    color: "cyan",
  },
  {
    icon: Lock,
    title: "LP Protection",
    description:
      "LP tokens are automatically locked for 90 days to ensure long-term liquidity stability. Project admins maintain skin in the game for sustained success.",
    color: "purple",
  },
]

export default function BenefitsSection() {
  return (
    <section className="py-12 px-4 bg-gradient-to-b from-black via-slate-950/50 to-black relative">
      <div className="max-w-6xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance mb-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
            Why Choose w3Swap?
          </h2>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Built for security, designed for simplicity, optimized for immediate liquidity.
          </p>
        </div>
        {/* Benefits grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            const colorConfig = {
              cyan: {
                bg: "from-cyan-500/20 to-cyan-500/10",
                text: "text-cyan-400",
                border: "border-cyan-500/30 hover:border-cyan-500/50",
              },
              purple: {
                bg: "from-purple-500/20 to-purple-500/10",
                text: "text-purple-400",
                border: "border-purple-500/30 hover:border-purple-500/50",
              },
              teal: {
                bg: "from-teal-500/20 to-teal-500/10",
                text: "text-teal-400",
                border: "border-teal-500/30 hover:border-teal-500/50",
              },
              yellow: {
                bg: "from-yellow-500/20 to-yellow-500/10",
                text: "text-yellow-400",
                border: "border-yellow-500/30 hover:border-yellow-500/50",
              },
            }
            const colors = colorConfig[benefit.color as keyof typeof colorConfig] || colorConfig.cyan
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="h-full"
              >
                <div className="relative h-full">
                  {/* Glow effect wrapper - outside card to avoid overflow clipping */}
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
                  {/* Card with glass effect */}
                  <Card className={`glass-card p-6 border transition-all duration-300 group h-full relative ${colors.border} group/card`}>
                    <div className="relative z-10 flex flex-col gap-4 h-full">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br ${colors.bg} group-hover:opacity-80 transition-opacity flex-shrink-0`}>
                          <Icon className={`h-6 w-6 ${colors.text}`} />
                        </div>
                        <h3 className="text-xl font-semibold text-white">{benefit.title}</h3>
                      </div>
                      <p className="text-base leading-relaxed text-slate-400 flex-grow">{benefit.description}</p>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

