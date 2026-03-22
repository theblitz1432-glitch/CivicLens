'use client'

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import {
  MapPin, Loader2, LayoutDashboard, Map as MapIcon,
  AlertCircle, User, Shield, HardHat, Bell, X,
  CheckCircle2, Clock, BarChart3, Camera, Settings,
  Home, Plus, Send, Phone, AlertTriangle, ZoomIn, ZoomOut,
  Navigation, RefreshCw, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsContent } from '../../components/SettingsContent';
import { DashboardHeader } from '../../components/DashboardHeader';
import StarRating from '../../components/StarRating';
import { LucideIcon } from 'lucide-react';

type Tab = 'overview' | 'map' | 'complaints' | 'analytics' | 'settings';
const API = process.env.NEXT_PUBLIC_API_URL;
const DEMO_LAT = 29.1492;
const DEMO_LNG = 75.7217;
const DEMO_LOCATION_NAME = 'Adampur, Hisar, Haryana';

// ── Block-wise authority data ──────────────────────────────────────────────
const BLOCK_AUTHORITIES: Record<string, {
  name: string; designation: string; dept: string; phone: string; area: string;
}> = {
  'Adampur':  { name: 'Sh. Deepak Yadav',    designation: 'BDO Adampur',           dept: 'Block Development Office', phone: '01662-267890', area: 'Adampur Block'         },
  'Barwala':  { name: 'Sh. Deepak Arora',    designation: 'BDO Barwala',           dept: 'Block Development Office', phone: '01662-267890', area: 'Barwala Block'         },
  'Hansi':    { name: 'Smt. Kavita Singh',   designation: 'SDM Hansi',             dept: 'Revenue Department',       phone: '01663-256890', area: 'Hansi Sub-Division'    },
  'Narnaund': { name: 'Sh. Harish Goyal',    designation: 'BDO Narnaund',          dept: 'Block Development Office', phone: '01663-234567', area: 'Narnaund Block'        },
  'Uklana':   { name: 'Sh. Mahesh Yadav',    designation: 'BDO Uklana',            dept: 'Block Development Office', phone: '01663-212345', area: 'Uklana Block'          },
  'Agroha':   { name: 'Sh. Vinod Kumar',     designation: 'BDO Agroha',            dept: 'Block Development Office', phone: '01662-278901', area: 'Agroha Block'          },
  'Bass':     { name: 'Sh. Raman Sharma',    designation: 'BDO Bass',              dept: 'Block Development Office', phone: '01662-289012', area: 'Bass Block'            },
  'Litani':   { name: 'Sh. Pawan Gupta',     designation: 'BDO Litani',            dept: 'Block Development Office', phone: '01662-290123', area: 'Litani Block'          },
  'Hisar':    { name: 'Sh. Rajesh Kumar',    designation: 'Municipal Commissioner',dept: 'Municipal Corporation',    phone: '01662-239874', area: 'Hisar Urban'           },
};

const DC_AUTHORITY = {
  name: 'Sh. Vikram Singh, IAS', designation: 'Deputy Commissioner',
  dept: 'Revenue & Administration', phone: '01662-231063', area: 'Hisar District',
};

const detectBlock = (locationName: string): string => {
  const found = Object.keys(BLOCK_AUTHORITIES).find(b =>
    locationName.toLowerCase().includes(b.toLowerCase())
  );
  return found || 'Hisar';
};

interface Project {
  _id: string; title: string; location: string; status: string;
  completionPercentage: number;
  contractor: { name: string; phone: string };
  authority: { name: string; designation: string; office: string };
  beforePhoto?: string; afterPhoto?: string;
}
interface Authority {
  _id: string; name: string; designation: string; department: string;
  office: string; phone: string; email: string;
}
interface Complaint {
  _id: string; category: string; description: string; status: string;
  photoVerified: boolean; damagePercentage?: number; damageType?: string;
  comparisonReport?: string; escalated?: boolean;
  location: { lat: number; lng: number; address: string }; createdAt: string;
}
interface Stats { total: number; resolved: number; inProgress: number; pending: number; }

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('civiclens_token') : ''}`,
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});

// ─── LIVE MAP ─────────────────────────────────────────────────────────────────
const LiveMap: React.FC<{
  complaints: Complaint[];
  projects: Project[];
  userLocation: { lat: number; lng: number } | null;
}> = ({ complaints, projects, userLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'all' | 'complaints' | 'projects'>('all');

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; setMapLoaded(false); }
    const load = async () => {
      if (typeof window === 'undefined' || !mapRef.current) return;
      if (!document.getElementById('leaflet-css')) {
        const l = document.createElement('link');
        l.id = 'leaflet-css'; l.rel = 'stylesheet';
        l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(l);
      }
      await new Promise(r => setTimeout(r, 150));
      if (!mapRef.current) return;
      const L = (await import('leaflet')).default;
      if ((mapRef.current as any)._leaflet_id) (mapRef.current as any)._leaflet_id = null;
      const center = userLocation || { lat: DEMO_LAT, lng: DEMO_LNG };
      const map = L.map(mapRef.current, { center: [center.lat, center.lng], zoom: 14, zoomControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;
      setMapLoaded(true);
    };
    load();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; setMapLoaded(false); } };
  }, [userLocation]);

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const addMarkers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      map.eachLayer((layer: any) => { if (!layer._url) map.removeLayer(layer); });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
      const loc = userLocation || { lat: DEMO_LAT, lng: DEMO_LNG };
      L.marker([loc.lat, loc.lng], {
        icon: L.divIcon({ html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.4)"></div>`, iconSize: [14, 14], iconAnchor: [7, 7], className: '' })
      }).bindPopup('<b>📍 Your Location</b>').addTo(map);

      const getColor = (c: Complaint) => {
        if (c.status === 'resolved') return '#22c55e';
        if (c.status === 'in_progress') return '#f59e0b';
        if ((c.damagePercentage || 0) >= 40) return '#ef4444';
        return '#f97316';
      };
      const catEmoji: Record<string, string> = { 'Road & Infrastructure': '🛣️', 'Water Supply': '💧', 'Electricity': '⚡', 'Sanitation': '🗑️', 'Street Light': '💡', 'Drainage': '🌊', 'Park': '🌳', 'Other': '📍' };

      if (activeLayer === 'all' || activeLayer === 'complaints') {
        complaints.forEach(c => {
          if (!c.location?.lat || !c.location?.lng) return;
          const color = getColor(c);
          const icon = L.divIcon({ html: `<div style="width:30px;height:30px;background:${color};border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:13px;">${catEmoji[c.category] || '📍'}</div>`, iconSize: [30, 30], iconAnchor: [15, 15], className: '' });
          L.marker([c.location.lat, c.location.lng], { icon }).bindPopup(`
            <div style="font-family:Arial;min-width:180px;">
              <p style="font-weight:bold;margin:0 0 4px;">${c.category}</p>
              <p style="font-size:12px;color:#475569;margin:0 0 4px;">${c.description?.substring(0, 80)}...</p>
              ${(c.damagePercentage || 0) > 0 ? `<p style="font-size:11px;color:#ef4444;font-weight:bold;">AI Damage: ${c.damagePercentage}%</p>` : ''}
              <span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold;">${c.status.replace('_', ' ').toUpperCase()}</span>
            </div>`).addTo(map);
        });
        if (complaints.length > 0) {
          const critical = complaints.filter(c => (c.damagePercentage || 0) >= 40).length;
          L.circle([loc.lat, loc.lng], { radius: 800, fillColor: critical > 3 ? '#ef4444' : critical > 1 ? '#f59e0b' : '#22c55e', fillOpacity: 0.07, color: critical > 3 ? '#ef4444' : critical > 1 ? '#f59e0b' : '#22c55e', weight: 1, opacity: 0.25 }).addTo(map);
        }
      }

      if (activeLayer === 'all' || activeLayer === 'projects') {
        const pColors: Record<string, string> = { planned: '#3b82f6', upcoming: '#8b5cf6', in_progress: '#f59e0b', delayed: '#ef4444', completed: '#22c55e' };
        projects.forEach((p, i) => {
          const lat = loc.lat + (i % 3 - 1) * 0.008;
          const lng = loc.lng + (Math.floor(i / 3) - 1) * 0.008;
          const color = pColors[p.status] || '#6b7280';
          const icon = L.divIcon({ html: `<div style="width:36px;height:36px;background:${color};border:3px solid white;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">🏗️</div>`, iconSize: [36, 36], iconAnchor: [18, 18], className: '' });
          L.marker([lat, lng], { icon }).bindPopup(`<div style="font-family:Arial;min-width:180px;"><p style="font-weight:bold;margin:0 0 4px;">🏗️ ${p.title}</p><p style="font-size:12px;color:#475569;margin:0 0 6px;">${p.location}</p><div style="background:#f1f5f9;border-radius:4px;height:6px;margin-bottom:6px;"><div style="background:${color};height:100%;width:${p.completionPercentage}%;border-radius:4px;"></div></div><p style="font-size:11px;color:${color};font-weight:bold;">${p.completionPercentage}% Complete</p></div>`).addTo(map);
        });
      }
    };
    addMarkers();
  }, [mapLoaded, complaints, projects, userLocation, activeLayer]);

  return (
    <div className="relative w-full h-[500px] rounded-[32px] overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-[32px]">
          <div className="text-center"><Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" /><p className="text-sm text-slate-500">Loading map...</p></div>
        </div>
      )}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-2xl shadow-lg border border-slate-200 p-1 flex gap-1">
        {(['all', 'complaints', 'projects'] as const).map(layer => (
          <button key={layer} onClick={() => setActiveLayer(layer)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${activeLayer === layer ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {layer === 'all' ? '🗺️ All' : layer === 'complaints' ? '⚠️ Issues' : '🏗️ Projects'}
          </button>
        ))}
      </div>
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <button onClick={() => mapInstanceRef.current?.zoomIn()} className="w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-200"><ZoomIn size={18} /></button>
        <button onClick={() => mapInstanceRef.current?.zoomOut()} className="w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-200"><ZoomOut size={18} /></button>
        <button onClick={() => { const l = userLocation || { lat: DEMO_LAT, lng: DEMO_LNG }; mapInstanceRef.current?.setView([l.lat, l.lng], 14); }} className="w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-600 border border-slate-200"><Navigation size={18} /></button>
      </div>
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/97 rounded-2xl shadow-lg border border-slate-200 p-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Legend</p>
        <div className="space-y-1.5">
          {[{ color: '#22c55e', label: '✅ Resolved' }, { color: '#f59e0b', label: '🔧 In Progress' }, { color: '#ef4444', label: '🚨 Damaged (40%+)' }, { color: '#3b82f6', label: '📋 Planned' }].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} /><span className="text-[10px] text-slate-600">{label}</span></div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/97 rounded-2xl shadow-lg border border-slate-200 p-3 text-center">
        <p className="text-lg font-bold text-slate-900">{complaints.length}</p>
        <p className="text-[10px] text-slate-500">Issues</p>
        <p className="text-lg font-bold text-red-500 mt-1">{complaints.filter(c => (c.damagePercentage || 0) >= 40).length}</p>
        <p className="text-[10px] text-slate-500">Critical</p>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
function CitizenDashboardInner() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showProjects, setShowProjects] = useState(false);
  const [showAuthority, setShowAuthority] = useState(false);
  const [locationName, setLocationName] = useState('Fetching location...');
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, resolved: 0, inProgress: 0, pending: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => { const tab = searchParams.get('tab') as Tab; if (tab) setActiveTab(tab); }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationName('Your Location'); setIsFetchingLocation(false); },
        () => { setUserLocation({ lat: DEMO_LAT, lng: DEMO_LNG }); setLocationName(DEMO_LOCATION_NAME); setIsFetchingLocation(false); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else { setUserLocation({ lat: DEMO_LAT, lng: DEMO_LNG }); setLocationName(DEMO_LOCATION_NAME); setIsFetchingLocation(false); }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      const headers = authHeader();
      const [projRes, compRes, statsRes] = await Promise.all([
        fetch(`${API}/civic/projects`, { headers }),
        fetch(`${API}/complaints/my`, { headers }),
        fetch(`${API}/complaints/stats`, { headers }),
      ]);
      const [projData, compData, statsData] = await Promise.all([projRes.json(), compRes.json(), statsRes.json()]);
      if (projData.success) setProjects(projData.projects);
      if (compData.success) setComplaints(compData.complaints);
      if (statsData.success) setStats(statsData.stats);
    } catch (err) { console.error('Fetch error:', err); }
    setLoadingData(false);
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // Detect block from location
  const detectedBlock = detectBlock(locationName);
  const blockAuth = BLOCK_AUTHORITIES[detectedBlock];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 border-r border-slate-200 flex-col p-8 bg-white shrink-0 h-full">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-bold tracking-tight">CivicLens</span>
        </div>
        <nav className="flex-1 space-y-2">
          {([['overview','Overview',LayoutDashboard],['map','Live Map',MapIcon],['complaints','Complaints',AlertCircle],['analytics','Analytics',BarChart3],['settings','Settings',Settings]] as [Tab,string,LucideIcon][]).map(([tab,label,Icon]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${activeTab===tab?'bg-blue-500 text-white shadow-xl shadow-blue-500/20':'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon size={22}/><span className="font-semibold">{label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-8 border-t border-slate-100">
          <div onClick={()=>setActiveTab('settings')} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 cursor-pointer hover:bg-slate-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500"><User size={24}/></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.name||'Citizen'}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Citizen</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <DashboardHeader onProfileClick={()=>setActiveTab('settings')} />
        <main className="flex-1 overflow-y-auto px-5 py-8 space-y-8 pb-32">
          {activeTab==='overview' && <OverviewTab user={user} locationName={locationName} isFetchingLocation={isFetchingLocation} setShowProjects={setShowProjects} setShowAuthority={setShowAuthority} setActiveTab={setActiveTab} stats={stats} loadingData={loadingData} complaints={complaints} />}
          {activeTab==='map' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><h2 className="text-2xl font-bold">Live Map</h2><p className="text-xs text-slate-500 mt-0.5">{locationName}</p></div>
                <button onClick={fetchAllData} className="flex items-center gap-2 text-sm text-blue-600 font-medium"><RefreshCw size={16}/> Refresh</button>
              </div>
              <LiveMap complaints={complaints} projects={projects} userLocation={userLocation} />
            </div>
          )}
          {activeTab==='complaints' && <ComplaintsTab onComplaintSubmitted={fetchAllData} existingComplaints={complaints} userLocation={userLocation} />}
          {activeTab==='analytics' && <AnalyticsTab stats={stats} complaints={complaints} />}
          {activeTab==='settings' && <SettingsContent user={user} logout={logout} roleLabel="Citizen" />}
        </main>

        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 py-3 flex items-center justify-between z-50 h-20">
          <div className="flex flex-1 items-center justify-around">
            <button onClick={()=>setActiveTab('overview')} className={`flex flex-col items-center gap-1 ${activeTab==='overview'?'text-blue-500':'text-slate-400'}`}><Home size={24}/><span className="text-[10px] font-bold">Home</span></button>
            <button onClick={()=>setActiveTab('complaints')} className={`flex flex-col items-center gap-1 ${activeTab==='complaints'?'text-blue-500':'text-slate-400'}`}><AlertCircle size={24}/><span className="text-[10px] font-bold">Complaint</span></button>
          </div>
          <div className="relative -top-6">
            <motion.button whileTap={{scale:0.9}} onClick={()=>setActiveTab('map')} className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white bg-blue-500"><Plus size={32}/></motion.button>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-500">Map</span>
          </div>
          <div className="flex flex-1 items-center justify-around">
            <button onClick={()=>setActiveTab('analytics')} className={`flex flex-col items-center gap-1 ${activeTab==='analytics'?'text-blue-500':'text-slate-400'}`}><Bell size={24}/><span className="text-[10px] font-bold">Updates</span></button>
            <button onClick={()=>setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab==='settings'?'text-blue-500':'text-slate-400'}`}><User size={24}/><span className="text-[10px] font-bold">Profile</span></button>
          </div>
        </div>
      </div>

      {/* Projects Modal */}
      <AnimatePresence>
        {showProjects && (
          <Modal title="Ongoing Projects" onClose={()=>setShowProjects(false)}>
            {loadingData ? <Loader2 className="animate-spin mx-auto my-8"/> : projects.length===0 ? (
              <p className="text-center text-slate-400 py-8">No projects found</p>
            ) : projects.map(p=>(
              <div key={p._id} className="bg-slate-50 rounded-[28px] p-5 border border-slate-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div><h3 className="font-bold text-slate-900 text-lg">{p.title}</h3><p className="text-xs text-slate-500">{p.location}</p></div>
                  <StatusBadge status={p.status}/>
                </div>
                <ProgressBar value={p.completionPercentage}/>
                {(p.beforePhoto || p.afterPhoto) && (
                  <div className="grid grid-cols-2 gap-2">
                    {p.beforePhoto && <div><p className="text-[10px] font-bold text-slate-400 mb-1">BEFORE</p><img src={p.beforePhoto} className="w-full h-20 object-cover rounded-xl" alt="Before"/></div>}
                    {p.afterPhoto && <div><p className="text-[10px] font-bold text-slate-400 mb-1">AFTER</p><img src={p.afterPhoto} className="w-full h-20 object-cover rounded-xl" alt="After"/></div>}
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <InfoCard icon={<HardHat size={20}/>} color="orange" title={p.contractor.name} subtitle={`Contact: ${p.contractor.phone}`}/>
                  <InfoCard icon={<Shield size={20}/>} color="blue" title={p.authority.name} subtitle={p.authority.designation}/>
                </div>
              </div>
            ))}
          </Modal>
        )}
      </AnimatePresence>

      {/* Authority Modal — Block-wise */}
      <AnimatePresence>
        {showAuthority && (
          <Modal title={`Your Block Authority`} onClose={()=>setShowAuthority(false)}>
            <p className="text-xs text-slate-400 -mt-2 mb-1">
              Showing authority for <span className="font-semibold text-blue-600">{detectedBlock} Block</span>
            </p>

            {/* Block Officer Card */}
            <div className="bg-blue-50 rounded-[24px] p-5 border border-blue-100">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-3">Your Block Officer</p>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg">
                  <Shield size={24}/>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-base">{blockAuth.name}</h3>
                  <p className="text-sm text-blue-600 font-semibold">{blockAuth.designation}</p>
                  <p className="text-xs text-slate-400 mb-3">{blockAuth.dept}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600"><MapPin size={12} className="text-blue-400"/>{blockAuth.area}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-600"><Phone size={12} className="text-blue-400"/>{blockAuth.phone}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* District Officer */}
            <div className="bg-white rounded-[24px] p-5 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">District Authority</p>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                  <Shield size={24}/>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-base">{DC_AUTHORITY.name}</h3>
                  <p className="text-sm text-slate-600 font-semibold">{DC_AUTHORITY.designation}</p>
                  <p className="text-xs text-slate-400 mb-3">{DC_AUTHORITY.dept}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600"><MapPin size={12} className="text-slate-400"/>{DC_AUTHORITY.area}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-600"><Phone size={12} className="text-slate-400"/>{DC_AUTHORITY.phone}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transparency Scorecard */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Transparency Scorecard — {detectedBlock}</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-2xl font-bold text-blue-600">{loadingData ? '…' : projects.length}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Projects</p>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-2xl font-bold text-green-600">{loadingData ? '…' : stats.resolved}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Resolved</p>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-2xl font-bold text-orange-500">{loadingData ? '…' : stats.pending}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pending</p>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── COMPLAINTS TAB ───────────────────────────────────────────────────────────
const ComplaintsTab: React.FC<{
  onComplaintSubmitted: () => void;
  existingComplaints: Complaint[];
  userLocation: { lat: number; lng: number } | null;
}> = ({ onComplaintSubmitted, existingComplaints, userLocation }) => {
  const [category, setCategory] = useState('Road & Infrastructure');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [verifyingPhoto, setVerifyingPhoto] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const openCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream); setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { setError('Camera access denied.'); }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current; const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const loc = userLocation || { lat: DEMO_LAT, lng: DEMO_LNG };
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, canvas.height - 64, canvas.width, 64);
    ctx.fillStyle = 'white'; ctx.font = 'bold 14px Arial';
    ctx.fillText(`📍 ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)} — Hisar, Haryana`, 10, canvas.height - 38);
    ctx.font = '12px Arial';
    ctx.fillText(`🕐 ${new Date().toLocaleString('en-IN')} | CivicLens`, 10, canvas.height - 16);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl); setPhotoPreview(dataUrl);
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null); setShowCamera(false);
  };

  const handleSubmit = async () => {
    setError('');
    if (!description.trim()) return setError('Please describe the issue');
    if (!photo) return setError('Photo required — camera only');
    setSubmitting(true); setVerifyingPhoto(true);
    try {
      const token = localStorage.getItem('civiclens_token');
      const loc = userLocation || { lat: DEMO_LAT, lng: DEMO_LNG };
      const response = await fetch(`${API}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ category, description, photoBase64: photo, location: { lat: loc.lat, lng: loc.lng, address: 'Adampur, Hisar, Haryana', block: 'ADAMPUR', district: 'HISAR' } }),
      });
      setVerifyingPhoto(false);
      const data = await response.json();
      if (data.photoRejected) { setError(`⚠️ ${data.message}`); setSubmitting(false); return; }
      if (data.success) {
        setSubmitted(true); setSubmitResult(data.complaint);
        setCategory('Road & Infrastructure'); setDescription(''); setPhoto(null); setPhotoPreview(null);
        onComplaintSubmitted();
        setTimeout(() => { setSubmitted(false); setSubmitResult(null); }, 6000);
      } else { setError(data.message || 'Submission failed'); }
    } catch { setError('Server error. Please try again.'); setVerifyingPhoto(false); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Register Complaint</h2>
        <p className="text-xs text-slate-500 mt-1">Your identity is fully protected — complaints are anonymous</p>
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          <div className="flex items-center justify-between p-4">
            <span className="text-white font-semibold">📸 Take Photo</span>
            <button onClick={() => { cameraStream?.getTracks().forEach(t => t.stop()); setShowCamera(false); }} className="text-white bg-white/20 rounded-full p-2"><X size={20} /></button>
          </div>
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="bg-black/70 px-4 py-2 text-white text-xs">📍 Hisar, Haryana • {new Date().toLocaleString('en-IN')}</div>
          <div className="p-6 flex justify-center bg-black">
            <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl"><Camera size={32} className="text-slate-900" /></button>
          </div>
        </div>
      )}

      {submitted && submitResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle2 size={20}/><div><p className="font-semibold">Submitted anonymously!</p><p className="text-sm">Authorities have been notified.</p></div>
          </div>
          {(submitResult.damagePercentage || 0) > 0 && (
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl ${submitResult.damagePercentage > 70 ? 'bg-red-100 text-red-700' : submitResult.damagePercentage > 40 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
              <AlertTriangle size={13}/> AI Damage: {submitResult.damagePercentage}% {submitResult.damagePercentage >= 40 ? '— AUTO-ESCALATED' : ''}
            </div>
          )}
          {submitResult.comparisonReport && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2">🤖 {submitResult.comparisonReport}</p>}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-700">
          <AlertTriangle size={20} className="shrink-0 mt-0.5"/><span className="text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <Shield size={16} className="text-slate-500 shrink-0"/>
          <p className="text-xs text-slate-600">Your identity is <strong>never revealed</strong> to contractors or authorities.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500">
            {['Road & Infrastructure','Water Supply','Electricity','Sanitation','Street Light','Drainage','Park','Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
          <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue in detail..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 resize-none" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Photo Evidence <span className="text-red-500">*</span>
            <span className="ml-2 text-green-600 normal-case font-normal text-[10px]">Camera only · AI verified</span>
          </label>
          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200">
              <img src={photoPreview} alt="Complaint" className="w-full h-52 object-cover" />
              <button onClick={() => { setPhoto(null); setPhotoPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg"><X size={16}/></button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
                <p className="text-white text-xs">📍 Hisar, Haryana • {new Date().toLocaleDateString('en-IN')}</p>
              </div>
              <button onClick={openCamera} className="absolute bottom-3 right-3 bg-white/20 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-white/30 flex items-center gap-1"><Camera size={12}/> Retake</button>
            </div>
          ) : (
            <button onClick={openCamera} className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3"><Camera size={28} className="text-slate-400"/></div>
              <span className="text-sm font-bold">Take Photo</span>
              <span className="text-[11px] text-slate-400 mt-1">Gallery uploads rejected · Camera only</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl">
          <MapPin size={20} className="text-blue-500 shrink-0"/>
          <div><p className="text-sm font-medium text-blue-800">Location attached automatically</p><p className="text-xs text-blue-600 mt-0.5">📍 Adampur, Hisar, Haryana</p></div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs space-y-0.5">
          <p className="font-bold text-amber-800">🤖 AI Verification (3 stages)</p>
          <p className="text-amber-700">1. Authenticity · 2. Geotag · 3. Damage comparison</p>
        </div>

        <button onClick={handleSubmit} disabled={submitting} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all">
          {submitting
            ? <><Loader2 size={18} className="animate-spin"/>{verifyingPhoto ? 'AI Verifying...' : 'Submitting...'}</>
            : <><Send size={18}/>Submit Anonymously</>}
        </button>
      </div>

      {existingComplaints.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">My Complaints ({existingComplaints.length})</h3>
          {existingComplaints.map(c => (
            <div key={c._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-start justify-between">
                <div><p className="font-bold text-slate-900 text-sm">{c.category}</p><p className="text-xs text-slate-500 mt-0.5">{new Date(c.createdAt).toLocaleDateString('en-IN')}</p></div>
                <StatusBadge status={c.status}/>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
              {(c.damagePercentage || 0) > 0 && (
                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${(c.damagePercentage||0)>70?'bg-red-50 text-red-600':(c.damagePercentage||0)>40?'bg-orange-50 text-orange-600':'bg-yellow-50 text-yellow-600'}`}>
                  <AlertTriangle size={10}/>AI: {c.damagePercentage}% {(c.damagePercentage||0)>=40?'· Auto-escalated':''}
                </div>
              )}
              {c.comparisonReport && <p className="text-[10px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1">🤖 {c.comparisonReport?.substring(0,120)}</p>}
              {c.photoVerified && <div className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={12}/><span>Photo verified by AI</span></div>}
              <StarRating complaintId={c._id} category={c.category} isVisible={c.status === 'resolved'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ANALYTICS TAB ─────────────────────────────────────────────────────────────
const AnalyticsTab: React.FC<{ stats: Stats; complaints: Complaint[] }> = ({ stats, complaints }) => {
  const criticalCount = complaints.filter(c => (c.damagePercentage || 0) >= 40).length;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>
      <div className="grid grid-cols-2 gap-4">
        {[{label:'Total',value:stats.total,color:'blue',icon:AlertCircle},{label:'Resolved',value:stats.resolved,color:'green',icon:CheckCircle2},{label:'In Progress',value:stats.inProgress,color:'orange',icon:Clock},{label:'Pending',value:stats.pending,color:'yellow',icon:AlertTriangle},{label:'Critical',value:criticalCount,color:'red',icon:AlertTriangle},{label:'Escalated',value:complaints.filter(c=>c.escalated).length,color:'red',icon:TrendingUp}].map(({label,value,color,icon:Icon})=>(
          <div key={label} className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm">
            <div className={`w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center text-${color}-600 mb-3`}><Icon size={20}/></div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      {complaints.length > 0 && (
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {complaints.slice(0,5).map(c=>(
              <div key={c._id} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"/>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{c.category}</p>
                  {(c.damagePercentage||0)>0 && <p className="text-[10px] text-red-500">AI: {c.damagePercentage}%</p>}
                  <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <StatusBadge status={c.status}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
interface OverviewTabProps { user:any; locationName:string; isFetchingLocation:boolean; setShowProjects:(v:boolean)=>void; setShowAuthority:(v:boolean)=>void; setActiveTab:(t:Tab)=>void; stats:Stats; loadingData:boolean; complaints:Complaint[]; }
const OverviewTab: React.FC<OverviewTabProps> = ({user,locationName,isFetchingLocation,setShowProjects,setShowAuthority,setActiveTab,stats,loadingData,complaints}) => {
  const criticalCount = complaints.filter(c => (c.damagePercentage||0) >= 40 && c.status === 'pending').length;
  const detectedBlock = detectBlock(locationName);
  return (
    <>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name?.split(' ')[0]||''} 👋</h1>
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isFetchingLocation?'bg-slate-100':'bg-blue-50'}`}>
              {isFetchingLocation?<Loader2 size={20} className="text-slate-400 animate-spin"/>:<MapPin size={20} className="text-blue-600"/>}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Location</p>
              <p className="text-sm font-bold text-slate-900">{locationName}</p>
              {!isFetchingLocation && <p className="text-[10px] text-blue-500 font-medium">{detectedBlock} Block · Hisar</p>}
            </div>
          </div>
          {!isFetchingLocation && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>}
        </div>

        {criticalCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0"/>
            <div><p className="font-bold text-red-700 text-sm">🚨 {criticalCount} Critical Issue{criticalCount>1?'s':''} Auto-Escalated</p><p className="text-xs text-red-600">District authority auto-notified</p></div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <SectionHeader icon={<HardHat size={14}/>} color="blue" title="Development"/>
        <div className="grid grid-cols-2 gap-4">
          <motion.div whileTap={{scale:0.95}} onClick={()=>setShowProjects(true)} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-2 cursor-pointer hover:border-blue-200 transition-colors">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">{loadingData?<Loader2 size={28} className="text-blue-400 animate-spin"/>:<HardHat size={32} className="text-blue-500"/>}</div>
            <h3 className="font-bold text-slate-900 text-sm">Ongoing Projects</h3>
            <p className="text-[10px] text-slate-500">Before & after photos</p>
          </motion.div>
          <motion.div whileTap={{scale:0.95}} onClick={()=>setShowAuthority(true)} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-2 cursor-pointer hover:border-blue-200 transition-colors">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">{loadingData?<Loader2 size={28} className="text-blue-400 animate-spin"/>:<Shield size={32} className="text-blue-600"/>}</div>
            <h3 className="font-bold text-slate-900 text-sm">{detectedBlock} Authority</h3>
            <p className="text-[10px] text-slate-500">Your block officer</p>
          </motion.div>
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeader icon={<AlertCircle size={14}/>} color="orange" title="Complaints"/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-50/50 p-6 rounded-[32px] border border-orange-100">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm"><AlertCircle size={24} className="text-orange-500"/></div>
              <div><h3 className="font-bold text-slate-900 text-lg">Anonymous Complaint</h3><p className="text-xs text-slate-500">AI-verified · Identity protected</p></div>
            </div>
            <button onClick={()=>setActiveTab('complaints')} className="w-full py-4 bg-[#2D7A6E] text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all">FILE A COMPLAINT</button>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500"><Bell size={20}/></div><h3 className="font-bold text-slate-900">Track Complaints</h3></div>
            {loadingData?<Loader2 size={20} className="animate-spin text-slate-400"/>:(
              <div className="space-y-3">
                <StatRow label="Total" value={stats.total} sub="Submitted" color="blue" icon={AlertCircle}/>
                <StatRow label="Resolved" value={stats.resolved} sub="Done" color="green" icon={CheckCircle2}/>
                <StatRow label="In Progress" value={stats.inProgress} sub="Active" color="orange" icon={Clock}/>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const Modal: React.FC<{title:string;onClose:()=>void;children:React.ReactNode}> = ({title,onClose,children}) => (
  <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"/>
    <motion.div initial={{opacity:0,y:'100%'}} animate={{opacity:1,y:0}} exit={{opacity:0,y:'100%'}} className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur z-10">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
      </div>
      <div className="p-6 overflow-y-auto space-y-4">{children}</div>
    </motion.div>
  </div>
);

const StatusBadge: React.FC<{status:string}> = ({status}) => {
  const map:Record<string,string> = {in_progress:'bg-blue-100 text-blue-700',delayed:'bg-orange-100 text-orange-700',completed:'bg-green-100 text-green-700',planned:'bg-blue-100 text-blue-700',pending:'bg-yellow-100 text-yellow-700',resolved:'bg-green-100 text-green-700',rejected:'bg-red-100 text-red-700',verified:'bg-blue-100 text-blue-700'};
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${map[status]||'bg-slate-100 text-slate-600'}`}>{status.replace('_',' ')}</span>;
};

const ProgressBar: React.FC<{value:number}> = ({value}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-bold"><span className="text-slate-500">Completion</span><span className="text-blue-600">{value}%</span></div>
    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden"><div className="bg-blue-500 h-full rounded-full" style={{width:`${value}%`}}/></div>
  </div>
);

const InfoCard: React.FC<{icon:React.ReactNode;color:string;title:string;subtitle:string}> = ({icon,color,title,subtitle}) => (
  <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
    <div className={`w-10 h-10 bg-${color}-50 rounded-lg flex items-center justify-center text-${color}-600`}>{icon}</div>
    <div><p className="text-sm font-bold text-slate-900">{title}</p><p className="text-xs text-slate-500">{subtitle}</p></div>
  </div>
);

const SectionHeader: React.FC<{icon:React.ReactNode;color:string;title:string}> = ({icon,color,title}) => (
  <div className="flex items-center gap-2 text-slate-900 font-bold">
    <div className={`w-6 h-6 bg-${color}-500 rounded-md flex items-center justify-center text-white`}>{icon}</div>
    <h2>{title}</h2>
  </div>
);

const StatRow: React.FC<{label:string;value:number;sub:string;color:string;icon:LucideIcon}> = ({label,value,sub,color,icon:Icon}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
      <div className={`w-5 h-5 rounded-full bg-${color}-500 flex items-center justify-center text-white`}><Icon size={12}/></div>{label}
    </div>
    <div className="text-xs font-bold text-slate-900">{value} <span className="text-slate-400 font-normal">{sub}</span></div>
  </div>
);

export default function CitizenDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" size={32}/></div>}>
      <CitizenDashboardInner/>
    </Suspense>
  );
}