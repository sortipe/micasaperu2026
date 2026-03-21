
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Property, Package, Transaction, LegalDoc, Inquiry, Notification, SocialLink, OfficeInfo, LocationItem, Complaint, PaymentMethod, LegalDocType } from '../types';
import { supabase } from '../lib/supabase';
import { GoogleGenAI, Type } from "@google/genai";
import { ToastType } from './Toast';

interface ClientDashboardProps {
  user: User;
  properties: Property[];
  packages: Package[];
  transactions: Transaction[];
  complaints?: Complaint[];
  legalDocs: LegalDoc[];
  inquiries: Inquiry[];
  notifications: Notification[];
  locations: LocationItem[];
  appLogo?: string | null;
  homeBanner?: string | null;
  socialLinks: SocialLink[];
  officeInfo: OfficeInfo;
  paymentMethods: PaymentMethod[];
  onUpdateLogo: (url: string) => Promise<void>;
  onUpdateBanner: (url: string) => Promise<void>;
  onUpdateSocialLinks: (links: SocialLink[]) => Promise<void>;
  onUpdateOfficeInfo: (info: OfficeInfo) => Promise<void>;
  onAddProperty: () => void;
  onEditProperty: (id: string) => void;
  onDeleteProperty: (id: string) => void;
  onUpdateProfile: (data: Partial<User>) => Promise<void>;
  onLogout: () => void;
  onUpdateTransactionStatus: (id: string, status: 'COMPLETED' | 'CANCELLED') => void;
  onSaveLegalDoc: (doc: Partial<LegalDoc>) => void;
  onSavePackage: (pkg: Package) => Promise<void>;
  onDeletePackage: (id: string) => Promise<void>;
  onUpdatePaymentMethod: (method: PaymentMethod) => Promise<void>;
  onDeletePaymentMethod: (id: string) => Promise<void>;
  onSaveLocation: (loc: LocationItem) => Promise<any>;
  onDeleteLocation: (id: string) => void;
  onNavigate: (view: any) => void;
  showToast: (message: string, type: ToastType) => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  user, properties = [], legalDocs = [], complaints = [], appLogo, homeBanner, socialLinks = [], officeInfo,
  locations = [], packages = [], paymentMethods = [], onUpdateLogo, onUpdateBanner, onUpdateSocialLinks, onUpdateOfficeInfo, 
  onAddProperty, onEditProperty, onDeleteProperty, onLogout, onSaveLegalDoc, onSaveLocation, onDeleteLocation, 
  onSavePackage, onDeletePackage, onUpdatePaymentMethod, onDeletePaymentMethod, inquiries = [], onNavigate, onUpdateProfile, transactions = [],
  onUpdateTransactionStatus, showToast
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROPERTIES' | 'COMPLAINTS' | 'POLICIES' | 'SETTINGS' | 'LOCATIONS' | 'PACKAGES' | 'PAYMENTS' | 'TRANSACTIONS' | 'PROFILE' | 'INQUIRIES' | 'MY_PAYMENTS'>('OVERVIEW');
  const [adminFilter, setAdminFilter] = useState<'ALL' | 'MINE'>('ALL');
  
  const [profileData, setProfileData] = useState({ name: user.name, avatar: user.avatar || '', whatsapp: user.whatsapp || '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<LocationItem[]>([]);
  const [locationSearch, setLocationSearch] = useState('');

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [tempOfficeInfo, setTempOfficeInfo] = useState<OfficeInfo>({ ...officeInfo });
  const [tempSocialLinks, setTempSocialLinks] = useState<SocialLink[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

  useEffect(() => {
    setTempOfficeInfo({ ...officeInfo });
  }, [officeInfo]);

  useEffect(() => {
    const platforms: SocialLink['platform'][] = ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TIKTOK', 'WHATSAPP'];
    const initialLinks = platforms.map(p => {
      const existing = socialLinks.find(l => l.platform === p);
      return existing || { platform: p, url: '' };
    });
    setTempSocialLinks(initialLinks);
  }, [socialLinks]);

  const isAdmin = user.role === 'ADMIN';
  const canPublish = user.propertiesRemaining > 0 || isAdmin;

  const myProperties = useMemo(() => {
    if (!isAdmin) return properties.filter(p => p.agentId === user.id);
    if (adminFilter === 'MINE') return properties.filter(p => p.agentId === user.id);
    return properties;
  }, [properties, user, isAdmin, adminFilter]);

  const filteredLocations = useMemo(() => {
    return locations.filter(l => 
      l.name.toLowerCase().includes(locationSearch.toLowerCase()) || 
      (l.parent && l.parent.toLowerCase().includes(locationSearch.toLowerCase()))
    );
  }, [locations, locationSearch]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'LOGO' | 'BANNER' | 'AVATAR') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (type === 'LOGO') setIsUploadingLogo(true);
    else if (type === 'BANNER') setIsUploadingBanner(true);
    else setIsUpdatingProfile(true);

    try {
      const fileName = `${type.toLowerCase()}-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `brand/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('properties').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('properties').getPublicUrl(filePath);
      
      if (type === 'LOGO') await onUpdateLogo(urlData.publicUrl);
      else if (type === 'BANNER') await onUpdateBanner(urlData.publicUrl);
      else {
        await onUpdateProfile({ avatar: urlData.publicUrl });
        setProfileData(prev => ({ ...prev, avatar: urlData.publicUrl }));
        showToast("Avatar actualizado", "SUCCESS");
      }
    } catch (err) { showToast("Error al subir imagen.", "ERROR"); } 
    finally { 
      setIsUploadingLogo(false); 
      setIsUploadingBanner(false); 
      setIsUpdatingProfile(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await onUpdateProfile({ name: profileData.name, whatsapp: profileData.whatsapp });
    } catch (err) {
      showToast("Error al actualizar perfil.", "ERROR");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const isLocationSaved = (loc: LocationItem) => {
    return locations.some(l => 
      l.name.toLowerCase() === loc.name.toLowerCase() && 
      l.type.toLowerCase() === loc.type.toLowerCase()
    );
  };

  const handleGenerateLocations = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Actúa como un experto en geografía e inmobiliaria peruana. Analiza cuidadosamente el siguiente pedido: "${aiPrompt}".
        Genera una lista de ubicaciones geográficas que coincidan exactamente con lo solicitado.
        
        REGLAS CRÍTICAS:
        1. Si el usuario pide "departamentos", genera ÚNICAMENTE los departamentos del Perú (son 24 departamentos + 1 Provincia Constitucional).
        2. Si el usuario pide "distritos de [Provincia/Departamento]", genera solo distritos de esa zona.
        3. No mezcles tipos de ubicación (ej: no pongas avenidas si pidieron departamentos) a menos que el pedido sea genérico.
        4. El campo "parent" debe ser "Perú" para departamentos, o el nombre del Departamento/Provincia superior para distritos y urbanizaciones.
        5. Genera hasta 30 resultados si el pedido lo requiere (como en el caso de todos los departamentos).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { 
                  type: Type.STRING,
                  description: "Nombre de la ubicación (ej: Miraflores, Lima, Av. Larco)"
                },
                type: { 
                  type: Type.STRING,
                  description: "Tipo de ubicación: Departamento, Provincia, Distrito, Urbanización, Avenida o Ciudad"
                },
                parent: { 
                  type: Type.STRING,
                  description: "Ubicación superior. Para departamentos usar 'Perú'. Para distritos usar el nombre del departamento."
                }
              },
              required: ["name", "type", "parent"]
            }
          }
        }
      });
      const data = JSON.parse(response.text || '[]');
      setAiSuggestions(data);
      showToast("Ubicaciones generadas con éxito", "SUCCESS");
    } catch (err) { showToast("Error con la IA: " + (err as Error).message, "ERROR"); } 
    finally { setIsAiGenerating(false); }
  };

  const saveAiSuggestion = async (loc: LocationItem) => {
    if (isLocationSaved(loc)) {
      showToast("Esta ubicación ya existe.", "WARNING");
      setAiSuggestions(prev => prev.filter(s => s.name !== loc.name));
      return;
    }
    try {
      await onSaveLocation(loc);
      setAiSuggestions(prev => prev.filter(s => s.name !== loc.name));
    } catch (err) { showToast("Error al guardar ubicación.", "ERROR"); }
  };

  const handleAddPropertyClick = () => {
    if (!canPublish) {
      showToast("No tienes saldo de publicaciones. Por favor adquiere un plan.", "WARNING");
      onNavigate('PRICING');
      return;
    }
    onAddProperty();
  };

  const handleAddNewPackage = () => {
    const newPkg: Package = {
      id: crypto.randomUUID(),
      name: 'Nuevo Plan',
      price: 0,
      propertyLimit: 1,
      durationDays: 30,
      featuredLimit: 0,
      superFeaturedLimit: 0,
      description: 'Ideal para publicar...',
      isActive: true
    };
    onSavePackage(newPkg);
  };

  const handleUpdateSocialLink = (platform: SocialLink['platform'], url: string) => {
    setTempSocialLinks(prev => prev.map(l => l.platform === platform ? { ...l, url } : l));
  };

  const saveSocialSettings = async () => {
    try {
      await onUpdateSocialLinks(tempSocialLinks);
    } catch (err) { showToast("Error al guardar redes.", "ERROR"); }
  };

  const saveOfficeSettings = async () => {
    try {
      await onUpdateOfficeInfo(tempOfficeInfo);
    } catch (err) { showToast("Error al guardar oficina.", "ERROR"); }
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'OVERVIEW':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col items-center text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Publicaciones</p>
              <p className="text-4xl font-black text-[#091F4F] tracking-tighter">{myProperties.length}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col items-center text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Interesados</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{inquiries.length}</p>
            </div>
            {isAdmin && (
              <div className="bg-red-50 p-8 rounded-[2.5rem] shadow-xl border border-red-100 flex flex-col items-center text-center">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Reclamos Pendientes</p>
                <p className="text-4xl font-black text-red-600 tracking-tighter">{complaints.filter(c => c.status === 'PENDIENTE').length}</p>
              </div>
            )}
          </div>
        );
      case 'PROPERTIES':
        return (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 animate-fade-in">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight">Gestión de Inmuebles</h2>
              <button onClick={handleAddPropertyClick} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all">+ Nuevo</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="pb-4 px-4">Inmueble</th>
                    <th className="pb-4 px-4">Precio</th>
                    <th className="pb-4 px-4">Estado</th>
                    <th className="pb-4 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myProperties.map(p => (
                    <tr key={p.id} className="group">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-4">
                          <img src={p.featuredImage} className="w-16 h-12 rounded-lg object-cover" />
                          <div className="max-w-[200px]">
                            <p className="font-black text-sm text-slate-900 truncate">{p.title}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{p.district}, {p.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                         <p className="font-black text-slate-900 text-sm">S/ {p.pricePEN.toLocaleString()}</p>
                         <p className="text-[10px] text-gray-400 font-bold">$ {p.priceUSD.toLocaleString()}</p>
                      </td>
                      <td className="py-6 px-4">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${p.status === 'FOR_SALE' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-6 px-4">
                         <div className="flex items-center gap-2">
                           <button onClick={() => onEditProperty(p.id)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg></button>
                           <button onClick={() => setConfirmAction({ message: "¿Estás seguro de que deseas eliminar este inmueble?", onConfirm: () => onDeleteProperty(p.id) })} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5"/></svg></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'TRANSACTIONS':
        if (!isAdmin) return null;
        return (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 animate-fade-in">
            <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight mb-10">Validación de Ventas</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="pb-4 px-4">Cliente</th>
                    <th className="pb-4 px-4">Plan</th>
                    <th className="pb-4 px-4">Monto</th>
                    <th className="pb-4 px-4">Pago</th>
                    <th className="pb-4 px-4">Estado</th>
                    <th className="pb-4 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map(t => (
                    <tr key={t.id} className="group">
                      <td className="py-6 px-4">
                        <p className="font-black text-sm text-slate-900">{t.userName}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(t.date).toLocaleDateString()}</p>
                      </td>
                      <td className="py-6 px-4">
                        <p className="font-black text-sm text-[#091F4F] uppercase">{t.packageName}</p>
                      </td>
                      <td className="py-6 px-4">
                        <p className="font-black text-red-600 text-sm">S/ {t.amount.toLocaleString()}</p>
                      </td>
                      <td className="py-6 px-4">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t.paymentMethodName}</p>
                      </td>
                      <td className="py-6 px-4">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${t.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : t.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                          {t.status === 'COMPLETED' ? 'Aprobado' : t.status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
                        </span>
                      </td>
                      <td className="py-6 px-4">
                         {t.status === 'PENDING' && (
                           <div className="flex items-center gap-2">
                             <button onClick={() => setConfirmAction({ message: "¿Aprobar compra?", onConfirm: () => onUpdateTransactionStatus(t.id, 'COMPLETED') })} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-all">Aprobar</button>
                             <button onClick={() => setConfirmAction({ message: "¿Rechazar compra?", onConfirm: () => onUpdateTransactionStatus(t.id, 'CANCELLED') })} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all">Rechazar</button>
                           </div>
                         )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">No hay transacciones registradas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'SETTINGS':
        if (!isAdmin) return null;
        return (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 animate-fade-in space-y-12">
            <div>
               <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight mb-8">Identidad de Marca</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-gray-50 rounded-3xl flex flex-col items-center">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Logo Principal</p>
                     <div className="w-full aspect-[2/1] bg-white rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-4 relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                        {appLogo ? <img src={appLogo} className="h-12 w-auto object-contain" /> : <span className="text-gray-300 text-[10px] font-black">Subir Logo</span>}
                        {isUploadingLogo && <div className="absolute inset-0 bg-white/80 flex items-center justify-center animate-pulse"><div className="w-6 h-6 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>}
                     </div>
                     <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'LOGO')} />
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl flex flex-col items-center">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Banner Principal (Home)</p>
                     <div className="w-full aspect-[2/1] bg-white rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-4 relative group cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                        {homeBanner ? <img src={homeBanner} className="w-full h-full object-cover" /> : <span className="text-gray-300 text-[10px] font-black">Subir Banner</span>}
                        {isUploadingBanner && <div className="absolute inset-0 bg-white/80 flex items-center justify-center animate-pulse"><div className="w-6 h-6 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>}
                     </div>
                     <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'BANNER')} />
                  </div>
               </div>
            </div>
            <div>
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight">Información de Oficina</h2>
                  <button onClick={saveOfficeSettings} className="bg-[#091F4F] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600">Guardar</button>
               </div>
               <div className="space-y-4">
                  <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={tempOfficeInfo.address} onChange={e => setTempOfficeInfo({...tempOfficeInfo, address: e.target.value})} placeholder="Dirección física" />
                  <div className="grid grid-cols-2 gap-4">
                     <input type="email" className="p-4 bg-gray-50 rounded-2xl font-bold" value={tempOfficeInfo.email} onChange={e => setTempOfficeInfo({...tempOfficeInfo, email: e.target.value})} placeholder="Email de contacto" />
                     <input type="text" className="p-4 bg-gray-50 rounded-2xl font-bold" value={tempOfficeInfo.phone} onChange={e => setTempOfficeInfo({...tempOfficeInfo, phone: e.target.value})} placeholder="WhatsApp (9 dgt)" />
                  </div>
               </div>
            </div>
          </div>
        );
      case 'LOCATIONS':
        if (!isAdmin) return null;
        return (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 animate-fade-in space-y-10">
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] space-y-6">
               <h2 className="text-xl font-black uppercase tracking-tight text-red-500">Generador de Ubicaciones IA</h2>
               <div className="flex gap-3">
                  <input type="text" className="flex-grow p-4 bg-white/10 rounded-xl font-bold outline-none border border-white/5 focus:ring-2 focus:ring-red-600" placeholder="Ej: Genera distritos residenciales de Arequipa..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                  <button disabled={isAiGenerating} onClick={handleGenerateLocations} className="bg-red-600 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-red-600 transition-all disabled:opacity-50">
                    {isAiGenerating ? 'IA Pensando...' : 'Generar'}
                  </button>
               </div>
               {aiSuggestions.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-slide-up">
                    {aiSuggestions.map((s, idx) => {
                      const alreadyExists = isLocationSaved(s);
                      return (
                        <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${alreadyExists ? 'bg-green-50/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                           <div>
                              <p className={`font-black text-sm ${alreadyExists ? 'text-green-400' : 'text-white'}`}>{s.name}</p>
                              <p className="text-[9px] text-gray-500 uppercase font-bold">{s.type} - {s.parent}</p>
                           </div>
                           {alreadyExists ? (
                             <div className="p-2 bg-green-600/20 text-green-500 rounded-lg border border-green-500/50" title="Ya existe en la base de datos">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                             </div>
                           ) : (
                             <button 
                               onClick={() => saveAiSuggestion(s)} 
                               className="p-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors"
                               title="Guardar ubicación"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                             </button>
                           )}
                        </div>
                      );
                    })}
                 </div>
               )}
            </div>
            <div>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-slate-900 uppercase">Base de Datos</h3>
                  <input type="text" className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold" placeholder="Buscar..." value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {filteredLocations.slice(0, 40).map((l) => (
                    <div key={l.id || `${l.name}-${l.type}`} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100 group">
                       <div className="truncate">
                          <p className="text-[11px] font-black text-slate-800 uppercase truncate">{l.name}</p>
                          <p className="text-[7px] font-bold text-gray-400 uppercase">{l.type}</p>
                       </div>
                       <button onClick={() => l.id && onDeleteLocation(l.id)} className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg></button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        );
      case 'PACKAGES':
        if (!isAdmin) return null;
        return (
          <div className="bg-gray-50/50 p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 animate-fade-in space-y-8">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight">Gestión de Planes</h2>
                <button onClick={handleAddNewPackage} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-[#091F4F] transition-all">+ Agregar Plan</button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {packages.map(pkg => (
                  <div key={pkg.id} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-100 flex flex-col space-y-6 animate-slide-up group relative">
                     {/* Botón borrar */}
                     <button 
                        onClick={() => setConfirmAction({ message: "¿Eliminar plan?", onConfirm: () => onDeletePackage(pkg.id) })}
                        className="absolute top-6 right-6 text-gray-300 hover:text-red-600 transition-colors"
                     >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round"/></svg>
                     </button>

                     <div className="flex justify-between items-start pt-2">
                        <div className="flex-grow pr-4">
                           <input 
                              className="w-full bg-transparent font-black text-xl text-[#091F4F] outline-none border-b border-transparent focus:border-red-600 transition-all" 
                              value={pkg.name} 
                              onChange={e => onSavePackage({...pkg, name: e.target.value})} 
                              placeholder="Nombre del Plan"
                           />
                        </div>
                        <div className="flex items-baseline shrink-0">
                           <span className="text-[10px] font-black text-gray-400 mr-1">S/</span>
                           <input 
                              type="number" 
                              className="w-16 bg-transparent font-black text-2xl text-red-600 outline-none text-right" 
                              value={pkg.price} 
                              onChange={e => onSavePackage({...pkg, price: Number(e.target.value)})} 
                           />
                        </div>
                     </div>

                     <div className="bg-gray-50 p-6 rounded-2xl">
                        <textarea 
                           className="w-full bg-transparent text-sm font-medium text-slate-600 outline-none resize-none min-h-[60px]" 
                           value={pkg.description} 
                           onChange={e => onSavePackage({...pkg, description: e.target.value})} 
                           placeholder="Escribe la descripción del plan..."
                           rows={2} 
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Inmuebles</p>
                           <input type="number" className="w-full bg-transparent font-black text-sm text-[#091F4F] outline-none" value={pkg.propertyLimit} onChange={e => onSavePackage({...pkg, propertyLimit: Number(e.target.value)})} />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Días</p>
                           <input type="number" className="w-full bg-transparent font-black text-sm text-[#091F4F] outline-none" value={pkg.durationDays} onChange={e => onSavePackage({...pkg, durationDays: Number(e.target.value)})} />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                           <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Destacados</p>
                           <input type="number" className="w-full bg-transparent font-black text-sm text-blue-900 outline-none" value={pkg.featuredLimit || 0} onChange={e => onSavePackage({...pkg, featuredLimit: Number(e.target.value)})} />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                           <p className="text-[8px] font-black text-yellow-600 uppercase tracking-widest mb-1">Súper Destacados</p>
                           <input type="number" className="w-full bg-transparent font-black text-sm text-yellow-900 outline-none" value={pkg.superFeaturedLimit || 0} onChange={e => onSavePackage({...pkg, superFeaturedLimit: Number(e.target.value)})} />
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer group/label">
                           <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${pkg.isActive ? 'bg-[#091F4F] border-[#091F4F]' : 'border-gray-200'}`}>
                              <input 
                                 type="checkbox" 
                                 className="hidden" 
                                 checked={pkg.isActive} 
                                 onChange={e => onSavePackage({...pkg, isActive: e.target.checked})} 
                              />
                              {pkg.isActive && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round"/></svg>}
                           </div>
                           <span className={`text-[11px] font-black uppercase tracking-widest ${pkg.isActive ? 'text-[#091F4F]' : 'text-gray-400'}`}>ACTIVO</span>
                        </label>
                        <span className="text-[9px] font-black text-gray-300 uppercase italic">ID: {pkg.id.slice(0, 8)}</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'PAYMENTS':
        if (!isAdmin) return null;
        return (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 animate-fade-in space-y-12">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight">Recaudo</h2>
                <button onClick={() => onUpdatePaymentMethod({id: crypto.randomUUID(), name: 'Nueva Cuenta', type: 'TRANSFER', isActive: true})} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">+ Nueva Cuenta</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {paymentMethods.map(method => (
                  <div key={method.id} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6 relative group">
                     <button onClick={() => onDeletePaymentMethod(method.id)} className="absolute top-6 right-6 text-gray-300 hover:text-red-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5"/></svg></button>
                     <input className="w-full mt-2 bg-transparent font-black text-xl text-slate-900 outline-none" value={method.name} onChange={e => onUpdatePaymentMethod({...method, name: e.target.value})} />
                     {method.type === 'TRANSFER' ? (
                       <div className="space-y-3">
                          <input className="w-full p-3 bg-white rounded-xl font-bold text-sm" placeholder="Banco" value={method.bankName} onChange={e => onUpdatePaymentMethod({...method, bankName: e.target.value})} />
                          <input className="w-full p-3 bg-white rounded-xl font-bold text-sm" placeholder="N° de Cuenta" value={method.accountNumber} onChange={e => onUpdatePaymentMethod({...method, accountNumber: e.target.value})} />
                       </div>
                     ) : (
                       <input className="w-full p-3 bg-white rounded-xl font-bold text-sm" placeholder="URL QR" value={method.qrUrl} onChange={e => onUpdatePaymentMethod({...method, qrUrl: e.target.value})} />
                     )}
                  </div>
                ))}
             </div>
          </div>
        );
      case 'COMPLAINTS':
        if (!isAdmin) return null;
        return (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 animate-fade-in">
             <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight mb-10">Reclamaciones</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   <tr>
                     <th className="pb-4 px-4">Reclamante</th>
                     <th className="pb-4 px-4">Tipo</th>
                     <th className="pb-4 px-4">Estado</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {complaints.map(c => (
                     <tr key={c.id}>
                       <td className="py-6 px-4">
                          <p className="font-black text-sm text-slate-900">{c.claimantName} {c.claimantPaternal}</p>
                       </td>
                       <td className="py-6 px-4">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${c.type === 'RECLAMO' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{c.type}</span>
                       </td>
                       <td className="py-6 px-4">
                          <button onClick={async () => {
                            if(c.status === 'PENDIENTE') {
                              await supabase.from('complaints').update({status: 'ATENDIDO'}).eq('id', c.id);
                              showToast("Marcado como atendido", "SUCCESS");
                              window.location.reload();
                            }
                          }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${c.status === 'PENDIENTE' ? 'bg-red-600 text-white' : 'bg-green-50 text-green-600'}`}>
                            {c.status}
                          </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );
      case 'POLICIES':
        if (!isAdmin) return null;
        return (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 animate-fade-in space-y-12">
             <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight mb-4">Legales</h2>
             {['TERMS_USE', 'PRIVACY', 'TERMS_CONTRACT', 'PROPERTY_POLICIES'].map((type) => {
                const doc = legalDocs.find(d => d.type === type) || { type: type as any, title: type, content: '', id: crypto.randomUUID() };
                return (
                  <div key={type} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6">
                     <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-900 uppercase">{type}</h3>
                        <button onClick={() => onSaveLegalDoc(doc)} className="bg-[#091F4F] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest">Publicar</button>
                     </div>
                     <textarea className="w-full bg-white p-6 rounded-2xl font-medium text-sm text-slate-600 min-h-[200px] shadow-inner" value={doc.content} onChange={e => onSaveLegalDoc({...doc, content: e.target.value})} />
                  </div>
                );
             })}
          </div>
        );
      case 'PROFILE':
        return (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 animate-fade-in max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight mb-8">Editar Perfil</h2>
            <div className="flex flex-col items-center mb-10">
               <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <img src={profileData.avatar || `https://ui-avatars.com/api/?name=${user.name}`} className="w-32 h-32 rounded-3xl border-4 border-white shadow-2xl object-cover" />
                  <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2"/><circle cx="12" cy="13" r="3" strokeWidth="2"/></svg>
                  </div>
                  {isUpdatingProfile && <div className="absolute inset-0 bg-white/60 rounded-3xl flex items-center justify-center"><div className="w-6 h-6 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>}
               </div>
               <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'AVATAR')} />
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                  <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">WhatsApp (Ej: 51999888777)</label>
                  <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={profileData.whatsapp} onChange={e => setProfileData({...profileData, whatsapp: e.target.value})} placeholder="Código de país + número" />
               </div>
               <button disabled={isUpdatingProfile} className="w-full bg-[#091F4F] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-red-600 transition-all uppercase text-[11px] tracking-widest">
                 {isUpdatingProfile ? 'Guardando...' : 'Actualizar Datos'}
               </button>
            </form>
          </div>
        );
      case 'MY_PAYMENTS':
        const myTransactions = transactions.filter(t => t.userId === user.id);
        return (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 animate-fade-in">
            <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight mb-10">Historial de Pagos</h2>
            {myTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 font-medium text-sm">No tienes pagos registrados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="pb-4 px-4">Fecha</th>
                      <th className="pb-4 px-4">Plan</th>
                      <th className="pb-4 px-4">Monto</th>
                      <th className="pb-4 px-4">Método</th>
                      <th className="pb-4 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myTransactions.map(t => (
                      <tr key={t.id} className="group">
                        <td className="py-6 px-4">
                          <p className="font-black text-sm text-slate-900">{new Date(t.date).toLocaleDateString()}</p>
                        </td>
                        <td className="py-6 px-4">
                          <p className="font-black text-sm text-[#091F4F] uppercase">{t.packageName}</p>
                        </td>
                        <td className="py-6 px-4">
                          <p className="font-black text-red-600 text-sm">S/ {t.amount.toLocaleString()}</p>
                        </td>
                        <td className="py-6 px-4">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.paymentMethodName}</p>
                        </td>
                        <td className="py-6 px-4">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            t.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {t.status === 'COMPLETED' ? 'Aprobado' : t.status === 'CANCELLED' ? 'Rechazado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'INQUIRIES':
        return (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 animate-fade-in">
            <h2 className="text-2xl font-black text-[#091F4F] uppercase tracking-tight mb-10">Interesados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="pb-4 px-4">Interesado</th>
                    <th className="pb-4 px-4">Inmueble</th>
                    <th className="pb-4 px-4">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inquiries.map((inq, idx) => (
                    <tr key={idx}>
                      <td className="py-6 px-4">
                        <p className="font-black text-sm text-slate-900">{inq.senderName}</p>
                        <p className="text-[10px] text-green-600 font-black">{inq.senderPhone}</p>
                      </td>
                      <td className="py-6 px-4">
                        <p className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[200px]">{inq.propertyTitle}</p>
                      </td>
                      <td className="py-6 px-4">
                         <p className="text-[10px] font-black text-gray-400 uppercase">{new Date(inq.date).toLocaleDateString()}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8 animate-fade-in pb-20">
      <div className="container mx-auto px-4">
        <div className={`rounded-[2.5rem] p-8 text-white mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-white ${isAdmin ? 'bg-[#091F4F]' : 'bg-red-600'}`}>
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} className="w-20 h-20 rounded-2xl border-4 border-white/20 shadow-xl object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">{user.name}</h1>
              <p className="opacity-60 text-[9px] font-bold uppercase tracking-[0.2em]">{isAdmin ? 'ADMINISTRADOR MASTER' : 'PERFIL DE ASESOR'}</p>
            </div>
          </div>
          <button onClick={handleAddPropertyClick} className="bg-white text-[#091F4F] font-black py-4 px-8 rounded-2xl shadow-xl uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95">
            + Publicar Inmueble
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex flex-col space-y-1.5 shrink-0">
            <button onClick={() => setActiveTab('OVERVIEW')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'OVERVIEW' ? 'bg-[#091F4F] text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>Resumen</button>
            <button onClick={() => setActiveTab('PROPERTIES')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'PROPERTIES' ? 'bg-[#091F4F] text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>Inmuebles</button>
            <button onClick={() => setActiveTab('INQUIRIES')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'INQUIRIES' ? 'bg-[#091F4F] text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>Interesados</button>
            <button onClick={() => setActiveTab('MY_PAYMENTS')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'MY_PAYMENTS' ? 'bg-[#091F4F] text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>Pagos</button>
            
            {isAdmin && (
              <>
                <div className="pt-4 border-t mt-4 mb-2 px-6"><span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Gestión</span></div>
                <button onClick={() => setActiveTab('TRANSACTIONS')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'TRANSACTIONS' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-red-50'}`}>Ventas</button>
                <button onClick={() => setActiveTab('PACKAGES')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'PACKAGES' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-red-50'}`}>Planes</button>
                <button onClick={() => setActiveTab('PAYMENTS')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'PAYMENTS' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-red-50'}`}>Recaudo</button>
                <button onClick={() => setActiveTab('LOCATIONS')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'LOCATIONS' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-red-50'}`}>Ubicaciones</button>
                <button onClick={() => setActiveTab('COMPLAINTS')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'COMPLAINTS' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-red-50'}`}>Reclamos</button>
                <button onClick={() => setActiveTab('POLICIES')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'POLICIES' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-red-50'}`}>Legales</button>
                <button onClick={() => setActiveTab('SETTINGS')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'SETTINGS' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>Marca</button>
              </>
            )}
            <button onClick={() => setActiveTab('PROFILE')} className={`flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'PROFILE' ? 'bg-gray-200 text-gray-900 shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>Mi Perfil</button>
            <button onClick={onLogout} className="flex items-center gap-4 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-red-600 mt-8 hover:bg-red-50 transition-colors">Cerrar Sesión</button>
          </div>

          <div className="flex-grow min-w-0">
            {renderActiveTabContent()}
          </div>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-scale-up">
            <h3 className="text-xl font-black text-slate-900 mb-4">{confirmAction.message}</h3>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
