'use client'
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

interface DashboardHeaderProps {
  onProfileClick: () => void;
}

export function DashboardHeader({ onProfileClick }: DashboardHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-40">
      {/* Left - App Name (mobile only) */}
      <div className="md:hidden flex items-center gap-2">
        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        <span className="font-bold text-slate-900">CivicLens</span>
      </div>

      {/* Right - Notification Bell + Profile */}
      <div className="ml-auto flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Profile Button */}
        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 pl-3 border-l border-slate-200"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <User size={18} />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role || 'citizen'}</p>
          </div>
        </button>
      </div>
    </header>
  );
}