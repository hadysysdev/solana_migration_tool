'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FloatingNav } from '@/components/w3swap/FloatingNav';
import {
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  Users,
  Lock,
  CheckCircle2,
  FileText,
  ArrowLeftRight,
  Coins,
  AlertCircle,
  Rocket
} from 'lucide-react';
import Link from 'next/link';

const navItems = [
  {
    name: 'Overview',
    link: '#overview',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    name: 'How It Works',
    link: '#how-it-works',
    icon: <ArrowRight className="h-4 w-4" />,
  },
  {
    name: 'For Users',
    link: '#for-users',
    icon: <Users className="h-4 w-4" />,
  },
  {
    name: 'For Admins',
    link: '#for-admins',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    name: 'Security',
    link: '#security',
    icon: <Lock className="h-4 w-4" />,
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black text-white relative">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }} />
      </div>

      {/* Floating Navigation Bar */}
      <FloatingNav navItems={navItems} />

      <div className="max-w-5xl mx-auto py-24 px-4 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent mb-6">
            Documentation
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Learn how w3Swap enables secure token migration with instant liquidity on Solana
          </p>
        </motion.div>

        {/* Overview Section */}
        <section id="overview" className="mb-16 scroll-mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Overview</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              w3Swap is a secure token migration platform built on Solana that enables projects to migrate 
              their tokens to new versions while providing instant liquidity through automated liquidity pool 
              creation. Our platform ensures both security and immediate trading capability for migrated tokens.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card hover:border-cyan-500/50 transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                      <Shield className="h-6 w-6 text-cyan-400" />
                    </div>
                    <CardTitle className="text-xl text-white">Security First</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-slate-400">
                    Smart contracts enforce migration rules. SOL commitment from project admins ensures completion.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card hover:border-purple-500/50 transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-teal-500/20">
                      <Zap className="h-6 w-6 text-purple-400" />
                    </div>
                    <CardTitle className="text-xl text-white">Instant Liquidity</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-slate-400">
                    Meteora DLMM pools are created automatically upon activation, enabling immediate trading.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card hover:border-teal-500/50 transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                      <TrendingUp className="h-6 w-6 text-teal-400" />
                    </div>
                    <CardTitle className="text-xl text-white">Enhanced Trading</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-slate-400">
                    Post-migration, old tokens are sold and proceeds added to LP, creating deeper liquidity.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="mb-16 scroll-mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-8 text-white"
          >
            How It Works
          </motion.h2>
          
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: 'Project Creation',
                description: 'Project admins create a migration project by specifying:',
                items: [
                  'Old and new token mints',
                  'Exchange ratio between old and new tokens',
                  'Migration period (start and end times)',
                  'Initial liquidity parameters for the LP',
                  'SOL commitment amount (ensures project completion)',
                ],
              },
              {
                step: 2,
                title: 'Activation & LP Creation',
                description: 'When the project admin activates the migration:',
                items: [
                  'SOL commitment is locked in the smart contract',
                  'New token is created (SPL Token or Token-2022)',
                  'Meteora DLMM liquidity pool is automatically created',
                  'Initial liquidity is provided based on configured parameters',
                  'Migration becomes active and available to token holders',
                ],
              },
              {
                step: 3,
                title: 'Token Migration',
                description: 'Token holders can migrate their tokens:',
                items: [
                  'Connect wallet and browse active migration projects',
                  'Select a project and enter the amount of old tokens to migrate',
                  'Preview the exchange rate and amount of new tokens to receive',
                  'Confirm and execute the migration transaction',
                  'Receive new tokens immediately in your wallet',
                ],
              },
              {
                step: 4,
                title: 'Settlement & LP Enhancement',
                description: 'When the migration period ends:',
                items: [
                  'Old tokens collected during migration are automatically sold',
                  'Proceeds from the sale are added to the liquidity pool',
                  'This creates deeper liquidity for the new token',
                  'LP tokens are locked for 90 days to ensure long-term stability',
                  'SOL commitment is released (or forfeited if migration failed)',
                ],
              },
            ].map((stepData, index) => (
              <motion.div
                key={stepData.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card hover:border-cyan-500/50 transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 font-bold">
                        {stepData.step}
                      </div>
                      {stepData.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-slate-400">
                      {stepData.description}
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-400 ml-4">
                      {stepData.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* For Users Section */}
        <section id="for-users" className="mb-16 scroll-mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-8 text-white"
          >
            For Token Holders
          </motion.h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="glass-card hover:border-cyan-500/50 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="h-5 w-5 text-cyan-400" />
                    Getting Started
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-400">
                    To migrate your tokens:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-2">
                    <li>Connect your Solana wallet (Phantom, Solflare, etc.)</li>
                    <li>Navigate to the <Link href="/migrate" className="text-cyan-400 hover:underline">Migrate</Link> page</li>
                    <li>Browse active migration projects</li>
                    <li>Select a project and review the exchange rate</li>
                    <li>Enter the amount of old tokens to migrate</li>
                    <li>Confirm the transaction in your wallet</li>
                    <li>Receive your new tokens immediately</li>
                  </ol>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card hover:border-purple-500/50 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Shield className="h-5 w-5 text-purple-400" />
                    Safety & Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-400">
                    Your migration is protected by:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                    <li><strong className="text-white">Smart Contract Security:</strong> All migrations execute on-chain via verified contracts</li>
                    <li><strong className="text-white">SOL Commitment:</strong> Project admins must lock SOL, ensuring project completion</li>
                    <li><strong className="text-white">Instant Liquidity:</strong> LP is created immediately, so you can trade right away</li>
                    <li><strong className="text-white">Transparent Exchange Rates:</strong> Rates are set upfront and visible before migration</li>
                    <li><strong className="text-white">No Hidden Fees:</strong> All fees are disclosed before you confirm</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* For Admins Section */}
        <section id="for-admins" className="mb-16 scroll-mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-8 text-white"
          >
            For Project Admins
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            <Alert className="glass-card border-yellow-500/30 bg-yellow-500/5">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="ml-2 text-slate-300">
                Admin access requires your wallet to be set as a platform superAdmin or project admin in the smart contract.
              </AlertDescription>
            </Alert>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">Creating a Migration Project</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-white">
                      <Coins className="h-4 w-4 text-cyan-400" />
                      Step 1: Create New Token (Optional)
                    </h4>
                    <p className="text-slate-400 text-sm ml-6">
                      If you haven't created your new token yet, you can use the Token Creation tool to mint a new 
                      SPL Token or Token-2022 with custom extensions.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-white">
                      <FileText className="h-4 w-4 text-purple-400" />
                      Step 2: Project Configuration
                    </h4>
                    <p className="text-slate-400 text-sm ml-6 mb-2">
                      Fill out the project creation form with:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm ml-10">
                      <li>Old token mint address</li>
                      <li>New token mint address</li>
                      <li>Exchange ratio (e.g., 1:1, 100:1, etc.)</li>
                      <li>Migration start and end times</li>
                      <li>SOL commitment amount</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-white">
                      <Rocket className="h-4 w-4 text-teal-400" />
                      Step 3: Fund & Activate
                    </h4>
                    <p className="text-slate-400 text-sm ml-6">
                      Fund the project with the required SOL commitment and initial liquidity. Once funded, 
                      activate the project to create the LP and start accepting migrations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">LP Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-400">
                    When activating your project, you'll configure the Meteora DLMM liquidity pool:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-slate-400 ml-4">
                    <li><strong className="text-white">Initial Price:</strong> Starting price for the new token in SOL</li>
                    <li><strong className="text-white">Liquidity Amount:</strong> Initial SOL and new token amounts</li>
                    <li><strong className="text-white">Trading Fees:</strong> Fee percentage for swaps (collected by LP)</li>
                    <li><strong className="text-white">Price Range:</strong> Min/max price bounds for the pool</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">Project Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-400 mb-3">
                    Once your project is active, you can:
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Monitor Progress</p>
                        <p className="text-sm text-slate-400">Track migrations, volume, and user count</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-cyan-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Manage Timeline</p>
                        <p className="text-sm text-slate-400">View time remaining and migration status</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lock className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">LP Lock Period</p>
                        <p className="text-sm text-slate-400">90-day lock ensures long-term liquidity</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Automatic Settlement</p>
                        <p className="text-sm text-slate-400">Old tokens sold and proceeds added to LP</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="mb-16 scroll-mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-8 text-white"
          >
            Security & Safety
          </motion.h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: Shield,
                title: 'Smart Contract Security',
                items: [
                  'All migrations execute on-chain via verified Solana programs',
                  'Immutable exchange rates set at project creation',
                  'No single point of failure - decentralized execution',
                ],
                color: 'cyan',
              },
              {
                icon: Lock,
                title: 'SOL Commitment Protection',
                items: [
                  'Project admins must lock SOL as commitment',
                  'SOL is only released after successful migration completion',
                  'Protects users from abandoned or incomplete projects',
                ],
                color: 'purple',
              },
              {
                icon: Zap,
                title: 'Instant Liquidity Guarantee',
                items: [
                  'LP created automatically upon activation',
                  'No waiting period - trade immediately after migration',
                  'Enhanced liquidity after settlement',
                ],
                color: 'teal',
              },
              {
                icon: ArrowLeftRight,
                title: 'Transparent Process',
                items: [
                  'All parameters visible before you migrate',
                  'On-chain transaction history',
                  'Real-time migration statistics',
                ],
                color: 'cyan',
              },
            ].map((securityItem, index) => {
              const Icon = securityItem.icon;
              const colorClasses = {
                cyan: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/10',
                purple: 'border-purple-500/20 text-purple-400 bg-purple-500/10',
                teal: 'border-teal-500/20 text-teal-400 bg-teal-500/10',
              };
              
              return (
                <motion.div
                  key={securityItem.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`glass-card ${colorClasses[securityItem.color as keyof typeof colorClasses]}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Icon className={`h-5 w-5 ${securityItem.color === 'cyan' ? 'text-cyan-400' : securityItem.color === 'purple' ? 'text-purple-400' : 'text-teal-400'}`} />
                        {securityItem.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-slate-400">
                        {securityItem.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className={`h-4 w-4 ${securityItem.color === 'cyan' ? 'text-cyan-400' : securityItem.color === 'purple' ? 'text-purple-400' : 'text-teal-400'} mt-0.5 flex-shrink-0`} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Token Standards Section */}
        <section className="mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-8 text-white"
          >
            Supported Token Standards
          </motion.h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">SPL Token (Legacy)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 mb-3">
                    The standard Solana Program Library token. Supports basic token functionality including transfers, 
                    minting, and burning.
                  </p>
                  <Badge className="bg-slate-900/50 text-slate-300 border-slate-700">Standard</Badge>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">Token-2022 (Token Extensions)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 mb-3">
                    The next-generation token standard with advanced features including transfer hooks, metadata 
                    extensions, interest-bearing tokens, and more.
                  </p>
                  <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-cyan-500/30">Enhanced</Badge>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-8 text-white"
          >
            Frequently Asked Questions
          </motion.h2>
          
          <div className="space-y-4">
            {[
              {
                question: 'How long does a migration take?',
                answer: 'The migration transaction executes instantly on Solana. Once confirmed, your new tokens appear in your wallet immediately. The migration period (set by project admins) typically ranges from a few days to several weeks.',
              },
              {
                question: 'What happens to my old tokens?',
                answer: 'Old tokens are collected during the migration process. When the migration period ends, these old tokens are automatically sold, and the proceeds are added to the liquidity pool for the new token, creating deeper liquidity.',
              },
              {
                question: 'Can I trade my new tokens immediately?',
                answer: 'Yes! The Meteora DLMM liquidity pool is created automatically when the project is activated, so you can trade your new tokens immediately after migration. No waiting period required.',
              },
              {
                question: 'What if I miss the migration window?',
                answer: 'Once the migration period ends, you won\'t be able to migrate through the platform. However, project admins may provide alternative migration methods. Check with the project team for details.',
              },
              {
                question: 'Are there any fees?',
                answer: 'Standard Solana transaction fees apply (typically ~0.000005 SOL). Project admins may configure platform fees, which are disclosed before you confirm the migration. All fees are visible in the transaction preview.',
              },
            ].map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="glass-card bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
            <CardContent className="text-center py-12">
              <h2 className="text-3xl font-bold mb-4 text-white">Ready to Get Started?</h2>
              <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
                Whether you're a token holder looking to migrate or a project admin creating a migration, 
                w3Swap makes the process secure and straightforward.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg" className="btn-brand">
                  <Link href="/migrate">
                    Browse Migrations
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-slate-700 hover:border-cyan-500">
                  <Link href="/admin">
                    Create Project
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
