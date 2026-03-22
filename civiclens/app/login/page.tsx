'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2, Shield, HardHat, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;

type Role = 'citizen' | 'contractor' | 'authority';

const ROLE_CONFIG = {
  citizen: {
    label: 'Citizen',
    icon: User,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500',
    description: 'File and track complaints',
    endpoint: '/auth/citizen/login',
    redirect: '/citizen',
  },
  contractor: {
    label: 'Contractor',
    icon: HardHat,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-500',
    description: 'Manage projects & reports',
    endpoint: '/auth/contractor/login',
    redirect: '/contractor',
  },
  authority: {
    label: 'Authority',
    icon: Shield,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-500',
    description: 'Monitor & resolve issues',
    endpoint: '/auth/authority/login',
    redirect: '/authority',
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();
  const [role, setRole]         = useState<Role>('citizen');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password)
      return setError('Please enter email and password');
    setLoading(true);
    try {
      const res  = await fetch(`${API}${cfg.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
        router.push(cfg.redirect);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
            <img src="/logo.png" alt="CivicLens" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">CivicLens</h1>
          <p className="text-slate-500 mt-1">Empowering Citizens. Ensuring Accountability.</p>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">

          {/* Role Selector */}
          <div className="p-2 bg-slate-50 flex gap-1 m-4 rounded-2xl">
            {(Object.keys(ROLE_CONFIG) as Role[]).map(r => {
              const RIcon = ROLE_CONFIG[r].icon;
              return (
                <button key={r} onClick={() => { setRole(r); setError(''); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-bold transition-all ${role === r ? `${ROLE_CONFIG[r].color} text-white shadow-lg` : 'text-slate-500 hover:bg-white'}`}>
                  <RIcon size={18} />
                  {ROLE_CONFIG[r].label}
                </button>
              );
            })}
          </div>

          {/* Role badge */}
          <div className="px-6 pb-2">
            <div className={`flex items-center gap-2 ${cfg.lightColor} ${cfg.textColor} px-4 py-2 rounded-xl`}>
              <Icon size={16} />
              <span className="text-sm font-semibold">{cfg.label} Login — {cfg.description}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 pt-4 space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                  <AlertCircle size={16} className="shrink-0" />{error}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={`Enter your ${cfg.label.toLowerCase()} email`}
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-2 ${cfg.borderColor} transition-all`} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pr-12 text-sm focus:outline-none focus:border-2 ${cfg.borderColor} transition-all`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className={`w-full py-4 ${cfg.color} text-white rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all mt-2`}>
              {loading ? <><Loader2 size={20} className="animate-spin" />Logging in...</> : `Login as ${cfg.label}`}
            </button>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => router.push(`/register?role=${role}`)} className={`${cfg.textColor} font-bold hover:underline`}>
                Register here
              </button>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Hisar District, Haryana · CivicLens v1.0
        </p>
      </div>
    </div>
  );
}