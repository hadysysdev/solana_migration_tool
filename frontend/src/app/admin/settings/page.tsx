'use client';

import { RequireAdmin } from '@/components/auth/require-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <RequireAdmin fallback={<div className="p-6">Admins only</div>}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-foreground-muted">
            This page is restricted to platform admins. Integrate PlatformConfig editors here (fee destination, allowed swap programs, thresholds, etc.).
          </CardContent>
        </Card>
      </div>
    </RequireAdmin>
  );
}

