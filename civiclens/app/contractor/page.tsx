'use client'
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Upload, Camera, MapPin, Calendar, DollarSign, 
  Star, FileText, AlertTriangle, CheckCircle, Clock,
  ChevronRight, BarChart3, HardHat, ShieldAlert, Image as ImageIcon,
  LayoutDashboard, UserCircle, Bell, Settings, LogOut, Shield, Key, Smartphone, Mail, Phone, Briefcase
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsContent } from '../../components/SettingsContent';
import { DashboardHeader } from '../../components/DashboardHeader';

type Tab = 'projects' | 'profile' | 'complaints' | 'settings';

export default function ContractorDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [showCreateProject, setShowCreateProject] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1c] text-slate-900 dark:text-slate-100 transition-colors duration-300 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="https://picsum.photos/seed/civiclens-logo/200/200" 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">CivicLens</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Contractor Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Projects & Milestones
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <UserCircle className="w-5 h-5" />
            Public Profile
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'complaints'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              Complaints
            </div>
            <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 py-0.5 px-2 rounded-full text-xs font-bold">
              3
            </span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings & Security
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader onProfileClick={() => setActiveTab('settings')} />
        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <HardHat className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Contractor Portal</h1>
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
            {(['projects', 'profile', 'complaints', 'settings'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'projects' && (
              <ProjectsSection 
                showCreate={showCreateProject} 
                setShowCreate={setShowCreateProject} 
              />
            )}
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'complaints' && <ComplaintsSection />}
            {activeTab === 'settings' && <SettingsContent user={user} logout={logout} roleLabel="Contractor" />}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// --- Sub-components for Sections ---

function ProjectsSection({ showCreate, setShowCreate }: { showCreate: boolean, setShowCreate: (v: boolean) => void }) {
  if (showCreate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create New Project</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Setup a new infrastructure project and upload initial baseline photos.</p>
          </div>
          <button 
            onClick={() => setShowCreate(false)}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="e.g. Main Street Resurfacing" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Type</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none appearance-none">
                  <option>Road Construction</option>
                  <option>Bridge Repair</option>
                  <option>Drainage System</option>
                  <option>Public Building</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location / Ward</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="Select location on map" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget (₹)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input type="number" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="e.g. 5000000" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Timeline</label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input type="date" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none" />
                  </div>
                  <span className="text-slate-400">to</span>
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input type="date" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                Mandatory BEFORE Photos
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Photos must be captured live. Geotags and timestamps will be automatically embedded and verified by AI. Cannot be backdated.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <button type="button" className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-emerald-500 transition-colors">
                  <Camera className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Capture Site Photo 1</span>
                </button>
                <button type="button" className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-emerald-500 transition-colors">
                  <Camera className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Capture Site Photo 2</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-2.5 rounded-xl font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button type="button" className="px-6 py-2.5 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors">
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Active Projects</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your ongoing projects, milestones, and completion photos.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Card 1 */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-block px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full mb-2">IN PROGRESS</span>
              <h3 className="text-lg font-bold">Ward 4 Road Resurfacing</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> MG Road to Station
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">65% Complete</div>
            </div>
          </div>
          
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-6">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
          </div>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Add Progress Milestone</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Upload AFTER / Completion Photos</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Project Card 2 */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm opacity-75">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-block px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full mb-2">COMPLETED</span>
              <h3 className="text-lg font-bold">Primary School Drainage</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> Ward 2, ZP School
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500">100% Complete</div>
            </div>
          </div>
          
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-6">
            <div className="bg-slate-400 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>

          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
            <CheckCircle className="w-5 h-5" />
            Completion photos verified by AI
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Public Profile</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">This is how your profile appears to citizens and authorities.</p>
        </div>
        <button className="px-4 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium shadow-sm transition-colors whitespace-nowrap">
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white dark:border-[#111827] shadow-md">
              <HardHat className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold">{user?.name || 'Apex Buildcon Pvt Ltd'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Reg: {user?.id || 'CTR-8492-XYZ'}</p>
            
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-6">
              <Star className="w-6 h-6 fill-current" />
              <span className="text-2xl font-bold text-slate-900 dark:text-white ml-1">4.2</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">/ 5</span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-6">
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mt-1">Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">3</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mt-1">Complaints</div>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Company Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Email Address</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{user?.email || 'contact@apexbuildcon.com'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Phone Number</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">+91 98765 43210</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Registered Address</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">123 Business Park, Sector 4, City Center</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">License Validity</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Valid until Dec 2028</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Specializations */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              Specializations
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">Road Construction</span>
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">Drainage Systems</span>
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">Public Buildings</span>
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">Bridge Repair</span>
            </div>
          </div>

          {/* Project History */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Project History
            </h3>
          
          <div className="space-y-4">
            {[
              { name: 'Ward 4 Road Resurfacing', status: 'In Progress', date: 'Oct 2023 - Present', rating: null },
              { name: 'Primary School Drainage', status: 'Completed', date: 'Jan 2023 - Aug 2023', rating: 4.5 },
              { name: 'Community Hall Renovation', status: 'Completed', date: 'Mar 2022 - Dec 2022', rating: 4.0 },
            ].map((proj, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
                <div>
                  <h4 className="font-bold">{proj.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      proj.status === 'Completed' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {proj.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{proj.date}</span>
                  </div>
                </div>
                {proj.rating && (
                  <div className="flex items-center gap-1 text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold">{proj.rating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings & Security</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account security, preferences, and active sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Account Security
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-bold">Two-Factor Authentication (2FA)</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add an extra layer of security to your account.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold mb-4">Change Password</h4>
              <form className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none" />
                  </div>
                </div>
                <button type="button" className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors">
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            Active Sessions
          </h3>

          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Chrome on Windows</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mumbai, India • 192.168.1.1</p>
                  <span className="inline-block mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">Current Session</span>
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Safari on iPhone</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Delhi, India • 10.0.0.5</p>
                  <p className="text-xs text-slate-400 mt-1">Last active: 2 hours ago</p>
                </div>
              </div>
              <button className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline">Revoke</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplaintsSection() {
  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);

  const complaints = [
    {
      id: 1,
      project: 'Ward 4 Road Resurfacing',
      date: '2 hours ago',
      severity: 62,
      damageType: 'Pothole / Surface Erosion',
      status: 'Action Required',
      description: 'Large pothole formed after recent rain. Not matching completion photos.',
    },
    {
      id: 2,
      project: 'Primary School Drainage',
      date: '1 day ago',
      severity: 25,
      damageType: 'Blockage',
      status: 'Action Required',
      description: 'Drain is blocked with debris, water overflowing onto street.',
    }
  ];

  if (selectedComplaint) {
    const complaint = complaints.find(c => c.id === selectedComplaint)!;
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedComplaint(null)}
          className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
        >
          ← Back to Complaints
        </button>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-red-50/50 dark:bg-red-900/10">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-full">ACTION REQUIRED</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {complaint.date}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{complaint.project}</h2>
                <p className="text-slate-600 dark:text-slate-300 mt-2">&quot;{complaint.description}&quot;</p>
                <p className="text-xs text-slate-400 mt-2 italic">Reported anonymously by citizen</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-500" />
              AI Damage Report
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-500">Contractor Completion Photo</div>
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700">
                  <img src="https://picsum.photos/seed/road1/800/600" alt="Before" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">Baseline</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-500">Citizen Uploaded Photo</div>
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative border border-red-200 dark:border-red-900/50">
                  <img src="https://picsum.photos/seed/road2/800/600" alt="After" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-2 left-2 bg-red-600/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">AI Verified</div>
                  {/* Simulated AI bounding box */}
                  <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-red-500 bg-red-500/20 rounded-lg"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Damage Type</div>
                <div className="font-bold text-lg">{complaint.damageType}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                <div className="text-sm text-red-600 dark:text-red-400 mb-1">AI Severity Score</div>
                <div className="font-bold text-2xl text-red-700 dark:text-red-400">{complaint.severity}%</div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
              <h3 className="text-lg font-bold mb-4">Respond & Rectify</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Upload a photo showing the rectified work to resolve this complaint. The AI will verify the fix.</p>
              
              <button className="w-full h-32 border-2 border-dashed border-emerald-300 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors mb-4">
                <Camera className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Capture Rectification Photo</span>
              </button>

              <div className="flex justify-end gap-3">
                <button className="px-6 py-2.5 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors">
                  Submit Fix for Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Incoming Complaints</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Review anonymous citizen complaints and AI damage reports.</p>
      </div>

      <div className="space-y-4">
        {complaints.map((complaint) => (
          <div 
            key={complaint.id}
            onClick={() => setSelectedComplaint(complaint.id)}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-red-300 dark:hover:border-red-800 cursor-pointer transition-colors group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{complaint.project}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {complaint.date}</span>
                    <span className="flex items-center gap-1"><ShieldAlert className="w-4 h-4 text-purple-500" /> AI Severity: {complaint.severity}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                  {complaint.status}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
              </div>
            </div>
          </div>
        ))}

        {/* Resolved Complaint Example */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm opacity-60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg line-through text-slate-500">Community Hall Renovation</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  <span>Resolved 2 weeks ago</span>
                </div>
              </div>
            </div>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
              RESOLVED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
