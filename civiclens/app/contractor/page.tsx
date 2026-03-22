'use client'

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import {
  X, Upload, Camera, CheckCircle2, AlertTriangle,
  Loader2, Send, User, FileText, TrendingUp, MessageSquare,
  Building, Star, Plus, Phone, Mail, MapPin, Shield,
  Edit2, ChevronRight, Clock, BarChart2, HardHat, Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsContent } from '../../components/SettingsContent';
import { DashboardHeader } from '../../components/DashboardHeader';
import ContractorRatingSummary from '../../components/ContractorRatingSummary';
import { LucideIcon } from 'lucide-react';

type Tab = 'projects' | 'profile' | 'complaints' | 'reports' | 'ratings' | 'settings';
const API = process.env.NEXT_PUBLIC_API_URL;

interface Project {
  _id: string; title: string; description: string; location: string;
  status: string; completionPercentage: number;
  contractor: { name: string; phone: string; email: string };
  authority: { name: string; designation: string; office: string };
  startDate: string; expectedEndDate: string; budget: number;
  reports: { title: string; description: string; completionUpdate: number; uploadedAt: string }[];
  beforePhoto?: string; afterPhoto?: string;
}
interface Complaint {
  _id: string; category: string; description: string; status: string;
  damagePercentage: number; photoVerified: boolean;
  location: { lat: number; lng: number; address: string };
  createdAt: string;
  userId: { name: string; phone: string; email: string };
  contractorReview?: { review: string; estimatedDays: number; actionTaken: string };
}
interface Stats {
  totalProjects: number; activeProjects: number; completedProjects: number;
  totalComplaints: number; pendingComplaints: number;
}

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('civiclens_token') : ''}`,
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});

const timeAgo = (date: string) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  return `${Math.floor(s / 86400)} days ago`;
};

function ContractorDashboardInner() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProjects: 0, activeProjects: 0, completedProjects: 0, totalComplaints: 0, pendingComplaints: 0 });
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => { const tab = searchParams.get('tab') as Tab; if (tab) setActiveTab(tab); }, [searchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authHeader();
      const [projRes, compRes, statsRes] = await Promise.all([
        fetch(`${API}/civic/projects/mine`, { headers }),
        fetch(`${API}/civic/complaints`, { headers }),
        fetch(`${API}/civic/stats/contractor`, { headers }),
      ]);
      const [projData, compData, statsData] = await Promise.all([projRes.json(), compRes.json(), statsRes.json()]);
      if (projData.success) setProjects(projData.projects);
      if (compData.success) setComplaints(compData.complaints);
      if (statsData.success) setStats(statsData.stats);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'projects', label: 'Projects' },
    { id: 'profile', label: 'Profile' },
    { id: 'complaints', label: 'Complaints' },
    { id: 'reports', label: 'Reports' },
    { id: 'ratings', label: 'Ratings' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F0] font-sans">
      <DashboardHeader onProfileClick={() => setActiveTab('settings')} />

      {/* Portal Header */}
      <div className="bg-white px-5 pt-5 pb-0 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md">
            <HardHat size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Contractor Portal</h1>
            <p className="text-xs text-slate-500">{user?.name || 'Contractor'}</p>
          </div>
        </div>

        {/* Scrollable Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-0 no-scrollbar">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 pb-24 max-w-2xl mx-auto">
        {activeTab === 'projects' && <ProjectsTab projects={projects} loading={loading} onRefresh={fetchData} />}
        {activeTab === 'profile' && <ProfileTab user={user} projects={projects} complaints={complaints} />}
        {activeTab === 'complaints' && <ComplaintsTab complaints={complaints} loading={loading} onRefresh={fetchData} />}
        {activeTab === 'reports' && <ReportsTab projects={projects} onRefresh={fetchData} />}
        {activeTab === 'ratings' && (
          <div className="space-y-4">
            <div><h2 className="text-2xl font-bold text-slate-900">My Ratings</h2><p className="text-sm text-slate-500">Citizen feedback on your work</p></div>
            <ContractorRatingSummary />
          </div>
        )}
        {activeTab === 'settings' && <SettingsContent user={user} logout={logout} roleLabel="Contractor" />}
      </div>
    </div>
  );
}

// ─── PROJECTS TAB ─────────────────────────────────────────────────────────────
const ProjectsTab: React.FC<{ projects: Project[]; loading: boolean; onRefresh: () => void }> = ({ projects, loading, onRefresh }) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [authorityName, setAuthorityName] = useState('');
  const [authorityDesignation, setAuthorityDesignation] = useState('');

  const resetForm = () => { setTitle(''); setDescription(''); setLocation(''); setBudget(''); setStartDate(''); setEndDate(''); setAuthorityName(''); setAuthorityDesignation(''); };

  const handleCreate = async () => {
    setError('');
    if (!title.trim()) return setError('Project title required');
    if (!location.trim()) return setError('Location required');
    setSubmitting(true);
    try {
      const userData = JSON.parse(localStorage.getItem('civiclens_user') || '{}');
      const res = await fetch(`${API}/civic/projects`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ title, description, location, budget: Number(budget) || 0, startDate, expectedEndDate: endDate, status: 'upcoming', completionPercentage: 0, contractor: { name: userData.name || 'Contractor', phone: userData.phone || '', email: userData.email || '' }, authority: { name: authorityName || 'TBD', designation: authorityDesignation || '', office: '' } }),
      });
      const data = await res.json();
      if (data.success) { setSuccess('Project created!'); resetForm(); setShowNewForm(false); onRefresh(); setTimeout(() => setSuccess(''), 3000); }
      else setError(data.message || 'Failed');
    } catch { setError('Server error.'); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Active Projects</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your ongoing projects, milestones, and completion photos.</p>
      </div>

      {success && <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-2 text-green-700 text-sm"><CheckCircle2 size={16}/>{success}</div>}

      {/* Create Project Button */}
      <button onClick={() => setShowNewForm(true)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all">
        <Plus size={20} /> Create Project
      </button>

      {/* Projects List */}
      {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
        : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Building size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No projects yet</p>
          </div>
        ) : projects.map(p => (
          <div key={p._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <StatusPill status={p.status} />
                  <h3 className="font-bold text-slate-900 text-lg mt-1">{p.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5"><MapPin size={11}/>{p.location}</div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-600 font-bold text-lg">{p.completionPercentage}%</p>
                  <p className="text-xs text-slate-400">Complete</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${p.completionPercentage}%` }} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <span>{new Date(p.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} — {new Date(p.expectedEndDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                {p.budget > 0 && <span className="ml-auto">₹{p.budget.toLocaleString('en-IN')}</span>}
              </div>
            </div>
            {/* Add Progress Milestone CTA */}
            <div className="border-t border-slate-50 px-4 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center"><TrendingUp size={14} className="text-emerald-600"/></div>
                Add Progress Milestone
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        ))
      }

      {/* Create Project Modal */}
      <AnimatePresence>
        {showNewForm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-h-[92vh] flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div><h2 className="text-xl font-bold">Create New Project</h2><p className="text-xs text-slate-400">Fill in the project details</p></div>
                <button onClick={() => setShowNewForm(false)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
              </div>
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm flex items-center gap-2"><AlertTriangle size={14}/>{error}</div>}
                {[
                  { label: 'Project Title *', value: title, set: setTitle, placeholder: 'e.g. Ward 4 Road Resurfacing' },
                  { label: 'Location *', value: location, set: setLocation, placeholder: 'e.g. MG Road to Station, Hisar' },
                  { label: 'Budget (₹)', value: budget, set: setBudget, placeholder: 'e.g. 5000000', type: 'number' },
                ].map(({ label, value, set, placeholder, type }) => (
                  <div key={label}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                    <input type={type || 'text'} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Project scope and objectives..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Authority Name</label><input type="text" value={authorityName} onChange={e => setAuthorityName(e.target.value)} placeholder="e.g. BDO Adampur" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Designation</label><input type="text" value={authorityDesignation} onChange={e => setAuthorityDesignation(e.target.value)} placeholder="e.g. BDO" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" /></div>
                </div>
                <button onClick={handleCreate} disabled={submitting} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <><Loader2 size={16} className="animate-spin"/>Creating...</> : <><Plus size={16}/>Create Project</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── PROFILE TAB (matches screenshots) ───────────────────────────────────────
const ProfileTab: React.FC<{ user: any; projects: Project[]; complaints: Complaint[] }> = ({ user, projects, complaints }) => {
  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState('Apex Buildcon Pvt Ltd');
  const [regNumber, setRegNumber] = useState('CTR-8492-XYZ');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('123 Business Park, Sector 4, City Center');
  const [licenseValidity, setLicenseValidity] = useState('Dec 2028');
  const [specializations, setSpecializations] = useState(['Road Construction', 'Drainage Systems', 'Public Buildings', 'Bridge Repair']);
  const [avgRating, setAvgRating] = useState(4.2);

  useEffect(() => {
    const saved = localStorage.getItem('civiclens_contractor_profile');
    if (saved) { const s = JSON.parse(saved); setCompanyName(s.companyName||companyName); setRegNumber(s.regNumber||regNumber); setPhone(s.phone||phone); setEmail(s.email||email); setAddress(s.address||address); setLicenseValidity(s.licenseValidity||licenseValidity); }
    // Fetch rating
    const token = localStorage.getItem('civiclens_token');
    fetch(`${API}/ratings/all`, { headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } })
      .then(r => r.json()).then(d => { if (d.success && d.average) setAvgRating(d.average); }).catch(() => {});
  }, []);

  const saveProfile = () => {
    localStorage.setItem('civiclens_contractor_profile', JSON.stringify({ companyName, regNumber, phone, email, address, licenseValidity }));
    setEditing(false);
  };

  const completedProjects = projects.filter(p => p.status === 'completed');

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold text-slate-900">Public Profile</h2><p className="text-sm text-slate-500 mt-1">This is how your profile appears to citizens and authorities.</p></div>

      {!editing ? (
        <button onClick={() => setEditing(true)} className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50">
          <Edit2 size={15} /> Edit Profile
        </button>
      ) : (
        <div className="flex gap-2">
          <button onClick={saveProfile} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-semibold text-sm">Save Changes</button>
          <button onClick={() => setEditing(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-semibold text-sm">Cancel</button>
        </div>
      )}

      {/* Company Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <HardHat size={36} className="text-slate-400" />
        </div>
        {editing ? (
          <div className="space-y-2 mb-3">
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full text-center font-bold text-lg bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500" />
            <input value={regNumber} onChange={e => setRegNumber(e.target.value)} className="w-full text-center text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500" placeholder="Registration Number" />
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-slate-900">{companyName}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Reg: {regNumber}</p>
          </>
        )}
        {/* Rating */}
        <div className="flex items-center justify-center gap-2 mt-3 mb-4">
          <Star size={20} className="text-yellow-400 fill-yellow-400" />
          <span className="text-2xl font-bold text-slate-900">{avgRating.toFixed(1)}</span>
          <span className="text-slate-400 text-sm">/ 5</span>
        </div>
        <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">{projects.length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Projects</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-500">{complaints.filter(c => c.status === 'pending').length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Complaints</p>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Company Details</p>
        <div className="space-y-4">
          {editing ? (
            <>
              <EditRow icon={<Mail size={16}/>} label="Email" value={email} onChange={setEmail} />
              <EditRow icon={<Phone size={16}/>} label="Phone" value={phone} onChange={setPhone} />
              <EditRow icon={<MapPin size={16}/>} label="Address" value={address} onChange={setAddress} />
              <EditRow icon={<Shield size={16}/>} label="License Valid Until" value={licenseValidity} onChange={setLicenseValidity} />
            </>
          ) : (
            <>
              <DetailRow icon={<Mail size={16}/>} label="Email Address" value={email || 'Not set'} />
              <DetailRow icon={<Phone size={16}/>} label="Phone Number" value={phone} />
              <DetailRow icon={<MapPin size={16}/>} label="Registered Address" value={address} />
              <DetailRow icon={<Shield size={16}/>} label="License Validity" value={`Valid until ${licenseValidity}`} valueColor="text-emerald-600" />
            </>
          )}
        </div>
      </div>

      {/* Specializations */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-emerald-600" />
          <p className="font-bold text-slate-900">Specializations</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {specializations.map(s => (
            <span key={s} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">{s}</span>
          ))}
        </div>
      </div>

      {/* Project History */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-emerald-600" />
          <p className="font-bold text-slate-900">Project History</p>
        </div>
        {projects.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">No projects yet</p> :
          projects.map(p => (
            <div key={p._id} className="py-3 border-b border-slate-50 last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusPill status={p.status} small />
                    <span className="text-xs text-slate-400">
                      {new Date(p.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} — {p.status === 'completed' ? new Date(p.expectedEndDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Present'}
                    </span>
                  </div>
                </div>
                {p.status === 'completed' && (
                  <div className="flex items-center gap-1">
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-slate-700">4.5</span>
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string; valueColor?: string }> = ({ icon, label, value, valueColor }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 mt-0.5">{icon}</div>
    <div><p className="text-sm font-semibold text-slate-800">{label}</p><p className={`text-sm ${valueColor || 'text-slate-500'} mt-0.5`}>{value}</p></div>
  </div>
);

const EditRow: React.FC<{ icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void }> = ({ icon, label, value, onChange }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0">{icon}</div>
    <div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label><input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:border-emerald-500" /></div>
  </div>
);

// ─── COMPLAINTS TAB ───────────────────────────────────────────────────────────
const ComplaintsTab: React.FC<{ complaints: Complaint[]; loading: boolean; onRefresh: () => void }> = ({ complaints, loading, onRefresh }) => {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [review, setReview] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetch(`${API}/complaints/${id}/status`, { method: 'PATCH', headers: authHeader(), body: JSON.stringify({ status }) });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleReviewSubmit = async () => {
    if (!selectedComplaint || !review) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/complaints/${selectedComplaint._id}/review`, { method: 'POST', headers: authHeader(), body: JSON.stringify({ review, estimatedDays: Number(estimatedDays), actionTaken }) });
      if (res.ok) { setSelectedComplaint(null); setReview(''); setEstimatedDays(''); setActionTaken(''); onRefresh(); }
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Incoming Complaints</h2>
        <p className="text-sm text-slate-500 mt-1">Review anonymous citizen complaints and AI damage reports.</p>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
        : complaints.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <CheckCircle2 size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No complaints</p>
          </div>
        ) : complaints.map(c => (
          <div key={c._id} onClick={() => setSelectedComplaint(c)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${(c.damagePercentage || 0) >= 40 ? 'bg-red-50' : 'bg-orange-50'}`}>
                <AlertTriangle size={22} className={(c.damagePercentage || 0) >= 40 ? 'text-red-500' : 'text-orange-400'} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{c.category}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5"><Clock size={10}/>{timeAgo(c.createdAt)}</div>
                {(c.damagePercentage || 0) > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Shield size={11} className="text-purple-500" />
                    <span className="text-xs text-purple-600 font-semibold">AI Severity: {c.damagePercentage}%</span>
                  </div>
                )}
                {c.contractorReview ? (
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">Reviewed</span>
                ) : (
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-1 bg-red-100 text-red-600 rounded-full">Action Required</span>
                )}
              </div>
              <ChevronRight size={16} className="text-slate-300 mt-1" />
            </div>
          </div>
        ))
      }

      {/* Complaint Detail Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedComplaint(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Complaint Detail</h2>
                <button onClick={() => setSelectedComplaint(null)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
              </div>
              <div className="p-5 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-slate-400">Category</p><p className="font-bold text-slate-900">{selectedComplaint.category}</p></div>
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-slate-400">Time</p><p className="font-bold text-slate-900">{timeAgo(selectedComplaint.createdAt)}</p></div>
                  {(selectedComplaint.damagePercentage || 0) > 0 && (
                    <div className={`col-span-2 p-3 rounded-xl ${(selectedComplaint.damagePercentage||0) > 70 ? 'bg-red-50' : (selectedComplaint.damagePercentage||0) > 40 ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                      <p className="text-slate-400 text-xs">AI Severity</p>
                      <p className={`font-bold text-base ${(selectedComplaint.damagePercentage||0) > 70 ? 'text-red-600' : (selectedComplaint.damagePercentage||0) > 40 ? 'text-orange-600' : 'text-yellow-600'}`}>
                        {selectedComplaint.damagePercentage}% — {(selectedComplaint.damagePercentage||0) > 70 ? 'Critical' : (selectedComplaint.damagePercentage||0) > 40 ? 'Moderate' : 'Minor'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-xs text-slate-400 mb-1">Description</p><p className="text-sm">{selectedComplaint.description}</p></div>
                {selectedComplaint.contractorReview && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-emerald-700 mb-1">✅ Your Review</p>
                    <p className="text-sm text-emerald-600">{selectedComplaint.contractorReview.review}</p>
                    <p className="text-xs text-emerald-500 mt-1">ETA: {selectedComplaint.contractorReview.estimatedDays} days</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Add Review</label>
                  <textarea value={review} onChange={e => setReview(e.target.value)} rows={3} placeholder="What action will be taken?" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Est. Days</label><input type="number" value={estimatedDays} onChange={e => setEstimatedDays(e.target.value)} placeholder="e.g. 7" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Action</label><input value={actionTaken} onChange={e => setActionTaken(e.target.value)} placeholder="e.g. Team dispatched" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedComplaint.status !== 'in_progress' && <button onClick={() => { handleStatusUpdate(selectedComplaint._id, 'in_progress'); setSelectedComplaint(null); }} className="py-3 bg-blue-500 text-white rounded-2xl text-sm font-bold">Mark In Progress</button>}
                  {selectedComplaint.status !== 'resolved' && <button onClick={() => { handleStatusUpdate(selectedComplaint._id, 'resolved'); setSelectedComplaint(null); }} className="py-3 bg-green-500 text-white rounded-2xl text-sm font-bold">Mark Resolved</button>}
                </div>
                <button onClick={handleReviewSubmit} disabled={submitting || !review} className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── REPORTS TAB ──────────────────────────────────────────────────────────────
const ReportsTab: React.FC<{ projects: Project[]; onRefresh: () => void }> = ({ projects, onRefresh }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completionUpdate, setCompletionUpdate] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedProjectData = projects.find(p => p._id === selectedProject);

  const openCamera = async () => {
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); setCameraStream(stream); setShowCamera(true); setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100); }
    catch { setError('Camera access denied.'); }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current; const c = canvasRef.current; const ctx = c.getContext('2d')!;
    c.width = v.videoWidth; c.height = v.videoHeight; ctx.drawImage(v, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, c.height - 55, c.width, 55);
    ctx.fillStyle = 'white'; ctx.font = 'bold 13px Arial';
    ctx.fillText(`🏗️ ${selectedProjectData?.title || 'Progress Report'} · ${new Date().toLocaleString('en-IN')}`, 10, c.height - 18);
    const url = c.toDataURL('image/jpeg', 0.85);
    setPhoto(url); setPhotoPreview(url); cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); setShowCamera(false);
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedProject) return setError('Select a project');
    if (!title.trim()) return setError('Enter report title');
    if (!description.trim()) return setError('Describe progress');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/civic/projects/${selectedProject}/report`, { method: 'POST', headers: authHeader(), body: JSON.stringify({ title, description, photoBase64: photo, completionUpdate: Number(completionUpdate) }) });
      const data = await res.json();
      if (data.success) { setSubmitted(true); setTitle(''); setDescription(''); setCompletionUpdate(''); setPhoto(null); setPhotoPreview(null); onRefresh(); setTimeout(() => setSubmitted(false), 4000); }
      else setError(data.message || 'Failed');
    } catch { setError('Server error.'); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold text-slate-900">Upload Report</h2><p className="text-sm text-slate-500 mt-1">Upload progress photos and update completion percentage.</p></div>

      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          <div className="flex items-center justify-between p-4"><span className="text-white font-semibold">📸 Site Photo</span><button onClick={() => { cameraStream?.getTracks().forEach(t => t.stop()); setShowCamera(false); }} className="text-white bg-white/20 rounded-full p-2"><X size={20}/></button></div>
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="p-6 flex justify-center bg-black"><button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white flex items-center justify-center"><Camera size={32} className="text-slate-900" /></button></div>
        </div>
      )}

      {submitted && <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-2 text-green-700"><CheckCircle2 size={18}/>Report submitted and project updated!</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-2 text-red-700"><AlertTriangle size={18}/>{error}</div>}

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Project</label>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500">
            <option value="">-- Select project --</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          {selectedProjectData && <p className="text-xs text-emerald-600 mt-1 font-medium">Current: {selectedProjectData.completionPercentage}% complete</p>}
        </div>
        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Report Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Week 4 Progress" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" /></div>
        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Progress Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe work completed..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none" /></div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Updated Completion %</label>
          <div className="flex items-center gap-3">
            <input type="number" min="0" max="100" value={completionUpdate} onChange={e => setCompletionUpdate(e.target.value)} placeholder="e.g. 75" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
            <span className="text-xl font-bold text-emerald-600 w-12 text-right">{completionUpdate||0}%</span>
          </div>
          {completionUpdate && <div className="mt-2 w-full bg-slate-100 rounded-full h-2"><div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100,Number(completionUpdate))}%` }} /></div>}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Site Photo <span className="text-emerald-600 normal-case font-normal">(AI verified)</span></label>
          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200">
              <img src={photoPreview} className="w-full h-48 object-cover" alt="Site" />
              <button onClick={() => { setPhoto(null); setPhotoPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5"><X size={14}/></button>
            </div>
          ) : (
            <button onClick={openCamera} className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors">
              <Camera size={28} className="mb-2" /><span className="text-sm font-bold">Take Site Photo</span><span className="text-xs mt-1">AI verifies construction site</span>
            </button>
          )}
        </div>
        <button onClick={handleSubmit} disabled={submitting} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <><Loader2 size={16} className="animate-spin"/>Uploading...</> : <><Upload size={16}/>Submit Report</>}
        </button>
      </div>
    </div>
  );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const StatusPill: React.FC<{ status: string; small?: boolean }> = ({ status, small }) => {
  const map: Record<string, string> = { in_progress: 'bg-yellow-100 text-yellow-700', delayed: 'bg-red-100 text-red-700', completed: 'bg-green-100 text-green-700', planned: 'bg-blue-100 text-blue-700', pending: 'bg-orange-100 text-orange-700', upcoming: 'bg-purple-100 text-purple-700' };
  const labels: Record<string, string> = { in_progress: 'IN PROGRESS', delayed: 'DELAYED', completed: 'COMPLETED', planned: 'PLANNED', pending: 'PENDING', upcoming: 'UPCOMING' };
  return <span className={`inline-block font-bold rounded-full ${small ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'} ${map[status] || 'bg-slate-100 text-slate-600'}`}>{labels[status] || status.toUpperCase()}</span>;
};

export default function ContractorDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" size={32} /></div>}>
      <ContractorDashboardInner />
    </Suspense>
  );
}