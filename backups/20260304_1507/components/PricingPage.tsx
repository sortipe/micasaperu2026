
import React from 'react';
import { Package } from '../types';
import { PACKAGES as DEFAULT_PACKAGES } from '../constants';

interface PricingPageProps {
  onSelectPackage: (pkg: Package) => void;
  customPackages?: Package[];
}

const PricingPage: React.FC<PricingPageProps> = ({ onSelectPackage, customPackages }) => {
  const displayPackages = customPackages || DEFAULT_PACKAGES;

  return (
    <div className="bg-gray-50 py-12 md:py-20 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
          <h2 className="text-[#091F4F] font-black text-[10px] uppercase tracking-[0.4em] mb-3">Alcance Máximo</h2>
          <h1 className="text-3xl md:text-5xl font-black text-[#091F4F] mb-4 tracking-tighter leading-none">Planes Inmobiliarios</h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Elige la visibilidad que tu propiedad merece</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto items-stretch">
          {displayPackages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl transition-all duration-500 flex flex-col relative border-2 ${
                pkg.id === 'pro' ? 'border-[#e31e24]/20 scale-105 z-10 shadow-2xl shadow-red-100' : 'border-white'
              }`}
            >
              {pkg.id === 'pro' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#e31e24] text-white px-5 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg">
                  Más Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-black text-[#091F4F] mb-2 tracking-tight">{pkg.name}</h3>
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-tight h-8 leading-tight">{pkg.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#091F4F] tracking-tighter leading-none">S/ {pkg.price}</span>
                <span className="text-gray-400 font-black text-[9px] uppercase tracking-widest opacity-60">
                  / {pkg.id === 'free' ? 'PAGO ÚNICO' : 'MENSUAL'}
                </span>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                <div className="flex items-center space-x-3">
                  <div className="shrink-0 text-[#e31e24]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-700 font-black text-sm tracking-tight">
                    {pkg.propertyLimit} {pkg.propertyLimit === 1 ? 'Propiedad' : 'Propiedades'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="shrink-0 text-[#e31e24]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-700 font-black text-sm tracking-tight">{pkg.durationDays} días de duración</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`shrink-0 ${pkg.featuredLimit > 0 ? 'text-[#e31e24]' : 'text-gray-200'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className={`text-sm font-black tracking-tight ${pkg.featuredLimit > 0 ? 'text-gray-700' : 'text-gray-200'}`}>
                    {pkg.featuredLimit} Destacados Premium
                  </span>
                </div>
              </div>

              <button 
                onClick={() => onSelectPackage(pkg)}
                className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
                  pkg.id === 'free' 
                  ? 'bg-gray-50 text-gray-400 hover:bg-gray-100' 
                  : 'bg-[#e31e24] text-white hover:bg-[#091F4F] shadow-red-100 hover:shadow-blue-100'
                }`}
              >
                {pkg.price === 0 ? 'PUBLICAR GRATIS' : 'ADQUIRIR PLAN'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
