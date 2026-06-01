import React from 'react';

interface PrivacyPolicyProps {
  officeInfo: { email: string; address: string };
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ officeInfo, onBack }) => {
  const contactEmail = officeInfo.email || 'soporte@micasaperu.com';
  const contactAddress = officeInfo.address || 'Av. Benavides 768, Int. 1303, Miraflores, Lima';
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
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-4">Política de Privacidad</h1>
            <p className="text-blue-200/70 text-sm font-bold">Última actualización: {today}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto prose prose-slate prose-sm md:prose-base">
          <div className="space-y-10 text-slate-700 text-[15px] leading-relaxed font-medium">

            <Section title="1. Responsable del Tratamiento">
              <p>
                <strong>Mi Casa Perú</strong> (en adelante, "la Plataforma"), con domicilio en {contactAddress}, 
                es el responsable del tratamiento de los datos personales que usted proporcione a través de 
                nuestros servicios en línea, conforme a lo establecido en la <strong>Ley N° 29733, Ley de 
                Protección de Datos Personales</strong>, su Reglamento aprobado por Decreto Supremo N° 003-2013-JUS, 
                y sus modificatorias.
              </p>
              <p>
                Para cualquier consulta relacionada con la presente Política de Privacidad o el ejercicio de 
                sus derechos, puede contactarnos a través de:
              </p>
              <ul>
                <li><strong>Correo electrónico:</strong> {contactEmail}</li>
                <li><strong>Dirección:</strong> {contactAddress}</li>
                <li><strong>Formulario ARCO:</strong> Disponible en el pie de página del sitio web</li>
              </ul>
            </Section>

            <Section title="2. Datos Personales que Recopilamos">
              <p>Dependiendo de los servicios que utilice, podemos recopilar las siguientes categorías de datos personales:</p>
              <h4 className="font-black text-[#091F4F] mt-6 mb-2 text-sm uppercase tracking-wider">2.1 Datos de Registro</h4>
              <ul>
                <li>Nombre y apellidos completos</li>
                <li>Correo electrónico</li>
                <li>Número de teléfono / WhatsApp</li>
                <li>DNI o documento de identidad</li>
                <li>Dirección (física y digital)</li>
                <li>Foto de perfil (opcional)</li>
              </ul>
              <h4 className="font-black text-[#091F4F] mt-6 mb-2 text-sm uppercase tracking-wider">2.2 Datos de Propiedades</h4>
              <ul>
                <li>Dirección y ubicación de la propiedad</li>
                <li>Características de la propiedad (área, habitaciones, baños, etc.)</li>
                <li>Precio y condiciones de venta o alquiler</li>
                <li>Fotografías y documentos de la propiedad</li>
                <li>Coordenadas geográficas</li>
              </ul>
              <h4 className="font-black text-[#091F4F] mt-6 mb-2 text-sm uppercase tracking-wider">2.3 Datos de Navegación</h4>
              <ul>
                <li>Dirección IP</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Páginas visitadas y tiempo de navegación</li>
                <li>Preferencias de búsqueda</li>
                <li>Cookies y tecnologías similares (ver Política de Cookies)</li>
              </ul>
            </Section>

            <Section title="3. Finalidad del Tratamiento">
              <p>Sus datos personales serán tratados para las siguientes finalidades:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Gestión de cuenta:</strong> Crear y mantener su cuenta de usuario en la Plataforma.</li>
                <li><strong>Publicación de propiedades:</strong> Permitir la publicación, gestión y visualización de anuncios inmobiliarios.</li>
                <li><strong>Gestión de leads:</strong> Facilitar la comunicación entre anunciantes y personas interesadas en propiedades.</li>
                <li><strong>Atención al cliente:</strong> Responder consultas, reclamos y solicitudes de información.</li>
                <li><strong>Procesamiento de pagos:</strong> Gestionar transacciones y cobros por los servicios contratados.</li>
                <li><strong>Cumplimiento legal:</strong> Atender obligaciones legales, incluyendo el libro de reclamaciones.</li>
                <li><strong>Mejora del servicio:</strong> Analizar el uso de la Plataforma para mejorar su funcionamiento y experiencia de usuario.</li>
                <li><strong>Comunicaciones comerciales:</strong> Enviar información sobre promociones y novedades, previo consentimiento.</li>
              </ol>
            </Section>

            <Section title="4. Base Legal del Tratamiento">
              <p>El tratamiento de sus datos personales se fundamenta en las siguientes bases legales:</p>
              <ul>
                <li><strong>Consentimiento:</strong> Cuando usted acepta nuestra Política de Privacidad y nos proporciona sus datos voluntariamente.</li>
                <li><strong>Ejecución de un contrato:</strong> Para la prestación de los servicios solicitados (publicación de anuncios, gestión de leads, etc.).</li>
                <li><strong>Cumplimiento de obligaciones legales:</strong> Para atender requerimientos de autoridades competentes y obligaciones derivadas de la normativa peruana.</li>
                <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios y garantizar la seguridad de la Plataforma.</li>
              </ul>
            </Section>

            <Section title="5. Tiempo de Conservación de los Datos">
              <p>Conservaremos sus datos personales durante el tiempo necesario para cumplir con las finalidades descritas en esta Política, salvo que usted ejerza su derecho de cancelación u oposición. En particular:</p>
              <ul>
                <li><strong>Datos de cuenta activa:</strong> Se conservarán mientras mantenga una cuenta activa en la Plataforma.</li>
                <li><strong>Datos de transacciones:</strong> Se conservarán por un período mínimo de 5 años conforme a las obligaciones fiscales y contables.</li>
                <li><strong>Datos de reclamos:</strong> Se conservarán hasta la atención definitiva del reclamo y por 2 años adicionales.</li>
                <li><strong>Datos de navegación:</strong> Se conservarán por un período máximo de 12 meses.</li>
              </ul>
              <p>Una vez cumplido el plazo de conservación, los datos serán eliminados de forma segura o anonimizados.</p>
            </Section>

            <Section title="6. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)">
              <p>La Ley N° 29733 le otorga los siguientes derechos sobre sus datos personales:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                  <h4 className="font-black text-[#091F4F] text-sm uppercase tracking-wider mb-2">Acceso</h4>
                  <p className="text-sm">Conocer qué datos personales nuestros tenemos, su origen y el tratamiento que realizamos.</p>
                </div>
                <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                  <h4 className="font-black text-[#091F4F] text-sm uppercase tracking-wider mb-2">Rectificación</h4>
                  <p className="text-sm">Solicitar la corrección de datos inexactos, incompletos o desactualizados.</p>
                </div>
                <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                  <h4 className="font-black text-[#091F4F] text-sm uppercase tracking-wider mb-2">Cancelación</h4>
                  <p className="text-sm">Solicitar la eliminación o supresión de sus datos cuando ya no sean necesarios.</p>
                </div>
                <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                  <h4 className="font-black text-[#091F4F] text-sm uppercase tracking-wider mb-2">Oposición</h4>
                  <p className="text-sm">Oponerse al tratamiento de sus datos para fines específicos, como marketing directo.</p>
                </div>
              </div>
              <div className="mt-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h4 className="font-black text-[#091F4F] text-sm uppercase tracking-wider mb-3">¿Cómo ejercer sus derechos ARCO?</h4>
                <p className="mb-3">Puede ejercer sus derechos de las siguientes maneras:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>A través del formulario de <strong>Derechos ARCO</strong> disponible en el pie de página de nuestro sitio web.</li>
                  <li>Mediante correo electrónico a: <strong>{contactEmail}</strong>, indicando el derecho que desea ejercer y adjuntando copia de su documento de identidad.</li>
                  <li>Mediante comunicación escrita dirigida a nuestra dirección: {contactAddress}.</li>
                </ol>
                <p className="mt-3 text-sm text-slate-500">Atenderemos su solicitud en un plazo máximo de <strong>20 días hábiles</strong>, prorrogable por otros 10 días hábiles si resulta necesario, conforme al Artículo 37 del Reglamento de la Ley N° 29733.</p>
              </div>
            </Section>

            <Section title="7. Transferencias de Datos">
              <p>Sus datos personales podrán ser transferidos a:</p>
              <ul>
                <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar la Plataforma (servidores, procesamiento de pagos, análisis de datos).</li>
                <li><strong>Anunciantes:</strong> Cuando usted solicita información sobre una propiedad, sus datos serán compartidos con el anunciante correspondiente.</li>
                <li><strong>Autoridades competentes:</strong> Cuando exista un requerimiento legal o judicial.</li>
              </ul>
              <p>No realizamos transferencias internacionales de datos personales sin las garantías adecuadas. En caso de requerirse, se adoptarán las medidas de seguridad y contractuales necesarias conforme a la Ley N° 29733.</p>
            </Section>

            <Section title="8. Seguridad de la Información">
              <p>Hemos implementado medidas de seguridad técnicas, organizativas y legales para proteger sus datos personales contra pérdida, uso indebido, acceso no autorizado, divulgación, alteración o destrucción. Estas medidas incluyen:</p>
              <ul>
                <li>Cifrado de comunicaciones mediante protocolo HTTPS/TLS</li>
                <li>Autenticación segura con Supabase (gestión de identidad y acceso)</li>
                <li>Control de acceso basado en roles (RBAC)</li>
                <li>Monitoreo continuo de seguridad</li>
                <li>Políticas internas de protección de datos</li>
                <li>Copias de seguridad periódicas</li>
              </ul>
              <p>Sin embargo, ningún sistema de seguridad es infalible. Le recomendamos tomar precauciones para proteger sus credenciales de acceso.</p>
            </Section>

            <Section title="9. Uso de Herramientas de Terceros">
              <p>Utilizamos las siguientes herramientas de terceros que pueden tener acceso a sus datos personales bajo sus propias políticas de privacidad:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#091F4F] text-white">
                      <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Herramienta</th>
                      <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Finalidad</th>
                      <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider">Política</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="p-3 font-bold">Supabase</td><td className="p-3">Base de datos y autenticación</td><td className="p-3"><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">supabase.com/privacy</a></td></tr>
                    <tr><td className="p-3 font-bold">Mercado Pago</td><td className="p-3">Procesamiento de pagos</td><td className="p-3"><a href="https://www.mercadopago.com.pe/privacidad" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">mercadopago.com.pe/privacidad</a></td></tr>
                    <tr><td className="p-3 font-bold">Google Analytics</td><td className="p-3">Análisis de tráfico (previa autorización)</td><td className="p-3"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">policies.google.com/privacy</a></td></tr>
                    <tr><td className="p-3 font-bold">Google Tag Manager</td><td className="p-3">Gestión de etiquetas (previa autorización)</td><td className="p-3"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">policies.google.com/privacy</a></td></tr>
                    <tr><td className="p-3 font-bold">Leaflet / OpenStreetMap</td><td className="p-3">Mapas interactivos</td><td className="p-3"><a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">osmfoundation.org/privacy</a></td></tr>
                    <tr><td className="p-3 font-bold">Cloudflare</td><td className="p-3">CDN y seguridad (Turnstile CAPTCHA)</td><td className="p-3"><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">cloudflare.com/privacypolicy</a></td></tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="10. Menores de Edad">
              <p>Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos intencionadamente datos personales de menores de edad. Si tenemos conocimiento de que un menor nos ha proporcionado datos personales, procederemos a eliminarlos de forma inmediata.</p>
            </Section>

            <Section title="11. Modificaciones a la Política de Privacidad">
              <p>Nos reservamos el derecho de modificar la presente Política de Privacidad en cualquier momento. Las modificaciones serán notificadas a través de la Plataforma y, cuando sea posible, mediante correo electrónico a los usuarios registrados. Le recomendamos revisar periódicamente esta página para mantenerse informado sobre cómo protegemos sus datos.</p>
            </Section>

            <Section title="12. Contacto del Delegado de Protección de Datos">
              <div className="bg-[#091F4F] text-white p-8 rounded-[2rem]">
                <h4 className="font-black text-lg uppercase tracking-tight mb-4">¿Tiene alguna consulta sobre sus datos personales?</h4>
                <p className="text-blue-200 text-sm mb-6">Puede contactar a nuestro Delegado de Protección de Datos Personales para cualquier consulta relacionada con el tratamiento de sus datos:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    <span className="font-bold">{contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <span className="font-bold">{contactAddress}</span>
                  </div>
                </div>
              </div>
            </Section>

          </div>
        </div>
      </div>

      <div className="bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cumplimiento Ley N° 29733 - Protección de Datos Personales</p>
            <button onClick={onBack} className="bg-[#091F4F] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all">
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2 className="text-xl font-black text-[#091F4F] uppercase tracking-tight mb-5 pb-3 border-b-2 border-red-600">
      {title}
    </h2>
    <div className="space-y-4">{children}</div>
  </section>
);

export default PrivacyPolicy;
