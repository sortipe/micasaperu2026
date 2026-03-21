
import React, { useState } from 'react';
import { Property } from '../types';

interface PropertyListProps {
  properties: Property[];
  onPropertySelect: (id: string) => void;
  currency: 'USD' | 'PEN';
  onClearFilters: () => void;
  layout?: 'grid' | 'list' | 'slider';
  visitedIds?: Set<string>;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
}

const PropertyList: React.FC<PropertyListProps> = ({ 
  properties, onPropertySelect, currency, onClearFilters, visitedIds = new Set(),
  favorites = new Set(), onToggleFavorite, layout = 'grid'
}) => {
  const handlePropertyClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    onPropertySelect(id);
  };

  if (properties.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 w-full animate-fade-in">
        <p className="text-gray-900 text-2xl font-black mb-2">No hallamos coincidencias</p>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-8">Intenta ajustando los filtros de búsqueda</p>
        <button onClick={onClearFilters} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Limpiar filtros</button>
      </div>
    );
  }

  return (
    <div className={
      layout === 'slider' ? "flex gap-4 overflow-x-auto pb-4 custom-scrollbar" :
      layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : 
      "flex flex-col gap-6"
    }>
      {properties.map(property => {
        const isVisited = visitedIds.has(property.id);
        const isFavorite = favorites.has(property.id);

        if (layout === 'list') {
          return (
            <div 
              key={property.id} 
              className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 cursor-pointer flex flex-col md:flex-row h-auto md:h-[260px]"
              onClick={(e) => handlePropertyClick(property.id, e)}
            >
              {/* Image Section */}
              <div className="relative w-full md:w-[320px] shrink-0 overflow-hidden aspect-[4/3] md:aspect-auto h-full">
                <img src={property.featuredImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                
                {/* Tag on image */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {property.status === 'PROJECT' ? (
                    <span className="md:hidden bg-[#2d3277] text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-lg">En planos</span>
                  ) : property.planType === 'SUPER_FEATURED' ? (
                    <span className="md:hidden bg-yellow-400 text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded shadow-lg">Super Destacado</span>
                  ) : (property.planType === 'FEATURED' || (property.isFeatured && property.planType !== 'BASIC')) ? (
                    <span className="md:hidden bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-lg">Destacado</span>
                  ) : null}
                  
                  <span className="hidden md:block bg-white/90 backdrop-blur-sm text-slate-900 text-[11px] font-bold px-3 py-1 rounded shadow-sm">
                    {property.features?.[0] || 'Inmueble'}
                  </span>
                </div>

                {/* Favorite Button (Mobile) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(property.id); }}
                  className="md:hidden absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100"
                >
                  <svg className={`w-5 h-5 ${isFavorite ? 'text-red-600 fill-current' : 'text-gray-400'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>

                {/* Carousel Dots Placeholder (Desktop) */}
                <div className="hidden md:flex absolute bottom-4 left-0 right-0 justify-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4 md:p-5 flex-grow flex flex-col relative min-w-0 h-full">
                {/* Favorite Button (Desktop) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(property.id); }}
                  className="hidden md:flex absolute top-5 right-5 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg className={`w-5 h-5 ${isFavorite ? 'text-red-600 fill-current' : ''}`} stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>

                {/* Mobile Header: Title + Logo */}
                <div className="md:hidden flex justify-between items-start mb-1">
                  <p className="text-[13px] font-medium text-slate-500">{property.title}</p>
                  <div className="w-16 h-8 bg-white border border-gray-100 rounded flex items-center justify-center text-[8px] font-bold text-blue-600">LOGO</div>
                </div>

                <div className="flex-grow">
                  {/* Mobile Price */}
                  <div className="md:hidden mb-3">
                    <h2 className="text-lg font-black text-slate-900">
                      Desde {currency === 'PEN' ? `S/ ${(property.pricePEN || 0).toLocaleString()}` : `$${(property.priceUSD || 0).toLocaleString()}`}
                    </h2>
                  </div>

                  {/* Desktop Price Line */}
                  <div className="hidden md:block mb-1">
                    <h2 className="text-[22px] font-bold text-slate-900 leading-none">
                      S/ {(property.pricePEN || 0).toLocaleString()} · USD {(property.priceUSD || 0).toLocaleString()}
                    </h2>
                    {property.maintenanceFee ? (
                      <p className="text-[13px] text-slate-500 font-medium mt-1.5">S/ {property.maintenanceFee} Mantenimiento</p>
                    ) : (
                      <p className="text-[13px] text-transparent font-medium mt-1.5 select-none">&nbsp;</p>
                    )}
                  </div>

                  {/* Mobile Stats Row */}
                  <div className="md:hidden flex items-center divide-x divide-gray-200 mb-4 text-[13px] text-slate-600 font-medium">
                    <div className="pr-3">{property.builtArea} m² área total</div>
                    <div className="px-3">{property.bedrooms} dorm.</div>
                    <div className="pl-3">{property.bathrooms} baños</div>
                  </div>

                  {/* Desktop Stats Line */}
                  <div className="hidden md:flex items-center gap-3 mb-3 text-[13px] text-slate-700 font-medium">
                    <span>{property.builtArea} m² área total</span>
                    <span>{property.bedrooms} dorm.</span>
                    <span>{property.bathrooms} baños</span>
                    <span>{property.parking} estac.</span>
                  </div>

                  {/* Mobile Tags */}
                  <div className="md:hidden flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-white border border-purple-800 text-purple-800 rounded-full text-[11px] font-bold">Parrilla</span>
                  </div>

                  {/* Address */}
                  <div className="mb-2">
                    <h3 className="text-[14px] font-bold text-slate-900 leading-tight">{property.address}</h3>
                    <p className="text-[13px] text-slate-500">{property.district}, {property.department}, {property.department}</p>
                  </div>

                  {/* Desktop Description */}
                  <p className="hidden md:block text-[12px] text-slate-500 leading-relaxed mb-0">
                    {property.description.length > 198 ? `${property.description.substring(0, 198)}...` : property.description}
                  </p>
                </div>

                {/* Mobile Action Buttons */}
                <div className="md:hidden flex items-center gap-2 mt-auto">
                  <button 
                    onClick={(e) => { e.stopPropagation(); }}
                    className="w-12 h-12 shrink-0 rounded-xl border-2 border-[#ff5a00] text-[#ff5a00] flex items-center justify-center"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${property.agentWhatsapp || '51900000000'}`, '_blank'); }}
                    className="flex-grow h-12 bg-[#25d366] text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5"
                  >
                    WhatsApp
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.6-2.8-23.6-8.7-45-27.7-16.6-14.8-27.8-33.1-31.1-38.6-3.2-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.6-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.6-9.2 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.3 5.7 23.7 9.1 31.7 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                  </button>
                  <button className="flex-grow h-12 bg-[#ff5a00] text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5">
                    Contactar
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </button>
                </div>

                {/* Desktop Bottom Bar */}
                <div className="hidden md:flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3">
                    {property.planType !== 'BASIC' && (
                      <>
                        <img 
                          src={property.agentAvatar || `https://ui-avatars.com/api/?name=${property.agentName || 'Asesor'}&background=0f172a&color=fff`} 
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100 shadow-sm" 
                          alt={property.agentName}
                        />
                        <div className="flex items-center gap-1.5">
                          {property.planType === 'SUPER_FEATURED' && (
                            <>
                              <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              </div>
                              <span className="text-[12px] font-bold text-yellow-600 uppercase tracking-wide">Super destacado</span>
                            </>
                          )}
                          {(property.planType === 'FEATURED' || (property.isFeatured && property.planType !== 'SUPER_FEATURED')) && (
                            <>
                              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              </div>
                              <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wide">Destacado</span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="w-10 h-10 rounded-xl border border-gray-300 text-slate-700 flex items-center justify-center hover:bg-gray-50 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${property.agentWhatsapp || '51900000000'}`, '_blank'); }}
                      className="h-10 px-4 bg-[#25d366] text-white rounded-xl font-bold text-[13px] hover:bg-[#128c7e] transition-all flex items-center gap-2"
                    >
                      WhatsApp
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.6-2.8-23.6-8.7-45-27.7-16.6-14.8-27.8-33.1-31.1-38.6-3.2-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.6-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.6-9.2 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.3 5.7 23.7 9.1 31.7 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                    </button>
                    <button className="h-10 px-6 bg-[#ff5a00] text-white rounded-xl font-bold text-[13px] hover:bg-[#e65100] transition-all flex items-center gap-2">
                      Contactar
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const isSlider = layout === 'slider';

        return (
          <div 
            key={property.id} 
            className={`${isSlider ? 'min-w-[240px] w-[240px] shrink-0' : 'w-full'} bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow flex flex-col`}
            onClick={(e) => handlePropertyClick(property.id, e)}
          >
            <div className={`relative ${isSlider ? 'h-40' : 'h-48'}`}>
              <img src={property.featuredImage} alt={property.title} className="w-full h-full object-cover" />
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(property.id); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
              >
                <svg className={`w-3.5 h-3.5 ${isFavorite ? 'text-red-500 fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              </button>
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {property.planType === 'SUPER_FEATURED' && (
                  <span className={`bg-yellow-400 text-slate-900 ${isSlider ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-1'} font-black rounded uppercase tracking-widest shadow-sm`}>
                    Super Destacado
                  </span>
                )}
                {(property.planType === 'FEATURED' || (property.isFeatured && property.planType !== 'SUPER_FEATURED')) && (
                  <span className={`bg-blue-600 text-white ${isSlider ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-1'} font-black rounded uppercase tracking-widest shadow-sm`}>
                    Destacado
                  </span>
                )}
              </div>
            </div>
            <div className={`${isSlider ? 'p-3' : 'p-4'} flex flex-col flex-grow`}>
              <p className="text-[9px] text-gray-500 mb-1">
                {property.status === 'FOR_SALE' ? 'Venta' : 
                 property.status === 'FOR_RENT' ? 'Alquiler' :
                 property.status === 'TEMPORAL' ? 'Temporal' :
                 property.status === 'TRASPASO' ? 'Traspaso' :
                 'Proyecto'} · {property.type}
              </p>
              <p className="text-[9px] text-gray-500 mb-0.5">{property.status === 'FOR_RENT' ? 'Alquiler' : 'Desde'}</p>
              <p className={`${isSlider ? 'text-xs' : 'text-lg'} font-black text-slate-900 mb-1`}>
                {currency === 'PEN' ? `S/ ${(property.pricePEN || 0).toLocaleString()}` : `$${(property.priceUSD || 0).toLocaleString()}`}
              </p>
              {property.maintenanceFee ? (
                <p className="text-[9px] text-slate-500 font-medium mb-1.5">S/ {property.maintenanceFee} Mantenimiento</p>
              ) : (
                <p className="text-[9px] text-transparent font-medium mb-1.5 select-none">&nbsp;</p>
              )}
              <p className="text-[11px] font-bold text-slate-900 truncate">{property.address}</p>
              <p className="text-[9px] text-gray-500 mb-3 truncate">{property.district}, {property.department}, {property.department}</p>
              
              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 text-[9px] text-gray-600 border-t pt-2.5">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                  <span>{property.bedrooms} dorm.</span>
                </div>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span>{property.bathrooms} baños</span>
                </div>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                  <span>{property.builtArea} m² área total</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyList;
