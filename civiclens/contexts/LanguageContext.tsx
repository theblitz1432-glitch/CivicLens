'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'English' | 'Hindi';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const translations: Record<Language, Record<string, string>> = {
  English: {
    'welcome': 'Welcome',
    'dashboard': 'Dashboard',
    'settings': 'Settings',
    'profile': 'Profile',
    'logout': 'Logout',
    'language': 'Language',
    'theme': 'Theme',
    'voice_assistant': 'Voice Assistant',
    'app_language': 'App Language',
    'assistant_language': 'Assistant Language',
    'navigation_mode': 'Navigation Mode',
    'voice_speed': 'Voice Speed',
    'voice_gender': 'Voice Gender',
    'high_contrast': 'High Contrast',
    'change_password': 'Change Password',
    'delete_account': 'Delete Account',
    'help_faq': 'Help & FAQ',
    'about': 'About CivicLens',
    'auto_upload': 'Auto-upload Offline',
  },
  Hindi: {
    'welcome': 'स्वागत है',
    'dashboard': 'डैशबोर्ड',
    'settings': 'सेटिंग्स',
    'profile': 'प्रोफ़ाइल',
    'logout': 'लॉगआउट',
    'language': 'भाषा',
    'theme': 'थीम',
    'voice_assistant': 'आवाज सहायक',
    'app_language': 'ऐप की भाषा',
    'assistant_language': 'सहायक भाषा',
    'navigation_mode': 'नेविगेशन मोड',
    'voice_speed': 'आवाज की गति',
    'voice_gender': 'आवाज का लिंग',
    'high_contrast': 'उच्च कंट्रास्ट',
    'change_password': 'पासवर्ड बदलें',
    'delete_account': 'खाता हटाएं',
    'help_faq': 'सहायता और अक्सर पूछे जाने वाले प्रश्न',
    'about': 'CivicLens के बारे में',
    'auto_upload': 'ऑफ़लाइन ऑटो-अपलोड',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ Start with default, no localStorage here
  const [language, setLanguageState] = useState<Language>('English');

  // ✅ Load from localStorage after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('app-language') as Language;
      if (saved) setTimeout(() => setLanguageState(saved), 0);
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('app-language', lang);
    setLanguageState(lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};