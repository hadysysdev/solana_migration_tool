'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search,
  ArrowRight,
  Rocket,
  Shield,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useProjects } from '@/lib/api';

export default function MigratePage() {
  const [searchTerm, setSearchTerm] = useState('');
  
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
    <main className="min-h-screen bg-black text-white relative py-24 px-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent mb-6">
            Token Migration Portal
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Safely migrate your tokens to new versions with instant liquidity and guaranteed protection
          </p>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Alert className="glass-card border-cyan-500/30 bg-cyan-500/5">
            <Shield className="h-4 w-4 text-cyan-400" />
            <AlertDescription className="ml-2 text-slate-300">
              All migrations are protected by smart contracts. LP tokens are automatically created upon activation,
              ensuring immediate trading capability for your new tokens.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Search by project name or token symbol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  />
                </div>
                <div className="text-sm text-slate-400">
                  {isLoading ? 'Loading...' : `${filteredProjects.length} active migration${filteredProjects.length !== 1 ? 's' : ''}`}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading migration projects...</p>
          </div>
        ) : error ? (
          <Card className="glass-card text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-2 font-semibold">Error loading migration projects</p>
              <p className="text-slate-400 text-sm mb-4">
                There was a problem connecting to the server. Please try again.
              </p>
              <Button onClick={() => window.location.reload()} className="btn-brand">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="glass-card text-center py-12">
            <CardContent>
              <Rocket className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No Active Migrations</h3>
              <p className="text-slate-400 mb-4">
                There are currently no active migration projects available.
              </p>
              <Button asChild variant="outline" className="border-slate-700 hover:border-cyan-500">
                <Link href="/admin">
                  Create Migration Project
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {filteredProjects.map((project, index) => {
              const now = Date.now() / 1000;
              const timeRemaining = (project.endTime || 0) - now;
              const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60));
              
              return (
                <motion.div
                  key={project.id.toString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="glass-card relative overflow-hidden hover:border-cyan-500/50 transition-all group">
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    </div>

                    <CardHeader>
                      <CardTitle className="pr-20 text-white">
                        Project #{project.projectId || project.id.toString().slice(-8)}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-slate-400">
                        Migration from {project.oldTokenMint.toString().slice(0, 8)}... to {project.newTokenMint.toString().slice(0, 8)}...
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Token Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Exchange Rate:</span>
                          <span className="font-semibold text-cyan-400">
                            {project.exchangeRateOld}:{project.exchangeRateNew}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">From:</span>
                          <Badge className="bg-slate-900/50 text-slate-300 border-slate-700">{project.oldTokenMint.toString().slice(0, 8)}...</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">To:</span>
                          <Badge className="bg-slate-900/50 text-slate-300 border-slate-700">{project.newTokenMint.toString().slice(0, 8)}...</Badge>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-cyan-400">
                            {project.totalMigrated > 0 
                              ? `${(project.totalMigrated / 1000000).toFixed(1)}M`
                              : '0'
                            }
                          </p>
                          <p className="text-xs text-slate-400">Tokens Migrated</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-400">
                            {project.totalUsers}
                          </p>
                          <p className="text-xs text-slate-400">Users</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button asChild className="w-full btn-brand" size="lg">
                        <Link href={`/migrate/${project.projectId || project.id.toString()}`}>
                          Migrate Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>

                      {/* Time Remaining */}
                      {daysRemaining > 0 && (
                        <p className="text-center text-sm text-slate-400">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {daysRemaining} days remaining
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
            <CardContent className="text-center py-8">
              <h2 className="text-2xl font-bold mb-2 text-white">Want to migrate your token?</h2>
              <p className="text-slate-400 mb-4">
                Create a migration project and provide instant liquidity for your community
              </p>
              <Button asChild size="lg" className="btn-brand">
                <Link href="/admin">
                  Create Migration Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
