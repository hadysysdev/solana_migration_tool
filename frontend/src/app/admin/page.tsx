'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Activity,
  Users,
  Coins,
  TrendingUp,
  Package,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useFetchProjects } from '@/lib/api';

export default function AdminDashboard() {
  const { data: projects, isLoading: projectsLoading } = useFetchProjects();

  // Calculate real stats from contract data
  const stats = {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter(p => p.account.status === 'Active').length || 0,
    totalValue: 0, // Calculate from actual LP commitments
    successRate: 0, // Calculate from completed vs total migrations
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-foreground-muted">
          Manage your token migration projects and monitor system health
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="glass" className="hover:border-primary-500/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-400" />
              Create Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground-muted mb-3">
              Launch a new token migration project
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/admin/projects/create">
                Create <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card variant="glass" className="hover:border-secondary-500/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-secondary-400" />
              Create Token-2022
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground-muted mb-3">
              Deploy a new Token-2022 with metadata
            </p>
            <Button asChild size="sm" variant="secondary" className="w-full">
              <Link href="/admin/token/create">
                Create <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card variant="glass" className="hover:border-success-500/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-success-400" />
              Monitor Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground-muted mb-3">
              View active migration projects
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/admin/projects">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card variant="glass" className="hover:border-warning-500/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-warning-400" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground-muted mb-3">
              Manage access and permissions
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/admin/settings">
                Settings <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-3xl">
              {projectsLoading ? '...' : stats.totalProjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-foreground-muted">
              Projects created
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Migrations</CardDescription>
            <CardTitle className="text-3xl">
              {projectsLoading ? '...' : stats.activeProjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-foreground-muted">
              Currently accepting migrations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Value Locked</CardDescription>
            <CardTitle className="text-3xl">
              {projectsLoading ? '...' : `${stats.totalValue} SOL`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-foreground-muted">
              SOL committed to liquidity
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-3xl">
              {projectsLoading ? '...' : `${stats.successRate}%`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-foreground-muted">
              Successful migrations
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest project events and migrations</CardDescription>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="text-center py-8 text-foreground-muted">
              Loading recent activity...
            </div>
          ) : projects?.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              No activity yet. Create your first project to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {projects?.slice(0, 5).map((project, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${project.account.status === 'Active' ? 'bg-success-500/10' :
                    project.account.status === 'Created' ? 'bg-warning-500/10' :
                      'bg-primary-500/10'
                    }`}>
                    {project.account.status === 'Active' ? (
                      <CheckCircle className="h-4 w-4 text-success-400" />
                    ) : project.account.status === 'Created' ? (
                      <AlertCircle className="h-4 w-4 text-warning-400" />
                    ) : (
                      <Activity className="h-4 w-4 text-primary-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Project {project.account.status === 'Active' ? 'Activated' : 'Created'}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {project.account.totalNewDistributed?.toString() || '0'} users • {project.account.migrationStart ? new Date(Number(project.account.migrationStart.toString()) * 1000).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
