
import React, { useEffect } from 'react';

export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyles = () => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-green-600 border-green-500';
      case 'ERROR':
        return 'bg-red-600 border-red-500';
      case 'WARNING':
        return 'bg-yellow-500 border-yellow-400';
      case 'INFO':
      default:
        return 'bg-blue-600 border-blue-500';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'SUCCESS':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'ERROR':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border-2 text-white animate-slide-up ${getStyles()}`}>
      <div className="shrink-0 bg-white/20 p-1.5 rounded-lg">
        {getIcon()}
      </div>
      <p className="text-xs font-black uppercase tracking-widest leading-none">{message}</p>
      <button onClick={onClose} className="ml-2 hover:scale-110 transition-transform">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
