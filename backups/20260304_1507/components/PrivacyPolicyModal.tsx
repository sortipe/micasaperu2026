
import React from 'react';
// Fixed: Changed PrivacyPolicy to LegalDoc as PrivacyPolicy is not exported from '../types'
import { LegalDoc } from '../types';

interface PrivacyPolicyModalProps {
  // Fixed: Changed PrivacyPolicy to LegalDoc to match the available exported interface
  policies: LegalDoc[];
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ policies, onClose }) => {
  return (
    <div className="fixed inset-0 z-[6000] overflow-y-auto bg-gray-100/95 backdrop-blur-md p-4 animate-fade-in flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-400 hover:text-red-600 transition-colors z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div className="p-10 md:p-14">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Políticas de Privacidad</h1>
          </div>

          <div className="space-y-10 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
            {policies.length > 0 ? policies.map((policy) => (
              <div key={policy.id} className="space-y-4">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight border-l-4 border-blue-600 pl-4">{policy.title}</h2>
                <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-sm">
                  {policy.content}
                </div>
              </div>
            )) : (
              <p className="text-center py-20 text-gray-400 font-bold uppercase text-xs tracking-widest">No hay políticas publicadas actualmente.</p>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-gray-50 flex justify-between items-center">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">MICASAPERÚ - Área Legal</p>
             <button onClick={onClose} className="bg-slate-900 text-white px-10 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
