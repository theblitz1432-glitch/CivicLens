'use client'

import React from 'react';
import { Bell, User } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardHeaderProps {
  onProfileClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onProfileClick }) => {
  return (
    <header className="bg-white dark:bg-[#002a5c] border-b border-slate-200 dark:border-white/10 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-[60] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm bg-slate-900 flex items-center justify-center">
           <img 
            src="https://picsum.photos/seed/civiclens-logo/200/200" 
            alt="CivicLens Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">CivicLens</span>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative"
        >
          <Bell size={26} strokeWidth={1.5} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#002a5c]" />
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full border border-slate-900 dark:border-white flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
        >
          <User size={22} strokeWidth={1.5} />
        </motion.button>
      </div>
    </header>
  );
};
