'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import {
  Search, Filter, LayoutGrid, CheckCircle2,
  AlertTriangle, Eye, Map as MapIcon, ShieldAlert,
  User, CheckCircle, X, RefreshCw, Clock,
  XCircle, Loader2, FileText, Building,
  Phone, MapPin, Zap, Droplets, Trash2, Lightbulb, TreePine,
  ChevronDown, ChevronRight, Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsContent } from '../../components/SettingsContent';
import { DashboardHeader } from '../../components/DashboardHeader';

const MapView = dynamic(() => import('../../components/AuthorityMap'), { ssr: false });
const API = process.env.NEXT_PUBLIC_API_URL;
type Tab = 'dashboard' | 'map' | 'alerts' | 'profile';

// ── Hisar Block-wise Structure ─────────────────────────────────────────────
const HISAR_BLOCKS: Record<string, {
  villages: string[];
  officer: string;
  designation: string;
  phone: string;
}> = {
  'Hisar Urban':  { villages: ['Ward 1-5', 'Ward 6-10', 'Ward 11-15', 'Ward 16-20', 'Sector 1-4', 'Sector 5-8'],     officer: 'Sh. Rajesh Kumar',   designation: 'Municipal Commissioner', phone: '01662-239874' },
  'Hisar Rural':  { villages: ['Mirch Pur', 'Butana', 'Rawalwas', 'Sisai', 'Kheri Sad', 'Kumhari'],                   officer: 'Sh. Suresh Sharma',  designation: 'Executive Engineer PWD',  phone: '01662-242156' },
  'Adampur':      { villages: ['Adampur', 'Dhani Machhroli', 'Kaimri', 'Jitpur', 'Fatehpur Pundri', 'Kirtan'],        officer: 'Sh. Deepak Yadav',   designation: 'BDO Adampur',             phone: '01662-267890' },
  'Barwala':      { villages: ['Barwala', 'Balsamand', 'Sandila', 'Dhansu', 'Ghangala', 'Badshapur'],                 officer: 'Sh. Deepak Arora',   designation: 'BDO Barwala',             phone: '01662-267891' },
  'Hansi':        { villages: ['Hansi City', 'Kinala', 'Umarwas', 'Dhani Fatu', 'Bas Peepal', 'Mundhal'],             officer: 'Smt. Kavita Singh',  designation: 'SDM Hansi',               phone: '01663-256890' },
  'Narnaund':     { villages: ['Narnaund', 'Kirmara', 'Gangwa', 'Sisar Khas', 'Dhani Mahu', 'Bahbalpur'],             officer: 'Sh. Harish Goyal',   designation: 'BDO Narnaund',            phone: '01663-234567' },
  'Uklana':       { villages: ['Uklana Mandi', 'Mastapur', 'Rajli', 'Sanch', 'Chhappar', 'Kharkhara'],               officer: 'Sh. Mahesh Yadav',   designation: 'BDO Uklana',              phone: '01663-212345' },
  'Agroha':       { villages: ['Agroha', 'Sarsod', 'Dhigal', 'Asron', 'Sahlon', 'Kharak Kalan'],                     officer: 'Sh. Vinod Kumar',    designation: 'BDO Agroha',              phone: '01662-278901' },
  'Bass':         { villages: ['Bass', 'Majra', 'Kheri Naru', 'Dabra', 'Sekhu', 'Sohansra'],                          officer: 'Sh. Raman Sharma',   designation: 'BDO Bass',                phone: '01662-289012' },
  'Litani':       { villages: ['Litani', 'Shekhupur', 'Balah', 'Salar', 'Badopal', 'Dhani Masitan'],                  officer: 'Sh. Pawan Gupta',    designation: 'BDO Litani',              phone: '01662-290123' },
};

// ── Types — use optional block to avoid conflicts with AuthorityMap ────────
type Complaint = {
  _id: string;
  category: string;
  description: string;
  status: string;
  photoUrl?: string;
  damagePercentage?: number;
  aiDetails?: string;
  photoVerified?: boolean;
  location: {
    lat: number;
    lng: number;
    address: string;
    block?: string | undefined;
  };
  userId: { name: string; email: string; phone: string };
  contractorReview?: { review: string; estimatedDays: number; actionTaken: string };
  createdAt: string;
};

type Project = {
  _id: string;
  title: string;
  location: string;
  status: string;
  completionPercentage: number;
  contractor: { name: string; phone: string };
  authority: { name: string };
  budget: number;
  reports?: { title: string; completionUpdate: number; uploadedAt: string }[];
};

const catIcon: Record<string, React.ReactNode> = {
  'Road & Infrastructure': <Building size={13} />,
  'Water Supply':          <Droplets size={13} />,
  'Electricity':           <Zap size={13} />,
  'Sanitation':            <Trash2 size={13} />,
  'Street Light':          <Lightbulb size={13} />,
  'Drainage':              <Droplets size={13} />,
  'Park':                  <TreePine size={13} />,
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending:     'bg-amber-100 text-amber-700',
    in_progress: 'bg-purple-100 text-purple-700',
    resolved:    'bg-emerald-100 text-emerald-700',
    rejected:    'bg-red-100 text-red-700',
    verified:    'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize whitespace-nowrap ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const DamageTag = ({ pct }: { pct: number }) => (
  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${pct > 70 ? 'bg-red-100 text-red-600' : pct > 40 ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'}`}>
    {pct > 70 ? '🔴 CRITICAL' : pct > 40 ? '🟠 MODERATE' : '🟡 MINOR'} {pct}%
  </span>
);

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('civiclens_token') : ''}`,
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});

export default function AuthorityDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab]           = useState<Tab>('dashboard');
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showFilters, setShowFilters]       = useState(false);
  const [statusFilter, setStatusFilter]     = useState('all');
  const [loading, setLoading]               = useState(true);
  const [complaints, setComplaints]         = useState<Complaint[]>([]);
  const [projects, setProjects]             = useState<Project[]>([]);
  const [updatingId, setUpdatingId]         = useState<string | null>(null);
  const [toast, setToast]                   = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [selectedBlock, setSelectedBlock]   = useState<string | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<string | null>(null);
  const [expandedBlock, setExpandedBlock]   = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authHeader();
      const [compRes, projRes] = await Promise.all([
        fetch(`${API}/complaints/all`, { headers }),
        fetch(`${API}/civic/projects`, { headers }),
      ]);
      const [compData, projData] = await Promise.all([compRes.json(), projRes.json()]);
      if (compData.success) setComplaints(compData.complaints);
      if (projData.success) setProjects(projData.projects);
    } catch { showToast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API}/complaints/${id}/status`, {
        method: 'PATCH', headers: authHeader(), body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, status } : c));
        if (selectedComplaint?._id === id) setSelectedComplaint(prev => prev ? { ...prev, status } : null);
        showToast(`Updated to ${status.replace('_', ' ')}`);
      } else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Server error', 'error'); }
    finally { setUpdatingId(null); }
  };

  // Filter complaints by block / village / search / status
  const filteredComplaints = complaints.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch  = !q || c.category.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const matchStatus  = statusFilter === 'all' || c.status === statusFilter;
    const matchBlock   = !selectedBlock   || (c.location?.block === selectedBlock)   || c.location?.address?.includes(selectedBlock);
    const matchVillage = !selectedVillage || c.location?.address?.includes(selectedVillage);
    return matchSearch && matchStatus && matchBlock && matchVillage;
  });

  // Derived stats
  const stats = {
    total:      complaints.length,
    pending:    complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    resolved:   complaints.filter(c => c.status === 'resolved').length,
    critical:   complaints.filter(c => (c.damagePercentage || 0) > 70 && c.status === 'pending').length,
  };
  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
  const avgDamage      = complaints.length > 0 ? Math.round(complaints.reduce((s, c) => s + (c.damagePercentage || 0), 0) / complaints.length) : 0;

  const getBlockStats = (blockName: string) => {
    const bc = complaints.filter(c =>
      c.location?.block === blockName || c.location?.address?.includes(blockName)
    );
    return {
      total:    bc.length,
      pending:  bc.filter(c => c.status === 'pending').length,
      critical: bc.filter(c => (c.damagePercentage || 0) > 70).length,
    };
  };

  const categoryCount = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1; return acc;
  }, {} as Record<string, number>);
  const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="p-4 space-y-5 pb-28">

      {/* Hisar Header */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Haryana Government</p>
            <h1 className="text-2xl font-bold mt-0.5">Hisar District</h1>
            <p className="text-blue-200 text-sm">{user?.name || 'Authority Officer'}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{resolutionRate}%</p>
            <p className="text-blue-200 text-xs">Resolution Rate</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[{ l: 'Total', v: stats.total, e: '📋' }, { l: 'Pending', v: stats.pending, e: '⏳' }, { l: 'Resolved', v: stats.resolved, e: '✅' }, { l: 'Critical', v: stats.critical, e: '🚨' }].map(({ l, v, e }) => (
            <div key={l} className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-lg">{e}</p><p className="font-bold text-sm">{v}</p><p className="text-blue-200 text-[9px]">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Search complaints..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <button onClick={fetchAll} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
        <button onClick={() => setShowFilters(true)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500"><Filter size={16} /></button>
      </div>

      {/* ── Block-wise Accordion ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-900">Block-wise Overview</h2>
          </div>
          {selectedBlock && (
            <button onClick={() => { setSelectedBlock(null); setSelectedVillage(null); setExpandedBlock(null); }}
              className="text-xs text-blue-600 font-bold flex items-center gap-1">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-50">
          {Object.entries(HISAR_BLOCKS).map(([blockName, blockData]) => {
            const bs         = getBlockStats(blockName);
            const isExpanded = expandedBlock === blockName;
            const isSelected = selectedBlock  === blockName;

            return (
              <div key={blockName}>
                {/* Block Row */}
                <div
                  className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                  onClick={() => {
                    setExpandedBlock(isExpanded ? null : blockName);
                    setSelectedBlock(isSelected ? null : blockName);
                    setSelectedVillage(null);
                  }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-500' : 'bg-slate-100'}`}>
                    <MapPin size={16} className={isSelected ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${isSelected ? 'text-blue-600' : 'text-slate-900'}`}>{blockName}</p>
                    <p className="text-xs text-slate-400 truncate">{blockData.officer}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {bs.critical > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">🚨{bs.critical}</span>}
                    {bs.pending  > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">⏳{bs.pending}</span>}
                    <span className="text-xs text-slate-400 w-4 text-right">{bs.total}</span>
                    {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </div>
                </div>

                {/* Villages (expanded) */}
                {isExpanded && (
                  <div className="bg-slate-50 px-3 pb-3">
                    {/* Officer info */}
                    <div className="bg-white rounded-xl p-3 mt-2 flex items-center gap-3 border border-slate-100">
                      <ShieldAlert size={16} className="text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{blockData.officer}</p>
                        <p className="text-[10px] text-slate-400">{blockData.designation} · {blockData.phone}</p>
                      </div>
                    </div>

                    {/* Village chips */}
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-2">Villages / Wards</p>
                    <div className="flex flex-wrap gap-1.5">
                      {blockData.villages.map(village => (
                        <button key={village} onClick={() => setSelectedVillage(selectedVillage === village ? null : village)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${selectedVillage === village ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50'}`}>
                          {village}
                        </button>
                      ))}
                    </div>

                    {/* CTA */}
                    {isSelected && (
                      <button onClick={() => setActiveTab('alerts')}
                        className="w-full mt-3 py-2 text-xs text-blue-600 font-bold text-center bg-blue-50 rounded-xl">
                        View {bs.total} complaint{bs.total !== 1 ? 's' : ''} in {blockName} →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Area Health */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">
            Area Health {selectedBlock ? `— ${selectedBlock}` : '— Hisar'}
            {selectedVillage ? ` › ${selectedVillage}` : ''}
          </h2>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Resolved',    value: resolutionRate, color: 'bg-emerald-500' },
            { label: 'In Progress', value: stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0, color: 'bg-purple-500' },
            { label: 'Pending',     value: stats.total > 0 ? Math.round((stats.pending    / stats.total) * 100) : 0, color: 'bg-amber-500'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${color}`} /><span className="text-slate-600">{label}</span></div>
                <span className="font-bold text-slate-900">{value}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} className={`h-full ${color} rounded-full`} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <p className="text-2xl font-bold text-red-600">{avgDamage}%</p>
            <p className="text-[10px] text-red-400">Avg Damage</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">{stats.critical}</p>
            <p className="text-[10px] text-blue-400">Critical Issues</p>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h2 className="font-bold text-slate-900 mb-3">Top Complaint Categories</h2>
        {topCategories.length === 0
          ? <p className="text-slate-400 text-sm text-center py-4">No data yet</p>
          : topCategories.map(([cat, count]) => (
            <div key={cat} className="mb-3">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1">{catIcon[cat]}{cat}</span>
                <span className="text-blue-600">{count}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(count / complaints.length) * 100}%` }} />
              </div>
            </div>
          ))
        }
      </div>

      {/* Projects Monitoring */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Project Monitoring</h2>
          <button onClick={() => setActiveTab('map')} className="text-xs text-blue-600 font-bold flex items-center gap-1"><MapIcon size={12} />Map</button>
        </div>
        {projects.length === 0
          ? <p className="text-slate-400 text-sm text-center py-6">No projects found</p>
          : projects.map(p => (
            <div key={p._id} className="p-4 border-b border-slate-50 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-400">{p.location} · ₹{p.budget?.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-500">{p.contractor.name} · {p.contractor.phone}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${p.completionPercentage}%` }} />
                </div>
                <span className="text-xs font-bold text-blue-600">{p.completionPercentage}%</span>
              </div>
              {p.reports && p.reports.length > 0 && (
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <FileText size={10} />{p.reports.length} reports uploaded
                </p>
              )}
            </div>
          ))
        }
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /><h2 className="font-bold text-slate-900">Recent Complaints</h2></div>
          <button onClick={() => setActiveTab('alerts')} className="text-xs text-blue-600 font-bold">View All</button>
        </div>
        {filteredComplaints.slice(0, 4).map(c => (
          <div key={c._id} className="p-4 border-b border-slate-50 last:border-0 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">{catIcon[c.category]}{c.category}</span>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-sm text-slate-700 line-clamp-1">{c.description}</p>
            <div className="flex items-center justify-between">
              {(c.damagePercentage || 0) > 0 && <DamageTag pct={c.damagePercentage!} />}
              <button onClick={() => setSelectedComplaint(c)} className="ml-auto flex items-center gap-1 text-xs text-blue-600 font-semibold">
                <Eye size={12} />Review
              </button>
            </div>
          </div>
        ))}
        {filteredComplaints.length === 0 && !loading && (
          <div className="p-6 text-center text-slate-400 text-sm">
            No complaints {selectedBlock ? `in ${selectedBlock}` : ''}
          </div>
        )}
      </div>

      <button onClick={() => setActiveTab('map')} className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
        <MapIcon size={16} /> Open Hisar District Map
      </button>
    </div>
  );

  // ── ALERTS TAB ─────────────────────────────────────────────────────────────
  const renderAlerts = () => (
    <div className="p-4 space-y-4 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Complaints</h2>
          {selectedBlock && (
            <p className="text-sm text-blue-600 font-medium">
              {selectedBlock}{selectedVillage ? ` › ${selectedVillage}` : ''}
            </p>
          )}
        </div>
        <span className="text-xs font-bold text-slate-400">{filteredComplaints.length}</span>
      </div>

      {/* Block quick-filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => { setSelectedBlock(null); setSelectedVillage(null); }}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${!selectedBlock ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
          All Blocks
        </button>
        {Object.keys(HISAR_BLOCKS).map(b => (
          <button key={b} onClick={() => { setSelectedBlock(b); setSelectedVillage(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${selectedBlock === b ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {b}
          </button>
        ))}
      </div>

      {/* Village sub-filter */}
      {selectedBlock && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => setSelectedVillage(null)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${!selectedVillage ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            All Villages
          </button>
          {HISAR_BLOCKS[selectedBlock]?.villages.map(v => (
            <button key={v} onClick={() => setSelectedVillage(v)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${selectedVillage === v ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['all', 'pending', 'in_progress', 'resolved', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${statusFilter === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {s === 'all' ? 'All Status' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading
        ? <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
        : (
          <div className="space-y-3">
            {filteredComplaints.map(c => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">{catIcon[c.category]}{c.category}</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{c.userId?.name || 'Citizen'}</p>
                    <p className="text-xs text-slate-400">{c.userId?.phone}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-sm text-slate-600">{c.description}</p>
                {(c.damagePercentage || 0) > 0 && <DamageTag pct={c.damagePercentage!} />}
                {c.aiDetails && <p className="text-[10px] text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-xl">🤖 {c.aiDetails}</p>}
                {c.contractorReview && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 text-xs">
                    <p className="font-bold text-emerald-700">Contractor: {c.contractorReview.review}</p>
                    <p className="text-emerald-500">ETA: {c.contractorReview.estimatedDays} days</p>
                  </div>
                )}
                <p className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setSelectedComplaint(c)} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"><Eye size={12} /> Review</button>
                  {c.status === 'pending' && (
                    <button onClick={() => updateStatus(c._id, 'in_progress')} disabled={updatingId === c._id}
                      className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50">
                      {updatingId === c._id ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />} Start
                    </button>
                  )}
                  {c.status === 'in_progress' && (
                    <button onClick={() => updateStatus(c._id, 'resolved')} disabled={updatingId === c._id}
                      className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50">
                      {updatingId === c._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Resolve
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {filteredComplaints.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No complaints {selectedBlock ? `in ${selectedBlock}` : ''}{selectedVillage ? ` › ${selectedVillage}` : ''}
              </div>
            )}
          </div>
        )
      }
    </div>
  );

  // ── MAP TAB ────────────────────────────────────────────────────────────────
  const renderMap = () => (
    <div className="flex flex-col p-4 gap-4 pb-28" style={{ minHeight: '80vh' }}>
      <div>
        <h2 className="text-xl font-bold text-slate-900">Hisar District Map</h2>
        <p className="text-xs text-slate-500">Haryana · 3983 sq km · 10 Blocks · 274 Villages</p>
      </div>
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden" style={{ minHeight: '55vh' }}>
        {/* cast to any to avoid Complaint type conflict with AuthorityMap */}
        <MapView complaints={complaints as any} />
      </div>
      <div className="flex gap-3 flex-wrap text-xs font-bold">
        {[{ color: 'bg-amber-500', label: 'Pending' }, { color: 'bg-purple-500', label: 'In Progress' }, { color: 'bg-emerald-500', label: 'Resolved' }, { color: 'bg-red-500', label: 'Critical 40%+' }].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded-full ${color}`} /><span className="text-slate-600">{label}</span></div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">HISAR BLOCKS</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(HISAR_BLOCKS).map(([b]) => {
            const bs = getBlockStats(b);
            return (
              <div key={b} onClick={() => setSelectedBlock(b === selectedBlock ? null : b)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${selectedBlock === b ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-blue-50'}`}>
                <span className="font-medium">{b}</span>
                {bs.total > 0 && <span className={`font-bold ${selectedBlock === b ? 'text-white' : 'text-blue-600'}`}>{bs.total}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <DashboardHeader onProfileClick={() => setActiveTab('profile')} />

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'map'       && renderMap()}
            {activeTab === 'alerts'    && renderAlerts()}
            {activeTab === 'profile'   && (
              <div className="p-4 pb-28">
                <SettingsContent user={user} logout={logout} roleLabel="Authority" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Complaint Detail Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedComplaint(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold">Complaint Detail</h3>
                <button onClick={() => setSelectedComplaint(null)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-slate-400">Category</p><p className="font-bold">{selectedComplaint.category}</p></div>
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-slate-400">Status</p><StatusBadge status={selectedComplaint.status} /></div>
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-slate-400">Citizen</p><p className="font-bold">{selectedComplaint.userId?.name}</p></div>
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-slate-400">Phone</p><p className="font-bold">{selectedComplaint.userId?.phone || 'N/A'}</p></div>
                  {(selectedComplaint.damagePercentage || 0) > 0 && (
                    <div className="col-span-2 bg-red-50 p-3 rounded-xl">
                      <p className="text-red-400 text-xs">AI Damage</p>
                      <DamageTag pct={selectedComplaint.damagePercentage!} />
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-xs text-slate-400 mb-1">Description</p><p className="text-sm">{selectedComplaint.description}</p></div>
                {selectedComplaint.aiDetails && (
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-400 font-bold mb-1">🤖 AI Analysis</p>
                    <p className="text-sm text-blue-700">{selectedComplaint.aiDetails}</p>
                  </div>
                )}
                {selectedComplaint.contractorReview && (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-bold mb-1">Contractor Review</p>
                    <p className="text-sm text-emerald-700">{selectedComplaint.contractorReview.review}</p>
                    <p className="text-xs text-emerald-500 mt-1">ETA: {selectedComplaint.contractorReview.estimatedDays} days · {selectedComplaint.contractorReview.actionTaken}</p>
                  </div>
                )}
                {selectedComplaint.photoUrl && (
                  <img src={selectedComplaint.photoUrl} alt="Evidence" className="w-full h-44 object-cover rounded-2xl" />
                )}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {selectedComplaint.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(selectedComplaint._id, 'in_progress')} disabled={!!updatingId}
                        className="py-3 bg-amber-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-1 disabled:opacity-50">
                        <Clock size={14} /> Start Work
                      </button>
                      <button onClick={() => updateStatus(selectedComplaint._id, 'rejected')} disabled={!!updatingId}
                        className="py-3 bg-red-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-1 disabled:opacity-50">
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                  {(selectedComplaint.status === 'in_progress' || selectedComplaint.status === 'verified') && (
                    <button onClick={() => updateStatus(selectedComplaint._id, 'resolved')} disabled={!!updatingId}
                      className="col-span-2 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                      <CheckCircle size={16} /> Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 relative z-10 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-lg">Filter Complaints</h3>
                <button onClick={() => setShowFilters(false)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {['all', 'pending', 'in_progress', 'resolved', 'rejected'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                      {s === 'all' ? 'All' : s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setStatusFilter('all'); setShowFilters(false); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Reset</button>
                <button onClick={() => { fetchAll(); setShowFilters(false); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">Apply</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-xl text-white text-sm font-bold flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
        {[
          { id: 'dashboard', icon: LayoutGrid,  label: 'Home'    },
          { id: 'map',       icon: MapIcon,      label: 'Map'     },
          { id: 'alerts',    icon: ShieldAlert,  label: 'Alerts'  },
          { id: 'profile',   icon: User,         label: 'Profile' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id as Tab)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === id ? 'text-blue-600' : 'text-slate-400'}`}>
            <Icon size={24} /><span className="text-[10px] font-bold">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}