'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Loader2, LayoutDashboard, Map as MapIcon, 
  AlertCircle, User, Shield, HardHat, Mic, Search, 
  Bell, Menu, X, ChevronRight, CheckCircle2, Clock, 
  BarChart3, Camera, LogOut, Settings, ChevronDown, 
  Home, Plus, Send, Bot, Sparkles, Minus, Phone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsContent } from '../../components/SettingsContent';
import { DashboardHeader } from '../../components/DashboardHeader';
import { LucideIcon } from 'lucide-react';

type Tab = 'overview' | 'map' | 'complaints' | 'analytics' | 'settings';

export default function CitizenDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showAuthority, setShowAuthority] = useState(false);
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const [locationName, setLocationName] = useState('Fetching location...');
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTimeout(() => {
            setLocationName("Uklana Mandi, Haryana");
            setIsFetchingLocation(false);
          }, 2000);
        },
        (error: GeolocationPositionError) => {
          setLocationName("Location Access Denied");
          setIsFetchingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }  else {
  setTimeout(() => {
    setLocationName("Geolocation not supported");
    setIsFetchingLocation(false);
  }, 0);
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 border-r border-slate-200 flex-col p-8 bg-white shrink-0 h-full">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
            <img 
              src="https://picsum.photos/seed/civiclens-logo/200/200" 
              alt="Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">CivicLens</span>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <NavItem icon={MapIcon} label="Live Map" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
          <NavItem icon={AlertCircle} label="Complaints" active={activeTab === 'complaints'} onClick={() => setActiveTab('complaints')} />
          <NavItem icon={BarChart3} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100">
          <div 
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 shrink-0">
              <User size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-slate-900">{user?.name || 'Citizen'}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Citizen</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <DashboardHeader onProfileClick={() => setActiveTab('settings')} />
        <main className="flex-1 overflow-y-auto px-5 py-8 space-y-8 pb-32">
          {activeTab === 'overview' && (
            <OverviewTab 
              user={user} 
              locationName={locationName} 
              isFetchingLocation={isFetchingLocation} 
              setShowSettings={setShowSettings} 
              setShowProjects={setShowProjects} 
              setShowAuthority={setShowAuthority} 
              setActiveTab={setActiveTab} 
            />
          )}
          {activeTab === 'map' && <MapTab locationName={locationName} />}
          {activeTab === 'complaints' && <ComplaintsTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'settings' && <SettingsContent user={user} logout={logout} roleLabel="Citizen" />}
        </main>

        {/* Floating Voice Agent Button */}
        <div className="fixed bottom-24 right-6 z-[90] flex flex-col items-end gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowVoiceAgent(true)}
            className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent pointer-events-none" />
            <Bot size={32} className="group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
          </motion.button>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 py-3 flex items-center justify-between z-50 h-20">
          <div className="flex flex-1 items-center justify-around">
            <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 ${activeTab === 'overview' ? 'text-blue-500' : 'text-slate-400'}`}>
              <Home size={24} />
              <span className="text-[10px] font-bold">Home</span>
            </button>
            <button onClick={() => setActiveTab('complaints')} className={`flex flex-col items-center gap-1 ${activeTab === 'complaints' ? 'text-blue-500' : 'text-slate-400'}`}>
              <AlertCircle size={24} />
              <span className="text-[10px] font-bold">Complaint</span>
            </button>
          </div>

          <div className="relative -top-6">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab('map')}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white ${activeTab === 'map' ? 'bg-blue-600 shadow-blue-600/30' : 'bg-blue-500 shadow-blue-500/30'}`}
            >
              <Plus size={32} />
            </motion.button>
            <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold ${activeTab === 'map' ? 'text-blue-600' : 'text-blue-500'}`}>Map</span>
          </div>

          <div className="flex flex-1 items-center justify-around">
            <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1 ${activeTab === 'analytics' ? 'text-blue-500' : 'text-slate-400'}`}>
              <Bell size={24} />
              <span className="text-[10px] font-bold">Updates</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-blue-500' : 'text-slate-400'}`}>
              <User size={24} />
              <span className="text-[10px] font-bold">Profile</span>
            </button>
          </div>
        </div>
      </div>


      {/* Projects Modal */}
      <AnimatePresence>
        {showProjects && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProjects(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur z-10">
                <h2 className="text-xl font-bold text-slate-900">Ongoing Projects</h2>
                <button onClick={() => setShowProjects(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Project 1 */}
                <div className="bg-slate-50 rounded-[28px] p-5 border border-slate-200 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Main Road Paving</h3>
                      <p className="text-xs text-slate-500">Sector 4 to Market</p>
                    </div>
                    <div className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">In Progress</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Completion</span>
                      <span className="text-blue-600">65%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full w-[65%]" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    {/* Contractor Details */}
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contractor Details</h4>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                          <HardHat size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">BuildRight Infra Pvt Ltd.</p>
                          <p className="text-xs text-slate-500">Contact: +91 98765 43210</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Higher Authority Details */}
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Higher Authority</h4>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          <Shield size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Dr. Sandeep Kumar, IAS</p>
                          <p className="text-xs text-slate-500">District Magistrate Office</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Project 2 */}
                <div className="bg-slate-50 rounded-[28px] p-5 border border-slate-200 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Water Pipeline Upgrade</h3>
                      <p className="text-xs text-slate-500">North Zone</p>
                    </div>
                    <div className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">Delayed</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Completion</span>
                      <span className="text-orange-600">30%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full w-[30%]" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    {/* Contractor Details */}
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contractor Details</h4>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                          <HardHat size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">AquaFlow Engineering</p>
                          <p className="text-xs text-slate-500">Contact: +91 91234 56789</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Higher Authority Details */}
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Higher Authority</h4>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          <Shield size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Mrs. Anita Sharma</p>
                          <p className="text-xs text-slate-500">Chief Engineer, Water Dept.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Authority Details Modal */}
      <AnimatePresence>
        {showAuthority && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAuthority(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur z-10">
                <h2 className="text-xl font-bold text-slate-900">Local Authorities</h2>
                <button onClick={() => setShowAuthority(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {/* Authority 1 */}
                <div className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                    <Shield size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">Dr. Sandeep Kumar, IAS</h3>
                    <p className="text-xs text-slate-500 mb-3">District Magistrate</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        <span>DM Office, Civil Lines</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        <span>+91 11 2345 6789</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authority 2 */}
                <div className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                    <Shield size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">Mrs. Anita Sharma</h3>
                    <p className="text-xs text-slate-500 mb-3">Chief Engineer, Water Dept.</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        <span>Municipal Corporation Bldg</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        <span>+91 11 9876 5432</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Authority 3 */}
                <div className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                    <Shield size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">Mr. Rajesh Verma</h3>
                    <p className="text-xs text-slate-500 mb-3">Superintendent of Police</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        <span>Police Headquarters</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        <span>100 / +91 11 1122 3344</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const NavItem: React.FC<{ icon: LucideIcon, label: string, active?: boolean, onClick: () => void }> = ({ icon: Icon, label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${
      active ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon size={22} />
    <span className="font-semibold">{label}</span>
  </button>
);

const MapTab: React.FC<{ locationName: string }> = ({ locationName }) => (
  <div className="space-y-4 h-full flex flex-col">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-slate-900">Live Map</h2>
      <div className="bg-white px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
        <MapPin size={14} className="text-blue-500" />
        {locationName}
      </div>
    </div>
    <div className="flex-1 bg-slate-200 rounded-[32px] overflow-hidden relative border border-slate-200 min-h-[400px]">
      {/* Simulated Map Background */}
      <img src="https://picsum.photos/seed/map/800/600?blur=2" alt="Map" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
      
      {/* Map Overlay content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        <div className="flex justify-end">
          <div className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg space-y-2">
            <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm"><Plus size={18} /></button>
            <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm"><Minus size={18} /></button>
          </div>
        </div>
        
        {/* Simulated Markers */}
        <div className="absolute top-1/3 left-1/4">
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/40 animate-bounce">
              <HardHat size={20} />
            </div>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white p-3 rounded-xl shadow-xl border border-slate-100 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="text-xs font-bold text-slate-900">Road Paving</p>
              <p className="text-[10px] text-slate-500">65% Complete</p>
            </div>
          </div>
        </div>
        
        <div className="absolute top-1/2 right-1/3">
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/40">
              <AlertCircle size={20} />
            </div>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white p-3 rounded-xl shadow-xl border border-slate-100 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="text-xs font-bold text-slate-900">Water Pipe Leak</p>
              <p className="text-[10px] text-orange-500">In Progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ComplaintsTab: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-900">Register Complaint</h2>
    
    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
          <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500">
            <option>Road & Infrastructure</option>
            <option>Water Supply</option>
            <option>Electricity</option>
            <option>Sanitation</option>
            <option>Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
          <textarea 
            rows={4}
            placeholder="Describe the issue in detail..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Photo Evidence</label>
          <div className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer">
            <Camera size={32} className="mb-2" />
            <span className="text-sm font-bold">Tap to capture or upload</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl text-blue-800 text-sm">
          <MapPin size={20} className="text-blue-500 shrink-0" />
          <p>Your current location will be attached automatically to verify the complaint.</p>
        </div>
      </div>
      
      <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
        <Send size={18} />
        Submit Complaint
      </button>
    </div>
  </div>
);

const AnalyticsTab: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-900">Village Analytics</h2>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
          <CheckCircle2 size={20} />
        </div>
        <p className="text-3xl font-bold text-slate-900">84%</p>
        <p className="text-xs text-slate-500 mt-1">Resolution Rate</p>
      </div>
      <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
          <Clock size={20} />
        </div>
        <p className="text-3xl font-bold text-slate-900">4.2</p>
        <p className="text-xs text-slate-500 mt-1">Days Avg Response</p>
      </div>
    </div>
    
    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-4">Recent Updates</h3>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">Water supply restored in Sector {i}</p>
              <p className="text-xs text-slate-500 mt-1">{i} hours ago</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
const OverviewTab: React.FC<LucideIcon> = ({ user, locationName, isFetchingLocation, setShowSettings, setShowProjects, setShowAuthority, setActiveTab }) => (
  <>
    {/* Welcome Header */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name?.split(' ')[0] || ''} 👋</h1>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isFetchingLocation ? 'bg-slate-100' : 'bg-blue-50'}`}>
            {isFetchingLocation ? (
              <Loader2 size={20} className="text-slate-400 animate-spin" />
            ) : (
              <MapPin size={20} className="text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Location</p>
            <p className="text-sm font-bold text-slate-900">{locationName}</p>
          </div>
        </div>
        {!isFetchingLocation && (
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live via Cellular Network" />
        )}
      </div>
    </div>

    {/* Development Section */}
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-900 font-bold">
        <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white">
          <HardHat size={14} />
        </div>
        <h2>Development</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowProjects(true)}
          className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-2 cursor-pointer hover:border-blue-200 transition-colors"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-1">
            <HardHat size={32} className="text-blue-500" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm leading-tight">Ongoing Projects</h3>
          <p className="text-[10px] text-slate-500">Nearby locality projects</p>
        </motion.div>
        
        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAuthority(true)}
          className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-2 relative overflow-hidden cursor-pointer hover:border-blue-200 transition-colors"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/30 pointer-events-none" />
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-1 z-10">
            <Shield size={32} className="text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm leading-tight z-10">Authority Details</h3>
          <p className="text-[10px] text-slate-500 z-10">Ruling party & officials</p>
        </motion.div>
      </div>
    </div>

    {/* Complaints Section */}
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-900 font-bold">
        <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center text-white">
          <AlertCircle size={14} />
        </div>
        <h2>Complaints</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Register Complaint Card */}
        <div className="bg-orange-50/50 p-6 rounded-[32px] border border-orange-100 relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <AlertCircle size={24} className="text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Register Complaint</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Submit and track issues in your village</p>
              </div>
            </div>
            
            <button 
              onClick={() => setActiveTab('complaints')}
              className="w-full py-4 bg-[#2D7A6E] text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-900/10 active:scale-[0.98] transition-transform"
            >
              FILE A COMPLAINT
            </button>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 size={10} />
                </div>
                Location Locked
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 size={10} />
                </div>
                Captured Live
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                </div>
                Anonymous
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                  <Plus size={10} />
                </div>
                Submit
              </div>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl" />
        </div>

        {/* Track Complaint Card */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500">
              <Bell size={20} />
            </div>
            <h3 className="font-bold text-slate-900">Track Complaint</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <CheckCircle2 size={12} />
                </div>
                Submitted
              </div>
              <div className="text-xs font-bold text-slate-900">124 <span className="text-slate-400 font-normal">Total</span></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <CheckCircle2 size={12} />
                </div>
                Verified
              </div>
              <div className="text-xs font-bold text-slate-900">98 <span className="text-slate-400 font-normal">Resolved</span></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center text-white">
                  <Clock size={12} />
                </div>
                In Progress
              </div>
              <div className="text-xs font-bold text-slate-900">26 <span className="text-slate-400 font-normal">Pending</span></div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Clock size={14} />
              Avg 5 days Res. Time
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
        </div>
      </div>
    </div>
  </>
);

