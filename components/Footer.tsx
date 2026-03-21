import React from 'react';
import { SocialLink, OfficeInfo } from '../types';

interface FooterProps {
  socialLinks: SocialLink[];
  officeInfo: OfficeInfo;
  onNavigate: (view: any) => void;
  onOpenLegal: (type: 'PRIVACY' | 'TERMS_USE') => void;
  logo?: string | null;
}

const Footer: React.FC<FooterProps> = ({ socialLinks, officeInfo, onNavigate, onOpenLegal, logo }) => {
  const socialIcons = {
    FACEBOOK: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
    ),
    INSTAGRAM: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
    ),
    LINKEDIN: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
    ),
    TIKTOK: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.776 8.776 0 0 1-1.87-1.35v7.45a7.12 7.12 0 1 1-7.12-7.12c.37 0 .75.04 1.12.12.02-1.61-.02-3.22.02-4.83a8.109 8.109 0 0 0-1.14-.08c-4.13 0-7.53 3.37-7.53 7.5a7.51 7.51 0 0 0 7.5 7.5c3.77 0 6.58-2.82 7.11-6.4.02-.13.03-.26.03-.4V4.11a8.17 8.17 0 0 0 4.67 1.43V.02h-4.67v12.22c-.17.31-.41.59-.7.8a4.594 4.594 0 0 1-5.23-.04c-.78-.57-1.21-1.51-1.21-2.48s.43-1.91 1.21-2.48c.78-.57 1.83-.75 2.74-.53.03-2.49.01-4.99.01-7.49z"></path></svg>
    ),
    WHATSAPP: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    )
  };

  return (
    <footer className="bg-[#091F4F] text-white pt-20 pb-10 mt-auto border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Columna Marca */}
          <div className="space-y-6">
            <div className="cursor-pointer flex items-center" onClick={() => onNavigate('HOME')}>
              {logo ? (
                <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <span className="font-black text-2xl tracking-tighter">MICASAPERU</span>
              )}
            </div>
            <p className="text-blue-100/60 text-sm font-medium leading-relaxed">
              La plataforma inmobiliaria integral del Perú: el punto de encuentro donde desarrolladores, asesores, empresas inmobiliarias y propietarios publican propiedades y concretan procesos de venta, alquiler, traspaso y toda forma de intermediación inmobiliaria.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.filter(l => l.url).map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all text-white"
                >
                  {socialIcons[link.platform]}
                </a>
              ))}
            </div>
          </div>

          {/* Columna Navegación */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500">Explorar</h4>
            <ul className="space-y-4">
              <li><button onClick={() => onNavigate('SEARCH')} className="text-blue-100 hover:text-white transition-colors text-sm font-bold">Buscador de Inmuebles</button></li>
              <li><button onClick={() => onNavigate('AUTH')} className="text-blue-100 hover:text-white transition-colors text-sm font-bold">Publicar Anuncio</button></li>
            </ul>
          </div>

          {/* Columna Legal */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500">Soporte y Legal</h4>
            <ul className="space-y-4">
              <li><button onClick={() => onOpenLegal('PRIVACY')} className="text-blue-100 hover:text-white transition-colors text-sm font-bold">Política de Privacidad</button></li>
              <li><button onClick={() => onOpenLegal('TERMS_USE')} className="text-blue-100 hover:text-white transition-colors text-sm font-bold">Términos y Condiciones</button></li>
              <li>
                <button 
                  onClick={() => onNavigate('COMPLAINTS_BOOK')} 
                  className="flex items-center gap-3 bg-red-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-[#091F4F] transition-all shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  Libro de Reclamaciones
                </button>
              </li>
            </ul>
          </div>

          {/* Columna Contacto */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500">Oficinas</h4>
            <div className="space-y-5">
              <div className="flex items-start gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <p className="text-sm font-bold text-blue-100/80 leading-snug">{officeInfo.address || 'Sin dirección registrada'}</p>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <p className="text-sm font-bold text-blue-100/80">{officeInfo.email || 'hola@aquivivir.com'}</p>
              </div>
              {officeInfo.phone && (
                <div className="flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <p className="text-sm font-bold text-blue-100/80">{officeInfo.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black text-blue-100/30 uppercase tracking-[0.4em]">MICASAPERU © 2025 - TODOS LOS DERECHOS RESERVADOS</p>
          <div className="flex items-center gap-8">
            <span className="text-[9px] font-black text-blue-100/20 uppercase tracking-widest">Desarrollado por Micasa Perú</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;