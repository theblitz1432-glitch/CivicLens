'use client'
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2, Shield, HardHat, User, AlertCircle, CheckCircle2, ChevronLeft, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;

const HISAR_BLOCKS = ['Hisar Urban','Hisar Rural','Adampur','Barwala','Hansi','Narnaund','Uklana','Agroha','Bass','Litani'];
const DEPARTMENTS  = ['Revenue & Administration','Public Works Department','Water Supply & Sanitation','Electricity Board','Municipal Corporation','Block Development Office','Health Department','Education Department'];
const DESIGNATIONS = ['BDO','SDM','Executive Engineer','Municipal Commissioner','Sarpanch','Deputy Commissioner','Tehsildar','Inspector'];
const SPECIALIZATIONS_LIST = ['Road Construction','Drainage Systems','Public Buildings','Bridge Repair','Water Pipeline','Electrical Work','Sanitation','Landscaping'];

type Role = 'citizen' | 'contractor' | 'authority';
type Step = 'form' | 'otp' | 'success';

const ROLE_CONFIG = {
  citizen:    { label: 'Citizen',    icon: User,     color: 'bg-blue-500',    textColor: 'text-blue-600',    lightColor: 'bg-blue-50',    borderColor: 'border-blue-500',    endpoint: '/auth/citizen/register',    redirect: '/citizen'    },
  contractor: { label: 'Contractor', icon: HardHat,  color: 'bg-emerald-500', textColor: 'text-emerald-600', lightColor: 'bg-emerald-50', borderColor: 'border-emerald-500', endpoint: '/auth/contractor/register', redirect: '/contractor' },
  authority:  { label: 'Authority',  icon: Shield,   color: 'bg-purple-500',  textColor: 'text-purple-600',  lightColor: 'bg-purple-50',  borderColor: 'border-purple-500',  endpoint: '/auth/authority/register',  redirect: '/authority'  },
};

function RegisterInner() {
  const { login }  = useAuth();
  const router     = useRouter();
  const params     = useSearchParams();
  const initRole   = (params.get('role') as Role) || 'citizen';

  const [role, setRole]   = useState<Role>(initRole);
  const [step, setStep]   = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPass, setShowPass] = useState(false);

  // OTP state
  const [otpSent, setOtpSent]     = useState(false);
  const [otpValue, setOtpValue]   = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp]   = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer]   = useState(0);

  // Common
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // Citizen-specific
  const [block, setBlock]       = useState('');
  const [pincode, setPincode]   = useState('');

  // Contractor-specific
  const [companyName, setCompanyName]       = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [address, setAddress]               = useState('');
  const [licenseValidity, setLicenseValidity] = useState('');
  const [selectedSpecs, setSelectedSpecs]   = useState<string[]>([]);

  // Authority-specific
  const [designation, setDesignation] = useState('');
  const [department, setDepartment]   = useState('');
  const [authBlock, setAuthBlock]     = useState('');
  const [office, setOffice]           = useState('');
  const [empCode, setEmpCode]         = useState('');

  const cfg  = ROLE_CONFIG[role];
  const Icon = cfg.icon;

  const toggleSpec = (s: string) =>
    setSelectedSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  // ── Start resend countdown ──────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Send OTP ────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) return setError('Please enter a valid email first');
    setSendingOtp(true);
    setError('');
    try {
      const res = await fetch(`${API}/otp/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setStep('otp');
        startResendTimer();
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch {
      setError('Cannot connect to server');
    }
    setSendingOtp(false);
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otpValue || otpValue.length !== 6) return setError('Enter the 6-digit OTP');
    setVerifyingOtp(true);
    setError('');
    try {
      const res = await fetch(`${API}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: email.trim().toLowerCase(), otp: otpValue }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpVerified(true);
        setStep('form');
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch {
      setError('Cannot connect to server');
    }
    setVerifyingOtp(false);
  };

  // ── Register ────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpVerified) return setError('Please verify your email with OTP first');
    if (!name || !email || !phone || !password) return setError('Please fill all required fields');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPwd) return setError('Passwords do not match');
    if (role === 'contractor' && (!companyName || !registrationNo)) return setError('Company name and registration number required');
    if (role === 'authority' && (!designation || !department || !authBlock)) return setError('Designation, department and block required');

    setLoading(true);
    try {
      const body: any = { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password };
      if (role === 'citizen') { body.block = block; body.pincode = pincode; }
      else if (role === 'contractor') { body.companyName = companyName; body.registrationNo = registrationNo; body.address = address; body.licenseValidity = licenseValidity; body.specializations = selectedSpecs; }
      else if (role === 'authority') { body.designation = designation; body.department = department; body.block = authBlock; body.office = office; body.empCode = empCode || undefined; }

      const res  = await fetch(`${API}${cfg.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
        setStep('success');
        setTimeout(() => router.push(cfg.redirect), 1500);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    }
    setLoading(false);
  };

  // ── OTP Step UI ─────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => { setStep('form'); setOtpValue(''); setError(''); }}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow border border-slate-200">
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Verify Email</h1>
              <p className="text-sm text-slate-500">Enter the OTP sent to your email</p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`w-16 h-16 ${cfg.lightColor} rounded-2xl flex items-center justify-center`}>
                <Mail size={32} className={cfg.textColor} />
              </div>
              <p className="text-sm text-slate-500">OTP sent to <span className="font-bold text-slate-900">{email}</span></p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                <AlertCircle size={16} className="shrink-0" />{error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enter 6-digit OTP</label>
              <input
                type="text" maxLength={6} value={otpValue}
                onChange={e => { setOtpValue(e.target.value.replace(/\D/g, '')); setError(''); }}
                placeholder="• • • • • •"
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-2xl font-bold text-center tracking-[1rem] focus:outline-none focus:border-2 ${cfg.borderColor}`}
              />
            </div>

            <button onClick={handleVerifyOTP} disabled={verifyingOtp || otpValue.length !== 6}
              className={`w-full py-4 ${cfg.color} text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60`}>
              {verifyingOtp ? <><Loader2 size={20} className="animate-spin" />Verifying...</> : '✓ Verify OTP'}
            </button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-slate-400">Resend OTP in <span className="font-bold text-slate-600">{resendTimer}s</span></p>
              ) : (
                <button onClick={handleSendOTP} disabled={sendingOtp}
                  className={`text-sm ${cfg.textColor} font-bold hover:underline disabled:opacity-50`}>
                  {sendingOtp ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push('/login')} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow border border-slate-200">
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="text-sm text-slate-500">Register on CivicLens</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
          {/* Role Selector */}
          <div className="p-2 bg-slate-50 flex gap-1 m-4 rounded-2xl">
            {(Object.keys(ROLE_CONFIG) as Role[]).map(r => {
              const RIcon = ROLE_CONFIG[r].icon;
              return (
                <button key={r} onClick={() => { setRole(r); setError(''); setOtpVerified(false); setOtpSent(false); setOtpValue(''); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-bold transition-all ${role === r ? `${ROLE_CONFIG[r].color} text-white shadow-lg` : 'text-slate-500 hover:bg-white'}`}>
                  <RIcon size={18} />
                  {ROLE_CONFIG[r].label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleRegister} className="p-6 pt-2 space-y-4 max-h-[75vh] overflow-y-auto">
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                  <AlertCircle size={16} className="shrink-0" />{error}
                </motion.div>
              )}
              {step === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm">
                  <CheckCircle2 size={16} />{cfg.label} account created! Redirecting...
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basic Information</p>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name"
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-2 ${cfg.borderColor}`} />
            </div>

            {/* Email + OTP */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address *</label>
              <div className="flex gap-2">
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setOtpVerified(false); setOtpSent(false); }}
                  placeholder="your@email.com" disabled={otpVerified}
                  className={`flex-1 bg-slate-50 border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-2 ${otpVerified ? 'border-green-400 bg-green-50' : `border-slate-200 ${cfg.borderColor}`}`} />
                {!otpVerified ? (
                  <button type="button" onClick={handleSendOTP} disabled={sendingOtp || !email}
                    className={`px-4 py-3 ${cfg.color} text-white rounded-2xl text-xs font-bold whitespace-nowrap disabled:opacity-50 flex items-center gap-1`}>
                    {sendingOtp ? <Loader2 size={14} className="animate-spin" /> : null}
                    {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                ) : (
                  <div className="px-4 py-3 bg-green-100 text-green-700 rounded-2xl text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Verified
                  </div>
                )}
              </div>
              {otpSent && !otpVerified && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex gap-2">
                  <input type="text" maxLength={6} value={otpValue}
                    onChange={e => { setOtpValue(e.target.value.replace(/\D/g, '')); setError(''); }}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold tracking-widest focus:outline-none focus:border-blue-500" />
                  <button type="button" onClick={handleVerifyOTP} disabled={verifyingOtp || otpValue.length !== 6}
                    className="px-4 py-3 bg-green-500 text-white rounded-2xl text-xs font-bold disabled:opacity-50">
                    {verifyingOtp ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-2 ${cfg.borderColor}`} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters"
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-2 ${cfg.borderColor}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm Password *</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Re-enter password"
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-2 ${cfg.borderColor}`} />
            </div>

            {/* CITIZEN */}
            {role === 'citizen' && (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">Location Details</p>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your Block</label>
                  <select value={block} onChange={e => setBlock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Select block</option>
                    {HISAR_BLOCKS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pincode</label>
                  <input value={pincode} onChange={e => setPincode(e.target.value)} placeholder="e.g. 125001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </>
            )}

            {/* CONTRACTOR */}
            {role === 'contractor' && (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">Company Details</p>
                {[
                  { label: 'Company Name *', value: companyName, set: setCompanyName, placeholder: 'e.g. Apex Buildcon Pvt Ltd' },
                  { label: 'Registration Number *', value: registrationNo, set: setRegistrationNo, placeholder: 'e.g. CTR-8492-XYZ' },
                  { label: 'Address', value: address, set: setAddress, placeholder: 'Company registered address' },
                  { label: 'License Valid Until', value: licenseValidity, set: setLicenseValidity, placeholder: 'e.g. Dec 2028' },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                    <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALIZATIONS_LIST.map(s => (
                      <button key={s} type="button" onClick={() => toggleSpec(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${selectedSpecs.includes(s) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* AUTHORITY */}
            {role === 'authority' && (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">Official Details</p>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Designation *</label>
                  <select value={designation} onChange={e => setDesignation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500">
                    <option value="">Select designation</option>
                    {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department *</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500">
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Block / Area *</label>
                  <select value={authBlock} onChange={e => setAuthBlock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500">
                    <option value="">Select block</option>
                    {HISAR_BLOCKS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Office Address</label>
                  <input value={office} onChange={e => setOffice(e.target.value)} placeholder="e.g. Block Development Office, Adampur"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Employee Code (optional)</label>
                  <input value={empCode} onChange={e => setEmpCode(e.target.value)} placeholder="Govt employee ID"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
                </div>
              </>
            )}

            <button type="submit" disabled={loading || step === 'success' || !otpVerified}
              className={`w-full py-4 ${cfg.color} text-white rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all mt-2`}>
              {loading ? <><Loader2 size={20} className="animate-spin" />Creating Account...</>
               : !otpVerified ? '⚠️ Verify Email First'
               : `Register as ${cfg.label}`}
            </button>

            <p className="text-center text-sm text-slate-500 pb-2">
              Already have an account?{' '}
              <button type="button" onClick={() => router.push('/login')} className={`${cfg.textColor} font-bold hover:underline`}>
                Login here
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" size={32} /></div>}>
      <RegisterInner />
    </Suspense>
  );
}