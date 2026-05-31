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

export function parseProgrammaticUrl(pathname: string): ProgrammaticRoute | null {
  const path = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
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
    'villa-maria-del-triunfo': 'Villa María del Triunfo', 'villa maria del triunfo': 'Villa María del Triunfo', 'vmt': 'Villa María del Triunfo',
    'san-juan-de-miraflores': 'San Juan de Miraflores', 'san juan de miraflores': 'San Juan de Miraflores',
    'cercado-de-lima': 'Cercado de Lima', 'cercado de lima': 'Cercado de Lima', 'centro-de-lima': 'Cercado de Lima',
    'comas': 'Comas',
    'independencia': 'Independencia', 'independencia-lima': 'Independencia',
    'carabayllo': 'Carabayllo',
    'puente-piedra': 'Puente Piedra', 'puente piedra': 'Puente Piedra',
    'ventanilla': 'Ventanilla',
    'san-luis': 'San Luis', 'san luis': 'San Luis',
    'arequipa': 'Arequipa',
    'trujillo': 'Trujillo',
    'cusco': 'Cusco',
    'tarapoto': 'Tarapoto',
    'ica': 'Ica',
    'piura': 'Piura',
    'huaraz': 'Huaraz',
    'chiclayo': 'Chiclayo',
    'lambayeque': 'Lambayeque',
    'huancayo': 'Huancayo',
    'pucallpa': 'Pucallpa',
    'iquitos': 'Iquitos',
    'puno': 'Puno',
    'tacna': 'Tacna',
    'moquegua': 'Moquegua',
    'ayacucho': 'Ayacucho',
    'cajamarca': 'Cajamarca',
    'junin': 'Junín', 'junín': 'Junín',
    'huanuco': 'Huánuco', 'huánuco': 'Huánuco',
    'ucayali': 'Ucayali',
    'madre-de-dios': 'Madre de Dios', 'madre de dios': 'Madre de Dios', 'puerto-maldonado': 'Madre de Dios',
    'san-martin': 'San Martín', 'san martin': 'San Martín',
    'ancash': 'Áncash', 'áncash': 'Áncash',
    'apurimac': 'Apurímac', 'apurímac': 'Apurímac'
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    if (knownTypes[part]) {
      type = knownTypes[part];
      rawType = part;
      continue;
    }

    if (knownStatus[part]) {
      status = knownStatus[part];
      rawStatus = part;
      continue;
    }

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
      district = districtCandidate.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      districtSlug = districtCandidate;
    }
  }

  if (!district || (!type && !status)) return null;

  if (!type) { type = 'Departamento'; rawType = 'departamentos'; }
  if (!status) { status = 'FOR_SALE'; rawStatus = 'venta'; }

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
