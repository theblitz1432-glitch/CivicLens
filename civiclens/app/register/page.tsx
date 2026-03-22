'use client'
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2, Shield, HardHat, User, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;

const HISAR_BLOCKS = ['Hisar Urban','Hisar Rural','Adampur','Barwala','Hansi','Narnaund','Uklana','Agroha','Bass','Litani'];
const DEPARTMENTS  = ['Revenue & Administration','Public Works Department','Water Supply & Sanitation','Electricity Board','Municipal Corporation','Block Development Office','Health Department','Education Department'];
const DESIGNATIONS = ['BDO','SDM','Executive Engineer','Municipal Commissioner','Sarpanch','Deputy Commissioner','Tehsildar','Inspector'];
const SPECIALIZATIONS_LIST = ['Road Construction','Drainage Systems','Public Buildings','Bridge Repair','Water Pipeline','Electrical Work','Sanitation','Landscaping'];

type Role = 'citizen' | 'contractor' | 'authority';

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
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !phone || !password) return setError('Please fill all required fields');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPwd) return setError('Passwords do not match');

    // Role-specific validation
    if (role === 'contractor' && (!companyName || !registrationNo)) return setError('Company name and registration number required');
    if (role === 'authority'  && (!designation || !department || !authBlock)) return setError('Designation, department and block required');

    setLoading(true);
    try {
      const body: any = { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password };
      if (role === 'citizen') {
        body.block   = block;
        body.pincode = pincode;
      } else if (role === 'contractor') {
        body.companyName      = companyName;
        body.registrationNo   = registrationNo;
        body.address          = address;
        body.licenseValidity  = licenseValidity;
        body.specializations  = selectedSpecs;
      } else if (role === 'authority') {
        body.designation = designation;
        body.department  = department;
        body.block       = authBlock;
        body.office      = office;
        body.empCode     = empCode || undefined;
      }

      const res  = await fetch(`${API}${cfg.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
        setSuccess(true);
        setTimeout(() => router.push(cfg.redirect), 1500);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">

        {/* Header */}
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
                <button key={r} onClick={() => { setRole(r); setError(''); }}
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
              {success && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm">
                  <CheckCircle2 size={16} />{cfg.label} account created! Redirecting...
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Common Fields ── */}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basic Information</p>
            {[
              { label: 'Full Name *', value: name, set: setName, placeholder: 'Enter your full name' },
              { label: 'Email Address *', value: email, set: setEmail, placeholder: 'your@email.com', type: 'email' },
              { label: 'Phone Number *', value: phone, set: setPhone, placeholder: '+91 98765 43210', type: 'tel' },
            ].map(({ label, value, set, placeholder, type }) => (
              <div key={label}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input type={type || 'text'} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-2 ${cfg.borderColor}`} />
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters"
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-2 ${cfg.borderColor}`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><EyeOff size={16} /></button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm Password *</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Re-enter password"
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-2 ${cfg.borderColor}`} />
            </div>

            {/* ── CITIZEN FIELDS ── */}
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

            {/* ── CONTRACTOR FIELDS ── */}
            {role === 'contractor' && (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">Company Details</p>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name *</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Apex Buildcon Pvt Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Registration Number *</label>
                  <input value={registrationNo} onChange={e => setRegistrationNo(e.target.value)} placeholder="e.g. CTR-8492-XYZ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Company registered address"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">License Valid Until</label>
                  <input value={licenseValidity} onChange={e => setLicenseValidity(e.target.value)} placeholder="e.g. Dec 2028"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
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

            {/* ── AUTHORITY FIELDS ── */}
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

            <button type="submit" disabled={loading || success}
              className={`w-full py-4 ${cfg.color} text-white rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all mt-2`}>
              {loading ? <><Loader2 size={20} className="animate-spin" />Creating Account...</> : `Register as ${cfg.label}`}
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