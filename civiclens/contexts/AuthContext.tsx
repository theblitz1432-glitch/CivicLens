'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  role: 'user' | 'contractor' | 'authority';
  email: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('civiclens_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setTimeout(() => setUser(parsed), 0);
      }
    } catch {
      localStorage.removeItem('civiclens_user');
    }
  }, []);

  const login = async (email: string, password: string, role: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        localStorage.setItem('civiclens_user', JSON.stringify(data.user));
        localStorage.setItem('civiclens_token', data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Server error' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('civiclens_user');
    localStorage.removeItem('civiclens_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}