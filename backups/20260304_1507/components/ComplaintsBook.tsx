
import React, { useState } from 'react';
import { Complaint } from '../types';
import { ToastType } from './Toast';

interface ComplaintsBookProps {
  onSave: (complaint: Partial<Complaint>) => Promise<void>;
  onClose: () => void;
  showToast: (message: string, type: ToastType) => void;
}

const ComplaintsBook: React.FC<ComplaintsBookProps> = ({ onSave, onClose, showToast }) => {
  const [formData, setFormData] = useState<Partial<Complaint>>({
    productService: 'SERVICIO',
    type: 'RECLAMO',
    claimantDocType: 'DNI',
    status: 'PENDIENTE',
    date: new Date().toISOString()
  });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await onSave(formData);
      showToast("Su reclamación ha sido registrada con éxito. Recibirá una respuesta en el plazo legal de 15 días hábiles.", "SUCCESS");
      onClose();
    } catch (err) {
      showToast("Error al enviar el formulario.", "ERROR");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] overflow-y-auto bg-gray-100/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden mb-10">
        {/* CABECERA LEGAL */}
        <div className="p-8 text-center border-b border-gray-100 bg-gray-50 flex flex-col items-center relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-600 transition-colors">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="w-16 h-16 mb-4 text-gray-800">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V5A2.5 2.5 0 0 1 6.5 2.5H20v14.5H6.5a2.5 2.5 0 0 0-2.5 2.5z"/></svg>
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Libro de Reclamaciones</h1>
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-1">E-HOLDING SAC (www.aquivivir.com)</p>
          <div className="text-[9px] font-bold text-gray-400 uppercase mt-2 space-y-0.5">
            <p>RUC: 20522947891</p>
            <p>AV. BENAVIDES 768, INT. 1303, MIRAFLORES</p>
            <p>GERENTE GENERAL: LEANDRO MOLINA</p>
          </div>
          <div className="mt-4 px-4 py-1.5 bg-gray-200 rounded-full text-[10px] font-black text-gray-600 uppercase">
            Fecha: {new Date().toLocaleDateString()}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          {/* SECCIÓN 1: CONSUMIDOR */}
          <div className="space-y-6">
            <h2 className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">1. Identificación del Consumidor Reclamante</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Nombre</label>
                <input required className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, claimantName: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Apellido Paterno</label>
                <input required className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, claimantPaternal: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Apellido Materno</label>
                <input required className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, claimantMaternal: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Dirección</label>
              <input required className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, claimantAddress: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Tipo Doc.</label>
                <select className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, claimantDocType: e.target.value})}>
                  <option value="DNI">DNI</option>
                  <option value="CE">C.E.</option>
                  <option value="PASAPORTE">PAS</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">N° Documento</label>
                <input required className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, claimantDocNumber: e.target.value})} />
              </div>
              <div className="md:col-span-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Teléfono</label>
                <input required className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, claimantPhone: e.target.value})} />
              </div>
              <div className="md:col-span-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Email</label>
                <input required type="email" className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, claimantEmail: e.target.value})} />
              </div>
              <div className="md:col-span-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Edad</label>
                <input required type="number" className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, claimantAge: e.target.value})} />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: BIEN CONTRATADO */}
          <div className="space-y-6">
            <h2 className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">2. Identificación del Bien Contratado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Producto o Servicio</label>
                <select className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, productService: e.target.value as any})}>
                  <option value="PRODUCTO">Producto</option>
                  <option value="SERVICIO">Servicio</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Monto Reclamado (S/)</label>
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 px-3">
                   <span className="font-bold mr-2 text-gray-400">S/</span>
                   <input type="number" step="0.01" className="w-full p-3 bg-transparent outline-none font-bold" onChange={e => setFormData({...formData, claimedAmount: Number(e.target.value)})} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Descripción del Bien</label>
                <textarea className="w-full p-4 bg-gray-50 rounded-lg font-medium border border-gray-100 min-h-[100px]" onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="md:col-span-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Atendido por</label>
                <input className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" placeholder="Nombre de quien lo atendió" onChange={e => setFormData({...formData, attendedBy: e.target.value})} />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: DETALLE RECLAMACIÓN */}
          <div className="space-y-6">
            <h2 className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">3. Detalle de la Reclamación y Pedido del Consumidor</h2>
            <div className="p-4 bg-yellow-50 rounded-xl text-[10px] text-yellow-800 font-medium">
               <p><strong>Reclamo:</strong> Disconformidad relacionada a los productos o servicios.</p>
               <p><strong>Queja:</strong> Disconformidad no relacionada a los productos o servicios; malestar o descontento respecto a la atención al público.</p>
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Tipo de Disconformidad</label>
              <select className="w-full p-3 bg-gray-50 rounded-lg font-bold border border-gray-100" onChange={e => setFormData({...formData, type: e.target.value as any})}>
                <option value="RECLAMO">Reclamo</option>
                <option value="QUEJA">Queja</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Detalle del Reclamo o Queja</label>
              <textarea required className="w-full p-4 bg-gray-50 rounded-lg font-medium border border-gray-100 min-h-[120px]" onChange={e => setFormData({...formData, detail: e.target.value})} />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase ml-1 mb-1 block">Pedido del Consumidor</label>
              <textarea required className="w-full p-4 bg-gray-50 rounded-lg font-medium border border-gray-100 min-h-[100px]" onChange={e => setFormData({...formData, request: e.target.value})} />
            </div>
          </div>

          {/* AVISOS LEGALES AL PIE */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <div className="text-[9px] text-gray-400 font-medium italic space-y-2">
              <p>* Las comunicaciones respecto al reclamo se realizarán a través del(los) correo(s) electrónico(s) brindado(s).</p>
              <p>* La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante Indecopi.</p>
              <p>* Los proveedores están obligados a atender los reclamos presentados en un plazo no mayor de quince (15) días hábiles improrrogables.</p>
            </div>
            <button 
              disabled={isSending}
              className="w-full bg-red-600 text-white font-black py-5 rounded-xl shadow-2xl hover:bg-slate-900 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50"
            >
              {isSending ? 'PROCESANDO...' : 'REGISTRAR MI RECLAMACIÓN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintsBook;
