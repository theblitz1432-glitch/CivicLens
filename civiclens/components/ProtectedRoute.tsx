'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'citizen' | 'contractor' | 'authority')[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait until auth state is loaded

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role as any)) {
      switch (user.role) {
        case 'contractor':
          router.replace('/contractor');
          break;
        case 'authority':
          router.replace('/authority');
          break;
        default:
          router.replace('/citizen');
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  // Show nothing while loading auth state
  if (isLoading) return null;

  // Not logged in
  if (!isAuthenticated) return null;

  // Wrong role
  if (allowedRoles && user && !allowedRoles.includes(user.role as any)) return null;

  return <>{children}</>;
}