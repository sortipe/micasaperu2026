
import React, { useState, useEffect, useRef } from 'react';
import { Property, User, PropertyCategory } from '../types';
import { DEPARTMENTS, COMMON_FEATURES, PROPERTY_CATEGORIES } from '../constants';
import { supabase } from '../lib/supabase';
import { ToastType } from './Toast';

declare const L: any;

interface AdminPanelProps {
  user: User;
  properties: Property[];
  editingId?: string | null;
  onAdd: (p: Property) => Promise<void>;
  onUpdate: (p: Property) => Promise<void>;
  onDelete: (id: string) => void;
  onCancel: () => void;
  showToast: (message: string, type: ToastType) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, properties, editingId, onAdd, onUpdate, onDelete, onCancel, showToast }) => {
  const [editingProperty, setEditingProperty] = useState<Partial<Property> | null>(null);
  const [isUploading, setIsUploading] = useState<{ featured: boolean; gallery: boolean; documents: boolean }>({ featured: false, gallery: false, documents: false });
  const [isSaving, setIsSaving] = useState(false);
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null);
  
  const mapRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const featuredInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) {
      const prop = properties.find(p => p.id === editingId);
      if (prop && (!editingProperty || editingProperty.id !== editingId)) {
        setEditingProperty({ ...prop });
      }
    } else if (!editingProperty) {
      startNew();
    }
  }, [editingId]);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

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
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      agentId: user.id, 
      agentName: user.name,
      agentAvatar: user.avatar,
      agentWhatsapp: user.whatsapp,
      lat: -12.1224,
      lng: -77.0312,
      isFeatured: false,
      planType: 'BASIC'
    });
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('properties').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading:', error);
      showToast("Error al subir archivo: " + (error.message || "Error desconocido"), "ERROR");
      return null;
    }
  };

  const updateField = (field: keyof Property, value: any) => {
    setEditingProperty(prev => {
      if (!prev) return null;
      
      // Ensure numeric fields are stored as numbers if possible
      let finalValue = value;
      const numericFields: (keyof Property)[] = ['lat', 'lng', 'pricePEN', 'priceUSD', 'maintenanceFee', 'bedrooms', 'bathrooms', 'parking', 'floors', 'yearBuilt', 'builtArea', 'terrainArea', 'constructionArea'];
      
      if (numericFields.includes(field) && typeof value === 'string') {
        if (value === '') {
          finalValue = undefined;
        } else {
          const num = parseFloat(value);
          if (!isNaN(num)) finalValue = num;
        }
      }

      let updated = { ...prev, [field]: finalValue };

      // Sync terrainArea with constructionArea if constructionArea is updated
      if (field === 'constructionArea') {
        updated.terrainArea = finalValue;
      }
      
      if (field === 'lat' || field === 'lng') {
        const newLat = field === 'lat' ? parseFloat(value) : (prev.lat || 0);
        const newLng = field === 'lng' ? parseFloat(value) : (prev.lng || 0);
        if (mapRef.current && pickerMarkerRef.current && !isNaN(newLat) && !isNaN(newLng)) {
          pickerMarkerRef.current.setLatLng([newLat, newLng]);
          mapRef.current.panTo([newLat, newLng]);
        }
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (editingProperty && editingProperty.id) {
      if (!editingProperty.title) {
        showToast("Por favor ingresa un título.", "WARNING");
        return;
      }
      if (!editingProperty.featuredImage) {
        showToast("Por favor sube una foto de portada.", "WARNING");
        return;
      }
      if (!editingProperty.district || !editingProperty.address) {
        showToast("Por favor completa la ubicación (Distrito y Dirección).", "WARNING");
        return;
      }

      const containsContactInfo = (text: string) => {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        if (emailRegex.test(lowerText)) return true;
        
        const digitWords = ['cero', 'zero', 'uno', 'one', 'dos', 'two', 'tres', 'three', 'cuatro', 'four', 'cinco', 'five', 'seis', 'six', 'siete', 'seven', 'ocho', 'eight', 'nueve', 'nine'];
        const digitPattern = `(?:\\d|${digitWords.join('|')})`;
        const separatorPattern = `[\\s\\-\\.,_]*`;
        const phoneRegex = new RegExp(`(?:${digitPattern}${separatorPattern}){9,}`, 'gi');
        
        return phoneRegex.test(lowerText);
      };

      const textToCheck = `${editingProperty.title} ${editingProperty.description} ${editingProperty.address}`;
      if (containsContactInfo(textToCheck)) {
        showToast("No se permite incluir teléfonos ni correos en el título, descripción o dirección.", "WARNING");
        return;
      }

      setIsSaving(true);
      const finalId = (editingProperty.id && editingProperty.id.length < 10) ? generateUUID() : (editingProperty.id || generateUUID());

      // Strip UI-only fields that don't exist in the database
      const { 
        agentName, 
        agentAvatar, 
        agentWhatsapp, 
        profiles, 
        ...cleanProperty 
      } = editingProperty as any;

      const payload: any = {
        id: finalId,
        title: cleanProperty.title,
        description: cleanProperty.description,
        pricePEN: cleanProperty.pricePEN,
        priceUSD: cleanProperty.priceUSD,
        maintenanceFee: cleanProperty.maintenanceFee || 0,
        constructionArea: cleanProperty.constructionArea || 0,
        terrainArea: cleanProperty.terrainArea || cleanProperty.constructionArea || 0,
        builtArea: cleanProperty.builtArea || 0,
        floors: cleanProperty.floors || 1,
        yearBuilt: cleanProperty.yearBuilt || 0,
        parkingCovered: cleanProperty.parkingCovered || false,
        deliveryMonth: cleanProperty.deliveryMonth,
        deliveryYear: cleanProperty.deliveryYear,
        department: cleanProperty.department,
        district: cleanProperty.district,
        address: cleanProperty.address,
        bedrooms: cleanProperty.bedrooms,
        bathrooms: cleanProperty.bathrooms,
        parking: cleanProperty.parking,
        featuredImage: cleanProperty.featuredImage,
        gallery: cleanProperty.gallery,
        documents: cleanProperty.documents,
        features: cleanProperty.features,
        type: cleanProperty.type,
        status: cleanProperty.status,
        createdAt: cleanProperty.createdAt,
        expiresAt: cleanProperty.expiresAt,
        isFeatured: cleanProperty.planType === 'FEATURED' || cleanProperty.planType === 'SUPER_FEATURED' || cleanProperty.isFeatured,
        planType: cleanProperty.planType || 'BASIC',
        lat: cleanProperty.lat,
        lng: cleanProperty.lng,
        agentId: (user.role === 'ADMIN' && editingId) ? editingProperty.agentId : user.id,
      };
      
      try {
        if (editingId) {
          await onUpdate(payload as Property);
        } else {
          await onAdd(payload as Property);
        }
      } catch (err: any) {
        console.error("Error al guardar en Supabase:", err);
        showToast("Error de base de datos: " + (err.message || "Error desconocido"), "ERROR");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const toggleFeature = (feature: string) => {
    setEditingProperty(prev => {
      if (!prev) return null;
      const currentFeatures = prev.features || [];
      const newFeatures = currentFeatures.includes(feature)
        ? currentFeatures.filter(f => f !== feature)
        : [...currentFeatures, feature];
      return { ...prev, features: newFeatures };
    });
  };

  const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProperty?.id) return;
    setIsUploading(prev => ({ ...prev, featured: true }));
    const url = await uploadFile(file, editingProperty.id);
    if (url) updateField('featuredImage', url);
    setIsUploading(prev => ({ ...prev, featured: false }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProperty?.id) return;
    setIsUploading(prev => ({ ...prev, gallery: true }));
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadFile(files[i], editingProperty.id);
      if (url) newUrls.push(url);
    }
    const currentGallery = editingProperty.gallery || [];
    updateField('gallery', [...currentGallery, ...newUrls]);
    setIsUploading(prev => ({ ...prev, gallery: false }));
  };

  const removeGalleryImage = (index: number) => {
    const currentGallery = [...(editingProperty?.gallery || [])];
    currentGallery.splice(index, 1);
    updateField('gallery', currentGallery);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedGalleryIndex(index);
    // Required for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.parentNode as any);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedGalleryIndex === null || draggedGalleryIndex === targetIndex) return;

    const currentGallery = [...(editingProperty?.gallery || [])];
    const draggedItem = currentGallery[draggedGalleryIndex];
    
    currentGallery.splice(draggedGalleryIndex, 1);
    currentGallery.splice(targetIndex, 0, draggedItem);
    
    updateField('gallery', currentGallery);
    setDraggedGalleryIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedGalleryIndex(null);
  };

  const moveGalleryImage = (index: number, direction: 'left' | 'right') => {
    const currentGallery = [...(editingProperty?.gallery || [])];
    if (direction === 'left' && index > 0) {
      [currentGallery[index], currentGallery[index - 1]] = [currentGallery[index - 1], currentGallery[index]];
    } else if (direction === 'right' && index < currentGallery.length - 1) {
      [currentGallery[index], currentGallery[index + 1]] = [currentGallery[index + 1], currentGallery[index]];
    }
    updateField('gallery', currentGallery);
  };

  const handleDocumentsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProperty?.id) return;
    setIsUploading(prev => ({ ...prev, documents: true }));
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadFile(files[i], editingProperty.id);
      if (url) newUrls.push(url);
    }
    const currentDocs = editingProperty.documents || [];
    updateField('documents', [...currentDocs, ...newUrls]);
    setIsUploading(prev => ({ ...prev, documents: false }));
  };

  const removeDocument = (index: number) => {
    const currentDocs = [...(editingProperty?.documents || [])];
    currentDocs.splice(index, 1);
    updateField('documents', currentDocs);
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        updateField('lat', latitude);
        updateField('lng', longitude);
      });
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || !editingProperty) return;
    
    let isCancelled = false;
    let retryTimeout: number;

    const initMap = () => {
      if (typeof L === 'undefined') {
        if (!isCancelled) retryTimeout = window.setTimeout(initMap, 200);
        return;
      }
      if (mapRef.current) return;

      const initialLat = editingProperty.lat || -12.1224;
      const initialLng = editingProperty.lng || -77.0312;
      
      try {
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false,
          scrollWheelZoom: false
        }).setView([initialLat, initialLng], 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);

        const pickerIcon = L.divIcon({
          className: 'location-picker-icon',
          html: `<div class="relative flex items-center justify-center"><div class="absolute -top-8 flex flex-col items-center"><div class="bg-red-600 text-white p-2 rounded-full shadow-2xl border-2 border-white animate-bounce"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg></div></div></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 0]
        });

        pickerMarkerRef.current = L.marker([initialLat, initialLng], {
          draggable: true,
          icon: pickerIcon
        }).addTo(mapRef.current);

        pickerMarkerRef.current.on('dragend', (e: any) => {
          const position = e.target.getLatLng();
          setEditingProperty(prev => prev ? { ...prev, lat: position.lat, lng: position.lng } : null);
        });

        setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 500);
      } catch (err) {
        console.warn("Map init error:", err);
      }
    };

    initMap();
    return () => { 
      isCancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (mapRef.current) { 
        mapRef.current.remove(); 
        mapRef.current = null; 
        pickerMarkerRef.current = null;
      } 
    };
  }, [editingProperty === null]);

  if (!editingProperty) return (
    <div className="flex justify-center items-center py-40">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
  );

  const isModerating = user.role === 'ADMIN' && editingProperty.agentId !== user.id;

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      {isModerating && (
        <div className="mb-8 bg-slate-900 text-white p-6 rounded-[2rem] border-l-[10px] border-red-600 shadow-xl flex items-center gap-6 animate-bounce-in">
           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Modo Administrador Activo</p>
              <h2 className="text-sm font-black uppercase">Estás editando el inmueble de: <span className="text-red-500">{editingProperty.agentName}</span></h2>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{editingId ? 'Editar Anuncio' : 'Publicar Inmueble'}</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Completa los datos técnicos</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-red-600 font-black uppercase text-[10px] tracking-widest transition-colors flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-12 max-w-6xl mx-auto border border-gray-100 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Título del anuncio</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-red-500" value={editingProperty.title || ''} onChange={(e) => updateField('title', e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ID Propiedad</label>
                  <input type="text" className="w-full p-4 bg-red-50 border-2 border-red-100 rounded-2xl font-black text-red-600 text-center uppercase text-[10px] truncate" value={editingProperty.id || ''} readOnly />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo de Inmueble</label>
                  <select className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-red-500 outline-none cursor-pointer" value={editingProperty.type || ''} onChange={(e) => updateField('type', e.target.value as PropertyCategory)}>
                    <option value="" disabled>Seleccionar tipo...</option>
                    {PROPERTY_CATEGORIES.map(cat => ( <option key={cat} value={cat}>{cat}</option> ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estado</label>
                  <select className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold cursor-pointer" value={editingProperty.status} onChange={(e) => updateField('status', e.target.value)}>
                    <option value="FOR_RENT">Alquiler</option>
                    <option value="FOR_SALE">Venta</option>
                    <option value="TEMPORAL">Temporal</option>
                    <option value="PROJECT">Proyecto</option>
                    <option value="TRASPASO">Traspaso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Plan de Publicación</label>
                  <select className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold cursor-pointer" value={editingProperty.planType || 'BASIC'} onChange={(e) => updateField('planType', e.target.value)}>
                    <option value="BASIC">Básico (Normal)</option>
                    <option value="FEATURED">Destacado</option>
                    <option value="SUPER_FEATURED">Súper Destacado</option>
                  </select>
                </div>
              </div>

              {editingProperty.status === 'PROJECT' && (
                <div className="bg-orange-50 p-8 rounded-[2rem] border border-orange-100 animate-fade-in">
                  <h3 className="text-xs font-black text-orange-900 uppercase tracking-widest mb-6 border-l-4 border-orange-500 pl-4">Datos de Entrega (Proyecto)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mes de Entrega</label>
                      <select 
                        className="w-full p-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer" 
                        value={editingProperty.deliveryMonth || 'Enero'} 
                        onChange={(e) => updateField('deliveryMonth', e.target.value)}
                      >
                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Año de Entrega</label>
                      <input 
                        type="number" 
                        className="w-full p-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                        value={editingProperty.deliveryYear || new Date().getFullYear()} 
                        onChange={(e) => updateField('deliveryYear', e.target.value)} 
                        placeholder="Ej: 2025"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NUEVA SECCIÓN DE FICHA TÉCNICA */}
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-l-4 border-red-600 pl-4">Ficha Técnica Detallada</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Habitaciones</label>
                    <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-500" value={editingProperty.bedrooms || 0} onChange={(e) => updateField('bedrooms', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Baños</label>
                    <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-500" value={editingProperty.bathrooms || 0} onChange={(e) => updateField('bathrooms', Number(e.target.value))} />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-grow">
                      <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Cocheras</label>
                      <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-500" value={editingProperty.parking || 0} onChange={(e) => updateField('parking', Number(e.target.value))} />
                    </div>
                    <label className="flex items-center gap-2 mb-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" checked={editingProperty.parkingCovered || false} onChange={(e) => updateField('parkingCovered', e.target.checked)} />
                      <span className="text-[9px] font-black text-gray-400 uppercase">Techado</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">N° Pisos</label>
                    <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-500" value={editingProperty.floors || 1} onChange={(e) => updateField('floors', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Antigüedad (Años)</label>
                    <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-500" value={editingProperty.yearBuilt ?? 0} onChange={(e) => updateField('yearBuilt', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Área Construida (m²)</label>
                    <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-500" value={editingProperty.builtArea || 0} onChange={(e) => updateField('builtArea', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Área Total/Terreno (m²)</label>
                    <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-500" value={editingProperty.constructionArea || 0} onChange={(e) => updateField('constructionArea', Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descripción pública</label>
                <textarea className="w-full p-4 bg-gray-50 border-none rounded-2xl font-medium min-h-[150px] resize-none" value={editingProperty.description || ''} onChange={(e) => updateField('description', e.target.value)} />
              </div>
            </div>

            <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest border-l-4 border-red-600 pl-4">Localización</h3>
                <button onClick={getCurrentLocation} className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">GPS Actual</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" className="w-full p-3 bg-white rounded-xl font-bold" value={editingProperty.department || ''} onChange={(e) => updateField('department', e.target.value)} placeholder="Departamento" />
                <input type="text" className="w-full p-3 bg-white rounded-xl font-bold" value={editingProperty.district || ''} onChange={(e) => updateField('district', e.target.value)} placeholder="Distrito" />
              </div>
              <input type="text" className="w-full p-3 bg-white rounded-xl font-bold" value={editingProperty.address || ''} onChange={(e) => updateField('address', e.target.value)} placeholder="Dirección Exacta" />
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-blue-400 uppercase mb-2 ml-1">Latitud</label>
                  <input type="number" step="any" className="w-full p-3 bg-white rounded-xl font-bold text-sm" value={editingProperty.lat ?? ''} onChange={(e) => updateField('lat', e.target.value)} placeholder="Ej: -12.1224" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-blue-400 uppercase mb-2 ml-1">Longitud</label>
                  <input type="number" step="any" className="w-full p-3 bg-white rounded-xl font-bold text-sm" value={editingProperty.lng ?? ''} onChange={(e) => updateField('lng', e.target.value)} placeholder="Ej: -77.0312" />
                </div>
              </div>

              <div ref={mapContainerRef} className="w-full h-80 bg-gray-200 rounded-3xl overflow-hidden border-4 border-white shadow-lg relative z-10" />
            </div>

            <div className="bg-gray-50 p-8 rounded-[2rem] space-y-6">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Amenidades</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {COMMON_FEATURES.map((feature, idx) => (
                  <label key={idx} className="flex items-center space-x-3 cursor-pointer group">
                    <input type="checkbox" className="hidden" checked={(editingProperty.features || []).includes(feature)} onChange={() => toggleFeature(feature)} />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${ (editingProperty.features || []).includes(feature) ? 'bg-red-600 border-red-600' : 'border-gray-200 bg-white group-hover:border-red-300'}`}>
                      {(editingProperty.features || []).includes(feature) && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-tight ${ (editingProperty.features || []).includes(feature) ? 'text-slate-900' : 'text-slate-400'}`}>{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-[#0f172a] p-8 rounded-[2.5rem] shadow-2xl text-white">
                <h3 className="text-xl font-black text-red-500 mb-6 uppercase tracking-tighter">Precios</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 ml-1">USD</label>
                    <input type="number" className="w-full p-4 bg-white/5 rounded-2xl font-black text-2xl text-red-50 outline-none focus:ring-1 focus:ring-red-500" value={editingProperty.priceUSD || 0} onChange={(e) => updateField('priceUSD', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 ml-1">PEN</label>
                    <input type="number" className="w-full p-4 bg-white/5 rounded-2xl font-black text-2xl text-red-50 outline-none focus:ring-1 focus:ring-red-500" value={editingProperty.pricePEN || 0} onChange={(e) => updateField('pricePEN', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2 ml-1">Mantenimiento (S/)</label>
                    <input type="number" className="w-full p-4 bg-white/5 rounded-2xl font-black text-2xl text-red-50 outline-none focus:ring-1 focus:ring-red-500" value={editingProperty.maintenanceFee || 0} onChange={(e) => updateField('maintenanceFee', Number(e.target.value))} />
                  </div>
                </div>
             </div>

             <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col items-center">
                <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6 w-full text-left">Foto de Portada</h4>
                <div className="relative w-full aspect-[4/3] rounded-[2rem] bg-gray-50 border-4 border-dashed border-gray-100 overflow-hidden flex items-center justify-center cursor-pointer group shadow-inner" onClick={() => featuredInputRef.current?.click()}>
                  {editingProperty.featuredImage ? <img src={editingProperty.featuredImage} className="w-full h-full object-cover rounded-[1.5rem]" /> : <span className="text-gray-300 font-black uppercase text-[10px] tracking-widest">Subir foto</span>}
                  {isUploading.featured && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm z-10"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>}
                </div>
                <input type="file" ref={featuredInputRef} className="hidden" accept="image/*" onChange={handleFeaturedUpload} />
             </div>

              <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
                <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6">Galería</h4>
                <div className="grid grid-cols-2 gap-4">
                  {(editingProperty.gallery || []).map((img, idx) => (
                    <div 
                      key={idx} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`relative aspect-square rounded-[1.5rem] overflow-hidden group cursor-move ${draggedGalleryIndex === idx ? 'opacity-50' : ''}`}
                    >
                      <img src={img} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => moveGalleryImage(idx, 'left')} className="bg-white text-slate-900 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg></button>
                        <button onClick={() => removeGalleryImage(idx)} className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-900 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg></button>
                        <button onClick={() => moveGalleryImage(idx, 'right')} className="bg-white text-slate-900 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg></button>
                      </div>
                    </div>
                  ))}
                  <div onClick={() => galleryInputRef.current?.click()} className="aspect-square rounded-[1.5rem] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200 transition-all">
                    {isUploading.gallery ? <div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <span className="text-[9px] font-black text-gray-300 uppercase">Subir</span>}
                  </div>
                </div>
                <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
             </div>

             <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
                <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6">Documentos / Planos</h4>
                <div className="space-y-4">
                  {(editingProperty.documents || []).map((doc, idx) => (
                    <div key={idx} className="relative group flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 overflow-hidden">
                        {doc.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                          <img src={doc} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        )}
                      </div>
                      <div className="flex-grow truncate">
                        <p className="text-[10px] font-black text-slate-900 uppercase truncate">Documento {idx + 1}</p>
                        <a href={doc} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-red-600 hover:underline">Ver archivo</a>
                      </div>
                      <button onClick={() => removeDocument(idx)} className="text-gray-300 hover:text-red-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                  ))}
                  <div onClick={() => documentsInputRef.current?.click()} className="p-6 rounded-[1.5rem] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200 transition-all">
                    {isUploading.documents ? <div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <span className="text-[9px] font-black text-gray-300 uppercase">Subir Documentos</span>}
                  </div>
                </div>
                <input type="file" ref={documentsInputRef} className="hidden" multiple onChange={handleDocumentsUpload} />
             </div>

             <button 
              onClick={handleSave} 
              disabled={isSaving || isUploading.featured || isUploading.gallery || isUploading.documents} 
              className="w-full bg-red-600 text-white font-black py-7 rounded-[2.5rem] shadow-2xl shadow-red-100 hover:bg-slate-900 transition-all text-xl uppercase tracking-widest disabled:opacity-50 active:scale-95"
             >
               {isSaving ? 'Guardando...' : 'Guardar Cambios'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
