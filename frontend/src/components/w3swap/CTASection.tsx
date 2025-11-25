"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Users, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function CTASection() {
  return (
    <section className="py-12 px-4 relative overflow-hidden bg-black">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-teal-500/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-6xl mx-auto"
      >
        <div className="grid md:grid-cols-2 gap-6">
          {/* Token Holder CTA */}
          <Card className="glass-card p-8 hover:border-cyan-500/50 transition-all duration-300 group">
          <CardContent className="p-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-cyan-500/20 transition-colors">
                  <Users className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Token Holder</h3>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Migrate Your Tokens</h2>
              <p className="text-slate-400 mb-6">
                Ready to migrate your tokens? Connect your wallet and start the migration process.
              </p>
              <Link href="/migrate">
                <Button className="btn-brand inline-flex items-center gap-2 group/btn w-full">
                  Start Migration
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Project Admin CTA */}
          <Card className="glass-card p-8 hover:border-purple-500/50 transition-all duration-300 group">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-purple-500/20 transition-colors">
                  <Settings className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Project Admin</h3>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Start a New Migration</h2>
              <p className="text-slate-400 mb-6">
                Launch your token migration project with w3Swap. Create and manage your migration today.
              </p>
              <Link href="/admin">
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:border-purple-500/80 hover:bg-purple-500/10 inline-flex items-center gap-2 group/btn w-full">
                  Create Migration
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
          </CardContent>
        </Card>
        </div>
      </motion.div>
    </section>
  )
}

