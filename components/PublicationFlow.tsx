
import React, { useState, useEffect, useRef } from 'react';
import { Property, User, PropertyCategory, Package, PaymentMethod } from '../types';
import { DEPARTMENTS, COMMON_FEATURES, PROPERTY_CATEGORIES } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ToastType } from './Toast';
import { Check } from 'lucide-react';
import PaymentFlow from './PaymentFlow';

declare const L: any;

interface PublicationFlowProps {
  user: User;
  properties: Property[];
  editingId?: string | null;
  packages: Package[];
  paymentMethods: PaymentMethod[];
  culqiPublicKey: string;
  onAdd: (p: Property) => Promise<void>;
  onUpdate: (p: Property) => Promise<void>;
  onCancel: () => void;
  showToast: (message: string, type: ToastType) => void;
}

type Step = 'PRINCIPALES' | 'MULTIMEDIA' | 'EXTRAS' | 'PUBLICAR';

const PublicationFlow: React.FC<PublicationFlowProps> = ({ 
  user, 
  properties, 
  editingId, 
  packages,
  paymentMethods,
  culqiPublicKey,
  onAdd, 
  onUpdate, 
  onCancel, 
  showToast 
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('PRINCIPALES');
  const [editingProperty, setEditingProperty] = useState<Partial<Property> | null>(null);
  const [isUploading, setIsUploading] = useState<{ featured: boolean; gallery: boolean; documents: boolean }>({ featured: false, gallery: false, documents: false });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Package | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS'>('IDLE');
  const [useCredits, setUseCredits] = useState((user.propertiesRemaining || 0) > 0 || (user.featuredRemaining || 0) > 0 || (user.superFeaturedRemaining || 0) > 0);

  const mapRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const featuredInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentsInputRef = useRef<HTMLInputElement>(null);

  const steps: { id: Step; label: string; icon: number }[] = [
    { id: 'PRINCIPALES', label: 'Principales', icon: 1 },
    { id: 'MULTIMEDIA', label: 'Multimedia', icon: 2 },
    { id: 'EXTRAS', label: 'Extras', icon: 3 },
    { id: 'PUBLICAR', label: 'Publicar', icon: 4 },
  ];

  useEffect(() => {
    if (editingId) {
      const prop = properties.find(p => p.id === editingId);
      if (prop) setEditingProperty({ ...prop });
    } else {
      startNew();
    }
  }, [editingId]);

  const generateUUID = () => crypto.randomUUID();

  const startNew = () => {
    setEditingProperty({
      id: generateUUID(),
      title: '',
      description: '',
      pricePEN: 0,
      priceUSD: 0,
      maintenanceFee: 0,
      constructionArea: 0,
      terrainArea: 0,
      builtArea: 0,
      floors: 1,
      yearBuilt: 0,
      department: 'Lima',
      district: '',
      address: '',
      bedrooms: 1,
      bathrooms: 1,
      parking: 0,
      parkingCovered: false,
      featuredImage: '',
      gallery: [],
      documents: [],
      features: [],
      type: 'Departamento',
      status: 'FOR_RENT',
      deliveryMonth: 'Enero',
      deliveryYear: new Date().getFullYear() + 1,
      createdAt: new Date().toISOString(),
      expiresAt: '', // Se calculará al publicar
      agentId: user.id,
      agentName: user.name,
      agentAvatar: user.avatar,
      agentWhatsapp: user.whatsapp,
      lat: -12.1224,
      lng: -77.0312,
      isFeatured: false,
      planType: 'BASIC',
      allowAdsUsage: undefined
    });
  };

  const updateField = (field: keyof Property, value: any) => {
    setEditingProperty(prev => prev ? { ...prev, [field]: value } : null);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!isSupabaseConfigured) return URL.createObjectURL(file);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      await supabase.storage.from('properties').upload(filePath, file);
      const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      showToast("Error al subir archivo", "ERROR");
      return null;
    }
  };

  const handleNext = () => {
    if (currentStep === 'PRINCIPALES') {
      if (!editingProperty?.title || !editingProperty?.type || !editingProperty?.district || !editingProperty?.address) {
        showToast("Por favor completa los campos obligatorios", "WARNING");
        return;
      }
      setCurrentStep('MULTIMEDIA');
    } else if (currentStep === 'MULTIMEDIA') {
      if (!editingProperty?.featuredImage) {
        showToast("Por favor sube al menos la foto de portada", "WARNING");
        return;
      }
      setCurrentStep('EXTRAS');
    } else if (currentStep === 'EXTRAS') {
      if (editingProperty?.allowAdsUsage === undefined) {
        showToast("Por favor indica tu preferencia de anuncios", "WARNING");
        return;
      }
      if (editingId) {
        handleFinalize();
      } else {
        setCurrentStep('PUBLICAR');
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'MULTIMEDIA') setCurrentStep('PRINCIPALES');
    if (currentStep === 'EXTRAS') setCurrentStep('MULTIMEDIA');
    if (currentStep === 'PUBLICAR') setCurrentStep('EXTRAS');
  };

  const handleFinalize = async () => {
    if (!editingProperty) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await onUpdate(editingProperty as Property);
      } else {
        await onAdd(editingProperty as Property);
      }
      showToast("Inmueble publicado con éxito", "SUCCESS");
    } catch (err) {
      showToast("Error al guardar", "ERROR");
    } finally {
      setIsSaving(false);
    }
  };

  // Map logic (similar to AdminPanel)
  useEffect(() => {
    if (currentStep !== 'PRINCIPALES' || !mapContainerRef.current || !editingProperty) return;
    
    const initMap = () => {
      if (typeof L === 'undefined') {
        setTimeout(initMap, 200);
        return;
      }
      if (mapRef.current) return;

      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false
      }).setView([editingProperty.lat || -12.1224, editingProperty.lng || -77.0312], 15);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);

      const pickerIcon = L.divIcon({
        className: 'location-picker-icon',
        html: `<div class="relative flex items-center justify-center"><div class="absolute -top-8 flex flex-col items-center"><div class="bg-red-600 text-white p-2 rounded-full shadow-2xl border-2 border-white animate-bounce"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg></div></div></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 0]
      });

      pickerMarkerRef.current = L.marker([editingProperty.lat || -12.1224, editingProperty.lng || -77.0312], {
        draggable: true,
        icon: pickerIcon
      }).addTo(mapRef.current);

      pickerMarkerRef.current.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        updateField('lat', pos.lat);
        updateField('lng', pos.lng);
      });
    };

    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentStep, editingProperty === null]);

  const isAdmin = user.role === 'ADMINISTRADOR';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Stepper Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className={`flex flex-col items-center gap-2 relative ${currentStep === step.id ? 'text-orange-500' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${currentStep === step.id ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-200'}`}>
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-grow h-1 bg-gray-100 mx-4 rounded-full overflow-hidden">
                    <div className={`h-full bg-orange-500 transition-all duration-500 ${steps.findIndex(s => s.id === currentStep) > idx ? 'w-full' : 'w-0'}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {currentStep === 'PRINCIPALES' && (
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100 animate-fade-in">
                <h2 className="text-3xl font-black text-slate-900 mb-8">¡Cuéntanos sobre tu inmueble!</h2>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Título del anuncio</label>
                    <input 
                      type="text" 
                      className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-orange-500" 
                      placeholder="Ej: Hermoso departamento en Miraflores con vista al mar"
                      value={editingProperty?.title || ''} 
                      onChange={(e) => updateField('title', e.target.value)} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Tipo de Inmueble</label>
                      <select 
                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                        value={editingProperty?.type || ''}
                        onChange={(e) => updateField('type', e.target.value)}
                      >
                        {PROPERTY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Estado</label>
                      <select 
                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                        value={editingProperty?.status || 'FOR_RENT'}
                        onChange={(e) => updateField('status', e.target.value)}
                      >
                        <option value="FOR_RENT">Alquiler</option>
                        <option value="FOR_SALE">Venta</option>
                        <option value="TEMPORAL">Temporal</option>
                        <option value="PROJECT">Proyecto</option>
                        <option value="TRASPASO">Traspaso</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Precio USD</label>
                      <input 
                        type="number" 
                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-orange-500"
                        value={editingProperty?.priceUSD || 0}
                        onChange={(e) => updateField('priceUSD', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Precio PEN</label>
                      <input 
                        type="number" 
                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-orange-500"
                        value={editingProperty?.pricePEN || 0}
                        onChange={(e) => updateField('pricePEN', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-orange-500 pl-4">Ubicación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" placeholder="Distrito" value={editingProperty?.district || ''} onChange={(e) => updateField('district', e.target.value)} />
                      <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" placeholder="Dirección" value={editingProperty?.address || ''} onChange={(e) => updateField('address', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Latitud</label>
                        <input 
                          type="number" 
                          step="any" 
                          className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                          placeholder="Ej: -12.1224" 
                          value={editingProperty?.lat === undefined ? '' : editingProperty.lat} 
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            updateField('lat', val);
                            if(pickerMarkerRef.current && val !== undefined && !isNaN(val)) {
                              pickerMarkerRef.current.setLatLng([val, editingProperty?.lng || -77.0312]);
                              mapRef.current?.setView([val, editingProperty?.lng || -77.0312]);
                            }
                          }} 
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Longitud</label>
                        <input 
                          type="number" 
                          step="any" 
                          className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                          placeholder="Ej: -77.0312" 
                          value={editingProperty?.lng === undefined ? '' : editingProperty.lng} 
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            updateField('lng', val);
                            if(pickerMarkerRef.current && val !== undefined && !isNaN(val)) {
                              pickerMarkerRef.current.setLatLng([editingProperty?.lat || -12.1224, val]);
                              mapRef.current?.setView([editingProperty?.lat || -12.1224, val]);
                            }
                          }} 
                        />
                      </div>
                    </div>
                    <div ref={mapContainerRef} className="w-full h-64 bg-gray-100 rounded-3xl overflow-hidden border border-gray-200" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'MULTIMEDIA' && (
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100 animate-fade-in">
                <h2 className="text-3xl font-black text-slate-900 mb-8">Fotos y Multimedia</h2>
                
                <div className="space-y-10">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Foto de Portada (Principal)</label>
                    <div 
                      onClick={() => featuredInputRef.current?.click()}
                      className="relative w-full aspect-video rounded-[2rem] bg-gray-50 border-4 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-all overflow-hidden"
                    >
                      {editingProperty?.featuredImage ? (
                        <img src={editingProperty.featuredImage} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Subir foto principal</span>
                        </div>
                      )}
                      {isUploading.featured && <div className="absolute inset-0 bg-white/80 flex items-center justify-center animate-pulse"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}
                    </div>
                    <input type="file" ref={featuredInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && editingProperty?.id) {
                        setIsUploading(p => ({...p, featured: true}));
                        const url = await uploadFile(file, editingProperty.id);
                        if (url) updateField('featuredImage', url);
                        setIsUploading(p => ({...p, featured: false}));
                      }
                    }} />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Galería de fotos</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(editingProperty?.gallery || []).map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => {
                              const newGallery = [...(editingProperty?.gallery || [])];
                              newGallery.splice(idx, 1);
                              updateField('gallery', newGallery);
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                      <div 
                        onClick={() => galleryInputRef.current?.click()}
                        className="aspect-square rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition-all"
                      >
                        <svg className="w-8 h-8 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                        <span className="text-[10px] font-black text-gray-400 uppercase">Añadir</span>
                      </div>
                    </div>
                    <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={async (e) => {
                      const files = e.target.files;
                      if (files && editingProperty?.id) {
                        setIsUploading(p => ({...p, gallery: true}));
                        const urls = [];
                        for (let i = 0; i < files.length; i++) {
                          const url = await uploadFile(files[i], editingProperty.id);
                          if (url) urls.push(url);
                        }
                        updateField('gallery', [...(editingProperty.gallery || []), ...urls]);
                        setIsUploading(p => ({...p, gallery: false}));
                      }
                    }} />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'EXTRAS' && (
              <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100 animate-fade-in">
                <h2 className="text-3xl font-black text-slate-900 mb-8">Detalles Adicionales</h2>
                
                <div className="space-y-10">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">Amenidades y Características</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {COMMON_FEATURES.map((feature, idx) => (
                        <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={(editingProperty?.features || []).includes(feature)} 
                            onChange={() => {
                              const current = editingProperty?.features || [];
                              const next = current.includes(feature) ? current.filter(f => f !== feature) : [...current, feature];
                              updateField('features', next);
                            }} 
                          />
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${ (editingProperty?.features || []).includes(feature) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-200 group-hover:border-orange-300'}`}>
                            {(editingProperty?.features || []).includes(feature) && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-8 rounded-[2rem]">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3">Autorización de Anuncios</h4>
                    <p className="text-xs text-gray-500 mb-6 font-medium">¿Permites usar tu publicación para anuncios pagados por nosotros para darte mayor alcance?</p>
                    <div className="flex gap-8">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${editingProperty?.allowAdsUsage === true ? 'border-orange-500' : 'border-gray-300'}`}>
                          {editingProperty?.allowAdsUsage === true && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                        </div>
                        <input type="radio" className="hidden" checked={editingProperty?.allowAdsUsage === true} onChange={() => updateField('allowAdsUsage', true)} />
                        <span className="text-xs font-black uppercase tracking-widest">Sí, permito</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${editingProperty?.allowAdsUsage === false ? 'border-orange-500' : 'border-gray-300'}`}>
                          {editingProperty?.allowAdsUsage === false && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                        </div>
                        <input type="radio" className="hidden" checked={editingProperty?.allowAdsUsage === false} onChange={() => updateField('allowAdsUsage', false)} />
                        <span className="text-xs font-black uppercase tracking-widest">No permito</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'PUBLICAR' && (
              <div className="space-y-8 animate-fade-in">
                {!isAdmin && paymentStatus !== 'SUCCESS' ? (
                  <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100">
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Publica tu inmueble</h2>
                        <p className="text-gray-500 font-medium">Elige cómo quieres activar tu anuncio.</p>
                      </div>
                      
                      {((user.propertiesRemaining || 0) > 0 || (user.featuredRemaining || 0) > 0 || (user.superFeaturedRemaining || 0) > 0) && (
                        <div className="flex bg-gray-100 p-1 rounded-2xl">
                          <button 
                            onClick={() => { setUseCredits(false); setSelectedPlan(null); }}
                            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!useCredits ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            Comprar Plan
                          </button>
                          <button 
                            onClick={() => { setUseCredits(true); setSelectedPlan(null); }}
                            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${useCredits ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            Usar mis Créditos
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {useCredits ? (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {(user.propertiesRemaining || 0) > 0 && (
                            <button 
                              onClick={() => {
                                updateField('planType', 'BASIC');
                                setPaymentStatus('SUCCESS');
                                showToast("Crédito Simple seleccionado", "SUCCESS");
                              }}
                              className="p-8 rounded-3xl border-2 border-gray-100 hover:border-orange-500 transition-all text-left group bg-gray-50/50"
                            >
                              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                              </div>
                              <h3 className="text-lg font-black text-slate-900 mb-1">Simple</h3>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Créditos: {user.propertiesRemaining}</p>
                              <span className="inline-block bg-orange-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Usar Crédito</span>
                            </button>
                          )}
                          
                          {(user.featuredRemaining || 0) > 0 && (
                            <button 
                              onClick={() => {
                                updateField('planType', 'FEATURED');
                                setPaymentStatus('SUCCESS');
                                showToast("Crédito Destacado seleccionado", "SUCCESS");
                              }}
                              className="p-8 rounded-3xl border-2 border-gray-100 hover:border-blue-500 transition-all text-left group bg-gray-50/50"
                            >
                              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                              </div>
                              <h3 className="text-lg font-black text-slate-900 mb-1">Destacado</h3>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Créditos: {user.featuredRemaining}</p>
                              <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Usar Crédito</span>
                            </button>
                          )}

                          {(user.superFeaturedRemaining || 0) > 0 && (
                            <button 
                              onClick={() => {
                                updateField('planType', 'SUPER_FEATURED');
                                setPaymentStatus('SUCCESS');
                                showToast("Crédito Super Destacado seleccionado", "SUCCESS");
                              }}
                              className="p-8 rounded-3xl border-2 border-gray-100 hover:border-purple-500 transition-all text-left group bg-gray-50/50"
                            >
                              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"/></svg>
                              </div>
                              <h3 className="text-lg font-black text-slate-900 mb-1">Super Destacado</h3>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Créditos: {user.superFeaturedRemaining}</p>
                              <span className="inline-block bg-purple-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Usar Crédito</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {!selectedPlan ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {packages.filter(pkg => {
                              // Filtrar por rol
                              const roleMatch = !pkg.allowedRoles || pkg.allowedRoles.length === 0 || user.role === 'ADMINISTRADOR' || pkg.allowedRoles.includes(user.role);
                              if (!roleMatch) return false;

                              // Filtrar por tipo de operación
                              const allowed = pkg.allowedOperation || 'BOTH';
                              if (allowed === 'BOTH') return true;
                              if (editingProperty?.status === 'FOR_RENT' && allowed === 'RENT') return true;
                              if (editingProperty?.status === 'FOR_SALE' && allowed === 'SALE') return true;
                              return false;
                            }).map(pkg => {
                              const isSuper = pkg.name.toLowerCase().includes('super');
                              const isFeatured = pkg.name.toLowerCase().includes('destacado') && !isSuper;
                              const isSimple = pkg.name.toLowerCase().includes('simple');
                              
                              let accentColor = 'text-orange-500';
                              if (isSuper) accentColor = 'text-purple-600';
                              if (isFeatured) accentColor = 'text-green-600';
                              if (isSimple) accentColor = 'text-yellow-600';

                              const features = pkg.features && pkg.features.length > 0 
                                ? pkg.features 
                                : pkg.description.split('|');

                              return (
                                <div 
                                  key={pkg.id} 
                                  className={`relative p-8 rounded-3xl border transition-all flex flex-col bg-white shadow-sm hover:shadow-md ${selectedPlan?.id === pkg.id ? 'border-emerald-600 ring-1 ring-emerald-600' : 'border-gray-100'}`}
                                >
                                  <h3 className={`text-sm font-black mb-6 ${accentColor}`}>{pkg.name}</h3>
                                  
                                  <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-xl font-black text-slate-900">S/.</span>
                                      <span className="text-2xl font-black text-slate-900">{pkg.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                                      <span className="text-xs font-bold text-gray-500">/ mes*</span>
                                    </div>
                                  </div>

                                  <div className="space-y-4 mb-8 flex-grow">
                                    {/* Plan Meta Info */}
                                    <div className="space-y-3 pb-4 border-b border-gray-100">
                                      <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                                          <Check className="w-3 h-3 text-emerald-600" strokeWidth={4} />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Tiempo de publicación</span>
                                          <span className="text-[12px] font-bold text-slate-800">{pkg.durationDays} días - Sin renovación automática</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                                          <Check className="w-3 h-3 text-emerald-600" strokeWidth={4} />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Categoría</span>
                                          <span className="text-[12px] font-bold text-slate-800">
                                            {isSuper ? 'Super Destacado' : isFeatured ? 'Destacado' : 'Simple'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Features */}
                                    {features.filter(f => f.trim() !== '').map((feature, i) => (
                                      <div key={i} className="flex items-start gap-3">
                                        <div className="mt-1 bg-emerald-50 rounded-full p-0.5 shrink-0">
                                          <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                                        </div>
                                        <span className="text-[12px] font-bold text-slate-600 leading-tight">{feature}</span>
                                      </div>
                                    ))}
                                  </div>

                                  <button 
                                    onClick={() => {
                                      setSelectedPlan(pkg);
                                      updateField('planType', isSuper ? 'SUPER_FEATURED' : isFeatured ? 'FEATURED' : 'BASIC');
                                    }}
                                    className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-[#065F46] text-white hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                                  >
                                    Comprar
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div className="flex items-center justify-between p-6 bg-orange-50 rounded-2xl border border-orange-100">
                              <div>
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Plan Seleccionado</p>
                                <h3 className="text-xl font-black">{selectedPlan.name}</h3>
                              </div>
                              <button onClick={() => setSelectedPlan(null)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600">Cambiar</button>
                            </div>

                            <PaymentFlow 
                              pkg={selectedPlan}
                              user={user}
                              paymentMethods={paymentMethods}
                              culqiPublicKey={culqiPublicKey}
                              onSuccess={() => {
                                setPaymentStatus('SUCCESS');
                                showToast("Pago procesado con éxito", "SUCCESS");
                              }}
                              onCancel={() => setSelectedPlan(null)}
                              onRecordTransaction={async (methodName, operationNumber, securityCode) => {
                                 // Logic to record transaction
                              }}
                              showToast={showToast}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-[2.5rem] shadow-xl p-12 border border-gray-100 text-center">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4">¡Todo listo para publicar!</h2>
                    <p className="text-gray-500 font-medium mb-10 max-w-md mx-auto">
                      {isAdmin ? "Como administrador, puedes publicar este inmueble de forma gratuita e inmediata." : "Tu pago ha sido procesado. Haz clic abajo para finalizar la publicación."}
                    </p>
                    <button 
                      onClick={handleFinalize}
                      disabled={isSaving}
                      className="bg-orange-500 text-white px-12 py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl shadow-orange-100 hover:bg-slate-900 transition-all active:scale-95"
                    >
                      {isSaving ? 'Publicando...' : 'Publicar Ahora'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep !== 'PUBLICAR' && (
              <div className="flex justify-between items-center pt-8">
                <button 
                  onClick={currentStep === 'PRINCIPALES' ? onCancel : handleBack}
                  className="px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-slate-900 transition-all"
                >
                  {currentStep === 'PRINCIPALES' ? 'Cancelar' : 'Anterior'}
                </button>
                <button 
                  onClick={handleNext}
                  className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl"
                >
                  {editingId && currentStep === 'EXTRAS' ? (isSaving ? 'Guardando...' : 'Guardar Cambios') : 'Siguiente'}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-gray-100 sticky top-24">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 pb-4 border-b">Detalle del aviso</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                  <span>{editingProperty?.status === 'FOR_SALE' ? 'Venta' : 'Alquiler'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                  <span>{editingProperty?.type || 'Tipo de inmueble'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span>{editingProperty?.district || 'Ubicación'}</span>
                </div>
              </div>

              {selectedPlan && (
                <div className="mt-8 pt-6 border-t space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</span>
                    <span className="text-xs font-black text-slate-900">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio</span>
                    <span className="text-xs font-black text-slate-900 whitespace-nowrap">S/ {selectedPlan.price}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-xs font-black text-slate-900 uppercase">Total</span>
                    <span className="text-xl font-black text-orange-500 whitespace-nowrap">S/ {selectedPlan.price}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PublicationFlow;
