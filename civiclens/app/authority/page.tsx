'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Search, Filter, LayoutGrid, CheckCircle2, Users, 
  MessageSquare, AlertTriangle, Eye, Map as MapIcon, ShieldAlert, 
  User, ChevronRight, TrendingUp, TrendingDown, CheckCircle, 
  MessageCircle, LogOut, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsContent } from '../../components/SettingsContent';
import { DashboardHeader } from '../../components/DashboardHeader';

type Tab = 'dashboard' | 'map' | 'alerts' | 'profile';

export default function AuthorityDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showTransparencyDetails, setShowTransparencyDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const notifications = [
    { id: 1, text: 'New critical escalation in Ward 5', time: '5m ago', unread: true },
    { id: 2, text: 'BuildRight Infra submitted a report', time: '1h ago', unread: true },
    { id: 3, text: 'Monthly transparency score updated', time: '1d ago', unread: false },
  ];

  const escalations = [
    { id: 'CMP-001', title: 'Main Street Paving', status: 'Escalated', severity: '65%', date: '2024-05-20', description: 'Large pothole formed near the intersection. Dangerous for two-wheelers.', color: 'red' },
    { id: 'CMP-002', title: 'Ward 5 Drainage', status: 'Under Review', severity: '45%', date: '2024-05-18', description: 'Drainage pipes left open on the sidewalk for over a week.', color: 'amber' },
    { id: 'CMP-003', title: 'Community Center Roof', status: 'Pending', severity: '25%', date: '2024-05-22', description: 'Water leakage reported in the main hall after recent rains.', color: 'blue' },
  ];

  const projects = [
    { id: 'PRJ-101', name: 'Main Street Paving', contractor: 'BuildRight Infra', status: 'Damaged', color: 'red' },
    { id: 'PRJ-102', name: 'Ward 5 Drainage', contractor: 'CityWorks Ltd', status: 'In Progress', color: 'amber' },
    { id: 'PRJ-103', name: 'Public Park Lighting', contractor: 'BrightLights Co', status: 'Good', color: 'emerald' },
    { id: 'PRJ-104', name: 'New Primary School', contractor: 'EduBuild', status: 'In Progress', color: 'amber' },
  ];

  const renderDashboard = () => (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-[#001f3f]">Authority Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, {user?.name?.split(' ')[0] || 'Rajesh'}.</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search projects or complaints..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <button 
          onClick={() => setShowFilters(true)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Projects */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-100">
              <LayoutGrid size={16} />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <TrendingUp size={12} />
              <span>+3 this month</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">42</h3>
          <p className="text-xs text-slate-500 mt-1">Total Projects</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-100">
              <CheckCircle2 size={16} />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <TrendingUp size={12} />
              <span>+5%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">84%</h3>
          <p className="text-xs text-slate-500 mt-1">Completion Rate</p>
        </div>

        {/* Avg Contractor Rating */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-100">
              <Users size={16} />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-red-500">
              <TrendingDown size={12} />
              <span>-0.1</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">4.2</h3>
          <p className="text-xs text-slate-500 mt-1">Avg Contractor Rating</p>
        </div>

        {/* Open Complaints */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-100">
              <MessageSquare size={16} />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <TrendingUp size={12} />
              <span>-4</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">18</h3>
          <p className="text-xs text-slate-500 mt-1">Open Complaints</p>
        </div>
      </div>

      {/* Critical Escalations */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            <h2 className="font-bold text-[#001f3f] text-lg">Critical Escalations</h2>
          </div>
          <button 
            onClick={() => setActiveTab('alerts')}
            className="text-blue-600 text-sm font-semibold hover:underline"
          >
            View All
          </button>
        </div>
        
        <div className="divide-y divide-slate-50">
          {escalations.slice(0, 2).map((esc) => (
            <div key={esc.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">{esc.id}</span>
                  <span className={`px-2 py-0.5 bg-${esc.color}-100 text-${esc.color}-600 text-[10px] font-bold rounded-full uppercase`}>
                    {esc.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-600">{esc.severity} Severity</div>
                  <div className="text-[10px] text-slate-400">{esc.date}</div>
                </div>
              </div>
              <h3 className="font-bold text-[#001f3f] text-lg">{esc.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-2">{esc.description}</p>
              <div className="flex items-center justify-between pt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/${esc.id}${i}/32/32`} className="w-6 h-6 rounded-full border border-white" alt="" referrerPolicy="no-referrer" />
                  ))}
                  <div className="w-6 h-6 rounded-full border border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">+12</div>
                </div>
                <button 
                  onClick={() => setSelectedReport(esc.id)}
                  className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <Eye size={16} />
                  Review AI Report <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Monitoring */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50">
          <h2 className="font-bold text-[#001f3f] text-lg">Project Monitoring</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 font-bold uppercase tracking-wider border-b border-slate-50">
              <tr>
                <th className="px-5 py-4">Project</th>
                <th className="px-5 py-4">Contractor</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="font-bold text-[#001f3f]">{proj.name}</div>
                    <div className="text-xs text-slate-400">{proj.id}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{proj.contractor}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 bg-${proj.color}-100 text-${proj.color}-600 text-xs font-bold rounded-full whitespace-nowrap`}>
                      {proj.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Area Health */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5">
        <h2 className="font-bold text-[#001f3f] text-lg mb-4">Area Health</h2>
        <div className="relative rounded-2xl overflow-hidden h-48 mb-4">
          <img src="https://picsum.photos/seed/map2/800/400?blur=2" className="w-full h-full object-cover opacity-80" alt="Map" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Map Markers */}
          <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
          <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              onClick={() => setActiveTab('map')}
              className="bg-white px-4 py-2 rounded-full font-bold text-sm text-[#001f3f] shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <MapIcon size={16} className="text-blue-600" />
              Open Interactive Map
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Good Condition</span>
            </div>
            <span className="font-bold text-[#001f3f]">65%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-600">Under Maintenance</span>
            </div>
            <span className="font-bold text-[#001f3f]">22%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-600">Critical Damage</span>
            </div>
            <span className="font-bold text-[#001f3f]">13%</span>
          </div>
        </div>
      </div>

      {/* Transparency Score */}
      <div className="bg-blue-600 rounded-[24px] p-6 text-white shadow-lg shadow-blue-600/20 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-50" />
        <div className="relative z-10">
          <h2 className="font-bold text-blue-100 text-lg mb-2">Transparency Score</h2>
          <div className="text-5xl font-black mb-4 tracking-tight">92<span className="text-2xl text-blue-200">/100</span></div>
          <p className="text-blue-100 text-sm leading-relaxed mb-6">
            Your district is performing in the top 5% for infrastructure accountability.
          </p>
          <button 
            onClick={() => setShowTransparencyDetails(true)}
            className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-blue-50 transition-colors"
          >
            <TrendingUp size={16} />
            View Full Report
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5">
        <h2 className="font-bold text-[#001f3f] text-lg mb-4">Recent Activity</h2>
        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="mt-0.5">
              <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <CheckCircle size={12} />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#001f3f]">Project PRJ-103 marked as completed</p>
              <p className="text-xs text-slate-400 mt-1">2h ago</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="mt-0.5">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <MessageCircle size={12} />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#001f3f]">New complaint filed for Ward 5</p>
              <p className="text-xs text-slate-400 mt-1">4h ago</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="mt-0.5">
              <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <Users size={12} />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#001f3f]">{"Contractor 'CityWorks' rating updated"}</p>
              <p className="text-xs text-slate-400 mt-1">1d ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="h-full flex flex-col p-4 space-y-4">
      <h2 className="text-xl font-bold text-[#001f3f]">Infrastructure Map</h2>
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden relative">
        <img 
          src="https://picsum.photos/seed/fullmap/1200/800" 
          className="w-full h-full object-cover" 
          alt="Full Map" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/10" />
        
        {/* Interactive Markers */}
        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute top-1/4 left-1/4 group cursor-pointer"
        >
          <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-bounce">
            <AlertTriangle size={12} className="text-white" />
          </div>
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            <p className="text-xs font-bold">Main Street Paving</p>
            <p className="text-[10px] text-red-500">Critical Damage</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute bottom-1/3 right-1/4 group cursor-pointer"
        >
          <div className="w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
            <CheckCircle size={12} className="text-white" />
          </div>
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            <p className="text-xs font-bold">Public Park Lighting</p>
            <p className="text-[10px] text-emerald-500">Completed</p>
          </div>
        </motion.div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <Search size={20} />
          </button>
          <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <Filter size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-[#001f3f]">Critical Alerts</h2>
      <div className="space-y-4">
        {escalations.map((esc) => (
          <motion.div 
            key={esc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">{esc.id}</span>
                <span className={`px-2 py-0.5 bg-${esc.color}-100 text-${esc.color}-600 text-[10px] font-bold rounded-full uppercase`}>
                  {esc.status}
                </span>
              </div>
              <div className="text-sm font-bold text-red-600">{esc.severity} Severity</div>
            </div>
            <h3 className="font-bold text-[#001f3f] text-lg">{esc.title}</h3>
            <p className="text-sm text-slate-600">{esc.description}</p>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setSelectedReport(esc.id)}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                AI Analysis
              </button>
              <button className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
                Assign Task
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <SettingsContent user={user} logout={logout} roleLabel="Authority" />
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#001a3d] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <DashboardHeader onProfileClick={() => setActiveTab('profile')} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'map' && renderMap()}
            {activeTab === 'alerts' && renderAlerts()}
            {activeTab === 'profile' && renderProfile()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* AI Report Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#001f3f]">AI Analysis Report</h3>
                  <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">
                    <CheckCircle size={24} />
                  </button>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                    <ShieldAlert size={18} />
                    <span>AI Verdict: High Severity</span>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Based on 15+ citizen reports and image analysis, there is a significant structural risk. The contractor&apos;s last update was 12 days ago, which exceeds the SLA for critical repairs.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Recommended Actions:</h4>
                  <ul className="space-y-2">
                    {['Dispatch emergency repair team', 'Issue formal warning to BuildRight Infra', 'Notify local ward councilor'].map((action, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Approve Actions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transparency Details Modal */}
      <AnimatePresence>
        {showTransparencyDetails && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTransparencyDetails(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#001f3f]">Transparency Breakdown</h3>
                  <button onClick={() => setShowTransparencyDetails(false)} className="text-slate-400 hover:text-slate-600">
                    <CheckCircle size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Public Data Accessibility', score: 95 },
                    { label: 'Contractor Accountability', score: 88 },
                    { label: 'Citizen Response Time', score: 92 },
                    { label: 'Budget Utilization Clarity', score: 94 },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-bold text-[#001f3f]">{item.score}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${item.score}%` }}
                          className="h-full bg-blue-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 italic">
                  * Scores are calculated based on real-time data from the last 30 days.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#001f3f]">Filter Projects</h3>
                  <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                    <CheckCircle size={24} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'In Progress', 'Completed', 'Damaged', 'Pending'].map(s => (
                        <button key={s} className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${s === 'All' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-600'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Severity Level</label>
                    <div className="flex flex-wrap gap-2">
                      {['Low', 'Medium', 'High', 'Critical'].map(s => (
                        <button key={s} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-full text-xs font-bold hover:border-blue-600 transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 pb-safe">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'map' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <MapIcon size={24} />
          <span className="text-[10px] font-bold">Map</span>
        </button>
        <button 
          onClick={() => setActiveTab('alerts')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'alerts' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <ShieldAlert size={24} />
          <span className="text-[10px] font-bold">Alerts</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <User size={24} />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>
    </div>
  );
}
