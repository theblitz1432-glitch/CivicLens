'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { User, HardHat, ShieldCheck, Mail, Lock, Phone, Map, Calendar, Users, ArrowRight, CheckCircle2, FileText, BadgeCheck, Loader2 } from 'lucide-react';
 
type Role = 'user' | 'contractor' | 'authority';
type Step = 'form' | 'verify-email';
 
export default function Register() {
  const [role, setRole] = useState<Role>('user');
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailOTP, setEmailOTP] = useState('');
  const [sendingEmailOTP, setSendingEmailOTP] = useState(false);
  const router = useRouter();
 
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    age: '',
    gender: '',
    password: '',
    contractorId: '',
    authorityId: '',
    agreeTerms: false
  });
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
 
  const handleSendEmailOTP = async () => {
    if (!formData.email) return setError('Please enter your email first');
    setError('');
    setSendingEmailOTP(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (data.success) { setStep('verify-email'); }
      else { setError(data.message || 'Failed to send email OTP'); }
    } catch { setError('Server error. Please try again.'); }
    setSendingEmailOTP(false);
  };
 
  const handleVerifyEmailOTP = async () => {
    if (!emailOTP) return setError('Please enter the OTP');
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: formData.email, otp: emailOTP }),
      });
      const data = await res.json();
      if (data.success) { await handleRegister(); }
      else { setError(data.message || 'Invalid OTP'); }
    } catch { setError('Server error. Please try again.'); }
    setLoading(false);
  };
 
  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: role,
          address: formData.address,
          age: formData.age,
          gender: formData.gender,
          contractorId: formData.contractorId,
          authorityId: formData.authorityId,
        }),
      });
      const data = await response.json();
      if (data.success) { router.replace('/login'); }
      else { setError(data.message || 'Registration failed'); setStep('form'); }
    } catch { setError('Server error. Please try again.'); setStep('form'); }
    setLoading(false);
  };
 
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0f1c] transition-colors duration-300">
      {/* Left side - Branding/Image */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 relative overflow-hidden items-center justify-center fixed inset-y-0 left-0">
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/civic2/1920/1080?blur=2"
            alt="City infrastructure"
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-slate-900/90 mix-blend-multiply" />
        </div>
        <div className="relative z-10 p-12 text-white max-w-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
            <h2 className="text-4xl font-semibold leading-tight mb-6">
              Join the movement for <br />
              <span className="text-indigo-400">better infrastructure.</span>
            </h2>
            <div className="space-y-4 mt-8">
              {['Report issues anonymously', 'Track project progress in real-time', 'Hold contractors accountable'].map(t => (
                <div key={t} className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
 
      {/* Right side - Register Form */}
      <div className="w-full lg:w-7/12 lg:ml-auto flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-2xl"
        >
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img src="https://picsum.photos/seed/civiclens-logo/200/200" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">CivicLens</h1>
          </div>
 
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Create an account</h2>
            <p className="text-slate-500 dark:text-slate-400">Fill in your details to get started with CivicLens.</p>
          </div>
 
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
 
          {/* STEP: Verify Email OTP */}
          {step === 'verify-email' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-center">
                <Mail className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Verify your email</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">We sent a 6-digit OTP to <strong>{formData.email}</strong></p>
              </div>
              <input
                type="text"
                value={emailOTP}
                onChange={e => setEmailOTP(e.target.value)}
                maxLength={6}
                className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-center tracking-widest text-2xl"
                placeholder="000000"
              />
              <button onClick={handleVerifyEmailOTP} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Creating Account...' : 'Verify & Create Account'}
              </button>
              <div className="flex justify-between">
                <button onClick={() => { setStep('form'); setEmailOTP(''); }} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">← Go back</button>
                <button onClick={handleSendEmailOTP} disabled={sendingEmailOTP} className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50">
                  {sendingEmailOTP ? 'Resending...' : 'Resend OTP'}
                </button>
              </div>
            </motion.div>
          )}
 
          {/* STEP: Main Form */}
          {step === 'form' && (
            <form onSubmit={e => { e.preventDefault(); handleSendEmailOTP(); }} className="space-y-8">
              {/* Role Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">I am registering as a</label>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => setRole('user')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${role === 'user' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-600' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <User className="w-6 h-6 mb-2" /><span className="text-sm font-medium">Citizen</span>
                  </button>
                  <button type="button" onClick={() => setRole('contractor')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${role === 'contractor' ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-600' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <HardHat className="w-6 h-6 mb-2" /><span className="text-sm font-medium">Contractor</span>
                  </button>
                  <button type="button" onClick={() => setRole('authority')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${role === 'authority' ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-600' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <ShieldCheck className="w-6 h-6 mb-2" /><span className="text-sm font-medium">Authority</span>
                  </button>
                </div>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {role === 'contractor' && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contractor Registration ID</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText className="h-5 w-5 text-slate-400" /></div>
                      <input type="text" name="contractorId" value={formData.contractorId} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                        placeholder="Enter your official contractor ID" required />
                    </div>
                  </div>
                )}
                {role === 'authority' && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Authority ID / Badge Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BadgeCheck className="h-5 w-5 text-slate-400" /></div>
                      <input type="text" name="authorityId" value={formData.authorityId} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                        placeholder="Enter your official authority ID" required />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                      placeholder="John Doe" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                      placeholder="john@example.com" required />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-slate-400" /></div>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                      placeholder="+91 98765 43210" required />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Address</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none"><Map className="h-5 w-5 text-slate-400" /></div>
                    <textarea name="address" value={formData.address} onChange={handleChange} rows={2}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow resize-none"
                      placeholder="Enter your complete address" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Age</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-5 w-5 text-slate-400" /></div>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} min="18" max="120"
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                      placeholder="Years" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Users className="h-5 w-5 text-slate-400" /></div>
                    <select name="gender" value={formData.gender} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white transition-shadow appearance-none"
                      required>
                      <option value="" disabled>Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                    <input type="password" name="password" value={formData.password} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                      placeholder="Create a strong password" required />
                  </div>
                </div>
              </div>
 
              {/* Checkbox */}
              <div className="flex items-start gap-3">
                <div className="flex items-center h-5 mt-0.5">
                  <input id="agreeTerms" name="agreeTerms" type="checkbox" checked={formData.agreeTerms} onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-600 dark:bg-[#111827]" required />
                </div>
                <label htmlFor="agreeTerms" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  I agree to the <a href="#" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Terms of Service</a> and <a href="#" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Privacy Policy</a>. I understand that my identity will remain anonymous when filing complaints.
                </label>
              </div>
 
              <button type="submit" disabled={sendingEmailOTP}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {sendingEmailOTP ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {sendingEmailOTP ? 'Sending OTP...' : 'Create Account'}
              </button>
            </form>
          )}
 
          <div className="mt-8 text-center pb-8 lg:pb-0">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}