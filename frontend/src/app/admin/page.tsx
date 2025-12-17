'use client';
import { motion } from 'framer-motion';
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-slate-400">
          Manage your token migration projects and monitor system health
        </p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Package,
            title: 'Create Project',
            description: 'Launch a new token migration project',
            href: '/admin/projects/create',
            color: 'cyan',
          },
          {
            icon: Coins,
            title: 'Create Token-2022',
            description: 'Deploy a new Token-2022 with metadata',
            href: '/admin/token/create',
            color: 'purple',
          },
          {
            icon: Activity,
            title: 'Monitor Projects',
            description: 'View active migration projects',
            href: '/admin/projects',
            color: 'teal',
          },
          {
            icon: Shield,
            title: 'Security Settings',
            description: 'Manage access and permissions',
            href: '/admin/settings',
            color: 'cyan',
          },
        ].map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card hover:border-cyan-500/50 transition-all group">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${
                      action.color === 'cyan' ? 'from-cyan-500/20 to-purple-500/20' :
                      action.color === 'purple' ? 'from-purple-500/20 to-teal-500/20' :
                      'from-teal-500/20 to-cyan-500/20'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        action.color === 'cyan' ? 'text-cyan-400' :
                        action.color === 'purple' ? 'text-purple-400' :
                        'text-teal-400'
                      }`} />
                    </div>
                    {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 mb-3">
                    {action.description}
                  </p>
                  <Button asChild size="sm" className="w-full btn-brand">
                    <Link href={action.href}>
                      Create <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Projects',
            value: projectsLoading ? '...' : stats.totalProjects,
            description: 'Projects created',
            color: 'cyan',
          },
          {
            label: 'Active Migrations',
            value: projectsLoading ? '...' : stats.activeProjects,
            description: 'Currently accepting migrations',
            color: 'purple',
          },
          {
            label: 'Total Value Locked',
            value: projectsLoading ? '...' : `${stats.totalValue} SOL`,
            description: 'SOL committed to liquidity',
            color: 'teal',
          },
          {
            label: 'Success Rate',
            value: projectsLoading ? '...' : `${stats.successRate}%`,
            description: 'Successful migrations',
            color: 'cyan',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">{stat.label}</CardDescription>
                <CardTitle className={`text-3xl ${
                  stat.color === 'cyan' ? 'text-cyan-400' :
                  stat.color === 'purple' ? 'text-purple-400' :
                  'text-teal-400'
                }`}>
                  {stat.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-slate-400">
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">Latest project events and migrations</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-8 text-slate-400">
                Loading recent activity...
              </div>
            ) : projects?.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No activity yet. Create your first project to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {projects?.slice(0, 5).map((project, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      project.status === 'Active' ? 'bg-green-500/10' :
                      project.status === 'Created' ? 'bg-yellow-500/10' :
                      'bg-cyan-500/10'
                    }`}>
                      {project.status === 'Active' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <Activity className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        Project {project.status === 'Active' ? 'Activated' : 'Created'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {project.totalUsers} users • {project.createdAt ? new Date(project.createdAt * 1000).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
