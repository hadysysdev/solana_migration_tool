'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Navigation } from '@/components/layout/navigation';
import { FloatingNav } from '@/components/ui/floating-navbar';
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
    <div className="min-h-screen">
      <Navigation />
      
      {/* Floating Navigation Bar */}
      <FloatingNav navItems={navItems} />

      <div className="container-page py-12 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 sm:text-5xl lg:text-6xl">
            Documentation
          </h1>
          <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
            Learn how w3Swap enables secure token migration with instant liquidity on Solana
          </p>
        </div>

        {/* Overview Section */}
        <section id="overview" className="mb-16 scroll-mt-20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">Overview</h2>
            <p className="text-lg text-foreground-muted leading-relaxed">
              w3Swap is a secure token migration platform built on Solana that enables projects to migrate 
              their tokens to new versions while providing instant liquidity through automated liquidity pool 
              creation. Our platform ensures both security and immediate trading capability for migrated tokens.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/10">
                    <Shield className="h-6 w-6 text-primary-400" />
                  </div>
                  <CardTitle className="text-xl">Security First</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Smart contracts enforce migration rules. SOL commitment from project admins ensures completion.
                </CardDescription>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-500/10">
                    <Zap className="h-6 w-6 text-secondary-400" />
                  </div>
                  <CardTitle className="text-xl">Instant Liquidity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Meteora DLMM pools are created automatically upon activation, enabling immediate trading.
                </CardDescription>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-500/10">
                    <TrendingUp className="h-6 w-6 text-success-400" />
                  </div>
                  <CardTitle className="text-xl">Enhanced Trading</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Post-migration, old tokens are sold and proceeds added to LP, creating deeper liquidity.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="mb-16 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-8">How It Works</h2>
          
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20 text-primary-400 font-bold">
                    1
                  </div>
                  Project Creation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground-muted">
                  Project admins create a migration project by specifying:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground-muted ml-4">
                  <li>Old and new token mints</li>
                  <li>Exchange ratio between old and new tokens</li>
                  <li>Migration period (start and end times)</li>
                  <li>Initial liquidity parameters for the LP</li>
                  <li>SOL commitment amount (ensures project completion)</li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20 text-primary-400 font-bold">
                    2
                  </div>
                  Activation & LP Creation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground-muted">
                  When the project admin activates the migration:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground-muted ml-4">
                  <li>SOL commitment is locked in the smart contract</li>
                  <li>New token is created (SPL Token or Token-2022)</li>
                  <li>Meteora DLMM liquidity pool is automatically created</li>
                  <li>Initial liquidity is provided based on configured parameters</li>
                  <li>Migration becomes active and available to token holders</li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20 text-primary-400 font-bold">
                    3
                  </div>
                  Token Migration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground-muted">
                  Token holders can migrate their tokens:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground-muted ml-4">
                  <li>Connect wallet and browse active migration projects</li>
                  <li>Select a project and enter the amount of old tokens to migrate</li>
                  <li>Preview the exchange rate and amount of new tokens to receive</li>
                  <li>Confirm and execute the migration transaction</li>
                  <li>Receive new tokens immediately in your wallet</li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20 text-primary-400 font-bold">
                    4
                  </div>
                  Settlement & LP Enhancement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground-muted">
                  When the migration period ends:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground-muted ml-4">
                  <li>Old tokens collected during migration are automatically sold</li>
                  <li>Proceeds from the sale are added to the liquidity pool</li>
                  <li>This creates deeper liquidity for the new token</li>
                  <li>LP tokens are locked for 90 days to ensure long-term stability</li>
                  <li>SOL commitment is released (or forfeited if migration failed)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Users Section */}
        <section id="for-users" className="mb-16 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-8">For Token Holders</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-400" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground-muted">
                  To migrate your tokens:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-foreground-muted ml-2">
                  <li>Connect your Solana wallet (Phantom, Solflare, etc.)</li>
                  <li>Navigate to the <Link href="/migrate" className="text-primary-400 hover:underline">Migrate</Link> page</li>
                  <li>Browse active migration projects</li>
                  <li>Select a project and review the exchange rate</li>
                  <li>Enter the amount of old tokens to migrate</li>
                  <li>Confirm the transaction in your wallet</li>
                  <li>Receive your new tokens immediately</li>
                </ol>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary-400" />
                  Safety & Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground-muted">
                  Your migration is protected by:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground-muted ml-2">
                  <li><strong>Smart Contract Security:</strong> All migrations execute on-chain via verified contracts</li>
                  <li><strong>SOL Commitment:</strong> Project admins must lock SOL, ensuring project completion</li>
                  <li><strong>Instant Liquidity:</strong> LP is created immediately, so you can trade right away</li>
                  <li><strong>Transparent Exchange Rates:</strong> Rates are set upfront and visible before migration</li>
                  <li><strong>No Hidden Fees:</strong> All fees are disclosed before you confirm</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Admins Section */}
        <section id="for-admins" className="mb-16 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-8">For Project Admins</h2>
          
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Admin access requires your wallet to be set as a platform superAdmin or project admin in the smart contract.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Creating a Migration Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary-400" />
                    Step 1: Create New Token (Optional)
                  </h4>
                  <p className="text-foreground-muted text-sm ml-6">
                    If you haven't created your new token yet, you can use the Token Creation tool to mint a new 
                    SPL Token or Token-2022 with custom extensions.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary-400" />
                    Step 2: Project Configuration
                  </h4>
                  <p className="text-foreground-muted text-sm ml-6 mb-2">
                    Fill out the project creation form with:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-foreground-muted text-sm ml-10">
                    <li>Old token mint address</li>
                    <li>New token mint address</li>
                    <li>Exchange ratio (e.g., 1:1, 100:1, etc.)</li>
                    <li>Migration start and end times</li>
                    <li>SOL commitment amount</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary-400" />
                    Step 3: Fund & Activate
                  </h4>
                  <p className="text-foreground-muted text-sm ml-6">
                    Fund the project with the required SOL commitment and initial liquidity. Once funded, 
                    activate the project to create the LP and start accepting migrations.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>LP Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground-muted">
                  When activating your project, you'll configure the Meteora DLMM liquidity pool:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground-muted ml-4">
                  <li><strong>Initial Price:</strong> Starting price for the new token in SOL</li>
                  <li><strong>Liquidity Amount:</strong> Initial SOL and new token amounts</li>
                  <li><strong>Trading Fees:</strong> Fee percentage for swaps (collected by LP)</li>
                  <li><strong>Price Range:</strong> Min/max price bounds for the pool</li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground-muted mb-3">
                  Once your project is active, you can:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Monitor Progress</p>
                      <p className="text-sm text-foreground-muted">Track migrations, volume, and user count</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-primary-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Manage Timeline</p>
                      <p className="text-sm text-foreground-muted">View time remaining and migration status</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="h-5 w-5 text-warning-400 mt-0.5" />
                    <div>
                      <p className="font-medium">LP Lock Period</p>
                      <p className="text-sm text-foreground-muted">90-day lock ensures long-term liquidity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-success-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Automatic Settlement</p>
                      <p className="text-sm text-foreground-muted">Old tokens sold and proceeds added to LP</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="mb-16 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-8">Security & Safety</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card variant="glass" className="border-primary-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary-400" />
                  Smart Contract Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>All migrations execute on-chain via verified Solana programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>Immutable exchange rates set at project creation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>No single point of failure - decentralized execution</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="glass" className="border-primary-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary-400" />
                  SOL Commitment Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>Project admins must lock SOL as commitment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>SOL is only released after successful migration completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>Protects users from abandoned or incomplete projects</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="glass" className="border-primary-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary-400" />
                  Instant Liquidity Guarantee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>LP created automatically upon activation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>No waiting period - trade immediately after migration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>Enhanced liquidity after settlement</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="glass" className="border-primary-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-primary-400" />
                  Transparent Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>All parameters visible before you migrate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>On-chain transaction history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 mt-0.5 flex-shrink-0" />
                    <span>Real-time migration statistics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Token Standards Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Supported Token Standards</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>SPL Token (Legacy)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted mb-3">
                  The standard Solana Program Library token. Supports basic token functionality including transfers, 
                  minting, and burning.
                </p>
                <Badge variant="outline">Standard</Badge>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Token-2022 (Token Extensions)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted mb-3">
                  The next-generation token standard with advanced features including transfer hooks, metadata 
                  extensions, interest-bearing tokens, and more.
                </p>
                <Badge variant="primary">Enhanced</Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">How long does a migration take?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted">
                  The migration transaction executes instantly on Solana. Once confirmed, your new tokens appear 
                  in your wallet immediately. The migration period (set by project admins) typically ranges from 
                  a few days to several weeks.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">What happens to my old tokens?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted">
                  Old tokens are collected during the migration process. When the migration period ends, these old 
                  tokens are automatically sold, and the proceeds are added to the liquidity pool for the new token, 
                  creating deeper liquidity.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">Can I trade my new tokens immediately?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted">
                  Yes! The Meteora DLMM liquidity pool is created automatically when the project is activated, 
                  so you can trade your new tokens immediately after migration. No waiting period required.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">What if I miss the migration window?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted">
                  Once the migration period ends, you won't be able to migrate through the platform. However, 
                  project admins may provide alternative migration methods. Check with the project team for details.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">Are there any fees?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted">
                  Standard Solana transaction fees apply (typically ~0.000005 SOL). Project admins may configure 
                  platform fees, which are disclosed before you confirm the migration. All fees are visible 
                  in the transaction preview.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-foreground-muted mb-6 max-w-2xl mx-auto">
              Whether you're a token holder looking to migrate or a project admin creating a migration, 
              w3Swap makes the process secure and straightforward.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" variant="gradient">
                <Link href="/migrate">
                  Browse Migrations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/admin">
                  Create Project
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

