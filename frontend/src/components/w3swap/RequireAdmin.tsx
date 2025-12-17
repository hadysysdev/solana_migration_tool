'use client';

import React from 'react';
import { useIsPlatformAdmin, useAdminDebugInfo } from '@/lib/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDebug?: boolean;
};

export function RequireAdmin({ children, fallback = null, showDebug = false }: Props) {
  const { isAdmin, isLoading } = useIsPlatformAdmin();
  const { debugInfo, error } = useAdminDebugInfo();

  // Show loading state while checking admin status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-slate-400">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <>
        {fallback}
        {showDebug && (
          <div className="fixed bottom-4 right-4 max-w-md z-50">
            <Card className="glass-card border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-sm text-yellow-400">Admin Access Debug</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                {error && (
                  <div className="text-red-400">
                    <strong>Error:</strong> {error}
                  </div>
                )}
                {debugInfo && (
                  <div className="space-y-1 text-slate-300">
                    {debugInfo.bypassEnabled && (
                      <div className="text-yellow-400 font-semibold">
                        ⚠️ Development Mode: Admin check bypassed
                      </div>
                    )}
                    <div><strong>Connected:</strong> {debugInfo.connected !== false ? 'Yes' : 'No'}</div>
                    {debugInfo.connectedWallet && (
                      <div><strong>Wallet:</strong> <code className="text-xs break-all">{debugInfo.connectedWallet}</code></div>
                    )}
                    {debugInfo.superAdmin && (
                      <div><strong>Super Admin:</strong> <code className="text-xs break-all">{debugInfo.superAdmin}</code></div>
                    )}
                    {debugInfo.projectAdmins && debugInfo.projectAdmins.length > 0 && (
                      <div>
                        <strong>Project Admins ({debugInfo.projectAdmins.length}):</strong>
                        <ul className="list-disc list-inside ml-2 mt-1">
                          {debugInfo.projectAdmins.map((admin: string, i: number) => (
                            <li key={i}><code className="text-xs break-all">{admin}</code></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {debugInfo.projectAdmins && debugInfo.projectAdmins.length === 0 && (
                      <div className="text-slate-400">No project admins configured</div>
                    )}
                    {debugInfo.hasAccess !== undefined && (
                      <div className={`font-semibold ${debugInfo.hasAccess ? 'text-green-400' : 'text-red-400'}`}>
                        <strong>Has Access:</strong> {debugInfo.hasAccess ? 'Yes' : 'No'}
                      </div>
                    )}
                    {debugInfo.isSuperAdmin !== undefined && (
                      <div className="text-slate-400">
                        <strong>Is Super Admin:</strong> {debugInfo.isSuperAdmin ? 'Yes' : 'No'}
                      </div>
                    )}
                    {debugInfo.isProjectAdmin !== undefined && (
                      <div className="text-slate-400">
                        <strong>Is Project Admin:</strong> {debugInfo.isProjectAdmin ? 'Yes' : 'No'}
                      </div>
                    )}
                    {debugInfo.platformConfigPda && (
                      <div className="text-slate-400">
                        <strong>Platform Config PDA:</strong> <code className="text-xs break-all">{debugInfo.platformConfigPda}</code>
                      </div>
                    )}
                    {debugInfo.programId && (
                      <div className="text-slate-400">
                        <strong>Program ID:</strong> <code className="text-xs break-all">{debugInfo.programId}</code>
                      </div>
                    )}
                    {debugInfo.programError && (
                      <div className="text-red-400">
                        <strong>Program Error:</strong> {debugInfo.programError}
                      </div>
                    )}
                    {debugInfo.fetchError && (
                      <div className="text-red-400">
                        <strong>Fetch Error:</strong> {debugInfo.fetchError}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }
  return <>{children}</>;
}

