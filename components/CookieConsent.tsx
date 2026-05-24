import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface CookieConsentProps {
  onLearnMore: () => void;
}

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface ConsentRecord {
  version: string;
  preferences: CookiePreferences;
  timestamp: string;
  userAgent: string;
}

const CONSENT_VERSION = '1.0';
const STORAGE_KEY = 'micasaperu_cookie_consent';

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const CookieConsent: React.FC<CookieConsentProps> = ({ onLearnMore }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ConsentRecord = JSON.parse(stored);
        if (parsed.version === CONSENT_VERSION) {
          setIsVisible(false);
          return;
        }
      }
      setIsVisible(true);
    } catch {
      setIsVisible(true);
    }
  }, []);

  const logConsentToSupabase = async (prefs: CookiePreferences) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('consent_logs').insert({
        consent_version: CONSENT_VERSION,
        preferences: prefs,
        user_agent: navigator.userAgent.slice(0, 500),
        ip_hash: null,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Non-blocking - consent still saved locally
    }
  };

  const saveConsent = (prefs: CookiePreferences) => {
    const record: ConsentRecord = {
      version: CONSENT_VERSION,
      preferences: prefs,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.slice(0, 200),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // localStorage may be unavailable
    }
    logConsentToSupabase(prefs);
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = { necessary: true, analytics: true, marketing: true };
    saveConsent(allAccepted);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handleRejectAll = () => {
    saveConsent(defaultPreferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isMounted || !isVisible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] flex justify-center px-4 pb-4 pointer-events-none">
      <div className="w-full max-w-3xl bg-[#091F4F] text-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_10px_0_0_rgba(0,0,0,0.3)] border border-white/10 pointer-events-auto animate-slide-up">
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 text-3xl md:text-4xl leading-none">🍪</div>
          <div className="flex-grow">
            <h2 className="text-sm font-black uppercase tracking-widest mb-1">Configuración de Cookies</h2>
            <p className="text-[11px] md:text-xs font-medium leading-relaxed text-blue-50">
              Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y mostrarte contenido relevante. 
              Puedes aceptar todas, rechazar las no esenciales o configurar tus preferencias.
              <button onClick={onLearnMore} className="ml-1 font-black underline hover:text-red-400 transition-colors">
                Ver política de cookies
              </button>
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="mb-4 space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-3">Preferencias por categoría</h3>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={preferences.necessary} disabled className="w-4 h-4 rounded accent-red-600" />
              <div className="flex-grow">
                <span className="text-xs font-bold">Cookies necesarias (siempre activas)</span>
                <p className="text-[10px] text-blue-200/60">Permiten la navegación básica y el funcionamiento del sitio.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={preferences.analytics} onChange={() => togglePreference('analytics')} className="w-4 h-4 rounded accent-red-600" />
              <div className="flex-grow">
                <span className="text-xs font-bold">Cookies de análisis</span>
                <p className="text-[10px] text-blue-200/60">Nos ayudan a entender cómo usas el sitio para mejorarlo.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={preferences.marketing} onChange={() => togglePreference('marketing')} className="w-4 h-4 rounded accent-red-600" />
              <div className="flex-grow">
                <span className="text-xs font-bold">Cookies de marketing</span>
                <p className="text-[10px] text-blue-200/60">Permiten mostrarte anuncios relevantes según tu navegación.</p>
              </div>
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button onClick={() => setShowDetails(!showDetails)} className="text-[10px] font-bold text-blue-200 underline hover:text-white transition-colors">
            {showDetails ? 'Ocultar preferencias' : 'Personalizar cookies'}
          </button>
          <div className="flex flex-wrap gap-2">
            {showDetails && (
              <button onClick={handleRejectAll} className="px-5 py-2.5 rounded-xl border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                Solo necesarias
              </button>
            )}
            {showDetails && (
              <button onClick={handleSavePreferences} className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
                Guardar
              </button>
            )}
            <button onClick={handleAcceptAll} className="bg-[#FFC107] hover:bg-white text-[#091F4F] px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg whitespace-nowrap">
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
