'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { MapPin, User, HardHat, ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Role = 'user' | 'contractor' | 'authority';

export default function Login() {
  const [role, setRole] = useState<Role>('user');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(identifier, password, role);

    setLoading(false);

    if (result.success) {
      if (role === 'contractor') router.replace('/contractor');
      else if (role === 'authority') router.replace('/authority');
      else router.replace('/citizen');
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0f1c] transition-colors duration-300">
      {/* Left side - Branding/Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src="https://picsum.photos/seed/civic/1920/1080?blur=2" 
            alt="City infrastructure" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-slate-900/90 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 p-12 text-white max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="CivicLens Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">CivicLens</h1>
            </div>
            <h2 className="text-5xl font-semibold leading-tight mb-6">
              Empowering Citizens.<br />
              <span className="text-indigo-400">Ensuring Accountability.</span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              A transparent platform connecting citizens, contractors, and authorities to build better infrastructure together.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="https://picsum.photos/seed/civiclens-logo/200/200" 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">CivicLens</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400">Please enter your details to sign in.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select your role</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    role === 'user' 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-600' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <User className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-medium">Citizen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('contractor')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    role === 'contractor' 
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-600' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <HardHat className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-medium">Contractor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('authority')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    role === 'authority' 
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-600' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-medium">Authority</span>
                </button>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                  <a href="#" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}