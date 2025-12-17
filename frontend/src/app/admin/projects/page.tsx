'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  ArrowRight,
  Clock,
  Users,
  Coins,
  TrendingUp,
  MoreVertical,
  Edit,
  Eye,
  Play,
  Pause,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useFetchProjects } from '@/lib/api';
import { useWalletUi } from '@wallet-ui/react';
import { useIsPlatformAdmin } from '@/lib/roles';

const statusConfig = {
  Created: { label: 'Created', color: 'secondary' },
  Active: { label: 'Active', color: 'success' },
  Completed: { label: 'Completed', color: 'default' },
  Cancelled: { label: 'Cancelled', color: 'destructive' },
};

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mineOnly, setMineOnly] = useState<boolean>(false);
  const { account } = useWalletUi();
  const isPlatformAdmin = useIsPlatformAdmin();

  const { data: projects, isLoading, error } = useFetchProjects();
  const me = account?.address;
  const filteredProjects = (projects || []).filter((project) => {
    // Safety check for project.account
    if (!project?.account) return false;



    // TODO: Add token symbol lookup when we have metadata
    const matchesSearch = searchTerm === '' ||
      String(project.account.projectId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.account.status === statusFilter;
    const matchesMine = !mineOnly || (me && project.account.projectAdmin?.toString() === me);

    return matchesSearch && matchesStatus && matchesMine;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-foreground-muted">
            Manage all your token migration projects
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/projects/create">
            Create Project
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
              <Input
                type="search"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'Active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'Created' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Created')}
              >
                Created
              </Button>
              <Button
                variant={statusFilter === 'Completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Completed')}
              >
                Completed
              </Button>
            </div>
            {isPlatformAdmin && (
              <div className="flex gap-2">
                <Button
                  variant={!mineOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMineOnly(false)}
                >
                  All Projects
                </Button>
                <Button
                  variant={mineOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMineOnly(true)}
                >
                  My Projects
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-foreground-muted">Loading projects...</p>
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-danger-400 mb-4">Error loading projects</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            if (!project?.account) return null;
            const status: any = (statusConfig as any)[project.account.status] || { label: project.account.status || 'Unknown', color: 'default' };
            const isMine = !!me && project.account.projectAdmin?.toString() === me;

            return (
              <Card key={`${project.account.projectId}:${project.account.projectAdmin}`} className="relative overflow-hidden hover:border-primary-500/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        Project #{String(project.account.projectId || 'Unknown')}
                      </CardTitle>
                      <CardDescription>
                        {project.account.oldTokenMint?.toString().slice(0, 8) || '???'}... → {project.account.newTokenMint?.toString().slice(0, 8) || '???'}...
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMine && (
                        <Badge variant="outline">You are admin</Badge>
                      )}
                      <Badge variant={status.color as any}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-foreground-muted">Total Migrated</p>
                      <p className="font-semibold">{(project.account.totalOldMigrated?.toString() || '0').toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted">Users</p>
                      <p className="font-semibold">{project.account.totalNewDistributed?.toString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted">Exchange Rate</p>
                      <p className="font-semibold">{project.account.exchangeRatioDenominator?.toString() ?? '0'}:{project.account.exchangeRatioNumerator?.toString() ?? '0'}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted">Created</p>
                      <p className="font-semibold">
                        {project.account.migrationStart ? new Date(Number(project.account.migrationStart.toString()) * 1000).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/admin/projects/${project.account.projectId}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/admin/projects/${project.account.projectId}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    {project.account.status === 'Created' && (
                      <Button size="sm" className="btn-brand">
                        <Play className="mr-2 h-4 w-4" />
                        Activate
                      </Button>
                    )}
                  </div>
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
            <p className="text-foreground-muted mb-4">
              No projects found matching your criteria
            </p>
            <Button asChild>
              <Link href="/admin/projects/create">
                Create Your First Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
