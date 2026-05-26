/**
 * Utilidades para el SEO Programático de Mi Casa Perú.
 * Proporciona el analizador de URLs dinámicas para mapear rutas amigables a filtros de búsqueda.
 */

export interface ProgrammaticRoute {
  type: string;
  status: 'FOR_SALE' | 'FOR_RENT' | 'TEMPORAL' | 'PROJECT' | 'TRASPASO';
  district: string;
  amenity: string | null;
  slugs: {
    type: string;
    status: string;
    district: string;
    amenity: string | null;
  };
}

/**
 * Parsea una ruta de URL en minúsculas y extrae las variables del SEO Programático.
 * Soporta múltiples formas flexibles:
 * A) Tipo + Operación + Distrito + [Amenity]: /departamentos-en-venta-en-miraflores-con-balcon/
 * B) Tipo + Distrito + [Amenity] (Venta por defecto): /casas-en-surco-con-jardin/
 * C) Operación + Distrito + [Amenity] (Departamento por defecto): /alquileres-en-san-isidro-pet-friendly/
 * 
 * Retorna un objeto ProgrammaticRoute o null si la URL no es programática.
 */
export function parseProgrammaticUrl(pathname: string): ProgrammaticRoute | null {
  // Normalizar el path: eliminar barras inclinadas al inicio/final y pasar a minúsculas
  const path = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();

  // Dividimos la cadena por "-en-"
  const parts = path.split('-en-');
  if (parts.length < 2) return null;

  let type: string | null = null;
  let status: 'FOR_SALE' | 'FOR_RENT' | 'TEMPORAL' | 'PROJECT' | 'TRASPASO' | null = null;
  let district: string | null = null;
  let amenity: string | null = null;

  let rawType = '';
  let rawStatus = '';
  let districtSlug = '';
  let amenitySlug: string | null = null;

  const knownTypes: Record<string, string> = {
    'departamento': 'Departamento', 'departamentos': 'Departamento',
    'casa': 'Casa', 'casas': 'Casa',
    'terreno': 'Terreno', 'terrenos': 'Terreno',
    'oficina': 'Oficina comercial', 'oficinas': 'Oficina comercial',
    'local': 'Local comercial', 'locales': 'Local comercial',
    'habitacion': 'Habitación', 'habitaciones': 'Habitación',
    'lote': 'Lote', 'lotes': 'Lote',
    'cochera': 'Cochera', 'cocheras': 'Cochera',
    'proyecto': 'Proyectos de lotes', 'proyectos': 'Proyectos de lotes'
  };

  const knownStatus: Record<string, 'FOR_SALE' | 'FOR_RENT' | 'TEMPORAL' | 'PROJECT' | 'TRASPASO'> = {
    'venta': 'FOR_SALE', 'ventas': 'FOR_SALE',
    'alquiler': 'FOR_RENT', 'alquileres': 'FOR_RENT',
    'temporal': 'TEMPORAL', 'temporales': 'TEMPORAL',
    'proyecto': 'PROJECT', 'proyectos': 'PROJECT',
    'traspaso': 'TRASPASO', 'traspasos': 'TRASPASO'
  };

  const knownDistricts: Record<string, string> = {
    'miraflores': 'Miraflores',
    'san-isidro': 'San Isidro', 'san isidro': 'San Isidro',
    'santiago-de-surco': 'Santiago de Surco', 'santiago de surco': 'Santiago de Surco',
    'surco': 'Santiago de Surco',
    'la-molina': 'La Molina', 'la molina': 'La Molina',
    'san-borja': 'San Borja', 'san borja': 'San Borja',
    'los-olivos': 'Los Olivos', 'los olivos': 'Los Olivos',
    'san-martin-de-porres': 'San Martín de Porres', 'san martin de porres': 'San Martín de Porres', 'smp': 'San Martín de Porres',
    'san-juan-de-lurigancho': 'San Juan de Lurigancho', 'san juan de lurigancho': 'San Juan de Lurigancho', 'sjl': 'San Juan de Lurigancho',
    'barranco': 'Barranco',
    'jesus-maria': 'Jesús María', 'jesus maria': 'Jesús María',
    'magdalena-del-mar': 'Magdalena del Mar', 'magdalena del mar': 'Magdalena del Mar', 'magdalena': 'Magdalena del Mar',
    'pueblo-libre': 'Pueblo Libre', 'pueblo libre': 'Pueblo Libre',
    'lince': 'Lince',
    'chorrillos': 'Chorrillos',
    'san-miguel': 'San Miguel', 'san miguel': 'San Miguel',
    'surquillo': 'Surquillo',
    'ate': 'Ate',
    'breña': 'Breña', 'brena': 'Breña',
    'santa-anita': 'Santa Anita', 'santa anita': 'Santa Anita',
    'villa-el-salvador': 'Villa El Salvador', 'villa el salvador': 'Villa El Salvador', 'ves': 'Villa El Salvador',
    'rimac': 'Rímac', 'rímac': 'Rímac',
    'arequipa': 'Arequipa',
    'trujillo': 'Trujillo',
    'cusco': 'Cusco',
    'tarapoto': 'Tarapoto'
  };

  // Iterar por las partes del split para clasificar cada elemento
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Verificar si es un tipo conocido
    if (knownTypes[part]) {
      type = knownTypes[part];
      rawType = part;
      continue;
    }

    // Verificar si es una operación conocida
    if (knownStatus[part]) {
      status = knownStatus[part];
      rawStatus = part;
      continue;
    }

    // De lo contrario, esta parte contiene el Distrito y el Amenity
    let districtCandidate = part;

    if (part.includes('-con-')) {
      const subParts = part.split('-con-');
      districtCandidate = subParts[0];
      amenitySlug = 'con-' + subParts[1];
    } else if (part.includes('-pet-friendly')) {
      const subParts = part.split('-pet-friendly');
      districtCandidate = subParts[0];
      amenitySlug = 'pet-friendly';
    } else {
      // Buscar sufijo conocido
      const knownAmenities = ['jardin', 'balcon', 'piscina', 'terraza', 'cochera', 'ascensor', 'seguridad'];
      for (const amen of knownAmenities) {
        if (part.endsWith('-' + amen)) {
          districtCandidate = part.substring(0, part.length - amen.length - 1);
          amenitySlug = amen;
          break;
        }
      }
    }

    if (knownDistricts[districtCandidate]) {
      district = knownDistricts[districtCandidate];
      districtSlug = districtCandidate;
    } else {
      // Fallback: capitalizar palabras
      district = districtCandidate.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      districtSlug = districtCandidate;
    }
  }

  // Una ruta programática válida requiere al menos un Distrito e intenciones (tipo u operación)
  if (!district || (!type && !status)) {
    return null;
  }

  // Valores predeterminados si faltan en la URL
  if (!type) {
    type = 'Departamento'; // Por defecto
    rawType = 'departamentos';
  }
  if (!status) {
    status = 'FOR_SALE'; // Venta por defecto
    rawStatus = 'venta';
  }

  // Mapear Amenity Slug al nombre formal en COMMON_FEATURES
  if (amenitySlug) {
    if (amenitySlug.includes('jardin')) amenity = 'Áreas verdes';
    else if (amenitySlug.includes('balcon')) amenity = 'Balcón con vista';
    else if (amenitySlug.includes('piscina')) amenity = 'Piscina';
    else if (amenitySlug.includes('terraza')) amenity = 'Terraza';
    else if (amenitySlug.includes('pet-friendly') || amenitySlug.includes('mascotas')) amenity = 'Pet friendly';
    else if (amenitySlug.includes('cochera') || amenitySlug.includes('estacionamiento')) amenity = 'Estacionamiento techado';
    else if (amenitySlug.includes('ascensor')) amenity = 'Ascensor';
    else if (amenitySlug.includes('seguridad')) amenity = 'Sistema de seguridad';
  }

  return {
    type,
    status,
    district,
    amenity,
    slugs: {
      type: rawType,
      status: rawStatus,
      district: districtSlug,
      amenity: amenitySlug
    }
  };
}
