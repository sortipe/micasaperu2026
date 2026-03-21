
import React from 'react';
import { LegalDoc } from '../types';

interface LegalModalProps {
  doc: LegalDoc | null;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ doc, onClose }) => {
  const displayDoc = doc || {
    title: 'Documento no disponible',
    content: 'Este documento legal se encuentra actualmente en proceso de redacción o actualización. Por favor, vuelva a consultar más tarde o póngase en contacto con nosotros para obtener más información.',
    updatedAt: new Date().toISOString(),
    type: 'PRIVACY' as any
  };

  return (
    <div className="fixed inset-0 z-[7000] overflow-y-auto bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white shadow-2xl rounded-[2.5rem] border border-gray-100 overflow-hidden relative">
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-gray-400 hover:text-red-600 transition-colors z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div className="p-8 md:p-16">
          <div className="flex items-center gap-5 mb-10">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">{displayDoc.title}</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Última actualización: {new Date(displayDoc.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-6 custom-scrollbar">
            <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-[15px]">
              {displayDoc.content}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-50 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Área de Cumplimiento Legal - MICASAPERÚ</p>
             </div>
             <button onClick={onClose} className="bg-slate-900 text-white px-12 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95">Entendido</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
