
import React, { useState, useEffect } from 'react';
import { Package, User, PaymentMethod } from '../types';
import { ToastType } from './Toast';

declare const Culqi: any;
declare global {
  interface Window {
    culqi: () => void;
  }
}

interface PaymentFlowProps {
  pkg: Package;
  user: User;
  paymentMethods: PaymentMethod[];
  onSuccess: () => void;
  onCancel: () => void;
  onRecordTransaction: (methodName: string) => Promise<void>;
  showToast: (message: string, type: ToastType) => void;
}

const PaymentFlow: React.FC<PaymentFlowProps> = ({ pkg, user, paymentMethods, onSuccess, onCancel, onRecordTransaction, showToast }) => {
  const [step, setStep] = useState<'METHOD' | 'DETAILS' | 'SUCCESS'>('METHOD');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof Culqi !== 'undefined') {
      Culqi.publicKey = (import.meta as any).env.VITE_CULQI_PUBLIC_KEY || 'pk_test_3269a3721e828114';
      Culqi.settings({
        title: 'Micasaperu',
        currency: 'PEN',
        description: `Suscripción: ${pkg.name}`,
        amount: Math.round(pkg.price * 100),
      });
      Culqi.options({
        lang: 'auto',
        modal: true,
        installments: false,
        customButton: 'Pagar',
      });
    }

    window.culqi = async () => {
      if (Culqi.token) {
        const token = Culqi.token.id;
        setIsProcessing(true);
        try {
          // Backend removed as per user request. Simulating success.
          // const res = await fetch('/api/culqi/charge', { ... });
          
          console.log('Simulating payment success with token:', token);
          await onRecordTransaction('Tarjeta de Crédito / Débito (Culqi)');
          setStep('SUCCESS');
        } catch (err) {
          console.error(err);
          showToast('Error de conexión al procesar el pago', 'ERROR');
        } finally {
          setIsProcessing(false);
          Culqi.close();
        }
      } else if (Culqi.error) {
        showToast(Culqi.error.user_message, 'ERROR');
      }
    };
  }, [pkg, user]);

  const handleProcessPayment = async () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    try {
      // Registramos la transacción en la DB
      await onRecordTransaction(selectedMethod.name);
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
            Validaremos tu pago en breve para activar tu <span className="font-bold text-slate-900">{pkg.name}</span>.
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
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01" /></svg>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase">{m.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{m.type === 'TRANSFER' ? 'Transferencia Bancaria' : m.type === 'CARD' ? 'Tarjeta de Crédito/Débito' : 'Escaneo de Código QR'}</p>
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
                      </div>
                    ) : selectedMethod.type === 'CARD' ? (
                      <div className="flex flex-col items-center text-center">
                         <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                           <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                         </div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[280px]">
                           Paga de forma segura usando Culqi con tu tarjeta de crédito o débito
                         </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                         <div className="w-44 h-44 bg-white p-3 rounded-[2rem] border-4 border-gray-50 shadow-inner mb-6 flex items-center justify-center overflow-hidden">
                           <img src={selectedMethod.qrUrl} className="w-full h-full object-contain" alt="QR" />
                         </div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[280px]">
                           Escanea el código y adjunta una captura de pantalla del comprobante
                         </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 mt-10">
                    <button 
                      onClick={selectedMethod.type === 'CARD' ? () => Culqi.open() : handleProcessPayment}
                      disabled={isProcessing}
                      className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-100 hover:bg-[#0f172a] transition-all text-xs uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>PROCESANDO...</span>
                        </>
                      ) : selectedMethod.type === 'CARD' ? (
                        <span>PAGAR CON TARJETA</span>
                      ) : (
                        <span>YA REALICÉ EL PAGO</span>
                      )}
                    </button>
                    
                    {selectedMethod.type === 'CARD' && (
                      <button 
                        onClick={handleProcessPayment}
                        disabled={isProcessing}
                        className="w-full bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        <span>SIMULAR PAGO (MODO DEMO)</span>
                      </button>
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
               
               <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-12">Resumen de Suscripción</h3>
               
               <div className="space-y-10 mb-10 pb-10 border-b border-white/10">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-2xl font-black tracking-tight leading-none mb-2">{pkg.name}</h4>
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-tight">Suscripción Mensual Inmobiliaria</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-red-500 tracking-tighter">S/ {pkg.price}</span>
                    </div>
                  </div>
               </div>

               <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-black uppercase tracking-widest">Total Mensual</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tighter">S/ {pkg.price}</span>
                  </div>
               </div>

               {/* Beneficios rápidos en el resumen */}
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
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentFlow;
