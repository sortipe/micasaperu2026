import React, { useState } from 'react';
import { Property } from '../types';

interface DevelopmentOptionsProps {
  properties: Property[];
  onPropertySelect: (id: string) => void;
  currency: 'USD' | 'PEN';
}

const DevelopmentOptions: React.FC<DevelopmentOptionsProps> = ({ properties, onPropertySelect, currency }) => {
  const [activeTab, setActiveTab] = useState<'EN_PLANOS' | 'ENTREGA_INMEDIATA' | 'EN_CONSTRUCCION'>('EN_PLANOS');

  const handlePropertyClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    onPropertySelect(id);
  };

  // Filter properties based on active tab
  // For now, we'll just filter by status === 'PROJECT' and mock the stages
  const projectProperties = properties.filter(p => p.status === 'PROJECT');
  
  // Mocking the stages since we don't have a specific field for it in Property type yet
  const filteredProperties = projectProperties.slice(0, 4); // Just show some projects

  if (projectProperties.length === 0) return null;

  return (
    <div className="container mx-auto px-4 mt-16 mb-16">
      <div className="bg-white rounded-3xl border border-gray-200 p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Text and Button */}
        <div className="lg:w-1/3 flex flex-col justify-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4 leading-tight">
            ¿Conoces nuestras opciones<br />de desarrollos?
          </h2>
          <p className="text-slate-600 text-sm mb-8">
            Puedes verlos según la etapa de construcción que más se ajusta a tu búsqueda.
          </p>
          <button className="border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-900 hover:text-white transition-colors w-fit">
            Más desarrollos en planos
          </button>
        </div>

        {/* Right Side: Tabs and Carousel */}
        <div className="lg:w-2/3 flex flex-col">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            <button 
              onClick={() => setActiveTab('EN_PLANOS')}
              className={`px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors border ${activeTab === 'EN_PLANOS' ? 'border-teal-600 text-teal-800 bg-teal-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              En planos
            </button>
            <button 
              onClick={() => setActiveTab('ENTREGA_INMEDIATA')}
              className={`px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors border ${activeTab === 'ENTREGA_INMEDIATA' ? 'border-teal-600 text-teal-800 bg-teal-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              Entrega inmediata
            </button>
            <button 
              onClick={() => setActiveTab('EN_CONSTRUCCION')}
              className={`px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors border ${activeTab === 'EN_CONSTRUCCION' ? 'border-teal-600 text-teal-800 bg-teal-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              En construcción
            </button>
          </div>

          {/* Carousel / List */}
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {filteredProperties.map(property => (
              <div 
                key={property.id} 
                onClick={(e) => handlePropertyClick(property.id, e)}
                className="min-w-[280px] w-[280px] bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow shrink-0 flex flex-col"
              >
                <div className="relative h-40">
                  <img src={property.featuredImage} alt={property.title} className="w-full h-full object-cover" />
                  <button className="absolute top-3 right-3 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <p className="text-[10px] text-gray-500 mb-1">Proyecto · {property.type}</p>
                  <p className="text-[10px] text-gray-500 mb-0.5">Desde</p>
                  <p className="text-lg font-black text-slate-900 mb-1">
                    {currency === 'PEN' ? `S/ ${property.pricePEN.toLocaleString()}` : `$${property.priceUSD.toLocaleString()}`}
                  </p>
                  {property.maintenanceFee ? (
                    <p className="text-[10px] text-slate-500 font-medium mb-2">S/ {property.maintenanceFee} Mantenimiento</p>
                  ) : (
                    <p className="text-[10px] text-transparent font-medium mb-2 select-none">&nbsp;</p>
                  )}
                  <p className="text-xs font-bold text-slate-900 truncate">{property.address}</p>
                  <p className="text-[10px] text-gray-500 mb-4 truncate">{property.district}, {property.department}, {property.department}</p>
                  
                  <div className="mt-auto flex items-center gap-4 text-[10px] text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                      {activeTab === 'EN_PLANOS' ? 'En planos' : activeTab === 'ENTREGA_INMEDIATA' ? 'Entrega inmediata' : 'En construcción'}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      {property.deliveryMonth || 'Enero'} {property.deliveryYear || 2025}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DevelopmentOptions;
