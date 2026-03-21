
import React, { useState, useEffect, useRef } from 'react';
import { Maximize, Building2, Bath, BedDouble, CalendarDays, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Property, User, Inquiry } from '../types';
import { ToastType } from './Toast';

declare const L: any;

const PhotoViewer = ({ images, initialIndex, onClose }: { images: string[], initialIndex: number, onClose: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  const paginate = (newDirection: number) => {
    const nextIndex = currentIndex + newDirection;
    if (nextIndex >= 0 && nextIndex < images.length) {
      setDirection(newDirection);
      setCurrentIndex(nextIndex);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? 45 : -45,
      x: direction > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.9,
      transformOrigin: direction > 0 ? "right center" : "left center"
    }),
    center: {
      zIndex: 1,
      rotateY: 0,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      rotateY: direction < 0 ? 45 : -45,
      x: direction < 0 ? 200 : -200,
      opacity: 0,
      scale: 0.9,
      transformOrigin: direction < 0 ? "right center" : "left center",
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/98 flex flex-col items-center justify-start pt-32 pb-12 px-6 md:px-12 backdrop-blur-3xl animate-fade-in overflow-y-auto">
      <button 
        onClick={onClose}
        className="fixed top-24 right-6 md:top-28 md:right-12 text-white bg-red-600 hover:bg-red-700 p-2 rounded-full transition-all z-[10000] hover:rotate-90 duration-300 shadow-2xl border-2 border-white/20"
      >
        <X className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
      </button>

      <div className="relative w-full max-w-5xl min-h-[60vh] flex items-center justify-center perspective-1000">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full flex items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            <img
              src={images[currentIndex]}
              className="max-w-full max-h-[70vh] object-contain shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] rounded-2xl border border-white/10"
              alt={`Imagen ${currentIndex + 1}`}
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 flex justify-between px-2 md:px-0 z-20 pointer-events-none">
          <button 
            disabled={currentIndex === 0}
            onClick={() => paginate(-1)}
            className={`pointer-events-auto w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl transition-all active:scale-90 border border-white/20 disabled:opacity-0 disabled:pointer-events-none -translate-x-2 md:-translate-x-10 shadow-2xl`}
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" strokeWidth={3} />
          </button>

          <button 
            disabled={currentIndex === images.length - 1}
            onClick={() => paginate(1)}
            className={`pointer-events-auto w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl transition-all active:scale-90 border border-white/20 disabled:opacity-0 disabled:pointer-events-none translate-x-2 md:translate-x-10 shadow-2xl`}
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" strokeWidth={3} />
          </button>
        </div>
      </div>
      
      <div className="mt-12 flex flex-col items-center gap-2 pb-8">
        <div className="px-6 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 shadow-xl">
          <span className="text-white text-xs font-black uppercase tracking-[0.5em]">
            {currentIndex + 1} <span className="text-white/30 mx-2">/</span> {images.length}
          </span>
        </div>
      </div>
    </div>
  );
};

const ContactFormModal = ({ property, agentName, agentAvatar, onClose, onSend, showToast }: { property: Property, agentName: string, agentAvatar?: string, onClose: () => void, onSend: (data: Partial<Inquiry>) => Promise<void>, showToast: (message: string, type: ToastType) => void }) => {
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dni: '',
    email: '',
    phone: '',
    message: `Hola, estoy interesado en el inmueble "${property.title}" y me gustaría recibir más información. Gracias.`
  });

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, maxLength);
    setFormData({ ...formData, [field]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.dni && formData.dni.length < 8) return showToast("El DNI debe tener 8 dígitos.", "WARNING");
    if (formData.phone.length < 9) return showToast("El celular debe tener 9 dígitos.", "WARNING");
    
    setIsSending(true);
    try {
      await onSend({
        propertyId: property.id,
        propertyTitle: property.title,
        agentId: property.agentId,
        senderName: formData.name,
        senderEmail: formData.email,
        senderPhone: formData.phone,
        senderDni: formData.dni,
        message: formData.message,
        date: new Date().toISOString(),
        isRead: false
      });
      setIsSuccess(true);
      showToast("Mensaje enviado con éxito", "SUCCESS");
    } catch (err) {
      showToast("Hubo un error al enviar tu mensaje. Por favor intenta de nuevo.", "ERROR");
    } finally {
      setIsSending(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center animate-bounce-in">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight mb-2">¡Mensaje Enviado!</h2>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-8 leading-relaxed">
            El agente se pondrá en contacto contigo pronto.
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-[#0a0f1d] text-white font-black py-4 rounded-xl shadow-lg hover:bg-red-600 transition-all text-[11px] uppercase tracking-[0.2em] active:scale-95"
          >
            ENTENDIDO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up relative">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-300 hover:text-gray-900 transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner overflow-hidden border-2 border-white">
              {agentAvatar ? (
                <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              )}
            </div>
            <h2 className="text-lg font-black text-[#0f172a] uppercase tracking-tight leading-none">CONTACTARTE CON</h2>
            <p className="text-red-600 text-base font-black uppercase tracking-tight mt-1">{agentName || 'AGENTE MICASAPERÚ'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Tu Nombre</label>
              <input 
                required 
                type="text" 
                className="w-full p-3.5 bg-[#f8f9fa] border-none rounded-2xl font-bold text-gray-800 text-sm outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-300" 
                placeholder="Nombre completo"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">DNI (Opcional)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  className="w-full p-3.5 bg-[#f8f9fa] border-none rounded-2xl font-bold text-gray-800 text-sm outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-300" 
                  placeholder="88888888"
                  value={formData.dni}
                  onChange={e => handleNumericInput(e, 'dni', 8)}
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">WhatsApp (9 dgt)</label>
                <input 
                  required 
                  type="text"
                  inputMode="numeric"
                  className="w-full p-3.5 bg-[#f8f9fa] border-none rounded-2xl font-bold text-gray-800 text-sm outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-300" 
                  placeholder="888888888"
                  value={formData.phone}
                  onChange={e => handleNumericInput(e, 'phone', 9)}
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Correo Electrónico</label>
              <input 
                required 
                type="email" 
                className="w-full p-3.5 bg-[#f8f9fa] border-none rounded-2xl font-bold text-gray-800 text-sm outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-300" 
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Tu Mensaje</label>
              <textarea 
                required 
                rows={3} 
                className="w-full p-4 bg-[#f8f9fa] border-none rounded-2xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-500 resize-none text-[13px] custom-scrollbar" 
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              />
            </div>

            <button 
              disabled={isSending}
              className="w-full bg-[#0a0f1d] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-red-600 transition-all text-[11px] uppercase tracking-[0.2em] mt-2 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ENVIANDO...</span>
                </>
              ) : (
                <span>ENVIAR SOLICITUD</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Interface for PropertyDetails component props
interface PropertyDetailsProps {
  property: Property;
  agent?: User;
  onBack: () => void;
  onSendMessage: (data: Partial<Inquiry>) => Promise<void>;
  showToast: (message: string, type: ToastType) => void;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, agent, onBack, onSendMessage, showToast }) => {
  const [activeImage, setActiveImage] = useState(property.featuredImage);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const allImages = [property.featuredImage, ...(property.gallery || [])].filter(Boolean);

  useEffect(() => {
    if (!mapContainerRef.current || !property.lat || !property.lng) return;
    
    let isCancelled = false;
    let retryTimeout: number;

    const initMap = () => {
      if (typeof L === 'undefined') {
        if (!isCancelled) retryTimeout = window.setTimeout(initMap, 200);
        return;
      }
      if (mapInstanceRef.current) return;

      try {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false,
          scrollWheelZoom: false,
          zoomSnap: 1
        }).setView([property.lat, property.lng], 17);

        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es-419').addTo(mapInstanceRef.current);

        const customPin = L.divIcon({
          className: 'location-picker-icon',
          html: `<div class="relative flex items-center justify-center"><div class="absolute -top-8 flex flex-col items-center"><div class="bg-red-600 text-white p-2 rounded-full shadow-2xl border-2 border-white animate-bounce"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg></div></div></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 0]
        });

        L.marker([property.lat, property.lng], { icon: customPin }).addTo(mapInstanceRef.current);
        
        setTimeout(() => mapInstanceRef.current && mapInstanceRef.current.invalidateSize(), 500);
      } catch (err) {
        console.warn("Map init error in details:", err);
      }
    };

    initMap();
    return () => { 
      isCancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [property]);

  const handleWhatsappClick = () => {
    const whatsappNumber = agent?.whatsapp || property.agentWhatsapp;
    if (!whatsappNumber) {
      showToast("Este agente no ha configurado su número de WhatsApp.", "WARNING");
      return;
    }
    // Remove non-numeric characters
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const currentUrl = window.location.href;
    const message = encodeURIComponent(`Hola, estoy interesado en el inmueble "${property.title}" que vi en Micasaperu.com. Link: ${currentUrl}`);
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-white min-h-screen animate-fade-in pb-20">
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          <button onClick={onBack} className="text-red-600 font-black uppercase text-[9px] tracking-widest hover:translate-x-[-4px] transition-all flex items-center bg-red-50 px-3 py-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Volver
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <div 
                onClick={() => {
                  const idx = allImages.indexOf(activeImage);
                  setViewerInitialIndex(idx >= 0 ? idx : 0);
                  setShowPhotoViewer(true);
                }}
                className="rounded-[2rem] overflow-hidden aspect-video shadow-xl bg-gray-200 border-2 border-white relative group cursor-zoom-in"
              >
                <img src={activeImage} alt={property.title} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Maximize className="text-white opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 w-12 h-12" strokeWidth={1.5} />
                </div>
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                   <div className="flex space-x-2">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">{property.status === 'FOR_SALE' ? 'Venta' : property.status === 'FOR_RENT' ? 'Alquiler' : property.status === 'TEMPORAL' ? 'Temporal' : property.status === 'TRASPASO' ? 'Traspaso' : property.status}</span>
                      {property.planType === 'SUPER_FEATURED' && <span className="bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl flex items-center"><svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> Super Destacado</span>}
                      {(property.planType === 'FEATURED' || (property.isFeatured && property.planType !== 'SUPER_FEATURED')) && <span className="bg-blue-900 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl flex items-center"><svg className="w-3 h-3 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> Destacado</span>}
                   </div>
                   {property.status === 'PROJECT' && (
                     <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl w-fit">
                       Entrega {property.deliveryMonth || 'Enero'} {property.deliveryYear || 2025}
                     </span>
                   )}
                </div>
              </div>

              {allImages.length > 1 && (
                <div className="flex items-start gap-2 overflow-x-auto py-1 custom-scrollbar">
                  {allImages.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        setActiveImage(img);
                        setViewerInitialIndex(idx);
                        setShowPhotoViewer(true);
                      }} 
                      className={`shrink-0 w-20 h-14 md:w-28 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${activeImage === img ? 'border-red-600 scale-105 shadow-lg' : 'border-white opacity-70 hover:opacity-100'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt="Galeria" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white py-5 space-y-8">
              {/* Type and Bedrooms */}
              <div>
                <p className="text-sm text-gray-500 font-medium mb-2">
                  {property.type} · {property.bedrooms} dormitorios
                </p>

                {/* Price */}
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-1">
                  {property.status === 'FOR_RENT' ? 'Alquiler' : property.status === 'FOR_SALE' ? 'Venta' : property.status} S/ {property.pricePEN.toLocaleString()} · USD {property.priceUSD.toLocaleString()}
                </h1>
                {property.maintenanceFee ? (
                  <p className="text-sm text-slate-500 font-medium mb-4">S/ {property.maintenanceFee} Mantenimiento</p>
                ) : <div className="mb-4"></div>}

                {/* Location */}
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {property.address}, {property.district}, {property.department}
                </p>

                {/* Map */}
                <div className="h-[250px] rounded-2xl overflow-hidden border-2 border-slate-50 shadow-inner relative z-10 mb-8">
                  <div ref={mapContainerRef} className="w-full h-full" />
                </div>

                {/* Features Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-y border-gray-100 mb-8">
                  <div className="flex flex-col items-center text-center">
                    <Maximize className="w-6 h-6 text-gray-600 mb-2" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-slate-900">{property.constructionArea || 0} m²</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">tot.</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <Building2 className="w-6 h-6 text-gray-600 mb-2" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-slate-900">{property.builtArea || 0} m²</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">cub.</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <Bath className="w-6 h-6 text-gray-600 mb-2" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-slate-900">{property.bathrooms}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">baños</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <BedDouble className="w-6 h-6 text-gray-600 mb-2" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-slate-900">{property.bedrooms}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">dorm.</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <CalendarDays className="w-6 h-6 text-gray-600 mb-2" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-slate-900">{property.yearBuilt === 0 ? 'Estreno' : `${property.yearBuilt || 0} años`}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">antigüedad</span>
                  </div>
                </div>

                {/* Title and Subtitle */}
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-2">{property.title}</h2>
                  <p className="text-sm text-slate-600 font-medium mb-6">{property.address}</p>
                  <div className={`relative ${!isDescriptionExpanded ? 'max-h-24 overflow-hidden' : ''}`}>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
                    {!isDescriptionExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
                    )}
                  </div>
                  <button 
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-4 hover:text-red-600 transition-colors"
                  >
                    {isDescriptionExpanded ? 'Ocultar descripción' : 'Leer descripción completa'}
                    <svg className={`w-4 h-4 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              </div>

              {/* FICHA TÉCNICA EXPANDIDA */}
              <div className="pt-6 border-t border-gray-50">
                <h2 className="text-lg font-black text-slate-900 mb-5 uppercase tracking-tight border-l-4 border-red-600 pl-3">Especificaciones Técnicas</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                    <p className="text-xl font-black text-slate-900 leading-none mb-1">{property.bedrooms}</p>
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Habitaciones</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                    <p className="text-xl font-black text-slate-900 leading-none mb-1">{property.bathrooms}</p>
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Baños</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                    <p className="text-xl font-black text-slate-900 leading-none mb-1">{property.parking || 0}</p>
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Cocheras {property.parkingCovered ? '(Techadas)' : ''}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                    <p className="text-xl font-black text-slate-900 leading-none mb-1">{property.floors || 1}</p>
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Pisos</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                    <p className="text-lg font-black text-slate-900 leading-none mb-1">{property.yearBuilt === 0 ? 'Estreno' : `${property.yearBuilt || 0} años`}</p>
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Antigüedad</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                    <p className="text-lg font-black text-slate-900 leading-none mb-1">{property.builtArea || 0} m²</p>
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Área Construida</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                    <p className="text-lg font-black text-slate-900 leading-none mb-1">{property.constructionArea || 0} m²</p>
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Área Total/Terreno</p>
                  </div>
                  {property.status === 'PROJECT' && (
                    <div className="p-3 bg-orange-50 rounded-2xl text-center border border-orange-100">
                      <p className="text-lg font-black text-orange-900 leading-none mb-1">{property.deliveryMonth || 'Ene'} {property.deliveryYear || 2025}</p>
                      <p className="text-[7.5px] font-black text-orange-400 uppercase tracking-widest">Entrega Estimada</p>
                    </div>
                  )}
                </div>
              </div>

              {property.features && property.features.length > 0 && (
                <div className="pt-6 border-t border-gray-50">
                   <h2 className="text-lg font-black text-slate-900 mb-5 uppercase tracking-tight border-l-4 border-red-600 pl-3">Características y Amenidades</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                      {property.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 group">
                           <div className="w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0 border border-green-100 group-hover:bg-green-600 group-hover:text-white transition-all">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                           </div>
                           <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{feature}</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {property.documents && property.documents.length > 0 && (
                <div className="pt-6 border-t border-gray-50 mt-6">
                   <h2 className="text-lg font-black text-slate-900 mb-5 uppercase tracking-tight border-l-4 border-red-600 pl-3">Documentos / Planos</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {property.documents.map((doc, idx) => (
                        <a 
                          key={idx} 
                          href={doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-red-600 hover:bg-white transition-all group"
                        >
                           <div className="w-12 h-12 bg-white text-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover:bg-red-600 group-hover:text-white transition-all overflow-hidden">
                              {doc.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                <img src={doc} className="w-full h-full object-cover" alt="Preview" />
                              ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                              )}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Documento {idx + 1}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Click para abrir archivo</span>
                           </div>
                        </a>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-28">
              <div className="bg-white p-6 rounded-[1rem] shadow-md border border-gray-200 mb-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">Contacta al anunciante</h3>
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setShowContactForm(true); }}>
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:border-red-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="Nombre" 
                      className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:border-red-500"
                    />
                    <input 
                      type="text" 
                      placeholder="Teléfono" 
                      className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:border-red-500"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="DNI" 
                    className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:border-red-500"
                  />
                  <textarea 
                    placeholder="Mensaje" 
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md text-sm outline-none focus:border-red-500 resize-none"
                    defaultValue={`¡Hola! Quiero que se comuniquen conmigo por este inmueble en alquiler que vi en Micasaperu.`}
                  />
                  <div className="space-y-2 pt-2">
                    <label className="flex items-start gap-2 text-[10px] text-gray-600">
                      <input type="checkbox" className="mt-0.5" defaultChecked />
                      <span>Acepto los Términos y Condiciones de Uso, y las políticas de privacidad.</span>
                    </label>
                    <label className="flex items-start gap-2 text-[10px] text-gray-600">
                      <input type="checkbox" className="mt-0.5" defaultChecked />
                      <span>Autorizo el uso de mi información para fines adicionales</span>
                    </label>
                  </div>
                  <div className="pt-2 space-y-2">
                    <button 
                      type="submit"
                      className="w-full bg-[#ff5a1f] text-white font-bold py-3 rounded-md hover:bg-[#e04a15] transition-colors text-sm flex justify-center items-center gap-2"
                    >
                      Contactar
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </button>
                    <button 
                      type="button"
                      onClick={handleWhatsappClick}
                      className="w-full bg-[#25D366] text-white font-bold py-3 rounded-md hover:bg-[#20b858] transition-colors text-sm flex justify-center items-center gap-2"
                    >
                      Contactar por WhatsApp
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white p-4 rounded-[1rem] shadow-md border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                    <img 
                      src={agent?.avatar || property.agentAvatar || `https://ui-avatars.com/api/?name=${agent?.name || property.agentName || 'Asesor'}&background=0f172a&color=fff`} 
                      alt={agent?.name || property.agentName} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{agent?.name || property.agentName || 'Agente Micasaperú'}</p>
                    <p className="text-xs text-gray-500">{agent?.phone || property.agentWhatsapp || 'Contactar para info'}</p>
                  </div>
                </div>
                <button 
                  onClick={handleWhatsappClick}
                  className="text-sm font-bold text-slate-900 flex items-center gap-1 hover:text-red-600 transition-colors"
                >
                  Ver teléfono
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showContactForm && (
        <ContactFormModal 
          property={property}
          agentName={agent?.name || property.agentName || 'AGENTE MICASAPERÚ'} 
          agentAvatar={agent?.avatar || property.agentAvatar || `https://ui-avatars.com/api/?name=${agent?.name || property.agentName || 'Asesor'}&background=0f172a&color=fff`}
          onClose={() => setShowContactForm(false)} 
          onSend={onSendMessage}
          showToast={showToast}
        />
      )}

      {showPhotoViewer && (
        <PhotoViewer 
          images={allImages}
          initialIndex={viewerInitialIndex}
          onClose={() => setShowPhotoViewer(false)}
        />
      )}
    </div>
  );
};

export default PropertyDetails;
