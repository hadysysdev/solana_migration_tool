"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Users, Shield, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: "Security First",
      description: "Every migration is designed with security and transparency as core principles.",
    },
    {
      icon: Users,
      title: "Community Focused",
      description: "Your token holders and community are our top priority.",
    },
    {
      icon: Zap,
      title: "Efficiency",
      description: "Quick deployments without sacrificing quality or security.",
    },
    {
      icon: CheckCircle2,
      title: "Transparency",
      description: "Complete visibility into every step of the process.",
    },
  ]

  return (
    <main className="min-h-screen bg-black text-white relative">
      {/* Background effects - matches your main page style */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }} />
      </div>

      {/* Hero Section */}
      <section className="py-24 px-4 border-b border-slate-800 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent mb-6">
            About w3Swap
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-8">
            We're a team of blockchain experts dedicated to making token migration safe, simple, and secure for
            everyone.
          </p>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance mb-6 text-white">Our Mission</h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-6">
              w3Swap exists to eliminate the friction and risk in token migrations. We believe that successful
              blockchain projects deserve trusted partners who understand their communities and technical requirements.
            </p>
            <p className="text-lg text-slate-400 leading-relaxed">
              We're building a platform that prioritizes security, transparency, and efficiency. Every migration we design
              reflects our commitment to excellence and the success of your project.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black via-slate-950/50 to-black relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance mb-6 text-white">Our Values</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="h-full"
                >
                  <Card className="glass-card p-6 hover:border-cyan-500/50 transition-all duration-300 group flex gap-4 h-full">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                        <Icon className="h-6 w-6 text-cyan-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-white">{value.title}</h3>
                      <p className="text-slate-400">{value.description}</p>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance mb-6 text-white">Complete Transparency</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              We believe in radical transparency. We provide detailed migration timelines, regular updates, and comprehensive documentation
              throughout the process. Our approach ensures you have full visibility into every step of your migration.
            </p>
            <Card className="glass-card p-8">
              <p className="text-sm font-semibold text-cyan-500 mb-4">Our Commitment</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-white">Secure</div>
                  <p className="text-xs text-slate-400">Migration Process</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Transparent</div>
                  <p className="text-xs text-slate-400">Operations</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">24hrs</div>
                  <p className="text-xs text-slate-400">Support Time</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

