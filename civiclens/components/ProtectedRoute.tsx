'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'contractor' | 'authority')[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
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
  }, [isAuthenticated, user, allowedRoles, router]);

  if (!isAuthenticated) return null;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}