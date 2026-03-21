
import React, { useState, useEffect } from 'react';

interface CookieConsentProps {
  onLearnMore: () => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onLearnMore }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const consent = localStorage.getItem('micasaperu_cookie_consent');
      if (consent !== 'accepted') {
        setIsVisible(true);
      }
    } catch (e) {
      // If localStorage is blocked, we show it anyway or handle gracefully
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('micasaperu_cookie_consent', 'accepted');
    } catch (e) {
      console.error('Could not save cookie consent', e);
    }
    setIsVisible(false);
  };

  if (!isMounted || !isVisible) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-[9999] flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-3xl bg-[#091F4F] text-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_10px_0_0_rgba(0,0,0,0.3)] border border-white/10 flex flex-col md:flex-row items-center gap-4 md:gap-8 pointer-events-auto animate-slide-up">
        <div className="flex items-center gap-4 flex-grow">
          <div className="shrink-0 text-3xl md:text-4xl">
            🍪
          </div>
          
          <div className="flex-grow">
            <p className="text-[11px] md:text-sm font-medium leading-relaxed text-blue-50">
              Utilizamos cookies para mejorar su experiencia en nuestro sitio. Al continuar navegando, acepta nuestra política de cookies. 
              <button 
                onClick={onLearnMore}
                className="ml-1 font-black underline hover:text-red-400 transition-colors"
              >
                Leer más
              </button>
            </p>
          </div>
        </div>

        <button 
          onClick={handleAccept}
          className="w-full md:w-auto bg-[#FFC107] hover:bg-white text-[#091F4F] px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg whitespace-nowrap"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
