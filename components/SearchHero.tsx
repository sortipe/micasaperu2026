
import React, { useState, useEffect, useRef } from 'react';
import { LocationItem } from '../types';
import { PROPERTY_CATEGORIES, COMMON_FEATURES } from '../constants';

interface SearchHeroProps {
  locations: LocationItem[];
  bannerUrl?: string | null;
  bannerUrlMobile?: string | null;
  filters: {
    query: string;
    selectedLocations: LocationItem[];
    type: string;
    status: string;
    minPrice: number;
    maxPrice: number;
    currency: 'USD' | 'PEN';
    includeMaintenance: boolean;
    sortBy: string;
    bedrooms: number;
    maxBedrooms: number;
    bathrooms: number;
    parking: number;
    minArea: number;
    maxArea: number;
    areaType: 'total' | 'built';
    advertiserType: 'all' | 'real_estate' | 'direct_owner';
    age: 'any' | 'under_construction' | 'brand_new' | 'up_to_5_years';
    publicationDate: 'any' | 'yesterday' | 'today' | 'last_week';
    selectedFeatures: string[];
  };
  onFilterChange: (filters: any) => void;
  onSearch: (layout?: 'LIST' | 'MAP', focusLoc?: LocationItem, overrideFilters?: any) => void;
  compact?: boolean;
  activeLayout?: 'LIST' | 'MAP';
}

const SearchHero: React.FC<SearchHeroProps> = ({
  locations,
  bannerUrl,
  bannerUrlMobile,
  filters,
  onFilterChange,
  onSearch,
  compact = false,
  activeLayout = 'LIST'
}) => {
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPricePopover, setShowPricePopover] = useState(false);
  const [showBedroomsPopover, setShowBedroomsPopover] = useState(false);
  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const [showHiddenLocations, setShowHiddenLocations] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const [tempMin, setTempMin] = useState<string>(filters.minPrice === 0 ? '' : filters.minPrice.toString());
  const [tempMax, setTempMax] = useState<string>(filters.maxPrice === Infinity ? '' : filters.maxPrice.toString());
  const [tempMinBed, setTempMinBed] = useState<string>(filters.bedrooms === 0 ? '' : filters.bedrooms.toString());
  const [tempMaxBed, setTempMaxBed] = useState<string>(filters.maxBedrooms === Infinity ? '' : filters.maxBedrooms.toString());

  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true);

  const locationRef = useRef<HTMLDivElement>(null);
  const pricePopoverRef = useRef<HTMLDivElement>(null);
  const bedroomsPopoverRef = useRef<HTMLDivElement>(null);
  const statusPopoverRef = useRef<HTMLDivElement>(null);
  const hiddenLocationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pricePopoverRef.current && !pricePopoverRef.current.contains(event.target as Node)) {
        setShowPricePopover(false);
      }
      if (bedroomsPopoverRef.current && !bedroomsPopoverRef.current.contains(event.target as Node)) {
        setShowBedroomsPopover(false);
      }
      if (statusPopoverRef.current && !statusPopoverRef.current.contains(event.target as Node)) {
        setShowStatusPopover(false);
      }
      if (hiddenLocationsRef.current && !hiddenLocationsRef.current.contains(event.target as Node)) {
        setShowHiddenLocations(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const getFullLocationName = (loc: LocationItem) => {
    let parts = [loc.name];
    let current = loc;
    let depth = 0;
    
    // Construir jerarquía recursivamente con límite de profundidad para evitar ciclos
    while (current.parent && depth < 10) {
      depth++;
      const parentLoc = locations.find(l => l.name === current.parent);
      if (parentLoc) {
        // Evitar ciclos si el padre ya está en la lista
        if (parts.includes(parentLoc.name)) break;
        
        parts.push(parentLoc.name);
        current = parentLoc;
      } else {
        if (!parts.includes(current.parent)) {
          parts.push(current.parent);
        }
        break;
      }
    }
    
    // Caso especial para Lima: Distrito -> Lima (Provincia) -> Lima (Departamento)
    // Si es distrito de Lima y solo tenemos [Distrito, Lima], agregamos la Provincia
    if (loc.type === 'Distrito' && parts[parts.length - 1] === 'Lima' && parts.length === 2) {
      parts.splice(1, 0, 'Lima');
    }
    
    return parts.join(', ');
  };

  const filteredSuggestions = (() => {
    if (!filters.query || filters.query.trim().length === 0) return [];

    const queryStr = normalizeText(filters.query);
    const queryWords = queryStr.split(/\s+/).filter(w => w.length > 0);
    const seen = new Set<string>();

    return locations
      .filter(loc => {
        const fullName = getFullLocationName(loc);
        const searchStr = normalizeText(fullName);
        return queryWords.every(word => searchStr.includes(word));
      })
      .sort((a, b) => {
        const nameA = normalizeText(a.name);
        const nameB = normalizeText(b.name);
        
        // Prioridad 1: Coincidencia exacta del nombre
        if (nameA === queryStr && nameB !== queryStr) return -1;
        if (nameB === queryStr && nameA !== queryStr) return 1;
        
        // Prioridad 2: Empieza con la query
        if (nameA.startsWith(queryStr) && !nameB.startsWith(queryStr)) return -1;
        if (nameB.startsWith(queryStr) && !nameA.startsWith(queryStr)) return 1;
        
        return 0;
      })
      .filter(loc => {
        const fullName = getFullLocationName(loc);
        if (seen.has(fullName)) return false;
        seen.add(fullName);
        return true;
      })
      .slice(0, 10);
  })();

  const handleLocationSelect = (loc: LocationItem) => {
    const isAlreadySelected = filters.selectedLocations.some(l => l.name === loc.name);
    
    // Si ya está seleccionado, solo cerramos el dropdown
    if (isAlreadySelected) {
      setShowLocationResults(false);
      const newFilters = { ...filters, query: '' };
      onFilterChange(newFilters);
      onSearch(activeLayout, undefined, newFilters);
      return;
    }
    
    // Actualizamos filtros y disparamos búsqueda con el nombre explícito para el mapa
    const newFilters = { 
      ...filters, 
      selectedLocations: [...filters.selectedLocations, loc], 
      query: '' 
    };
    onFilterChange(newFilters);
    setShowLocationResults(false);
    onSearch(activeLayout, undefined, newFilters);
  };

  const removeLocation = (locName: string) => {
    const newFilters = { ...filters, selectedLocations: filters.selectedLocations.filter(l => l.name !== locName) };
    onFilterChange(newFilters);
    onSearch(activeLayout, undefined, newFilters);
  };

  const applyPriceFilter = () => {
    onFilterChange({
      ...filters,
      minPrice: tempMin === '' ? 0 : Number(tempMin),
      maxPrice: tempMax === '' ? Infinity : Number(tempMax)
    });
    setShowPricePopover(false);
  };

  const clearPriceFilter = () => {
    setTempMin('');
    setTempMax('');
    onFilterChange({ ...filters, minPrice: 0, maxPrice: Infinity });
  };

  const applyBedroomsFilter = () => {
    onFilterChange({ 
      ...filters, 
      bedrooms: tempMinBed === '' ? 0 : parseInt(tempMinBed),
      maxBedrooms: tempMaxBed === '' ? Infinity : parseInt(tempMaxBed)
    });
    setShowBedroomsPopover(false);
  };

  const clearBedroomsFilter = () => {
    setTempMinBed('');
    setTempMaxBed('');
    onFilterChange({ ...filters, bedrooms: 0, maxBedrooms: Infinity });
  };

  const tabs = [
    { id: '', label: 'TODOS' },
    { id: 'FOR_RENT', label: 'ALQUILAR' },
    { id: 'FOR_SALE', label: 'COMPRAR' },
    { id: 'TEMPORAL', label: 'TEMPORAL' },
    { id: 'PROJECT', label: 'PROYECTOS' },
    { id: 'TRASPASO', label: 'TRASPASO' }
  ];

  const LocationTags = () => {
    const maxVisible = 2;
    const visibleLocations = filters.selectedLocations.slice(0, maxVisible);
    const hiddenLocations = filters.selectedLocations.slice(maxVisible);
    const hiddenCount = hiddenLocations.length;

    return (
      <>
        {visibleLocations.map((loc, i) => (
          <span key={i} className="bg-red-600 text-white text-[9px] md:text-[10px] font-black px-2 md:px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm animate-fade-in whitespace-nowrap max-w-[120px] md:max-w-[180px]">
            <span className="truncate">{loc.name}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); removeLocation(loc.name); }} className="hover:scale-125 transition-all shrink-0">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </span>
        ))}
        {hiddenCount > 0 && (
          <div className="relative" ref={hiddenLocationsRef}>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowHiddenLocations(!showHiddenLocations); }}
              className="bg-slate-800 text-white text-[9px] md:text-[10px] font-black px-2 md:px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-700 transition-colors"
            >
              +{hiddenCount}
            </button>
            
            {showHiddenLocations && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] p-2 min-w-[200px] animate-fade-in">
                <div className="flex flex-col gap-1">
                  {hiddenLocations.map((loc, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                      <span className="text-[10px] font-bold text-slate-700 truncate">{loc.name}</span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); removeLocation(loc.name); if (hiddenCount === 1) setShowHiddenLocations(false); }} 
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  if (compact) {
    return (
      <>
        {/* Mobile Toggle Button */}
        <div className="md:hidden flex justify-between items-center mb-3">
          <button 
            onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
          >
            <svg className={`w-4 h-4 transition-transform ${isMobileCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
            {isMobileCollapsed ? 'Mostrar Filtros' : 'Ocultar Filtros'}
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
              <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-widest">Filtros Avanzados</h3>
                <button onClick={() => setShowAdvancedFilters(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-5 md:p-6 space-y-6 md:space-y-8 custom-scrollbar">
                {/* Características */}
                <div>
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Características</label>
                  <input 
                    type="text" 
                    placeholder="Ej: piscina, amueblado, permite mascotas..." 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:border-red-600 transition-colors"
                  />
                </div>

                {/* Superficie */}
                <div>
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Superficie</label>
                  <div className="flex gap-6 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="areaType" checked={filters.areaType === 'built'} onChange={() => onFilterChange({...filters, areaType: 'built'})} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.areaType === 'built' ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                        {filters.areaType === 'built' && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                      </div>
                      <span className="text-sm font-bold text-gray-700">Techada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="areaType" checked={filters.areaType === 'total'} onChange={() => onFilterChange({...filters, areaType: 'total'})} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.areaType === 'total' ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                        {filters.areaType === 'total' && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                      </div>
                      <span className="text-sm font-bold text-gray-700">Total</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative">
                      <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none appearance-none pr-10">
                        <option>m²</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                      </div>
                    </div>
                    <input type="number" placeholder="Desde" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:border-red-600" value={filters.minArea || ''} onChange={e => onFilterChange({...filters, minArea: Number(e.target.value)})} />
                    <input type="number" placeholder="Hasta" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:border-red-600" value={filters.maxArea === Infinity ? '' : filters.maxArea} onChange={e => onFilterChange({...filters, maxArea: Number(e.target.value)})} />
                  </div>
                </div>

                {/* Baños */}
                <div>
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Baños</label>
                  <div className="flex border border-gray-200 rounded-2xl overflow-hidden">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button 
                        key={n} 
                        onClick={() => onFilterChange({...filters, bathrooms: n})}
                        className={`flex-1 py-4 font-bold text-sm transition-all border-r last:border-none ${filters.bathrooms === n ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        {n}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estacionamientos */}
                <div>
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Estacionamientos</label>
                  <div className="flex border border-gray-200 rounded-2xl overflow-hidden">
                    {[0, 1, 2, 3, 4].map(n => (
                      <button 
                        key={n} 
                        onClick={() => onFilterChange({...filters, parking: n})}
                        className={`flex-1 py-4 font-bold text-sm transition-all border-r last:border-none ${filters.parking === n ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        {n === 0 ? '0' : `${n}+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de anunciante */}
                <div>
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Tipo de anunciante</label>
                  <div className="space-y-3">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'real_estate', label: 'Inmobiliaria' },
                      { id: 'direct_owner', label: 'Dueño directo' }
                    ].map(type => (
                      <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                        <input type="radio" name="advertiserType" checked={filters.advertiserType === type.id} onChange={() => onFilterChange({...filters, advertiserType: type.id})} className="hidden" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.advertiserType === type.id ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                          {filters.advertiserType === type.id && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Antigüedad */}
                <div>
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Antigüedad</label>
                  <div className="space-y-3">
                    {[
                      { id: 'any', label: 'Cualquiera' },
                      { id: 'under_construction', label: 'En construcción' },
                      { id: 'brand_new', label: 'A estrenar' },
                      { id: 'up_to_5_years', label: 'Hasta 5 años' }
                    ].map(age => (
                      <label key={age.id} className="flex items-center gap-3 cursor-pointer group">
                        <input type="radio" name="age" checked={filters.age === age.id} onChange={() => onFilterChange({...filters, age: age.id})} className="hidden" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.age === age.id ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                          {filters.age === age.id && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{age.label}</span>
                      </label>
                    ))}
                  </div>
                  <button className="mt-4 flex items-center gap-1 text-[11px] font-black text-slate-900 uppercase tracking-widest hover:text-red-600 transition-colors">
                    Ver más
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                </div>

                {/* Fecha de publicación */}
                <div>
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Fecha de publicación</label>
                  <div className="space-y-3">
                    {[
                      { id: 'any', label: 'Cualquiera' },
                      { id: 'yesterday', label: 'Desde ayer' },
                      { id: 'today', label: 'Hoy' },
                      { id: 'last_week', label: 'Última semana' }
                    ].map(date => (
                      <label key={date.id} className="flex items-center gap-3 cursor-pointer group">
                        <input type="radio" name="publicationDate" checked={filters.publicationDate === date.id} onChange={() => onFilterChange({...filters, publicationDate: date.id})} className="hidden" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.publicationDate === date.id ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                          {filters.publicationDate === date.id && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{date.label}</span>
                      </label>
                    ))}
                  </div>
                  <button className="mt-4 flex items-center gap-1 text-[11px] font-black text-slate-900 uppercase tracking-widest hover:text-red-600 transition-colors">
                    Ver más
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                </div>

                {/* Ambientes */}
                <div>
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Ambientes</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'bodega', label: 'Bodega' },
                      { id: 'cafeteria', label: 'Área de cafetería' }
                    ].map(feature => (
                      <label key={feature.id} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={filters.selectedFeatures.includes(feature.label)} 
                          onChange={() => {
                            const newFeatures = filters.selectedFeatures.includes(feature.label)
                              ? filters.selectedFeatures.filter(f => f !== feature.label)
                              : [...filters.selectedFeatures, feature.label];
                            onFilterChange({...filters, selectedFeatures: newFeatures});
                          }} 
                          className="hidden" 
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${filters.selectedFeatures.includes(feature.label) ? 'bg-red-600 border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                          {filters.selectedFeatures.includes(feature.label) && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-white">
                <button 
                  onClick={() => onFilterChange({
                    ...filters,
                    bathrooms: 0,
                    parking: 0,
                    minArea: 0,
                    maxArea: Infinity,
                    areaType: 'total',
                    advertiserType: 'all',
                    age: 'any',
                    publicationDate: 'any',
                    selectedFeatures: []
                  })} 
                  className="text-[11px] font-black text-slate-900 uppercase tracking-widest hover:text-red-600 transition-colors"
                >
                  Limpiar
                </button>
                <button 
                  onClick={() => { setShowAdvancedFilters(false); onSearch(activeLayout); }} 
                  className="border-2 border-orange-500 text-orange-600 px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-50 transition-all"
                >
                  Ver resultados
                </button>
              </div>
            </div>
          </div>
        )}
        <div className={`w-full max-w-7xl mx-auto px-2 relative transition-all duration-300 ${isMobileCollapsed ? 'max-h-0 md:max-h-none opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto overflow-hidden md:overflow-visible' : 'max-h-[1000px] opacity-100 overflow-visible'}`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
          <div className="flex-grow relative w-full" ref={locationRef}>
            <div 
              className="min-h-[50px] bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex flex-wrap gap-2 items-center shadow-sm hover:border-red-200 transition-colors cursor-text"
              onClick={() => locationRef.current?.querySelector('input')?.focus()}
            >
              <LocationTags />
              <input 
                type="text" 
                className="flex-grow bg-transparent border-none outline-none font-bold text-xs min-w-[120px]" 
                placeholder={filters.selectedLocations.length > 0 ? "" : "Distrito o Ciudad..."} 
                value={filters.query} 
                onChange={e => { 
                  const val = e.target.value;
                  const newFilters = { ...filters, query: val };
                  onFilterChange(newFilters); 
                  setShowLocationResults(true); 
                  if (val.trim() === '') {
                    onSearch(activeLayout, undefined, newFilters);
                  }
                }} 
                onFocus={() => setShowLocationResults(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredSuggestions.length > 0 && filters.query.trim().length > 0) {
                      handleLocationSelect(filteredSuggestions[0]);
                    } else {
                      const newFilters = { ...filters, query: '' };
                      onFilterChange(newFilters);
                      onSearch(activeLayout, undefined, newFilters);
                    }
                  }
                }}
              />
            </div>
            {showLocationResults && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
                {filteredSuggestions.map((loc, idx) => (
                  <div key={idx} onClick={() => handleLocationSelect(loc)} className="px-5 py-4 hover:bg-red-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-none group">
                    <span className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors">{getFullLocationName(loc)}</span>
                    <span className="text-[9px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded uppercase font-black">{loc.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:flex gap-2">
            <div className="relative" ref={statusPopoverRef}>
              <button 
                onClick={() => setShowStatusPopover(!showStatusPopover)}
                className={`w-full h-[50px] px-4 rounded-xl border font-black text-[10px] uppercase tracking-widest flex items-center justify-between gap-2 transition-all shadow-sm ${showStatusPopover ? 'border-red-600 text-red-600 bg-red-50' : 'bg-white text-slate-800 border-gray-200'}`}
              >
                <span>{tabs.find(t => t.id === filters.status)?.label || 'Operación'}</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${showStatusPopover ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {showStatusPopover && (
                <div className="absolute top-full left-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[2000] p-6 w-[200px] animate-slide-up">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Tipo de operación</h4>
                  <div className="space-y-3">
                    {tabs.map(tab => (
                      <label key={tab.id} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="status" 
                          checked={filters.status === tab.id} 
                          onChange={() => { onFilterChange({ ...filters, status: tab.id }); setShowStatusPopover(false); }} 
                          className="hidden" 
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.status === tab.id ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                          {filters.status === tab.id && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                        </div>
                        <span className={`text-xs font-bold ${filters.status === tab.id ? 'text-red-600' : 'text-gray-700'}`}>{tab.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <select 
                className="w-full h-[50px] bg-white border border-gray-200 rounded-xl px-4 font-bold text-[10px] uppercase outline-none md:min-w-[130px] shadow-sm appearance-none" 
                value={filters.type} 
                onChange={e => { onFilterChange({ ...filters, type: e.target.value }); }}
              >
                <option value="">Tipo Inmueble</option>
                {PROPERTY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <div className="relative" ref={bedroomsPopoverRef}>
              <button 
                onClick={() => setShowBedroomsPopover(!showBedroomsPopover)}
                className={`w-full h-[50px] px-4 rounded-xl border font-black text-[10px] uppercase tracking-widest flex items-center justify-between gap-2 transition-all shadow-sm ${showBedroomsPopover ? 'border-orange-500 text-orange-600 bg-orange-50' : 'bg-white text-slate-800 border-gray-200'}`}
              >
                <span>Dormitorios</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${showBedroomsPopover ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {showBedroomsPopover && (
                <div className="absolute top-full left-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[2000] p-6 w-[280px] md:w-[320px] animate-slide-up">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Dormitorios</h4>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="relative">
                      <select 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none appearance-none pr-8"
                        value={tempMinBed}
                        onChange={e => setTempMinBed(e.target.value)}
                      >
                        <option value="">Sin mínimo</option>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'dorm' : 'dorms'}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                      </div>
                    </div>
                    <div className="relative">
                      <select 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none appearance-none pr-8"
                        value={tempMaxBed}
                        onChange={e => setTempMaxBed(e.target.value)}
                      >
                        <option value="">sin máximo</option>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'dorm' : 'dorms'}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button onClick={clearBedroomsFilter} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-600">Limpiar</button>
                    <button onClick={applyBedroomsFilter} className="border border-orange-500 text-orange-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-50">Ver resultados</button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={pricePopoverRef}>
              <button 
                onClick={() => setShowPricePopover(!showPricePopover)}
                className={`w-full h-[50px] px-4 rounded-xl border font-black text-[10px] uppercase tracking-widest flex items-center justify-between gap-2 transition-all shadow-sm ${showPricePopover ? 'border-red-600 text-red-600 bg-red-50' : 'bg-white text-slate-800 border-gray-200'}`}
              >
                <span>Precio</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${showPricePopover ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {showPricePopover && (
                <div className="absolute top-full right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[2000] p-6 w-[280px] md:w-[300px] animate-slide-up">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Rango de Precio</h4>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <input type="number" placeholder="Desde" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none" value={tempMin} onChange={e => setTempMin(e.target.value)} />
                    <input type="number" placeholder="Hasta" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none" value={tempMax} onChange={e => setTempMax(e.target.value)} />
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <button onClick={clearPriceFilter} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-600">Limpiar</button>
                    <button onClick={applyPriceFilter} className="bg-[#091F4F] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600">Aplicar</button>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowAdvancedFilters(true)}
              className="w-full h-[50px] px-4 rounded-xl border border-gray-200 bg-white text-slate-800 font-black text-[10px] uppercase tracking-widest flex items-center justify-between gap-2 transition-all shadow-sm hover:border-red-600 hover:text-red-600"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                <span>Filtros</span>
              </div>
            </button>
            
            <button 
              onClick={() => {
                if (filters.query.trim().length > 0 && filteredSuggestions.length > 0) {
                  handleLocationSelect(filteredSuggestions[0]);
                } else {
                  const newFilters = { ...filters, query: '' };
                  onFilterChange(newFilters);
                  onSearch(activeLayout, undefined, newFilters);
                }
              }} 
              className="col-span-2 sm:col-span-1 h-[38px] px-6 rounded-xl font-black text-[11px] uppercase tracking-widest bg-red-600 text-white hover:bg-slate-900 shadow-xl active:scale-95 transition-all"
            >
              BUSCAR
            </button>
          </div>
        </div>
      </div>
    </>
    );
  }

  return (
    <>
      {showAdvancedFilters && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-widest">Filtros Avanzados</h3>
              <button onClick={() => setShowAdvancedFilters(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-5 md:p-6 space-y-6 md:space-y-8 custom-scrollbar">
              {/* Tipo de operación */}
              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Tipo de operación</label>
                <div className="grid grid-cols-2 gap-3">
                  {tabs.map(tab => (
                    <label key={tab.id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="advanced-status" 
                        checked={filters.status === tab.id} 
                        onChange={() => onFilterChange({ ...filters, status: tab.id })} 
                        className="hidden" 
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.status === tab.id ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                        {filters.status === tab.id && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                      </div>
                      <span className={`text-sm font-bold ${filters.status === tab.id ? 'text-red-600' : 'text-gray-700'}`}>{tab.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Características */}
              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Características</label>
                <input 
                  type="text" 
                  placeholder="Ej: piscina, amueblado, permite mascotas..." 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:border-red-600 transition-colors"
                />
              </div>

              {/* Superficie */}
              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Superficie</label>
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="areaType" checked={filters.areaType === 'built'} onChange={() => onFilterChange({...filters, areaType: 'built'})} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.areaType === 'built' ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                      {filters.areaType === 'built' && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                    </div>
                    <span className="text-sm font-bold text-gray-700">Techada</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="areaType" checked={filters.areaType === 'total'} onChange={() => onFilterChange({...filters, areaType: 'total'})} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.areaType === 'total' ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                      {filters.areaType === 'total' && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                    </div>
                    <span className="text-sm font-bold text-gray-700">Total</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none appearance-none pr-10">
                      <option>m²</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  <input type="number" placeholder="Desde" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:border-red-600" value={filters.minArea || ''} onChange={e => onFilterChange({...filters, minArea: Number(e.target.value)})} />
                  <input type="number" placeholder="Hasta" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:border-red-600" value={filters.maxArea === Infinity ? '' : filters.maxArea} onChange={e => onFilterChange({...filters, maxArea: Number(e.target.value)})} />
                </div>
              </div>

              {/* Baños */}
              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Baños</label>
                <div className="flex border border-gray-200 rounded-2xl overflow-hidden">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button 
                      key={n} 
                      onClick={() => onFilterChange({...filters, bathrooms: n})}
                      className={`flex-1 py-4 font-bold text-sm transition-all border-r last:border-none ${filters.bathrooms === n ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      {n}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Estacionamientos */}
              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Estacionamientos</label>
                <div className="flex border border-gray-200 rounded-2xl overflow-hidden">
                  {[0, 1, 2, 3, 4].map(n => (
                    <button 
                      key={n} 
                      onClick={() => onFilterChange({...filters, parking: n})}
                      className={`flex-1 py-4 font-bold text-sm transition-all border-r last:border-none ${filters.parking === n ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      {n === 0 ? '0' : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de anunciante */}
              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Tipo de anunciante</label>
                <div className="space-y-3">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'real_estate', label: 'Inmobiliaria' },
                    { id: 'direct_owner', label: 'Dueño directo' }
                  ].map(type => (
                    <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="advertiserType" checked={filters.advertiserType === type.id} onChange={() => onFilterChange({...filters, advertiserType: type.id})} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.advertiserType === type.id ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                        {filters.advertiserType === type.id && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Antigüedad */}
              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Antigüedad</label>
                <div className="space-y-3">
                  {[
                    { id: 'any', label: 'Cualquiera' },
                    { id: 'under_construction', label: 'En construcción' },
                    { id: 'brand_new', label: 'A estrenar' },
                    { id: 'up_to_5_years', label: 'Hasta 5 años' }
                  ].map(age => (
                    <label key={age.id} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="age" checked={filters.age === age.id} onChange={() => onFilterChange({...filters, age: age.id})} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.age === age.id ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                        {filters.age === age.id && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{age.label}</span>
                    </label>
                  ))}
                </div>
                <button className="mt-4 flex items-center gap-1 text-[11px] font-black text-slate-900 uppercase tracking-widest hover:text-red-600 transition-colors">
                  Ver más
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>

              {/* Fecha de publicación */}
              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Fecha de publicación</label>
                <div className="space-y-3">
                  {[
                    { id: 'any', label: 'Cualquiera' },
                    { id: 'yesterday', label: 'Desde ayer' },
                    { id: 'today', label: 'Hoy' },
                    { id: 'last_week', label: 'Última semana' }
                  ].map(date => (
                    <label key={date.id} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="publicationDate" checked={filters.publicationDate === date.id} onChange={() => onFilterChange({...filters, publicationDate: date.id})} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${filters.publicationDate === date.id ? 'border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                        {filters.publicationDate === date.id && <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{date.label}</span>
                    </label>
                  ))}
                </div>
                <button className="mt-4 flex items-center gap-1 text-[11px] font-black text-slate-900 uppercase tracking-widest hover:text-red-600 transition-colors">
                  Ver más
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>

              {/* Ambientes */}
              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Ambientes</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'bodega', label: 'Bodega' },
                    { id: 'cafeteria', label: 'Área de cafetería' }
                  ].map(feature => (
                    <label key={feature.id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={filters.selectedFeatures.includes(feature.label)} 
                        onChange={() => {
                          const newFeatures = filters.selectedFeatures.includes(feature.label)
                            ? filters.selectedFeatures.filter(f => f !== feature.label)
                            : [...filters.selectedFeatures, feature.label];
                          onFilterChange({...filters, selectedFeatures: newFeatures});
                        }} 
                        className="hidden" 
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${filters.selectedFeatures.includes(feature.label) ? 'bg-red-600 border-red-600' : 'border-gray-300 group-hover:border-red-400'}`}>
                        {filters.selectedFeatures.includes(feature.label) && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-white">
              <button 
                onClick={() => onFilterChange({
                  ...filters,
                  status: '',
                  bathrooms: 0,
                  parking: 0,
                  minArea: 0,
                  maxArea: Infinity,
                  areaType: 'total',
                  advertiserType: 'all',
                  age: 'any',
                  publicationDate: 'any',
                  selectedFeatures: []
                })} 
                className="text-[11px] font-black text-slate-900 uppercase tracking-widest hover:text-red-600 transition-colors"
              >
                Limpiar
              </button>
              <button 
                onClick={() => { setShowAdvancedFilters(false); onSearch(activeLayout); }} 
                className="border-2 border-orange-500 text-orange-600 px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-50 transition-all"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="relative pt-0 pb-8 md:pt-0 md:pb-4 min-h-[350px] md:min-h-[420px] flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <picture className="w-full h-full">
            {bannerUrlMobile && <source media="(max-width: 768px)" srcSet={bannerUrlMobile} />}
            <img 
              src={bannerUrl || "https://images.unsplash.com/photo-1556911227-4da5279f50bb?q=80&w=2070"} 
              onLoad={() => setIsImageLoaded(true)} 
              className="w-full h-full object-cover object-top" 
              alt="Banner" 
            />
          </picture>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-6xl mt-24 md:mt-32">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-8 md:mb-12 animate-slide-up leading-tight drop-shadow-2xl">
            Tu próximo hogar <br/><span className="text-red-600 italic">está aquí.</span>
          </h1>

          <div className="w-full max-w-5xl mx-auto px-2">
            <div className="flex bg-white/10 backdrop-blur-xl rounded-t-[1.5rem] md:rounded-t-[2.5rem] overflow-hidden border-x border-t border-white/20 w-fit">
                {tabs.map((tab, idx) => (
                  <button
                    key={tab.id}
                    onClick={() => { onFilterChange({ ...filters, status: tab.id }); }}
                    className={`px-4 md:px-8 py-3 md:py-4 text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${
                      filters.status === tab.id ? 'bg-white text-red-600' : 'text-white hover:bg-white/10'
                    } ${idx >= 3 ? 'hidden md:block' : 'block'}`}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>

            <div className="bg-white rounded-b-[1.5rem] rounded-tr-[1.5rem] p-2 md:p-3 shadow-2xl relative overflow-visible border border-white">
              <div className="flex flex-col md:flex-row items-center w-full gap-2">
                <div className="shrink-0 w-full md:w-auto px-2 h-10 md:h-14 flex items-center">
                  <div className="relative w-full md:w-auto">
                    <select 
                      className="w-full md:min-w-[150px] h-9 md:h-11 bg-white border border-gray-200 rounded-xl px-4 pr-10 outline-none font-medium text-gray-700 text-sm appearance-none cursor-pointer hover:border-gray-300 transition-colors"
                      value={filters.type}
                      onChange={e => { onFilterChange({ ...filters, type: e.target.value }); }}
                    >
                      <option value="">Tipo Inmueble</option>
                      {PROPERTY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block w-px h-10 bg-gray-100"></div>

                <div className="flex-grow relative w-full md:w-auto px-4 py-2 md:py-0 h-10 md:h-14 flex items-center gap-3 bg-gray-50 md:bg-transparent rounded-xl cursor-text" onClick={() => locationRef.current?.querySelector('input')?.focus()} ref={locationRef}>
                  <div className="flex items-center gap-2 w-full overflow-hidden">
                    <LocationTags />
                    <input 
                      type="text" 
                      className="flex-grow bg-transparent border-none outline-none font-bold text-slate-800 text-sm md:text-lg placeholder:text-gray-300 min-w-[150px]" 
                      placeholder={filters.selectedLocations.length > 0 ? "" : "¿En qué distrito o ciudad buscas?"}
                      value={filters.query} 
                      onChange={e => { 
                        const val = e.target.value;
                        const newFilters = { ...filters, query: val };
                        onFilterChange(newFilters); 
                        setShowLocationResults(true); 
                        if (val.trim() === '') {
                          onSearch('LIST', undefined, newFilters);
                        }
                      }} 
                      onFocus={() => setShowLocationResults(true)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filteredSuggestions.length > 0 && filters.query.trim().length > 0) {
                            handleLocationSelect(filteredSuggestions[0]);
                          } else {
                            const newFilters = { ...filters, query: '' };
                            onFilterChange(newFilters);
                            onSearch('LIST', undefined, newFilters);
                          }
                        }
                      }}
                    />
                  </div>
                  
                  {showLocationResults && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-5 bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-gray-100 z-[9999] text-left max-h-80 overflow-y-auto">
                      {filteredSuggestions.map((loc, idx) => (
                        <div key={idx} onClick={() => handleLocationSelect(loc)} className="px-6 md:px-10 py-4 md:py-6 hover:bg-red-50 cursor-pointer flex justify-between items-center group border-b border-gray-50 last:border-none">
                          <span className="font-bold text-gray-700 text-sm md:text-lg group-hover:text-red-600 transition-colors">{getFullLocationName(loc)}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-400 px-3 py-1 rounded-lg uppercase font-black">{loc.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => {
                    if (filters.query.trim().length > 0 && filteredSuggestions.length > 0) {
                      handleLocationSelect(filteredSuggestions[0]);
                    } else {
                      const newFilters = { ...filters, query: '' };
                      onFilterChange(newFilters);
                      onSearch('LIST', undefined, newFilters);
                    }
                  }} 
                  className="bg-red-600 hover:bg-slate-900 text-white px-4 md:px-8 h-9 md:h-11 rounded-xl md:rounded-[1.2rem] font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 w-full md:w-auto"
                >
                  BUSCAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchHero;
