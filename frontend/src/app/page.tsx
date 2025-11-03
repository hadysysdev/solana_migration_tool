import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Shield, Zap, TrendingUp, Globe, Users } from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/layout/navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 mt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10" />
        <div className="container-page relative">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Secure Token Migration
              <span className="text-gradient-primary block">
                With Instant Liquidity
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-foreground-muted lg:text-xl">
              The most secure and efficient way to migrate your tokens on Solana. 
              Built-in liquidity protection ensures immediate trading capability for migrated tokens.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Button asChild size="lg" className="min-w-[200px]">
                <Link href="/migrate">
                  Start Migration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/admin">
                  Project Admin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-y">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Choose W3Swap?
            </h2>
            <p className="mt-4 text-foreground-muted">
              Built for security, designed for simplicity, optimized for immediate liquidity.
            </p>
          </div>
          
          <div className="grid-responsive">
            <Card variant="glass" className="group hover:border-primary-500/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/10 group-hover:bg-primary-500/20 transition-colors">
                    <Shield className="h-6 w-6 text-primary-400" />
                  </div>
                  <CardTitle className="text-xl">Security First</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Advanced smart contracts with built-in protection mechanisms. 
                  SOL commitment ensures project completion and protects migrators from abandoned projects.
                </CardDescription>
              </CardContent>
            </Card>

            <Card variant="glass" className="group hover:border-primary-500/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-500/10 group-hover:bg-secondary-500/20 transition-colors">
                    <Zap className="h-6 w-6 text-secondary-400" />
                  </div>
                  <CardTitle className="text-xl">Instant Liquidity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Liquidity pools are created immediately upon project activation using Meteora DLMM. 
                  Start trading your new tokens right after migration.
                </CardDescription>
              </CardContent>
            </Card>

            <Card variant="glass" className="group hover:border-primary-500/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-500/10 group-hover:bg-success-500/20 transition-colors">
                    <TrendingUp className="h-6 w-6 text-success-400" />
                  </div>
                  <CardTitle className="text-xl">Enhanced Trading</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Post-migration, old tokens are automatically sold and proceeds added to the liquidity pool, 
                  creating deeper liquidity and better trading experience.
                </CardDescription>
              </CardContent>
            </Card>

            <Card variant="glass" className="group hover:border-primary-500/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-500/10 group-hover:bg-warning-500/20 transition-colors">
                    <Globe className="h-6 w-6 text-warning-400" />
                  </div>
                  <CardTitle className="text-xl">Token Standards</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Full support for both SPL Token and Token-2022 (Token Extensions). 
                  Migrate to modern token standards with advanced features.
                </CardDescription>
              </CardContent>
            </Card>

            <Card variant="glass" className="group hover:border-primary-500/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/10 group-hover:bg-primary-500/20 transition-colors">
                    <Users className="h-6 w-6 text-primary-400" />
                  </div>
                  <CardTitle className="text-xl">Flexible Access</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Configurable allow/deny lists and special exchange ratios for different user groups. 
                  Complete control over who can participate and their migration terms.
                </CardDescription>
              </CardContent>
            </Card>

            <Card variant="glass" className="group hover:border-primary-500/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-500/10 group-hover:bg-secondary-500/20 transition-colors">
                    <Shield className="h-6 w-6 text-secondary-400" />
                  </div>
                  <CardTitle className="text-xl">LP Protection</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  LP tokens are automatically locked for 90 days to ensure long-term liquidity stability. 
                  Project admins maintain skin in the game for sustained success.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-y bg-surface/30">
        <div className="container-page">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-400">$2.5M+</div>
                <div className="text-sm text-foreground-muted mt-1">Total Value Migrated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary-400">150+</div>
                <div className="text-sm text-foreground-muted mt-1">Successful Migrations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success-400">99.9%</div>
                <div className="text-sm text-foreground-muted mt-1">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning-400">5K+</div>
                <div className="text-sm text-foreground-muted mt-1">Happy Users</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-y">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Migrate Your Tokens?
            </h2>
            <p className="mt-4 text-lg text-foreground-muted">
              Join the future of token migration with W3Swap's secure and efficient platform.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              <Button asChild size="lg" variant="gradient">
                <Link href="/migrate">
                  Browse Active Migrations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/docs">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}