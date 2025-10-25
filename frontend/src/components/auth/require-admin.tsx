'use client';

import React from 'react';
import { useIsPlatformAdmin } from '@/lib/roles';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RequireAdmin({ children, fallback = null }: Props) {
  const isAdmin = useIsPlatformAdmin();
  if (!isAdmin) return <>{fallback}</>;
  return <>{children}</>;
}

