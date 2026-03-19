'use client'
import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, AlertCircle, CheckCircle2, Info, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'complaint' | 'status_update' | 'project' | 'system';
  isRead: boolean;
  createdAt: string;
  complaintId?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('civiclens_token') : ''}`,
  'Content-Type': 'application/json',
});

const typeIcon: Record<string, React.ReactNode> = {
  complaint: <AlertCircle size={16} className="text-orange-500" />,
  status_update: <CheckCircle2 size={16} className="text-green-500" />,
  project: <Briefcase size={16} className="text-blue-500" />,
  system: <Info size={16} className="text-slate-500" />,
};

const typeColor: Record<string, string> = {
  complaint: 'border-l-orange-400',
  status_update: 'border-l-green-400',
  project: 'border-l-blue-400',
  system: 'border-l-slate-300',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/notifications`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, { method: 'PATCH', headers: authHeader() });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/notifications/read-all`, { method: 'PATCH', headers: authHeader() });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`${API}/notifications/${id}`, { method: 'DELETE', headers: authHeader() });
      const deleted = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[200]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700" title="Mark all read">
                    <CheckCheck size={16} />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n._id}
                    className={`flex gap-3 px-4 py-3 border-b border-slate-50 border-l-2 transition-colors ${typeColor[n.type]} ${!n.isRead ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="mt-0.5 shrink-0">{typeIcon[n.type]}</div>
                    <div className="flex-1 min-w-0" onClick={() => !n.isRead && markAsRead(n._id)}>
                      <p className={`text-sm leading-tight ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {!n.isRead && (
                        <button onClick={() => markAsRead(n._id)} className="p-1 hover:bg-green-100 rounded-lg text-green-600" title="Mark read">
                          <Check size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteNotification(n._id)} className="p-1 hover:bg-red-100 rounded-lg text-red-400" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">{notifications.length} total notifications</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}