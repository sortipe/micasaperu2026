import React, { useState } from 'react';
import { User } from '../types';
import { ToastType } from './Toast';
import Turnstile from './Turnstile';
import Honeypot from './Honeypot';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface DataRequestFormProps {
  currentUser: User | null;
  onClose: () => void;
  showToast: (message: string, type: ToastType) => void;
}

const REQUEST_TYPES = [
  { value: 'ACCESS', label: 'Acceso (Conocer qué datos personales tenemos sobre ti)' },
  { value: 'RECTIFICATION', label: 'Rectificación (Corregir datos inexactos o incompletos)' },
  { value: 'CANCELLATION', label: 'Cancelación (Eliminar tus datos personales)' },
  { value: 'OPPOSITION', label: 'Oposición (Oponerte al tratamiento de tus datos)' },
  { value: 'DATA_EXPORT', label: 'Exportación (Obtener copia de tus datos en formato portable)' },
  { value: 'ACCOUNT_DELETION', label: 'Eliminación de Cuenta (Solicitar el borrado completo de tu cuenta)' },
] as const;

type RequestType = typeof REQUEST_TYPES[number]['value'];

const DataRequestForm: React.FC<DataRequestFormProps> = ({ currentUser, onClose, showToast }) => {
  const [requestType, setRequestType] = useState<RequestType>('ACCESS');
  const [description, setDescription] = useState('');
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return showToast('Por favor, ingresa tu nombre completo.', 'WARNING');
    if (!email.trim()) return showToast('Por favor, ingresa tu correo electrónico.', 'WARNING');

    if (!acceptedPrivacy) {
      return showToast(
        'Debes aceptar el tratamiento de tus datos personales según la Ley N° 29733 para procesar tu solicitud.',
        'WARNING'
      );
    }

    if (!turnstileToken) return showToast('Por favor, verifica que no eres un robot.', 'WARNING');

    setIsSending(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('data_requests').insert({
          user_id: currentUser?.id || null,
          user_name: name.trim(),
          user_email: email.trim(),
          request_type: requestType,
          description: description.trim(),
          status: 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      } else {
        // Demo mode: simulate saving
        await new Promise(r => setTimeout(r, 800));
      }

      showToast(
        'Tu solicitud de derechos ARCO ha sido registrada exitosamente. Recibirás una respuesta en un plazo máximo de 20 días hábiles, conforme a la Ley N° 29733.',
        'SUCCESS'
      );
      onClose();
    } catch (err) {
      console.error('Error al enviar solicitud ARCO:', err);
      showToast('Error al enviar la solicitud. Por favor, inténtalo nuevamente.', 'ERROR');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] overflow-y-auto bg-gray-100/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-[2rem] border border-gray-200 overflow-hidden mb-10">
        {/* CABECERA LEGAL */}
        <div className="p-8 text-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white flex flex-col items-center relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-600 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div className="w-16 h-16 mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#091F4F]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Derechos ARCO</h1>
          <p className="text-xs font-bold text-gray-500 mt-1 max-w-lg">
            Ejerce tus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición</strong> sobre tus datos personales, conforme a la <strong>Ley N° 29733 - Ley de Protección de Datos Personales</strong>.
          </p>
          <div className="mt-4 px-5 py-2 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-medium text-blue-800 leading-relaxed">
            También puedes ejercer tus derechos ARCO escribiendo a: <strong className="text-[#091F4F]">soporte@micasaperu.com</strong> o enviando una carta física a nuestra dirección.
          </div>
          <div className="mt-4 px-4 py-1.5 bg-[#091F4F]/5 rounded-full text-[9px] font-black text-[#091F4F] uppercase tracking-wider">
            Fecha: {new Date().toLocaleDateString('es-PE')}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* SECCIÓN 1: DATOS DEL SOLICITANTE */}
          <div className="space-y-5">
            <h2 className="bg-[#091F4F] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[9px]">1</span>
              Tus Datos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1.5 block tracking-wider">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 rounded-xl font-bold border border-gray-100 focus:border-[#091F4F] focus:ring-1 focus:ring-[#091F4F] outline-none transition-all text-sm"
                  placeholder="Ej: Juan Pérez García"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1.5 block tracking-wider">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 rounded-xl font-bold border border-gray-100 focus:border-[#091F4F] focus:ring-1 focus:ring-[#091F4F] outline-none transition-all text-sm"
                  placeholder="Ej: usuario@correo.com"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: TIPO DE SOLICITUD */}
          <div className="space-y-5">
            <h2 className="bg-[#091F4F] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[9px]">2</span>
              Tipo de Solicitud
            </h2>
            <div className="space-y-2">
              {REQUEST_TYPES.map(rt => (
                <label
                  key={rt.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    requestType === rt.value
                      ? 'border-[#091F4F] bg-[#091F4F]/5'
                      : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="requestType"
                    value={rt.value}
                    checked={requestType === rt.value}
                    onChange={() => setRequestType(rt.value as RequestType)}
                    className="mt-0.5 accent-[#091F4F]"
                  />
                  <span className="text-sm font-bold text-gray-700 leading-snug">{rt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* SECCIÓN 3: DETALLE */}
          <div className="space-y-5">
            <h2 className="bg-[#091F4F] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[9px]">3</span>
              Detalle de tu Solicitud
            </h2>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1.5 block tracking-wider">
                Explica tu solicidad (opcional pero recomendado)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-xl font-medium border border-gray-100 focus:border-[#091F4F] focus:ring-1 focus:ring-[#091F4F] outline-none transition-all min-h-[120px] text-sm"
                placeholder="Ej: Solicito acceso a todos los datos personales que tienen registrados sobre mi persona, incluyendo el origen y destino de los mismos, así como el periodo de almacenamiento..."
              />
            </div>
          </div>

          {/* AVISOS LEGALES */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[10px] text-amber-800 font-medium leading-relaxed space-y-1">
              <p><strong>Plazo de atención:</strong> Tenemos un plazo máximo de 20 días hábiles para atender tu solicitud, prorrogable por otros 10 días hábiles si resulta necesario, conforme al Artículo 37 del Reglamento de la Ley N° 29733.</p>
              <p><strong>Costo:</strong> El ejercicio de los derechos ARCO es gratuito, salvo que realices una solicitud de acceso a datos personales de manera reiterada (Art. 19 del Reglamento).</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
              <label className="flex items-start gap-2.5 text-[10.5px] text-slate-600 cursor-pointer select-none leading-relaxed">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                  checked={acceptedPrivacy}
                  onChange={e => setAcceptedPrivacy(e.target.checked)}
                />
                <span>
                  Autorizo el tratamiento de mis datos personales proporcionados en el presente formulario, exclusivamente para la atención de mi solicitud de derechos ARCO, de acuerdo con la <strong className="text-red-600 font-bold">Política de Privacidad</strong> de este portal y lo dispuesto por la <strong className="font-bold text-slate-900">Ley N° 29733 - Ley de Protección de Datos Personales</strong> y su Reglamento (D.S. N° 003-2013-JUS).
                </span>
              </label>
            </div>

            <Honeypot name="arco_website" />
            <Turnstile onVerify={setTurnstileToken} />

            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-[#091F4F] text-white font-black py-5 rounded-xl shadow-2xl hover:bg-red-600 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? 'ENVIANDO SOLICITUD...' : 'ENVIAR MI SOLICITUD ARCO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataRequestForm;
