'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe, Mic, Zap, Volume2, User, Palette, Moon,
  Key, Trash2, CheckCircle2, Info, LogOut, Camera,
  MapPin, ChevronRight, Check, X, LucideIcon,
  Eye, Bell, Wifi, Shield, HelpCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../components/ThemeProvider';

interface SettingsContentProps {
  user: { name?: string; email?: string; role?: string } | null;
  logout: () => void;
  roleLabel: string;
}

interface SettingItemProps {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  value?: string;
  onClick?: () => void;
  isRed?: boolean;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
}

interface SelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: { label: string; value: string; description?: string }[];
  current: string;
  onSelect: (val: string) => void;
}

const SettingItem = ({
  icon: Icon, label, sublabel, value, onClick,
  isRed = false, hasToggle = false, toggleValue = false, onToggle = () => {}
}: SettingItemProps) => (
  <div
    onClick={!hasToggle ? onClick : undefined}
    className={`flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${onClick || hasToggle ? 'cursor-pointer' : ''} ${isRed ? 'text-red-600' : 'text-slate-900'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRed ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className={`text-sm font-bold ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{label}</p>
        {sublabel && <p className="text-[10px] text-slate-400 font-medium">{sublabel}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs font-bold text-emerald-600 max-w-24 truncate">{value}</span>}
      {hasToggle ? (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(!toggleValue); }}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${toggleValue ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
          <motion.div animate={{ x: toggleValue ? 24 : 2 }} className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm" />
        </button>
      ) : (
        onClick && <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
      )}
    </div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 pt-6 pb-2">
    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{title}</h4>
  </div>
);

const SelectorModal = ({ isOpen, onClose, title, options, current, onSelect }: SelectorModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          className="relative w-full max-w-sm bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={18} /></button>
          </div>
          <div className="p-2 pb-6 max-h-96 overflow-y-auto">
            {options.map((opt) => (
              <button key={opt.value} onClick={() => { onSelect(opt.value); onClose(); }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${current === opt.value ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}>
                <div className="text-left">
                  <p className="font-bold text-sm">{opt.label}</p>
                  {opt.description && <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>}
                </div>
                {current === opt.value && <Check size={18} className="flex-shrink-0" />}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel, isDanger }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel: string; isDanger?: boolean;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl">
          <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm">Cancel</button>
            <button onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm text-white ${isDanger ? 'bg-red-500' : 'bg-blue-500'}`}>
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const InputModal = ({ isOpen, onClose, onSubmit, title }: {
  isOpen: boolean; onClose: () => void; onSubmit: (vals: any) => void; title: string;
}) => {
  const [curr, setCurr] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!curr) return setError('Enter current password');
    if (next.length < 6) return setError('New password must be at least 6 characters');
    if (next !== confirm) return setError('Passwords do not match');
    onSubmit({ current: curr, new: next });
    setCurr(''); setNext(''); setConfirm(''); setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
              <button onClick={onClose} className="p-2 bg-slate-50 rounded-full"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {[{ label: 'Current password', val: curr, set: setCurr }, { label: 'New password', val: next, set: setNext }, { label: 'Confirm new password', val: confirm, set: setConfirm }].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{label}</label>
                  <input type="password" value={val} onChange={e => { set(e.target.value); setError(''); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              ))}
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            </div>
            <button onClick={handleSubmit} className="w-full mt-6 py-3 bg-blue-500 text-white rounded-2xl font-bold text-sm">Update Password</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-xl text-white text-sm font-bold flex items-center gap-2 ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
    {type === 'success' ? <Check size={16} /> : <X size={16} />}
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
  </motion.div>
);

export const SettingsContent: React.FC<SettingsContentProps> = ({ user, logout, roleLabel }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [voiceAssistant, setVoiceAssistant] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [autoUpload, setAutoUpload] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState('Normal');
  const [voiceGender, setVoiceGender] = useState('Female');
  const [navMode, setNavMode] = useState('Assistive');
  const [assistantLang, setAssistantLang] = useState('Hindi');

  const [showLangSel, setShowLangSel] = useState(false);
  const [showThemeSel, setShowThemeSel] = useState(false);
  const [showSpeedSel, setShowSpeedSel] = useState(false);
  const [showGenderSel, setShowGenderSel] = useState(false);
  const [showNavModeSel, setShowNavModeSel] = useState(false);
  const [showAssistLangSel, setShowAssistLangSel] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('civiclens_settings');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.voiceAssistant !== undefined) setVoiceAssistant(s.voiceAssistant);
        if (s.highContrast !== undefined) setHighContrast(s.highContrast);
        if (s.autoUpload !== undefined) setAutoUpload(s.autoUpload);
        if (s.notifications !== undefined) setNotifications(s.notifications);
        if (s.offlineMode !== undefined) setOfflineMode(s.offlineMode);
        if (s.voiceSpeed) setVoiceSpeed(s.voiceSpeed);
        if (s.voiceGender) setVoiceGender(s.voiceGender);
        if (s.navMode) setNavMode(s.navMode);
        if (s.assistantLang) setAssistantLang(s.assistantLang);
      }
    } catch {}
  }, []);

  const saveSettings = (updates: object) => {
    try {
      const curr = JSON.parse(localStorage.getItem('civiclens_settings') || '{}');
      localStorage.setItem('civiclens_settings', JSON.stringify({ ...curr, ...updates }));
    } catch {}
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Apply high contrast
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    saveSettings({ highContrast });
  }, [highContrast]);

  // Apply theme to whole app
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.add('light');
    else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
    }
  }, [theme]);

  // Apply voice speed to VoiceAgent
  useEffect(() => {
    const rateMap: Record<string, number> = { Slow: 0.7, Normal: 0.9, Fast: 1.2, 'Very Fast': 1.5 };
    localStorage.setItem('civiclens_voice_rate', String(rateMap[voiceSpeed] ?? 0.9));
  }, [voiceSpeed]);

  // Apply voice gender to VoiceAgent
  useEffect(() => {
    localStorage.setItem('civiclens_voice_gender', voiceGender);
  }, [voiceGender]);

  // Apply nav mode to VoiceAgent (auto-listen)
  useEffect(() => {
    localStorage.setItem('civiclens_nav_mode', navMode);
    // Dispatch event so VoiceAgent can react
    window.dispatchEvent(new CustomEvent('civiclens_nav_mode', { detail: navMode }));
  }, [navMode]);

  // Apply assistant language
  useEffect(() => {
    const langCodeMap: Record<string, string> = {
      English: 'en-IN', Hindi: 'hi-IN', Punjabi: 'pa-IN', Tamil: 'ta-IN',
      Telugu: 'te-IN', Bengali: 'bn-IN', Gujarati: 'gu-IN', Kannada: 'kn-IN',
      Malayalam: 'ml-IN', Marathi: 'mr-IN',
    };
    localStorage.setItem('civiclens_assistant_lang', langCodeMap[assistantLang] || 'hi-IN');
    window.dispatchEvent(new CustomEvent('civiclens_assistant_lang', { detail: langCodeMap[assistantLang] }));
  }, [assistantLang]);

  // Disable voice assistant
  useEffect(() => {
    localStorage.setItem('civiclens_voice_enabled', String(voiceAssistant));
    window.dispatchEvent(new CustomEvent('civiclens_voice_enabled', { detail: voiceAssistant }));
  }, [voiceAssistant]);

  const handleToggle = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    saveSettings({ [key]: val });
    showToast(`${key.replace(/([A-Z])/g, ' $1').trim()} ${val ? 'enabled' : 'disabled'}`);
  };

  const handleSelect = (key: string, val: string, setter: (v: string) => void, label?: string) => {
    setter(val);
    saveSettings({ [key]: val });
    showToast(`${label ?? key} set to ${val}`);
  };

  const handlePasswordChange = async (vals: { current: string; new: string }) => {
    try {
      const token = localStorage.getItem('civiclens_token');
      const API = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: vals.current, newPassword: vals.new }),
      });
      const data = await res.json();
      if (data.success) showToast('Password updated successfully!');
      else showToast(data.message || 'Failed to update password', 'error');
    } catch { showToast('Could not connect to server', 'error'); }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('civiclens_token');
      const API = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API}/auth/delete-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { showToast('Account deleted'); setTimeout(logout, 1500); }
      else showToast(data.message || 'Failed to delete account', 'error');
    } catch { showToast('Could not connect to server', 'error'); }
  };

  const themeLabel = theme.charAt(0).toUpperCase() + theme.slice(1).replace('-', ' ');

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-900 min-h-full pb-20 transition-colors">

      {/* Profile Header */}
      <div className="p-6">
        <div className="relative bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden p-6 flex flex-col items-center text-center">
          <div className="absolute top-0 left-0 right-0 h-24 bg-slate-100 overflow-hidden">
            <img src="https://picsum.photos/seed/forest/800/200" alt="Cover" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
          </div>
          <div className="relative mt-8 mb-4">
            <div className="w-24 h-24 rounded-[28px] overflow-hidden border-4 border-white shadow-lg">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} alt="Profile" className="w-full h-full object-cover bg-blue-50" />
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-xl border-2 border-white flex items-center justify-center shadow-lg"
              onClick={() => showToast('Photo upload coming soon!')}>
              <Camera size={16} />
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name || 'Citizen'}</h2>
              <div className="bg-emerald-100 text-emerald-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Check size={8} /> VERIFIED
              </div>
            </div>
            {user?.email && <p className="text-xs text-slate-400">{user.email}</p>}
            <div className="mt-3">
              <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{roleLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-1">
        <SectionHeader title={t('language') || 'LANGUAGE & VOICE'} />
        <SettingItem icon={Globe} label={t('language')} sublabel="Interface and text language" value={language} onClick={() => setShowLangSel(true)} />
        <SettingItem icon={Mic} label="Assistant Language" sublabel="Language AI speaks and understands" value={assistantLang} onClick={() => setShowAssistLangSel(true)} />
        <SettingItem icon={Zap} label="Navigation Mode" sublabel="Hands-free or assistive voice control" value={navMode} onClick={() => setShowNavModeSel(true)} />

        <SectionHeader title="VOICE CUSTOMIZATION" />
        <SettingItem icon={Volume2} label="Voice Speed" sublabel="How fast the AI speaks" value={voiceSpeed} onClick={() => setShowSpeedSel(true)} />
        <SettingItem icon={User} label="Voice Gender" sublabel="AI voice preference" value={voiceGender} onClick={() => setShowGenderSel(true)} />
        <SettingItem icon={Mic} label={t('voiceAssistant')} sublabel="Enable voice-driven interactions"
          hasToggle toggleValue={voiceAssistant} onToggle={v => handleToggle('voiceAssistant', v, setVoiceAssistant)} />

        <SectionHeader title="APPEARANCE" />
        <SettingItem icon={Palette} label={t('theme')} sublabel="Customize the look and feel" value={themeLabel} onClick={() => setShowThemeSel(true)} />
        <SettingItem icon={Moon} label="High Contrast" sublabel="Easier visibility for outdoor use"
          hasToggle toggleValue={highContrast} onToggle={v => handleToggle('highContrast', v, setHighContrast)} />
        <SettingItem icon={Eye} label="Font Size" sublabel="Text size across the app" value="Medium" onClick={() => showToast('Font size settings coming soon!')} />

        <SectionHeader title="NOTIFICATIONS & SYNC" />
        <SettingItem icon={Bell} label={t('notifications')} sublabel="Complaint updates and alerts"
          hasToggle toggleValue={notifications} onToggle={v => handleToggle('notifications', v, setNotifications)} />
        <SettingItem icon={CheckCircle2} label="Auto Upload" sublabel="Sync data when connectivity returns"
          hasToggle toggleValue={autoUpload} onToggle={v => handleToggle('autoUpload', v, setAutoUpload)} />
        <SettingItem icon={Wifi} label="Offline Mode" sublabel="Save complaints for later submission"
          hasToggle toggleValue={offlineMode} onToggle={v => handleToggle('offlineMode', v, setOfflineMode)} />

        <SectionHeader title="SECURITY & ACCOUNT" />
        <SettingItem icon={Key} label={t('changePassword')} sublabel="Update your login password" onClick={() => setShowPassModal(true)} />
        <SettingItem icon={Shield} label="Privacy Policy" onClick={() => window.open('https://civiclens.app/privacy', '_blank')} />
        <SettingItem icon={Trash2} label={t('deleteAccount')} sublabel="Permanently remove your data" isRed onClick={() => setShowDeleteConfirm(true)} />

        <SectionHeader title="SUPPORT" />
        <SettingItem icon={HelpCircle} label="Help & FAQ" onClick={() => window.open('https://civiclens.app/help', '_blank')} />
        <SettingItem icon={Info} label="About CivicLens" onClick={() => showToast('CivicLens v1.0.4 — Built for citizens')} />

        <div className="p-6 space-y-4">
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-4 bg-red-50 text-red-600 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
            <LogOut size={20} /> {t('logout')}
          </button>
          <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            CIVICLENS V1.0.4 • MADE FOR {roleLabel.toUpperCase()}S
          </p>
        </div>
      </div>

      {/* Modals */}
      <SelectorModal isOpen={showLangSel} onClose={() => setShowLangSel(false)} title="App Language"
        options={[
          { label: 'English', value: 'English', description: 'Interface in English' },
          { label: 'Hindi (हिंदी)', value: 'Hindi', description: 'इंटरफेस हिंदी में' },
          { label: 'Punjabi (ਪੰਜਾਬੀ)', value: 'Punjabi', description: 'ਪੰਜਾਬੀ ਵਿੱਚ' },
          { label: 'Tamil (தமிழ்)', value: 'Tamil', description: 'தமிழில்' },
          { label: 'Telugu (తెలుగు)', value: 'Telugu', description: 'తెలుగులో' },
          { label: 'Bengali (বাংলা)', value: 'Bengali', description: 'বাংলায়' },
          { label: 'Gujarati (ગુજરાતી)', value: 'Gujarati', description: 'ગુજરાતીમાં' },
          { label: 'Kannada (ಕನ್ನಡ)', value: 'Kannada', description: 'ಕನ್ನಡದಲ್ಲಿ' },
          { label: 'Malayalam (മലയാളം)', value: 'Malayalam', description: 'മലയാളത്തിൽ' },
          { label: 'Marathi (मराठी)', value: 'Marathi', description: 'मराठीत' },
        ]}
        current={language}
        onSelect={v => { setLanguage(v as any); showToast(`Language changed to ${v}`); }}
      />

      <SelectorModal isOpen={showAssistLangSel} onClose={() => setShowAssistLangSel(false)} title="Assistant Language"
        options={['English','Hindi','Punjabi','Tamil','Telugu','Bengali','Gujarati','Kannada','Malayalam','Marathi'].map(l => ({ label: l, value: l }))}
        current={assistantLang}
        onSelect={v => handleSelect('assistantLang', v, setAssistantLang, 'Assistant language')}
      />

      <SelectorModal isOpen={showThemeSel} onClose={() => setShowThemeSel(false)} title="Theme"
        options={[
          { label: '☀️ Light', value: 'light', description: 'Clean white interface' },
          { label: '🌙 Dark', value: 'dark', description: 'Easy on eyes at night' },
          { label: '⚙️ System', value: 'system', description: 'Follows your device setting' },
        ]}
        current={theme}
        onSelect={v => { setTheme(v as any); showToast(`Theme set to ${v}`); }}
      />

      <SelectorModal isOpen={showSpeedSel} onClose={() => setShowSpeedSel(false)} title="Voice Speed"
        options={[
          { label: 'Slow', value: 'Slow', description: '0.7x speed' },
          { label: 'Normal', value: 'Normal', description: '1x speed' },
          { label: 'Fast', value: 'Fast', description: '1.2x speed' },
          { label: 'Very Fast', value: 'Very Fast', description: '1.5x speed' },
        ]}
        current={voiceSpeed}
        onSelect={v => handleSelect('voiceSpeed', v, setVoiceSpeed, 'Voice speed')}
      />

      <SelectorModal isOpen={showGenderSel} onClose={() => setShowGenderSel(false)} title="Voice Gender"
        options={[{ label: 'Female', value: 'Female' }, { label: 'Male', value: 'Male' }]}
        current={voiceGender}
        onSelect={v => handleSelect('voiceGender', v, setVoiceGender, 'Voice gender')}
      />

      <SelectorModal isOpen={showNavModeSel} onClose={() => setShowNavModeSel(false)} title="Navigation Mode"
        options={[
          { label: '🤝 Assistive', value: 'Assistive', description: 'Voice + touch control' },
          { label: '🎙️ Hands-free', value: 'Hands-free', description: 'Full voice control only' },
          { label: '👆 Touch only', value: 'Touch only', description: 'Disable voice navigation' },
        ]}
        current={navMode}
        onSelect={v => handleSelect('navMode', v, setNavMode, 'Navigation mode')}
      />

      <InputModal isOpen={showPassModal} onClose={() => setShowPassModal(false)} onSubmit={handlePasswordChange} title="Change Password" />

      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDeleteAccount}
        title="Delete Account" isDanger message="This will permanently delete your account and all your complaints. This cannot be undone." confirmLabel="Delete Account" />

      <ConfirmModal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={logout}
        title="Logout" message="Are you sure you want to logout?" confirmLabel="Logout" />

      <AnimatePresence>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};