'use client'

import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../components/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}