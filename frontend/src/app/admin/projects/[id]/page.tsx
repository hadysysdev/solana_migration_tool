'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject, useProjectEvents, useProjectAnalytics } from '@/lib/api';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const numericId = Number(params.id);
  const { data: project, isLoading } = useProject(numericId);
  const { data: events } = useProjectEvents(numericId);
  const { data: analytics } = useProjectAnalytics(numericId, 30);

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (!project) return <div className="p-6">Project not found.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics (30d)</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-foreground-muted">Total Migrated</div>
            <div className="font-semibold">{analytics?.total_migrated ?? 0}</div>
          </div>
          <div>
            <div className="text-foreground-muted">Total Users</div>
            <div className="font-semibold">{analytics?.total_users ?? 0}</div>
          </div>
          <div>
            <div className="text-foreground-muted">Events</div>
            <div className="font-semibold">{analytics ? Object.values(analytics.event_counts || {}).reduce((a: any,b: any)=> (a as number) + (b as number), 0) : 0}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project #{numericId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Status: <span className="font-semibold">{project.status}</span></div>
          <div>Old Mint: <span className="font-mono">{project.oldTokenMint.toString()}</span></div>
          <div>New Mint: <span className="font-mono">{project.newTokenMint.toString()}</span></div>
          <div>Totals: migrated {project.totalMigrated ?? 0}, users {project.totalUsers ?? 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(events || []).slice(0, 20).map((e: any, idx: number) => (
            <div key={idx} className="text-xs border-b border-border pb-2">
              <div className="font-semibold">{e.event_name}</div>
              <div className="text-foreground-muted">{e.created_at}</div>
            </div>
          ))}
          {(!events || events.length === 0) && <div className="text-xs text-foreground-muted">No events yet.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
