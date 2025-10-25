'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search,
  Info,
  ArrowRight,
  Rocket,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useProjects } from '@/lib/api';

export default function MigratePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const { data: projects, isLoading, error } = useProjects();

  // Filter only active projects for public migration
  const activeProjects = (projects || []).filter(project => project.status === 'Active');
  
  const filteredProjects = activeProjects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.oldTokenMint.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.newTokenMint.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Simple top nav */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container-page h-12 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold">← Home</Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/migrate" className="text-foreground-muted hover:text-foreground">Migrate</Link>
            <Link href="/admin" className="text-foreground-muted hover:text-foreground">Admin</Link>
          </div>
        </div>
      </nav>
      <div className="container-page py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Token Migration Portal</h1>
        <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
          Safely migrate your tokens to new versions with instant liquidity and guaranteed protection
        </p>
      </div>

      {/* Info Banner */}
      <Alert className="mb-8">
        <Shield className="h-4 w-4" />
        <AlertDescription className="ml-2">
          All migrations are protected by smart contracts. LP tokens are automatically created upon activation,
          ensuring immediate trading capability for your new tokens.
        </AlertDescription>
      </Alert>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
              <Input
                type="search"
                placeholder="Search by project name or token symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-foreground-muted">
              {isLoading ? 'Loading...' : `${filteredProjects.length} active migration${filteredProjects.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-foreground-muted">Loading migration projects...</p>
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-danger-400 mb-4">Error loading migration projects</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {filteredProjects.map((project) => {
            const now = Date.now() / 1000;
            const isActive = now >= project.startTime && now <= project.endTime;
            const timeRemaining = project.endTime - now;
            const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60));
            
            return (
              <Card 
                key={project.id.toString()} 
                className="relative overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="success">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                </div>

                <CardHeader>
                  <CardTitle className="pr-20">
                    Project #{project.id.toString().slice(-8)}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    Migration from {project.oldTokenMint.toString().slice(0, 8)}... to {project.newTokenMint.toString().slice(0, 8)}...
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Token Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-muted">Exchange Rate:</span>
                      <span className="font-semibold text-primary-400">
                        {project.exchangeRateOld}:{project.exchangeRateNew}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-muted">From:</span>
                      <Badge variant="outline">{project.oldTokenMint.toString().slice(0, 8)}...</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-muted">To:</span>
                      <Badge variant="outline">{project.newTokenMint.toString().slice(0, 8)}...</Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-border">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-400">
                        {project.totalMigrated > 0 
                          ? `${(project.totalMigrated / 1000000).toFixed(1)}M`
                          : '0'
                        }
                      </p>
                      <p className="text-xs text-foreground-muted">Tokens Migrated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-secondary-400">
                        {project.totalUsers}
                      </p>
                      <p className="text-xs text-foreground-muted">Users</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/migrate/${project.id.toString()}`}>
                      Migrate Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  {/* Time Remaining */}
                  {daysRemaining > 0 && (
                    <p className="text-center text-sm text-foreground-muted">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {daysRemaining} days remaining
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Rocket className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
            <p className="text-foreground-muted">
              No migration projects match your search criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20">
        <CardContent className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Want to migrate your token?</h2>
          <p className="text-foreground-muted mb-4">
            Create a migration project and provide instant liquidity for your community
          </p>
          <Button asChild size="lg" variant="gradient">
            <Link href="/admin">
              Create Migration Project
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

// cn helper is available via '@/lib/utils' if needed

