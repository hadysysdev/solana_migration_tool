"use client"

import { useState, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type FAQItem = {
  id: string
  question: string
  answer: ReactNode
}

const overviewFaq: FAQItem[] = [
  {
    id: "overview-what-is-w3swap",
    question: "What is w3Swap?",
    answer:
      "w3Swap is a token migration protocol built for Solana projects that want to relaunch their token with clean ownership of liquidity, modern token standards, and a fresh on-chain setup. It gives both projects and holders a structured way to move from an old token to a new one without ad‑hoc scripts or manual airdrops.",
  },
  {
    id: "overview-who-is-it-for",
    question: "Who is w3Swap for?",
    answer: (
      <div className="space-y-3">
        <p>
          w3Swap is designed for teams and communities that already have an existing token on Solana and want a second
          chapter under better conditions.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Projects that launched quickly and now want cleaner tokenomics and clearer ownership of LP</li>
          <li>Communities that need to move away from abandoned contracts or stuck liquidity</li>
          <li>Teams upgrading to Token‑2022 or modernizing their token standard</li>
        </ul>
      </div>
    ),
  },
  {
    id: "overview-how-long",
    question: "How long does a w3Swap migration take?",
    answer:
      "A migration has a clearly defined on‑chain window (configured by the project) plus a short settlement and lockup period. The active window is typically days to a few weeks, while full settlement and LP lockup are handled automatically according to the parameters the project chooses when it sets up the migration.",
  },
]

const holderFaq: FAQItem[] = [
  {
    id: "holder-how-to-migrate",
    question: "I'm a token holder. How do I migrate on w3Swap?",
    answer: (
      <div className="space-y-3">
        <p>Migration for holders is a short, on‑chain flow you complete from your own wallet:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to the project's migration page during the active window and connect your Solana wallet.</li>
          <li>Review your eligibility and see how many old tokens you can migrate and at what ratio.</li>
          <li>Enter the amount of old tokens you want to migrate and confirm the transaction in your wallet.</li>
          <li>Your old tokens move into the migration vault and you receive new tokens based on the configured ratio.</li>
          <li>You can repeat the flow while the migration window is open, as long as you remain eligible.</li>
        </ol>
      </div>
    ),
  },
  {
    id: "holder-what-happens-to-old-tokens",
    question: "What happens to my old tokens after I migrate?",
    answer:
      "Your old tokens are held in a secure vault until settlement. After the migration window closes, those tokens are automatically sold or processed according to the project's configuration, and the value is used to deepen liquidity in the new token's LP. You continue holding the new token you received during migration.",
  },
  {
    id: "holder-miss-window",
    question: "What if I miss the migration window?",
    answer:
      "Once the migration window closes, you can no longer use w3Swap to exchange old tokens for the new token. Projects can optionally choose to allocate a portion of un‑migrated supply for future rewards or separate airdrops, but that is up to each team and is not guaranteed by the protocol.",
  },
  {
    id: "holder-safety",
    question: "Is it safe to connect my wallet and migrate?",
    answer:
      "w3Swap uses audited, non‑custodial contracts where you always interact directly from your own wallet. The migration page clearly shows which token you are migrating from and to, the ratio, and the active window so you can verify details before you sign. You never hand over your private keys or seed phrase to use w3Swap.",
  },
]

const adminFaq: FAQItem[] = [
  {
    id: "admin-why-use-w3swap",
    question: "Why would a project use w3Swap instead of launching a new token manually?",
    answer:
      "w3Swap gives you a structured on‑chain migration: holders get a clear path to upgrade, and you regain control of LP and token supply without bespoke scripts or risky airdrops. The protocol handles vaults, eligibility lists, migration windows, settlement, and LP funding so you can focus on messaging and community instead of raw infrastructure.",
  },
  {
    id: "admin-decisions",
    question: "What decisions do project admins need to make before launching a migration?",
    answer: (
      <div className="space-y-3">
        <p>Before you launch, you'll configure a few key parameters that define how your migration works:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Migration timing: when the window opens and how long it should stay active.</li>
          <li>
            Eligibility rules: who can migrate and on what terms using allow lists, deny lists, or ratio lists for
            specific wallets.
          </li>
          <li>Exchange ratio: how many new tokens holders receive for each old token migrated.</li>
          <li>LP commitment: how much SOL or value you will commit to the new liquidity pool.</li>
          <li>
            Un‑migrated tokens and recovered value: how any remaining supply or value is allocated (treasury, team,
            incentives, or other programs).
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "admin-unmigrated",
    question: "What happens to un‑migrated tokens and recovered value?",
    answer:
      "At the end of a migration, un‑migrated supply and any recovered value can be allocated to the team, treasury, or community programs according to the plan you configure. w3Swap enforces those choices on‑chain so holders can see how the un‑migrated portion is treated instead of it being decided informally later.",
  },
  {
    id: "admin-lp-ownership",
    question: "Who owns the new liquidity pool (LP) and are there lockups?",
    answer:
      "w3Swap is designed so projects retain ownership of their new LP position rather than leaving it stranded in third‑party wallets. When settlement completes, the LP is created or topped up using the configured commitment and recovered value, and LP tokens are subject to a protocol‑level lockup period so liquidity cannot be rugged immediately after launch.",
  },
  {
    id: "admin-costs",
    question: "What does it cost to run a migration on w3Swap?",
    answer:
      "Running a migration involves an on‑chain setup cost, a minimum LP commitment, and a clearly disclosed protocol fee that is taken from the value used to form the new LP. Exact numbers can vary by network conditions and configuration, but all fees and commitments are shown in the setup flow before you activate a migration.",
  },
]

const mechanicsFaq: FAQItem[] = [
  {
    id: "mechanics-how-it-works",
    question: "How does a w3Swap migration work from start to finish?",
    answer: (
      <div className="space-y-4">
        {/* Inline phase flow */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-300">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Setup
          </span>
          <span className="text-slate-600">→</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Active Window
          </span>
          <span className="text-slate-600">→</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Settlement
          </span>
          <span className="text-slate-600">→</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Lockup
          </span>
        </div>
        <p>A migration follows the same four phases you see on the main w3Swap timeline:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            <span className="font-medium">Setup:</span> The project configures the new token, eligibility lists, window
            timing, exchange ratio, and LP commitment.
          </li>
          <li>
            <span className="font-medium">Active window:</span> Holders deposit old tokens into the migration vault and
            receive new tokens based on the configured ratio while the window is open.
          </li>
          <li>
            <span className="font-medium">Settlement:</span> After the window closes, settlement jobs process remaining
            balances—old tokens are sold or handled per configuration, and proceeds are used to deepen the new LP.
          </li>
          <li>
            <span className="font-medium">Lockup & post‑migration:</span> LP tokens are locked for a defined period, and
            the project continues with the new token and refreshed liquidity.
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: "mechanics-eligibility",
    question: "How are eligibility and ratios enforced?",
    answer:
      "w3Swap allows projects to upload structured lists that define who can migrate and on what terms—such as allow lists, deny lists, or ratio lists that change the exchange rate for specific wallets. These rules are enforced by the migration contracts so holders see their eligibility and ratio directly on‑chain instead of relying on manual spreadsheets.",
  },
  {
    id: "mechanics-trading",
    question: "Can holders trade during and after the migration?",
    answer:
      "Yes. During the migration window, trading typically continues, but liquidity may be thinner as value moves toward the new token. After settlement and LP funding complete, holders can trade the new token against a refreshed liquidity pool that reflects the final migration outcomes.",
  },
]

export default function FAQPage() {
  const [openIds, setOpenIds] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    )
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-black text-white relative py-16 md:py-24 px-4 sm:px-6 lg:px-8"
    >
      {/* Background effects - aligned with main landing page */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none -z-20"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none -z-30"
        aria-hidden="true"
      />
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1000ms" }}
        />
      </div>

      <div className="max-w-5xl lg:max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
            Everything you need to know about token migrations with w3Swap.
          </p>
        </motion.div>

        {/* Overview section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">Overview</h2>
          <p className="text-slate-400 mb-6 max-w-3xl">
            Start here for a high-level overview of what w3Swap is and how migrations fit into your project's next
            chapter.
          </p>
          <div className="space-y-4">
            {overviewFaq.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="glass-card p-6 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => toggleItem(item.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold pr-4 text-slate-100">
                        {item.question}
                      </h3>
                      <ChevronDown
                        className={`w-5 h-5 text-cyan-500 flex-shrink-0 transition-transform ${
                          openIds.includes(item.id) ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    <AnimatePresence>
                      {openIds.includes(item.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t border-slate-700"
                        >
                          <div className="text-slate-400 leading-relaxed text-sm md:text-base space-y-3">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Token holder section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-cyan-300 mb-4">For Token Holders</h2>
          <p className="text-slate-400 mb-6 max-w-3xl">
            Answers to the most common questions from holders who want to understand what happens to their tokens and
            how to participate safely.
          </p>
          <div className="space-y-4">
            {holderFaq.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="glass-card p-6 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => toggleItem(item.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold pr-4 text-slate-100">
                        {item.question}
                      </h3>
                      <ChevronDown
                        className={`w-5 h-5 text-cyan-500 flex-shrink-0 transition-transform ${
                          openIds.includes(item.id) ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    <AnimatePresence>
                      {openIds.includes(item.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t border-slate-700"
                        >
                          <div className="text-slate-400 leading-relaxed text-sm md:text-base space-y-3">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Project admin section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-purple-300 mb-4">For Project Admins</h2>
          <p className="text-slate-400 mb-6 max-w-3xl">
            Guidance for teams planning a migration: what decisions you'll make, how LP and un‑migrated tokens are
            handled, and what to expect from the process.
          </p>
          <div className="space-y-4">
            {adminFaq.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="glass-card p-6 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => toggleItem(item.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold pr-4 text-slate-100">
                        {item.question}
                      </h3>
                      <ChevronDown
                        className={`w-5 h-5 text-cyan-500 flex-shrink-0 transition-transform ${
                          openIds.includes(item.id) ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    <AnimatePresence>
                      {openIds.includes(item.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t border-slate-700"
                        >
                          <div className="text-slate-400 leading-relaxed text-sm md:text-base space-y-3">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Process & mechanics section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">Process & Mechanics</h2>
          <p className="text-slate-400 mb-6 max-w-3xl">
            A high-level view of how w3Swap migrations are structured end-to-end, aligned with the phases shown on the
            main w3Swap page.
          </p>
          <div className="space-y-4">
            {mechanicsFaq.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="glass-card p-6 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => toggleItem(item.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold pr-4 text-slate-100">
                        {item.question}
                      </h3>
                      <ChevronDown
                        className={`w-5 h-5 text-cyan-500 flex-shrink-0 transition-transform ${
                          openIds.includes(item.id) ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    <AnimatePresence>
                      {openIds.includes(item.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t border-slate-700"
                        >
                          <div className="text-slate-400 leading-relaxed text-sm md:text-base space-y-3">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Card className="glass-card p-8">
            <CardContent className="p-0">
              <p className="text-slate-400 mb-4">
                Still have questions or want help planning a migration tailored to your project?
              </p>
              <Link href="/contact">
                <Button className="btn-brand">
                  Contact Our Team
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resources */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 grid gap-4 md:grid-cols-2"
        >
          <Card className="glass-card p-6">
            <CardContent className="p-0">
              <h3 className="text-base font-semibold mb-2 text-white">Explore the migration timeline</h3>
              <p className="text-sm text-slate-400 mb-3">
                See how the setup, active window, settlement, and lockup phases fit together on the main w3Swap page.
              </p>
              <Link href="/">
                <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:border-cyan-500/80">
                  View Overview
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="glass-card p-6">
            <CardContent className="p-0">
              <h3 className="text-base font-semibold mb-2 text-white">Ready to plan your migration?</h3>
              <p className="text-sm text-slate-400 mb-3">
                Share your project details and we'll follow up with concrete next steps and timing recommendations.
              </p>
              <Link href="/contact">
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:border-purple-500/80">
                  Plan Your Migration
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}

