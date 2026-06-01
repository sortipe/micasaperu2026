import React from 'react';

interface CookiesPolicyProps {
  onBack: () => void;
}

const CookiesPolicy: React.FC<CookiesPolicyProps> = ({ onBack }) => {
  const today = new Date().toLocaleDateString('es-PE');

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div className="bg-[#091F4F] text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <button onClick={onBack} className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
            Volver al inicio
          </button>
          <div className="max-w-4xl">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a10 10 0 00-10 10c0 4.42 2.65 8.17 6.35 9.95.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.58.56-3.12-1.24-3.12-1.24-.42-1.07-1.03-1.36-1.03-1.36-.84-.58.06-.57.06-.57.93.07 1.42 1.07 1.42 1.07.83 1.42 2.18 1.01 2.71.77.08-.61.33-1.02.6-1.26-2.07-.24-4.25-1.04-4.25-4.62 0-1.02.36-1.86.96-2.52-.1-.24-.42-1.2.09-2.5 0 0 .78-.25 2.56.96a8.92 8.92 0 014.66 0c1.78-1.21 2.56-.96 2.56-.96.51 1.3.19 2.26.09 2.5.6.66.96 1.5.96 2.52 0 3.58-2.18 4.38-4.26 4.62.33.29.64.86.64 1.73 0 1.25-.01 2.26-.01 2.57 0 .26.18.58.69.48C19.35 20.17 22 16.42 22 12A10 10 0 0012 2z"/></svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-4">Política de Cookies</h1>
            <p className="text-blue-200/70 text-sm font-bold">Última actualización: {today}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-10 text-slate-700 text-[15px] leading-relaxed font-medium">

          <section>
            <h2 className="text-xl font-black text-[#091F4F] uppercase tracking-tight mb-5 pb-3 border-b-2 border-red-600">1. ¿Qué son las Cookies?</h2>
            <div className="space-y-4">
              <p>
                Las cookies son pequeños archivos de texto que los sitios web almacenan en su navegador cuando los visita. 
                Permiten que el sitio recuerde sus preferencias, acciones y navegación durante un período de tiempo, 
                para que no tenga que volver a configurarlas cada vez que regrese.
              </p>
              <p>
                En <strong>Mi Casa Perú</strong> utilizamos cookies propias y de terceros para garantizar el correcto 
                funcionamiento del sitio web, mejorar su experiencia de navegación, analizar el tráfico y, previo 
                consentimiento, mostrarle contenido relevante.
              </p>
              <p>
                Esta Política de Cookies es parte integral de nuestra <strong>Política de Privacidad</strong> y debe 
                ser leída en conjunto con ella.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#091F4F] uppercase tracking-tight mb-5 pb-3 border-b-2 border-red-600">2. Clasificación de Cookies</h2>
            <div className="space-y-4">
              <p>Clasificamos las cookies según su finalidad y según quien las gestiona:</p>

              <h3 className="font-black text-[#091F4F] text-sm uppercase tracking-wider mt-6">2.1 Según su Finalidad</h3>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h4 className="font-black text-sm uppercase tracking-wider">Cookies Necesarias (Siempre activas)</h4>
                  </div>
                  <p className="text-sm">Son esenciales para el funcionamiento básico del sitio web. Permiten la navegación, 
                  el acceso a áreas seguras, la autenticación de usuarios y la gestión de la sesión. No requieren su 
                  consentimiento previo.</p>
                </div>

                <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h4 className="font-black text-sm uppercase tracking-wider">Cookies de Análisis (Requieren consentimiento)</h4>
                  </div>
                  <p className="text-sm">Nos ayudan a entender cómo los visitantes interactúan con el sitio web, 
                  recopilando información anónima sobre las páginas visitadas, el tiempo de navegación y las 
                  preferencias de búsqueda. Esto nos permite mejorar continuamente nuestros servicios.</p>
                </div>

                <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <h4 className="font-black text-sm uppercase tracking-wider">Cookies de Marketing (Requieren consentimiento)</h4>
                  </div>
                  <p className="text-sm">Se utilizan para mostrar anuncios relevantes para usted según sus intereses 
                  y hábitos de navegación. También limitan la cantidad de veces que ve un anuncio y miden la 
                  efectividad de las campañas publicitarias.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#091F4F] uppercase tracking-tight mb-5 pb-3 border-b-2 border-red-600">3. Cookies Utilizadas en Mi Casa Perú</h2>
            <p>A continuación, detallamos todas las cookies y tecnologías similares utilizadas en nuestra plataforma:</p>

            <h3 className="font-black text-[#091F4F] text-sm uppercase tracking-wider mt-8 mb-4">3.1 Cookies Necesarias</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#091F4F] text-white">
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Cookie / Tecnología</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Proveedor</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Finalidad</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">sb-* (Supabase)</td>
                    <td className="p-3">Supabase</td>
                    <td className="p-3">Autenticación de usuarios y gestión de sesiones. Almacena el token de acceso JWT.</td>
                    <td className="p-3">Sesión / 1 año (recordar sesión)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">micasaperu_cookie_consent</td>
                    <td className="p-3">Mi Casa Perú</td>
                    <td className="p-3">Almacena sus preferencias de consentimiento de cookies en el navegador.</td>
                    <td className="p-3">1 año</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">micasaperu_cache_*</td>
                    <td className="p-3">Mi Casa Perú</td>
                    <td className="p-3">Cache local de datos de la aplicación (propiedades, ubicaciones, preferencias) para mejorar el rendimiento.</td>
                    <td className="p-3">Sesión / persistente</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">__cf_bm</td>
                    <td className="p-3">Cloudflare</td>
                    <td className="p-3">Cookies de seguridad para proteger contra bots y abusos mediante Turnstile CAPTCHA.</td>
                    <td className="p-3">30 minutos</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-black text-[#091F4F] text-sm uppercase tracking-wider mt-8 mb-4">3.2 Cookies de Análisis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#091F4F] text-white">
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Cookie / Tecnología</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Proveedor</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Finalidad</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">_ga</td>
                    <td className="p-3">Google Analytics</td>
                    <td className="p-3">Distinguir visitantes únicos mediante un identificador generado aleatoriamente.</td>
                    <td className="p-3">2 años</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">_ga_*</td>
                    <td className="p-3">Google Analytics 4</td>
                    <td className="p-3">Mantener el estado de la sesión y rastrear las interacciones del usuario.</td>
                    <td className="p-3">1 año</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">_gid</td>
                    <td className="p-3">Google Analytics</td>
                    <td className="p-3">Almacenar y contar las visitas a páginas.</td>
                    <td className="p-3">24 horas</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">_gat</td>
                    <td className="p-3">Google Analytics</td>
                    <td className="p-3">Limitar la tasa de solicitudes (throttle).</td>
                    <td className="p-3">1 minuto</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-black text-[#091F4F] text-sm uppercase tracking-wider mt-8 mb-4">3.3 Cookies de Marketing</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#091F4F] text-white">
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Cookie / Tecnología</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Proveedor</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Finalidad</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">_fbp</td>
                    <td className="p-3">Meta (Facebook)</td>
                    <td className="p-3">Almacenar y rastrear visitas en sitios web para publicidad dirigida en Facebook/Instagram.</td>
                    <td className="p-3">3 meses</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">fr</td>
                    <td className="p-3">Meta (Facebook)</td>
                    <td className="p-3">Mostrar anuncios relevantes y medir su efectividad.</td>
                    <td className="p-3">3 meses</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">IDE</td>
                    <td className="p-3">Google Ads / DV360</td>
                    <td className="p-3">Mostrar anuncios de Google en sitios de terceros.</td>
                    <td className="p-3">13 meses</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-black text-[#091F4F] text-sm uppercase tracking-wider mt-8 mb-4">3.4 Tecnologías de Terceros</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#091F4F] text-white">
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Servicio</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Proveedor</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Finalidad</th>
                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Almacenamiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">Google Tag Manager</td>
                    <td className="p-3">Google</td>
                    <td className="p-3">Gestión centralizada de etiquetas y scripts del sitio. No almacena datos por sí mismo, pero carga otros scripts.</td>
                    <td className="p-3">No almacena cookies propias</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">Leaflet / OpenStreetMap</td>
                    <td className="p-3">OSM Foundation</td>
                    <td className="p-3">Visualización de mapas interactivos con ubicación de propiedades. Carga bajo demanda.</td>
                    <td className="p-3">No almacena cookies propias</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">WhatsApp API</td>
                    <td className="p-3">Meta / WhatsApp</td>
                    <td className="p-3">Botón de contacto directo vía WhatsApp. Solo se activa al hacer clic.</td>
                    <td className="p-3">No almacena cookies propias</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">Mercado Pago</td>
                    <td className="p-3">Mercado Libre</td>
                    <td className="p-3">Procesamiento seguro de pagos. Se carga solo al iniciar un flujo de pago.</td>
                    <td className="p-3">Cookies propias de MP</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">Unsplash</td>
                    <td className="p-3">Unsplash</td>
                    <td className="p-3">Imágenes de stock para banners y fondos.</td>
                    <td className="p-3">Puede almacenar cookies</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 font-bold">Google Fonts</td>
                    <td className="p-3">Google</td>
                    <td className="p-3">Fuentes tipográficas del sitio web.</td>
                    <td className="p-3">Puede almacenar cookies</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#091F4F] uppercase tracking-tight mb-5 pb-3 border-b-2 border-red-600">4. Gestión del Consentimiento</h2>
            <div className="space-y-4">
              <p>
                Al acceder a nuestro sitio web por primera vez, se muestra un banner de configuración de cookies 
                donde puede:
              </p>
              <ul>
                <li><strong>Aceptar todas las cookies:</strong> Autoriza la instalación de todos los tipos de cookies.</li>
                <li><strong>Rechazar cookies no esenciales:</strong> Solo se instalarán las cookies necesarias para el funcionamiento básico.</li>
                <li><strong>Configurar preferencias:</strong> Puede seleccionar qué categorías de cookies acepta (análisis, marketing).</li>
              </ul>
              <p>
                Puede modificar sus preferencias en cualquier momento eliminando las cookies almacenadas en su 
                navegador o mediante la configuración de su navegador web.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#091F4F] uppercase tracking-tight mb-5 pb-3 border-b-2 border-red-600">5. Consentimiento Mode v2 de Google</h2>
            <div className="space-y-4">
              <p>
                Implementamos <strong>Google Consent Mode v2</strong>, que ajusta dinámicamente el comportamiento 
                de las etiquetas de Google (Google Analytics, Google Ads, etc.) según las preferencias de 
                consentimiento del usuario. Los parámetros gestionados son:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">ad_storage</p>
                  <p className="text-xs font-bold">Almacenamiento de anuncios</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">analytics_storage</p>
                  <p className="text-xs font-bold">Almacenamiento de análisis</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">ad_user_data</p>
                  <p className="text-xs font-bold">Datos de usuario para anuncios</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">ad_personalization</p>
                  <p className="text-xs font-bold">Personalización de anuncios</p>
                </div>
              </div>
              <p className="mt-4">
                Todos estos parámetros se inicializan en <strong>"denied"</strong> antes de que se cargue 
                cualquier script de Google, y se actualizan según la elección del usuario en el banner de cookies.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#091F4F] uppercase tracking-tight mb-5 pb-3 border-b-2 border-red-600">6. Cómo Configurar las Cookies en su Navegador</h2>
            <p>Puede gestionar las cookies desde la configuración de su navegador web:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-blue-300 transition-all flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-blue-600 font-black text-sm">Ch</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Google Chrome</p>
                  <p className="text-[10px] text-gray-500">Configurar cookies en Chrome</p>
                </div>
              </a>
              <a href="https://support.mozilla.org/kb/delete-cookies-remove-info-websites-stored" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-orange-300 transition-all flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-orange-600 font-black text-sm">Ff</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Mozilla Firefox</p>
                  <p className="text-[10px] text-gray-500">Configurar cookies en Firefox</p>
                </div>
              </a>
              <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-gray-400 transition-all flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-gray-600 font-black text-sm">Sa</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Safari (Mac)</p>
                  <p className="text-[10px] text-gray-500">Configurar cookies en Safari</p>
                </div>
              </a>
              <a href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge" target="_blank" rel="noopener noreferrer" className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-green-300 transition-all flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-green-600 font-black text-sm">Ed</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Microsoft Edge</p>
                  <p className="text-[10px] text-gray-500">Configurar cookies en Edge</p>
                </div>
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#091F4F] uppercase tracking-tight mb-5 pb-3 border-b-2 border-red-600">7. Actualizaciones de la Política de Cookies</h2>
            <p>
              Podemos actualizar esta Política de Cookies periódicamente para reflejar cambios en las cookies 
              que utilizamos o por requisitos legales. Le recomendamos revisar esta página regularmente. 
              La fecha de la última actualización aparece al inicio de esta página.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#091F4F] uppercase tracking-tight mb-5 pb-3 border-b-2 border-red-600">8. Contacto</h2>
            <p>
              Si tiene alguna pregunta sobre nuestra Política de Cookies, puede contactarnos a través de 
              nuestro <strong>formulario de Derechos ARCO</strong> disponible en el pie de página o mediante 
              correo electrónico.
            </p>
          </section>

        </div>
      </div>

      <div className="bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cumplimiento Ley N° 29733 y RGPD - Política de Cookies</p>
            <button onClick={onBack} className="bg-[#091F4F] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all">
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesPolicy;
