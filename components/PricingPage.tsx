
import React, { useState } from 'react';
import { Package, Role } from '../types';
import { PACKAGES as DEFAULT_PACKAGES } from '../constants';

interface PricingPageProps {
  onSelectPackage: (pkg: Package) => void;
  onAddToCart: (pkg: Package) => void;
  customPackages?: Package[];
  userRole?: Role;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSelectPackage, onAddToCart, customPackages, userRole }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const allPackages = customPackages || DEFAULT_PACKAGES;
  
  const displayPackages = allPackages.filter(pkg => {
    if (!pkg.allowedRoles || pkg.allowedRoles.length === 0) return true;
    if (!userRole) return false;
    if (userRole === 'ADMINISTRADOR') return true;
    return pkg.allowedRoles.includes(userRole);
  });

  const getCategories = () => {
    const groups = new Set(displayPackages.map(p => p.packageGroup).filter(Boolean));
    return Array.from(groups) as string[];
  };

  const getFilteredPackages = () => {
    if (!selectedCategory) return [];
    return displayPackages.filter(p => p.packageGroup === selectedCategory);
  };

  const hasValidOffer = (pkg: Package) => {
    if (!pkg.offerPrice || pkg.offerPrice <= 0) return false;
    if (!pkg.offerExpiresAt) return true;
    return new Date(pkg.offerExpiresAt) > new Date();
  };

  const getDiscount = (pkg: Package) => {
    if (!hasValidOffer(pkg)) return 0;
    return Math.round((1 - pkg.offerPrice! / pkg.price) * 100);
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="bg-gray-50 py-12 md:py-20 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
          <h2 className="text-[#091F4F] font-black text-[10px] uppercase tracking-[0.4em] mb-3">Alcance Máximo</h2>
          <h1 className="text-3xl md:text-5xl font-black text-[#091F4F] mb-4 tracking-tighter leading-none">Planes Inmobiliarios</h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Elige la visibilidad que tu propiedad merece</p>
        </div>

        {!selectedCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {getCategories().map((category, index) => (
              <button 
                key={category}
                onClick={() => handleSelectCategory(category)}
                className={`bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl transition-all duration-500 flex flex-col relative border-2 hover:border-red-500 cursor-pointer ${
                  index === 1 ? 'border-[#e31e24]/20 scale-105 z-10 shadow-2xl shadow-red-100' : 'border-white'
                }`}
              >
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#e31e24] text-white px-5 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg">
                    Más Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-[#091F4F] mb-2 tracking-tight">{category}</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    {displayPackages.filter(p => p.packageGroup === category).length} planes disponibles
                  </p>
                </div>
                <div className="mt-auto">
                  <svg className="w-8 h-8 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <button 
              onClick={handleBackToCategories}
              className="flex items-center gap-2 text-gray-400 hover:text-red-600 font-black text-[10px] uppercase tracking-widest mb-8 transition-colors mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Volver a categorías
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto items-stretch">
              {getFilteredPackages().map((pkg, index) => (
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

                  <div className="mb-8 flex items-baseline gap-2 relative">
                    {hasValidOffer(pkg) ? (
                      <>
                        <span className="text-4xl font-black text-[#e31e24] tracking-tighter leading-none">S/ {pkg.offerPrice!.toLocaleString()}</span>
                        <span className="text-gray-400 font-black text-[9px] uppercase tracking-widest line-through opacity-60">
                          S/ {pkg.price.toLocaleString()}
                        </span>
                        <div className="absolute -top-2 right-4 bg-green-500 text-white px-2 py-0.5 rounded-full font-black text-[9px]">
                          -{getDiscount(pkg)}%
                        </div>
                        {pkg.offerExpiresAt && (
                          <div className="absolute -bottom-6 right-0 text-[8px] font-black text-orange-500">
                            Oferta hasta el {new Date(pkg.offerExpiresAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-black text-[#091F4F] tracking-tighter leading-none">S/ {pkg.price.toLocaleString()}</span>
                        <span className="text-gray-400 font-black text-[9px] uppercase tracking-widest opacity-60">
                          / MENSUAL
                        </span>
                      </>
                    )}
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
                    {pkg.price === 0 ? 'PUBLICAR Gratis' : 'ADQUIRIR PLAN'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPage;
