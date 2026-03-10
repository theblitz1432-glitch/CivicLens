'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Mic, Zap, Volume2, User, Palette, Moon, 
  Key, Trash2, CheckCircle2, Info, LogOut, Camera, 
  MapPin, ChevronRight, Check, X, LucideIcon
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
  options: { label: string; value: string }[];
  current: string;
  onSelect: (val: string) => void;
}

// ✅ Defined OUTSIDE main component
const SettingItem = ({ icon: Icon, label, sublabel, value, onClick, isRed = false, hasToggle = false, toggleValue = false, onToggle = () => {} }: SettingItemProps) => (
  <div 
    onClick={!hasToggle ? onClick : undefined}
    className={`flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${isRed ? 'text-red-600' : 'text-slate-900'}`}
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
      {value && <span className="text-xs font-bold text-emerald-600">{value}</span>}
      {hasToggle ? (
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(!toggleValue); }}
          className={`w-12 h-6 rounded-full transition-colors relative ${toggleValue ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
          <motion.div 
            animate={{ x: toggleValue ? 24 : 2 }}
            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
          />
        </button>
      ) : (
        <ChevronRight size={16} className="text-slate-300" />
      )}
    </div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 pt-8 pb-2">
    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{title}</h4>
  </div>
);

const SelectorModal = ({ isOpen, onClose, title, options, current, onSelect }: SelectorModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          className="relative w-full max-w-sm bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={18} /></button>
          </div>
          <div className="p-2">
            {options.map((opt) => (
              <button 
                key={opt.value}
                onClick={() => { onSelect(opt.value); onClose(); }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${current === opt.value ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                <span className="font-bold text-sm">{opt.label}</span>
                {current === opt.value && <Check size={18} />}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ✅ Main component
export const SettingsContent: React.FC<SettingsContentProps> = ({ user, logout, roleLabel }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  const [voiceAssistant, setVoiceAssistant] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [autoUpload, setAutoUpload] = useState(true);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  return (
    <div className="max-w-md mx-auto bg-white min-h-full pb-20">
      {/* Profile Header */}
      <div className="p-6">
        <div className="relative bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-6 flex flex-col items-center text-center">
          <div className="absolute top-0 left-0 right-0 h-24 bg-slate-100 overflow-hidden">
            <img 
              src="https://picsum.photos/seed/forest/800/200" 
              alt="Cover" 
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="relative mt-8 mb-4">
            <div className="w-24 h-24 rounded-[28px] overflow-hidden border-4 border-white shadow-lg">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Rahul'}`} 
                alt="Profile" 
                className="w-full h-full object-cover bg-blue-50"
              />
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-xl border-2 border-white flex items-center justify-center shadow-lg">
              <Camera size={16} />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-bold text-[#001f3f]">{user?.name || 'Rahul Sharma'}</h2>
              <div className="bg-emerald-100 text-emerald-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Check size={8} />
                VERIFIED
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-medium">
              <MapPin size={12} />
              <span>Gram Panchayat, Malpur</span>
            </div>
            <div className="mt-3">
              <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-2">
        <SectionHeader title={t('language').toUpperCase() + ' & VOICE'} />
        <SettingItem icon={Globe} label={t('app_language')} sublabel="Interface and text language" value={language} onClick={() => setShowLanguageSelector(true)} />
        <SettingItem icon={Mic} label={t('assistant_language')} sublabel="Language the assistant speaks and understands" value={language} />
        <SettingItem icon={Zap} label={t('navigation_mode')} sublabel="On: Hands-free | Assistive: Voice + Touch" value="Assistive" />

        <SectionHeader title="VOICE CUSTOMIZATION" />
        <SettingItem icon={Volume2} label={t('voice_speed')} value="Normal" />
        <SettingItem icon={User} label={t('voice_gender')} value="Female" />
        <SettingItem icon={Mic} label={t('voice_assistant')} sublabel="Enable voice-driven interactions" hasToggle toggleValue={voiceAssistant} onToggle={setVoiceAssistant} />

        <SectionHeader title="APPEARANCE" />
        <SettingItem icon={Palette} label={t('theme')} sublabel="Customize the look and feel" value={theme.charAt(0).toUpperCase() + theme.slice(1).replace('-', ' ')} onClick={() => setShowThemeSelector(true)} />
        <SettingItem icon={Moon} label={t('high_contrast')} sublabel="Easier visibility for outdoor use" hasToggle toggleValue={highContrast} onToggle={setHighContrast} />

        <SectionHeader title="SECURITY & ACCOUNT" />
        <SettingItem icon={Key} label={t('change_password')} />
        <SettingItem icon={Trash2} label={t('delete_account')} sublabel="Permanently remove your data" isRed />

        <SectionHeader title="ACCESSIBILITY & ALERTS" />
        <SettingItem icon={CheckCircle2} label={t('auto_upload')} sublabel="Sync data when connectivity returns" hasToggle toggleValue={autoUpload} onToggle={setAutoUpload} />

        <SectionHeader title="SUPPORT" />
        <SettingItem icon={Info} label={t('help_faq')} />
        <SettingItem icon={Info} label={t('about')} />

        <div className="p-6 space-y-6">
          <button onClick={logout} className="w-full py-4 bg-red-50 text-red-600 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
            <LogOut size={20} />
            {t('logout')}
          </button>
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">CIVICLENS V1.0.4 • MADE FOR {roleLabel}S</p>
          </div>
        </div>
      </div>

      {/* Selectors */}
      <SelectorModal isOpen={showLanguageSelector} onClose={() => setShowLanguageSelector(false)} title={t('app_language')} options={[{ label: 'English', value: 'English' }, { label: 'Hindi (हिंदी)', value: 'Hindi' }]} current={language} onSelect={(val: string) => setLanguage(val as 'English' | 'Hindi')} />
      <SelectorModal isOpen={showThemeSelector} onClose={() => setShowThemeSelector(false)} title={t('theme')} options={[{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }, { label: 'System', value: 'system' }]} current={theme} onSelect={(val: string) => setTheme(val as 'light' | 'dark' | 'system')} />
    </div>
  );
};
