import React, { useState, useEffect } from 'react';
import { Package, User, PaymentMethod, CartItem } from '../types';
import { ToastType } from './Toast';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

interface PaymentFlowProps {
  pkg?: Package;
  cartItems?: CartItem[];
  user: User;
  paymentMethods: PaymentMethod[];
  mpAccessToken?: string;
  mpPublicKey?: string;
  onSuccess: (methodId: string, opNumber?: string) => void;
  onCancel: () => void;
  onRecordTransaction: (methodName: string, operationNumber?: string, securityCode?: string) => Promise<void>;
  onUpdateProfile?: (data: Partial<User>) => Promise<void>;
  showToast: (message: string, type: ToastType) => void;
}

const PaymentFlow: React.FC<PaymentFlowProps> = ({ pkg, cartItems, user, paymentMethods, mpAccessToken, mpPublicKey, onSuccess, onCancel, onRecordTransaction, onUpdateProfile, showToast }) => {
  const [step, setStep] = useState<'METHOD' | 'DETAILS' | 'SUCCESS'>('METHOD');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationNumber, setOperationNumber] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [dni, setDni] = useState(user.dni || '');
  const [saveDni, setSaveDni] = useState(true);
  const [showRetry, setShowRetry] = useState(false);

  const isCart = !!cartItems && cartItems.length > 0;
  const totalAmount = isCart 
    ? cartItems!.reduce((acc, item) => acc + (item.package.price * item.quantity), 0)
    : (pkg?.price || 0);
  
  const description = isCart 
    ? `Compra de ${cartItems!.length} planes` 
    : `Suscripción: ${pkg?.name}`;



  const handleProcessMP = async () => {
    if (!mpAccessToken) {
       showToast("Las credenciales de Mercado Pago no están configuradas correctamente.", "ERROR");
       return;
    }
    
    if (dni.length < 8) {
       showToast("Por favor, ingresa tu DNI o RUC para habilitar el pago.", "WARNING");
       return;
    }

    try {
      setIsProcessing(true);
      
      // Si el usuario pidió guardar el DNI, lo enviamos al perfil (Sin bloquear el pago)
      if (saveDni && dni !== user.dni && onUpdateProfile) {
        onUpdateProfile({ dni }).catch(err => console.error("Supabase Profile Sync failed (ignoring for payment):", err));
      }

      const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: (cartItems || (pkg ? [{ package: pkg, quantity: 1 }] : [])).map(item => ({
            title: item.package.name,
            quantity: item.quantity,
            currency_id: 'PEN',
            unit_price: Number(item.package.price.toFixed(2))
          })),
          payer: {
            email: user.email,
            first_name: user.name.split(' ')[0] || 'Cliente',
            last_name: user.name.split(' ').slice(1).join(' ') || 'MiCasaPeru',
            identification: {
              type: dni.length === 11 ? 'RUC' : 'DNI',
              number: dni
            }
          },
          back_urls: {
            success: window.location.origin + window.location.pathname,
            failure: window.location.origin + window.location.pathname,
            pending: window.location.origin + window.location.pathname
          },
          statement_descriptor: 'MICASAPERU'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Mercado Pago API Error:", data);
        throw new Error(data.message || "Error de Mercado Pago API");
      }
      if (data.id) {
        setPreferenceId(data.id);
        // El SDK se encargará de renderizar el botón oficial usando este ID
      } else {
        throw new Error(data.message || "Error al crear preferencia con Mercado Pago");
      }
    } catch(err: any) {
      showToast(err.message || "Error al conectar con Mercado Pago", "ERROR");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (mpPublicKey) {
      initMercadoPago(mpPublicKey, { locale: 'es-PE' });
    }
  }, [mpPublicKey]);

  useEffect(() => {
    if (step === 'DETAILS' && selectedMethod?.type === 'MERCADOPAGO' && !preferenceId && !isProcessing) {
      handleProcessMP();
    }
  }, [step, selectedMethod, preferenceId, isProcessing]);



  const handleProcessPayment = async () => {
    if (!selectedMethod) return;

    if (!operationNumber.trim() && !securityCode.trim()) {
      showToast("Por favor, ingresa al menos el número de operación o código de seguridad.", "WARNING");
      return;
    }

    setIsProcessing(true);
    try {
      // Registramos la transacción en la DB
      await onRecordTransaction(selectedMethod.name, operationNumber, securityCode);
      // Pequeña pausa para feedback visual y pasamos al éxito
      setTimeout(() => {
        setIsProcessing(false);
        setStep('SUCCESS');
      }, 800);
    } catch (err) {
      console.error("Payment registration failed:", err);
      setIsProcessing(false);
      showToast("Error al procesar la solicitud. Por favor intenta de nuevo.", "ERROR");
    }
  };

  if (step === 'SUCCESS') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 md:p-16 max-w-xl w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight uppercase">¡Solicitud Enviada!</h1>
          <p className="text-gray-500 text-base font-medium mb-10 leading-relaxed">
            Hemos recibido tu comprobante de <span className="text-red-600 font-black">{selectedMethod?.name}</span>. <br/>
            Validaremos tu pago en breve para activar {isCart ? 'tus planes' : <span className="font-bold text-slate-900">{pkg?.name}</span>}.
          </p>
          <button 
            onClick={onSuccess} 
            className="w-full bg-[#0f172a] text-white font-black py-5 rounded-2xl transition-all shadow-xl hover:bg-red-600 active:scale-95 uppercase text-xs tracking-widest"
          >
            Ir a mi Panel de Control
          </button>
        </div>
      </div>
    );
  }

  const activeMethods = paymentMethods.filter(m => m.isActive);

  return (
    <div className="min-h-[90vh] py-12 bg-gray-50/30 animate-fade-in">
      <div className="container mx-auto max-w-5xl px-4">
        
        {/* Header con estilo de la captura */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={step === 'DETAILS' ? () => setStep('METHOD') : onCancel} 
            className="bg-white p-3 rounded-2xl shadow-sm text-gray-400 hover:text-red-600 transition-all active:scale-90"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-[#0f172a] tracking-tighter uppercase leading-none">Finalizar Compra</h1>
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Paso {step === 'METHOD' ? '1' : '2'} de 2</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Detalles del Pago */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100 min-h-[450px] flex flex-col">
              
              {step === 'METHOD' ? (
                <div className="animate-fade-in flex flex-col h-full">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-8">Selecciona tu método de pago</h2>
                  <div className="space-y-4 flex-grow">
                    {activeMethods.length > 0 ? activeMethods.map(m => (
                      <div 
                        key={m.id}
                        onClick={() => { setSelectedMethod(m); setStep('DETAILS'); }}
                        className="bg-gray-50 p-6 rounded-3xl border-2 border-transparent hover:border-red-500 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#0f172a] group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                            {m.type === 'TRANSFER' ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            ) : m.type === 'CARD' ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            ) : m.type === 'MERCADOPAGO' ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01" /></svg>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase">{m.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{m.type === 'TRANSFER' ? 'Transferencia Bancaria' : m.type === 'CARD' ? 'Tarjeta de Crédito/Débito' : m.type === 'MERCADOPAGO' ? 'Mercado Pago' : 'Escaneo de Código QR'}</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-red-600 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </div>
                    )) : (
                      <p className="text-center text-gray-400 font-bold text-xs uppercase py-20">No hay métodos disponibles.</p>
                    )}
                  </div>
                </div>
              ) : selectedMethod && (
                <div className="animate-fade-in flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">{selectedMethod.name}</h2>
                     <button onClick={() => setStep('METHOD')} className="text-[10px] font-black text-red-600 uppercase border-b-2 border-red-500/20 hover:border-red-500 transition-all">Cambiar Método</button>
                  </div>

                  <div className="flex-grow flex flex-col items-center justify-center">
                    {selectedMethod.type === 'TRANSFER' ? (
                      <div className="w-full space-y-4">
                         <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                               <span className="font-black text-gray-400 uppercase">Banco</span>
                               <span className="font-black text-slate-900 uppercase">{selectedMethod.bankName || 'BCP'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                               <span className="font-black text-gray-400 uppercase">N° de Cuenta</span>
                               <span className="font-black text-slate-900">{selectedMethod.accountNumber}</span>
                            </div>
                            {selectedMethod.cci && (
                              <div className="flex justify-between items-center text-xs">
                                 <span className="font-black text-gray-400 uppercase">CCI</span>
                                 <span className="font-black text-slate-900">{selectedMethod.cci}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200">
                               <span className="font-black text-gray-400 uppercase">Titular</span>
                               <span className="font-black text-slate-900 uppercase">MICASAPERU INMOBILIARIA</span>
                            </div>
                         </div>
                         {selectedMethod.instructions && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-4">
                              {selectedMethod.instructions}
                            </p>
                          )}
                      </div>
                    ) : selectedMethod.type === 'MERCADOPAGO' ? (
                      <div className="flex flex-col items-center text-center w-full">
                         <div className="w-24 h-24 bg-blue-50 text-[#009EE3] rounded-full flex items-center justify-center mb-6 relative shadow-inner">
                           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         </div>
                         
                         {!preferenceId || isProcessing ? (
                           <div className="w-full max-w-md space-y-5 mb-8 animate-fade-in">
                              <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                                 <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Datos de Facturación
                                 </h4>
                                 <div className="space-y-4">
                                    <div>
                                       <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 text-left">N° de Documento (DNI/RUC)</label>
                                       <input 
                                         type="text" 
                                         className="w-full p-4 bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl font-black text-slate-900 outline-none transition-all placeholder:text-gray-200" 
                                         value={dni} 
                                         onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 11))} 
                                         placeholder="Ej: 12345678" 
                                       />
                                    </div>
                                    <div className="flex items-center gap-3 ml-1 cursor-pointer group" onClick={() => setSaveDni(!saveDni)}>
                                       <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${saveDni ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100' : 'bg-white border-gray-200 group-hover:border-blue-400'}`}>
                                          {saveDni && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>}
                                       </div>
                                       <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight group-hover:text-blue-600 transition-colors">Recordar mis datos para futuras compras</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <button 
                                onClick={handleProcessMP} 
                                disabled={isProcessing || dni.length < 8} 
                                className="w-full bg-[#009EE3] text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#0089c7] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                              >
                                {isProcessing ? 'Validando Datos...' : 'Generar Botón de Pago'}
                                {!isProcessing && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>}
                              </button>
                           </div>
                         ) : (
                           <div className="w-full max-w-sm animate-fade-in flex flex-col items-center">
                              <div className="min-h-[60px] w-full">
                                <Wallet 
                                  initialization={{ preferenceId: preferenceId, redirectMode: 'self' }} 
                                  onReady={() => console.log("Mercado Pago Wallet Brick is ready")}
                                  onError={(error) => {
                                    console.error("Mercado Pago Brick Error:", error);
                                    showToast("Error al cargar el botón de pago de Mercado Pago", "ERROR");
                                  }}
                                />
                              </div>
                              
                              <button onClick={() => setPreferenceId(null)} className="mt-6 text-[9px] font-black text-gray-400 uppercase hover:text-blue-500 transition-all tracking-[0.2em] border-b border-transparent hover:border-blue-200 pb-1">← Volver a Editar Datos</button>
                           </div>
                         )}

                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[280px]">
                            {selectedMethod.instructions || 'Paga de forma 100% segura con tu cuenta de Mercado Pago o tarjeta.'}
                         </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                         <div className="w-44 h-44 bg-white p-3 rounded-[2rem] border-4 border-gray-50 shadow-inner mb-6 flex items-center justify-center overflow-hidden">
                           <img src={selectedMethod.qrUrl} className="w-full h-full object-contain" alt="QR" />
                         </div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[280px]">
                           {selectedMethod.instructions || 'Escanea el código y adjunta una captura de pantalla del comprobante'}
                         </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 mt-10">
                    {selectedMethod.type !== 'MERCADOPAGO' && (
                      <div className="w-full space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Número de Operación</label>
                            <input 
                              type="text" 
                              className="w-full p-4 bg-gray-50 border-2 border-transparent hover:border-gray-200 focus:border-red-500 rounded-2xl font-bold text-slate-900 outline-none transition-all placeholder:text-gray-300 placeholder:font-medium" 
                              value={operationNumber} 
                              onChange={e => setOperationNumber(e.target.value)} 
                              placeholder="Ej: 12345678" 
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Código de Seguridad</label>
                            <input 
                              type="text" 
                              className="w-full p-4 bg-gray-50 border-2 border-transparent hover:border-gray-200 focus:border-red-500 rounded-2xl font-bold text-slate-900 outline-none transition-all placeholder:text-gray-300 placeholder:font-medium" 
                              value={securityCode} 
                              onChange={e => setSecurityCode(e.target.value)} 
                              placeholder="Ej: 1234" 
                            />
                          </div>
                        </div>
                        <button 
                          onClick={handleProcessPayment}
                          disabled={isProcessing}
                          className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-100 hover:bg-[#0f172a] transition-all text-xs uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 mt-4"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>PROCESANDO...</span>
                            </>
                          ) : (
                            <span>YA REALICÉ EL PAGO</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen de Suscripción (Estilo Captura) */}
          <div className="lg:col-span-5">
            <div className="bg-[#0f172a] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
               {/* Decoración sutil */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[60px] -mr-16 -mt-16"></div>
               
               <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-12">Resumen de Compra</h3>
               
               <div className="space-y-10 mb-10 pb-10 border-b border-white/10">
                  {isCart && cartItems ? (
                    <div className="space-y-6">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="text-lg font-black tracking-tight leading-none mb-1">{item.package.name}</h4>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-tight">Cant: {item.quantity}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg font-black text-red-500 tracking-tighter whitespace-nowrap">S/ {(item.package.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : pkg ? (
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-2xl font-black tracking-tight leading-none mb-2">{pkg.name}</h4>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-tight">Suscripción Mensual Inmobiliaria</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xl font-black text-red-500 tracking-tighter whitespace-nowrap">S/ {pkg.price}</span>
                      </div>
                    </div>
                  ) : null}
               </div>

               <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <span className="text-sm font-black uppercase tracking-widest">Total a Pagar</span>
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className="text-2xl font-black text-white tracking-tighter whitespace-nowrap">S/ {totalAmount.toFixed(2)}</span>
                  </div>
               </div>

               {/* Beneficios rápidos en el resumen */}
               {!isCart && pkg && (
                 <div className="mt-10 pt-8 border-t border-white/5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{pkg.propertyLimit} Anuncios incluidos</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Vigencia por {pkg.durationDays} días</p>
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

export default PaymentFlow;
