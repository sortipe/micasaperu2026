
import { Property, User, Package, LocationItem } from './types';

export const COMMON_FEATURES = [
  'Área de lavandería', 'Pet friendly', 'Sistema de seguridad', 'Balcón con vista',
  'Áreas verdes', 'Estacionamiento techado', 'Acceso controlado', 'Intercomunicador',
  'Piscina', 'Gimnasio', 'Ascensor', 'Terraza', 'Aire acondicionado', 'Zona BBQ', 'Parrilla',
  'Servicio de Luz', 'Servicio de Agua', 'Gas natural', 'Recepción', 'Cancha de futbol'
];

export const PROPERTY_CATEGORIES = [
  'Casa',
  'Departamento',
  'Terreno',
  'Oficina comercial',
  'Local comercial',
  'Casa de campo',
  'Casa de playa',
  'Condominio de edificios',
  'Desarrollo vertical',
  'Desarrollo horizontal',
  'Edificios',
  'Cochera',
  'Habitación',
  'Hotel',
  'Lote',
  'Nave industrial',
  'Proyectos de lotes',
  'Terreno agrícola',
  'Traspaso',
  'Negocio',
  'Departamento Dúplex',
  'Amoblado',
  'Local industrial',
  'Triplex'
];

export const PACKAGES: Package[] = [
  {
    id: 'pkg-001-monthly',
    name: 'Pack 1 Simple Alquiler Mensual',
    price: 100,
    propertyLimit: 1,
    durationDays: 30,
    featuredLimit: 0,
    superFeaturedLimit: 0,
    description: '30 días de publicación - Sin renovación automática|NO VÁLIDO PARA VENTA - SOLO ALQUILER|Visibilidad estándar',
    features: ['1 Propiedad', '30 días de publicación - Sin renovación automática', 'Solo Alquiler'],
    packageGroup: 'Mensual'
  },
  {
    id: 'pkg-002-quarterly',
    name: 'Pack 1 Superdestacado Trimestral',
    price: 390,
    propertyLimit: 1,
    durationDays: 90,
    featuredLimit: 0,
    superFeaturedLimit: 1,
    description: '90 días de publicación|PAGO MENSUAL hasta el vencimiento|Máxima exposición',
    features: ['1 Propiedad', '90 días de publicación - Sin renovación automática', '1 Super Destacado', 'Máxima Exposición'],
    packageGroup: 'Trimestral'
  },
  {
    id: 'pkg-003-quarterly',
    name: 'Pack 1 Destacado Trimestral',
    price: 196,
    propertyLimit: 1,
    durationDays: 90,
    featuredLimit: 1,
    superFeaturedLimit: 0,
    description: '90 días de publicación|PAGO MENSUAL hasta el vencimiento|Visibilidad destacada en el portal',
    features: ['1 Propiedad', '90 días de publicación - Sin renovación automática', '1 Destacado', 'Visibilidad Mejorada'],
    packageGroup: 'Trimestral'
  },
  {
    id: 'pkg-004-quarterly',
    name: 'Pack 1 Simple Trimestral',
    price: 169,
    propertyLimit: 1,
    durationDays: 90,
    featuredLimit: 0,
    superFeaturedLimit: 0,
    description: '90 días de publicación|PAGO MENSUAL hasta el vencimiento|Visibilidad estándar',
    packageGroup: 'Trimestral'
  },
  {
    id: 'pkg-005-monthly',
    name: 'Pack 3 Avisos destacados',
    price: 415,
    propertyLimit: 3,
    durationDays: 30,
    featuredLimit: 3,
    superFeaturedLimit: 0,
    description: '30 días de publicación|PAGO MENSUAL hasta el vencimiento|Visibilidad destacada en el portal',
    packageGroup: 'Mensual'
  },
  {
    id: 'pkg-006-quarterly',
    name: 'Pack 3 Avisos Súper destacados',
    price: 815,
    propertyLimit: 3,
    durationDays: 90,
    featuredLimit: 0,
    superFeaturedLimit: 3,
    description: '90 días de publicación|PAGO MENSUAL hasta el vencimiento|Máxima exposición',
    packageGroup: 'Trimestral'
  },
  {
    id: 'pkg-007-monthly',
    name: 'Pack 5 avisos (mixto)',
    price: 730,
    propertyLimit: 5,
    durationDays: 30,
    featuredLimit: 2,
    superFeaturedLimit: 1,
    description: 'Aprox. S/730 al mes + IGV|Pack mixto de 5 avisos',
    packageGroup: 'Mensual'
  },
  {
    id: 'pkg-008-monthly',
    name: 'Pack 10 avisos (7 simples + 2 destacados + 1 Súper destacado)',
    price: 690,
    propertyLimit: 10,
    durationDays: 30,
    featuredLimit: 2,
    superFeaturedLimit: 1,
    description: '7 simples + 2 destacados + 1 Súper destacado|Aprox. S/690 al mes + IGV',
    packageGroup: 'Mensual'
  },
  {
    id: 'pkg-009-monthly',
    name: 'Pack 5 avisos destacados',
    price: 980,
    propertyLimit: 5,
    durationDays: 30,
    featuredLimit: 5,
    superFeaturedLimit: 0,
    description: 'Aprox. S/980 al mes + IGV|5 avisos destacados',
    packageGroup: 'Mensual'
  }
];

export const PERU_LOCATIONS: LocationItem[] = [
  // Departamentos
  { id: 'dep-lima', name: "Lima", type: "Departamento", lat: -12.0464, lng: -77.0428 },
  { id: 'dep-san-martin', name: "San Martín", type: "Departamento", lat: -6.485, lng: -76.375 },
  { id: 'dep-arequipa', name: "Arequipa", type: "Departamento", lat: -16.409, lng: -71.537 },
  { id: 'dep-cusco', name: "Cusco", type: "Departamento", lat: -13.531, lng: -71.967 },
  { id: 'dep-la-libertad', name: "La Libertad", type: "Departamento", lat: -8.115, lng: -79.028 },
  { id: 'dep-piura', name: "Piura", type: "Departamento", lat: -5.194, lng: -80.632 },
  { id: 'dep-lambayeque', name: "Lambayeque", type: "Departamento", lat: -6.701, lng: -79.906 },
  { id: 'dep-ica', name: "Ica", type: "Departamento", lat: -14.067, lng: -75.728 },
  { id: 'dep-junin', name: "Junín", type: "Departamento", lat: -12.065, lng: -75.204 },
  { id: 'dep-ancash', name: "Ancash", type: "Departamento", lat: -9.527, lng: -77.527 },
  
  // Distritos Clave Lima
  { id: 'dis-smp', name: "San Martín de Porres", type: "Distrito", parent: "Lima", lat: -12.000, lng: -77.050 },
  { id: 'dis-miraflores', name: "Miraflores", type: "Distrito", parent: "Lima", lat: -12.122, lng: -77.031 },
  { id: 'dis-san-isidro', name: "San Isidro", type: "Distrito", parent: "Lima", lat: -12.096, lng: -77.042 },
  { id: 'dis-san-borja', name: "San Borja", type: "Distrito", parent: "Lima", lat: -12.109, lng: -76.996 },
  { id: 'dis-surco', name: "Santiago de Surco", type: "Distrito", parent: "Lima", lat: -12.140, lng: -76.980 },
  { id: 'dis-la-molina', name: "La Molina", type: "Distrito", parent: "Lima", lat: -12.083, lng: -76.924 },
  { id: 'dis-los-olivos', name: "Los Olivos", type: "Distrito", parent: "Lima", lat: -11.992, lng: -77.067 },
  { id: 'dis-sjl', name: "San Juan de Lurigancho", type: "Distrito", parent: "Lima", lat: -12.000, lng: -77.000 },
  { id: 'dis-barranco', name: "Barranco", type: "Distrito", parent: "Lima", lat: -12.148, lng: -77.021 },
  { id: 'dis-jesus-maria', name: "Jesús María", type: "Distrito", parent: "Lima", lat: -12.074, lng: -77.048 },
  { id: 'dis-magdalena', name: "Magdalena del Mar", type: "Distrito", parent: "Lima", lat: -12.091, lng: -77.070 },
  { id: 'dis-pueblo-libre', name: "Pueblo Libre", type: "Distrito", parent: "Lima", lat: -12.073, lng: -77.063 },
  { id: 'dis-lince', name: "Lince", type: "Distrito", parent: "Lima", lat: -12.083, lng: -77.033 },
  { id: 'dis-chorrillos', name: "Chorrillos", type: "Distrito", parent: "Lima", lat: -12.175, lng: -77.018 },
  { id: 'dis-san-miguel', name: "San Miguel", type: "Distrito", parent: "Lima", lat: -12.077, lng: -77.090 },
  { id: 'dis-surquillo', name: "Surquillo", type: "Distrito", parent: "Lima", lat: -12.113, lng: -77.022 },
  { id: 'dis-ate', name: "Ate", type: "Distrito", parent: "Lima", lat: -12.024, lng: -76.911 },
  { id: 'dis-brena', name: "Breña", type: "Distrito", parent: "Lima", lat: -12.062, lng: -77.048 },
  { id: 'dis-santa-anita', name: "Santa Anita", type: "Distrito", parent: "Lima", lat: -12.046, lng: -76.971 },
  { id: 'dis-ves', name: "Villa El Salvador", type: "Distrito", parent: "Lima", lat: -12.213, lng: -76.936 },
  { id: 'dis-rimac', name: "Rímac", type: "Distrito", parent: "Lima", lat: -12.035, lng: -77.030 },

  // San Martín (Departamento)
  { id: 'ciu-tarapoto', name: "Tarapoto", type: "Ciudad", parent: "San Martín", lat: -6.480, lng: -76.360 },
  { id: 'ciu-moyobamba', name: "Moyobamba", type: "Ciudad", parent: "San Martín", lat: -6.035, lng: -76.971 },
  { id: 'ciu-juanjui', name: "Juanjuí", type: "Ciudad", parent: "San Martín", lat: -7.177, lng: -76.726 },
  { id: 'ciu-rioja', name: "Rioja", type: "Ciudad", parent: "San Martín", lat: -6.061, lng: -77.167 },
  { id: 'ciu-picota', name: "Picota", type: "Ciudad", parent: "San Martín", lat: -6.918, lng: -76.332 },
  { id: 'ciu-tocache', name: "Tocache", type: "Ciudad", parent: "San Martín", lat: -8.184, lng: -76.512 },

  // Otros
  { id: 'ciu-cusco', name: "Cusco", type: "Ciudad", parent: "Cusco", lat: -13.518, lng: -71.978 },
  { id: 'ciu-trujillo', name: "Trujillo", type: "Ciudad", parent: "La Libertad", lat: -8.111, lng: -79.028 },
  { id: 'ciu-arequipa', name: "Arequipa", type: "Ciudad", parent: "Arequipa", lat: -16.409, lng: -71.537 }
];

// Usamos IDs que parezcan UUIDs para evitar errores de sintaxis en el cliente
export const INITIAL_PROPERTIES: Property[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Penthouse de Lujo con Vista al Mar',
    description: 'Exclusivo departamento frente al Malecón de la Reserva. Cuenta con acabados de mármol, terraza privada con piscina y seguridad las 24 horas.',
    pricePEN: 2100000,
    priceUSD: 560000,
    constructionArea: 180,
    builtArea: 180,
    floors: 1,
    yearBuilt: 2,
    terrainArea: 180,
    department: 'Lima',
    district: 'Miraflores',
    address: 'Malecón de la Reserva 450',
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    featuredImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070',
    gallery: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2070',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080'
    ],
    features: ['Ascensor Directo', 'Piscina', 'Terraza', 'Jacuzzi', 'Seguridad 24/7'],
    type: 'Departamento',
    status: 'FOR_SALE',
    agentId: '00000000-0000-0000-0000-000000000000',
    agentName: 'Jorge Joel',
    agentAvatar: 'https://ui-avatars.com/api/?name=Jorge+Joel&background=ef4444&color=fff',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
    isFeatured: true,
    lat: -12.1265,
    lng: -77.0372
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Moderna Casa Minimalista en La Molina',
    description: 'Hermosa propiedad de diseño contemporáneo ubicada en Rinconada del Lago. Amplios jardines, cocina tipo isla y techos de doble altura.',
    pricePEN: 3200000,
    priceUSD: 850000,
    constructionArea: 350,
    builtArea: 350,
    floors: 2,
    yearBuilt: 4,
    terrainArea: 500,
    department: 'Lima',
    district: 'La Molina',
    address: 'Av. Rinconada del Lago 120',
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    featuredImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070',
    gallery: [],
    features: ['Jardín Amplio', 'Zona BBQ', 'Cisterna', 'Walking Closet', 'Estudio'],
    type: 'Casa',
    status: 'FOR_SALE',
    agentId: '00000000-0000-0000-0000-000000000000',
    agentName: 'Jorge Joel',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 45 * 86400000).toISOString(),
    isFeatured: true,
    lat: -12.0833,
    lng: -76.9242
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    title: 'Departamento Estreno en San Isidro',
    description: 'Cerca al Lima Golf Club, acabados de primera, zona exclusiva y tranquila.',
    pricePEN: 1200000,
    priceUSD: 320000,
    constructionArea: 120,
    builtArea: 120,
    floors: 1,
    yearBuilt: 1,
    terrainArea: 120,
    department: 'Lima',
    district: 'San Isidro',
    address: 'Av. Pezet 980',
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    featuredImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070',
    gallery: [],
    features: ['Gimnasio', 'Seguridad 24/7'],
    type: 'Departamento',
    status: 'FOR_SALE',
    agentId: '00000000-0000-0000-0000-000000000000',
    agentName: 'Inmobiliaria Premium',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    isFeatured: false,
    lat: -12.0967,
    lng: -77.0428
  }
];

export const DEPARTMENTS = PERU_LOCATIONS.filter(l => l.type === 'Departamento').map(l => l.name);
