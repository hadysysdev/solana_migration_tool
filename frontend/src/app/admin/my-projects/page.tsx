'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Eye, Edit } from 'lucide-react';
import { useFetchProjects } from '@/lib/api';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { RequireAdmin } from '@/components/auth/require-admin';

export default function MyProjectsPage() {
  const wallet = useAnchorWallet();
  const { data: projects, isLoading, error } = useFetchProjects();
  console.log(projects);
  const [searchTerm, setSearchTerm] = useState('');

  const mine = useMemo(() => {
    const me = wallet?.publicKey?.toBase58();
    const rows = (projects || []);
    return rows.filter((p) => (!me ? false : p.account.projectAdmin.toBase58() === me))
      .filter((p) => searchTerm === '' || String(p.account.projectId).includes(searchTerm));
  }, [projects, wallet?.publicKey?.toBase58(), searchTerm]);

  return (
    <RequireAdmin fallback={<div className="p-6">Admins only</div>}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <p className="mt-2 text-foreground-muted">Projects created by your admin wallet</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
              <Input
                type="search"
                placeholder="Search by numeric project id..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="p-6 text-foreground-muted">Loading…</div>
        ) : error ? (
          <Card className="text-center py-12"><CardContent>Error loading projects</CardContent></Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mine.map((project) => (
              <Card key={`${project.account.projectId}:${project.account.projectAdmin}`} className="relative">
                <CardHeader>
                  <CardTitle>Project #{project.account.projectId}</CardTitle>
                  <CardDescription>
                    {project.account.oldTokenMint.toString().slice(0, 8)}… → {project.account.newTokenMint.toString().slice(0, 8)}…
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/admin/projects/${project.account.projectId}`}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/admin/projects/${project.account.projectId}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RequireAdmin>
  );
}
