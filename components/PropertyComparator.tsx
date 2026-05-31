import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { optimizeImageUrl } from '../lib/imageTransform';

interface PropertyComparatorProps {
  properties: Property[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const COMPARISON_FEATURES = [
  { key: 'pricePEN', label: 'Precio S/', type: 'currency-pen' },
  { key: 'priceUSD', label: 'Precio $', type: 'currency-usd' },
  { key: 'type', label: 'Tipo', type: 'text' },
  { key: 'status', label: 'Operación', type: 'status' },
  { key: 'district', label: 'Distrito', type: 'text' },
  { key: 'department', label: 'Departamento', type: 'text' },
  { key: 'bedrooms', label: 'Dormitorios', type: 'number' },
  { key: 'bathrooms', label: 'Baños', type: 'number' },
  { key: 'parking', label: 'Estacionamiento', type: 'number' },
  { key: 'builtArea', label: 'Área techada', type: 'area' },
  { key: 'constructionArea', label: 'Área construida', type: 'area' },
  { key: 'terrainArea', label: 'Área de terreno', type: 'area' },
  { key: 'yearBuilt', label: 'Año construcción', type: 'text' },
  { key: 'maintenanceFee', label: 'Mantenimiento', type: 'currency' },
];

function getFeatureValue(property: Property, key: string, type: string): string {
  const val = (property as any)[key];
  if (val === null || val === undefined || val === '') return '—';
  if (type === 'currency-pen') return `S/ ${Number(val).toLocaleString('es-PE')}`;
  if (type === 'currency-usd' || type === 'currency') {
    if (type === 'currency') return val ? `S/ ${val.toLocaleString('es-PE')}` : '—';
    return `$${Number(val).toLocaleString('en-US')}`;
  }
  if (type === 'area') return `${val} m²`;
  if (type === 'number') return String(val);
  if (type === 'status') {
    if (val === 'FOR_SALE') return 'Venta';
    if (val === 'FOR_RENT') return 'Alquiler';
    if (val === 'TEMPORAL') return 'Temporal';
    if (val === 'PROJECT') return 'Proyecto';
    if (val === 'TRASPASO') return 'Traspaso';
    return val;
  }
  return String(val);
}

const PropertyComparator: React.FC<PropertyComparatorProps> = ({ properties, onRemove, onClear, onClose }) => {
  const [highlightDifferences, setHighlightDifferences] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (properties.length === 0) return null;

  const featureValues = COMPARISON_FEATURES.map(feature => ({
    ...feature,
    values: properties.map(p => getFeatureValue(p, feature.key, feature.type)),
  }));

  const allSame = (values: string[]) => {
    if (values.length < 2) return true;
    return values.every(v => v === values[0]);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[1.5rem] md:rounded-[2rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
        <div className="p-3 md:p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-widest">
              Comparar {properties.length} propiedades
            </h2>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 cursor-pointer">
              <input type="checkbox" checked={highlightDifferences} onChange={() => setHighlightDifferences(!highlightDifferences)} className="w-3.5 h-3.5 rounded accent-red-600" />
              Resaltar diferencias
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClear} className="text-[10px] font-bold text-red-600 hover:text-red-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
              Limpiar todo
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-auto p-3 md:p-5">
          {isMobile ? (
            <div className="space-y-4">
              {COMPARISON_FEATURES.map(feature => {
                const values = featureValues.find(f => f.key === feature.key)!;
                const isDifferent = !allSame(values.values);
                if (highlightDifferences && !isDifferent) return null;
                return (
                  <div key={feature.key} className="bg-gray-50 rounded-xl p-3">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{feature.label}</h3>
                    <div className="space-y-2">
                      {properties.map((p, idx) => {
                        const isHighlighted = highlightDifferences && isDifferent && values.values[idx] !== '—';
                        return (
                          <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg ${isHighlighted ? 'bg-yellow-50 border border-yellow-200' : 'bg-white border border-gray-100'}`}>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <img src={optimizeImageUrl(p.featuredImage, { width: 48 })} alt={p.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" width="32" height="32" />
                              <span className="text-[11px] font-bold text-gray-700 truncate">{p.title}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-900 flex-shrink-0 ml-2">{values.values[idx]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-white z-10 p-3 min-w-[140px]">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Característica</span>
                  </th>
                  {properties.map(p => (
                    <th key={p.id} className="sticky top-0 bg-white z-10 p-3 min-w-[200px]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <img src={optimizeImageUrl(p.featuredImage, { width: 200 })} alt={p.title} className="w-full h-24 rounded-xl object-cover mb-2" width="200" height="96" loading="lazy" />
                          <h3 className="text-[11px] font-bold text-gray-700 truncate">{p.title}</h3>
                          <p className="text-[9px] text-gray-400 truncate">{p.district}, {p.department}</p>
                        </div>
                        <button onClick={() => onRemove(p.id)} className="p-1 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                          <svg className="w-4 h-4 text-gray-400 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureValues.map(feature => {
                  const isDifferent = !allSame(feature.values);
                  if (highlightDifferences && !isDifferent) return null;
                  return (
                    <tr key={feature.key} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-bold text-[11px] text-gray-600">{feature.label}</td>
                      {feature.values.map((value, idx) => {
                        const isHighlighted = highlightDifferences && isDifferent && value !== '—';
                        return (
                          <td key={idx} className={`p-3 text-sm font-semibold ${isHighlighted ? 'bg-yellow-50 text-slate-900' : 'text-slate-700'}`}>
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-3 md:p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-[10px] text-gray-500 font-medium">
            {properties.length < 4 ? 'Puedes agregar hasta 4 propiedades para comparar' : 'Máximo 4 propiedades'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClear} className="px-4 py-2 text-[10px] font-bold text-gray-600 hover:text-red-600 transition-colors">
              Limpiar
            </button>
            <button onClick={onClose} className="px-6 py-2.5 bg-[#091F4F] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyComparator;
