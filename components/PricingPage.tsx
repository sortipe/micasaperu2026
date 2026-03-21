
import React from 'react';
import { Package, Role } from '../types';
import { PACKAGES as DEFAULT_PACKAGES } from '../constants';

interface PricingPageProps {
  onSelectPackage: (pkg: Package) => void;
  onAddToCart: (pkg: Package) => void;
  customPackages?: Package[];
  userRole?: Role;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSelectPackage, onAddToCart, customPackages, userRole }) => {
  const displayPackages = (customPackages || DEFAULT_PACKAGES).filter(pkg => {
    // If no roles are specified, it's available to everyone
    if (!pkg.allowedRoles || pkg.allowedRoles.length === 0) return true;
    // If user is not logged in, they can only see public packages (no allowedRoles)
    if (!userRole) return false;
    // Admins see everything
    if (userRole === 'ADMINISTRADOR') return true;
    // Check if user's role is in the allowed list
    return pkg.allowedRoles.includes(userRole);
  });

  return (
    <div className="bg-gray-50 py-12 md:py-20 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
          <h2 className="text-[#091F4F] font-black text-[10px] uppercase tracking-[0.4em] mb-3">Alcance Máximo</h2>
          <h1 className="text-3xl md:text-5xl font-black text-[#091F4F] mb-4 tracking-tighter leading-none">Planes Inmobiliarios</h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Elige la visibilidad que tu propiedad merece</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto items-stretch">
          {displayPackages.map((pkg, index) => (
            <div 
              key={pkg.id} 
              className={`bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl transition-all duration-500 flex flex-col relative border-2 ${
                index === 1 ? 'border-[#e31e24]/20 scale-105 z-10 shadow-2xl shadow-red-100' : 'border-white'
              }`}
            >
              {index === 1 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#e31e24] text-white px-5 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg">
                  Más Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-black text-[#091F4F] mb-2 tracking-tight">{pkg.name}</h3>
                <div className="space-y-1">
                  {pkg.description.split('|').map((line, i) => (
                    <p key={i} className="text-gray-400 text-[10px] font-bold uppercase tracking-tight leading-tight">
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#091F4F] tracking-tighter leading-none">S/ {pkg.price.toLocaleString()}</span>
                <span className="text-gray-400 font-black text-[9px] uppercase tracking-widest opacity-60">
                  / MENSUAL
                </span>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {pkg.features && pkg.features.filter(f => f.trim() !== '').length > 0 ? (
                  pkg.features.filter(f => f.trim() !== '').map((feature, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="shrink-0 text-[#e31e24]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-gray-700 font-black text-sm tracking-tight">{feature}</span>
                    </div>
                  ))
                ) : (
                  <>
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
                      <span className="text-gray-700 font-black text-sm tracking-tight">{pkg.durationDays} días de publicación - Sin renovación automática</span>
                    </div>
                    {pkg.featuredLimit > 0 && (
                      <div className="flex items-center space-x-3">
                        <div className="shrink-0 text-[#e31e24]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-gray-700 font-black text-sm tracking-tight">
                          {pkg.featuredLimit} Destacados
                        </span>
                      </div>
                    )}
                    {pkg.superFeaturedLimit && pkg.superFeaturedLimit > 0 && (
                      <div className="flex items-center space-x-3">
                        <div className="shrink-0 text-yellow-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </div>
                        <span className="text-gray-700 font-black text-sm tracking-tight">
                          {pkg.superFeaturedLimit} Super Destacados
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button 
                onClick={() => onSelectPackage(pkg)}
                className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
                  pkg.price === 0 
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
