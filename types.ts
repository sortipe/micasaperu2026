
export type Role = 'ADMINISTRADOR' | 'PARTICULAR DUEÑO DIRECTO' | 'INMOBILARIA CORREDOR' | 'CONSTRUCTORA DESARROLLADORA';

export type LegalDocType = 'TERMS_USE' | 'TERMS_CONTRACT' | 'PRIVACY' | 'PROPERTY_POLICIES';

export type PropertyCategory = 
  | 'Casa'
  | 'Departamento'
  | 'Terreno'
  | 'Oficina comercial'
  | 'Local comercial'
  | 'Casa de campo'
  | 'Casa de playa'
  | 'Condominio de edificios'
  | 'Desarrollo vertical'
  | 'Desarrollo horizontal'
  | 'Edificios'
  | 'Cochera'
  | 'Habitación'
  | 'Hotel'
  | 'Lote'
  | 'Nave industrial'
  | 'Proyectos de lotes'
  | 'Terreno agrícola'
  | 'Traspaso'
  | 'Negocio'
  | 'Departamento Dúplex'
  | 'Amoblado'
  | 'Local industrial'
  | 'Triplex';

export interface OfficeInfo {
  address: string;
  email: string;
  phone: string;
  supportWhatsapp?: string;
  constructoraWhatsapp?: string;
}

export interface SocialLink {
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | 'TIKTOK' | 'WHATSAPP';
  url: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  propertyLimit: number;
  durationDays: number;
  featuredLimit: number;
  superFeaturedLimit?: number;
  description: string;
  features?: string[];
  isActive?: boolean;
  allowedRoles?: Role[];
  allowedOperation?: 'RENT' | 'SALE' | 'BOTH';
}

export interface LocationItem {
  id?: string;
  name: string;
  type: 'Departamento' | 'Provincia' | 'Distrito' | 'Avenida' | 'Urbanización' | 'Asentamiento' | 'Anexo' | 'Ciudad';
  parent?: string;
  lat?: number;
  lng?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'TRANSFER' | 'QR' | 'CARD' | 'MERCADOPAGO';
  bankName?: string;
  accountNumber?: string;
  cci?: string;
  qrUrl?: string;
  paymentLink?: string;
  instructions?: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  packageId: string;
  packageName: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  paymentMethodName: string;
  operationNumber?: string;
  securityCode?: string;
}

export interface Complaint {
  id: string;
  date: string;
  claimantName: string;
  claimantPaternal: string;
  claimantMaternal: string;
  claimantAddress: string;
  claimantDocType: string;
  claimantDocNumber: string;
  claimantPhone: string;
  claimantEmail: string;
  claimantAge: string;
  productService: 'PRODUCTO' | 'SERVICIO';
  claimedAmount: number;
  description: string;
  attendedBy?: string;
  type: 'RECLAMO' | 'QUEJA';
  detail: string;
  request: string;
  status: 'PENDIENTE' | 'ATENDIDO';
}

export interface LegalDoc {
  id: string;
  type: LegalDocType;
  title: string;
  content: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  pricePEN: number;
  priceUSD: number;
  maintenanceFee?: number;
  constructionArea: number; // Área de terreno / Total
  terrainArea: number; // Duplicado conceptualmente pero mantenido para compatibilidad
  builtArea?: number; // Área construida (NUEVO)
  floors?: number; // Número de pisos (NUEVO)
  yearBuilt?: number; // Año de construcción (NUEVO)
  department: string;
  district: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  parkingCovered?: boolean;
  featuredImage: string;
  gallery: string[];
  documents?: string[];
  features?: string[];
  type: PropertyCategory;
  status: 'FOR_SALE' | 'FOR_RENT' | 'PROJECT' | 'SOLD' | 'TEMPORAL' | 'TRASPASO';
  deliveryMonth?: string;
  deliveryYear?: number;
  agentId: string; 
  agentName?: string;
  agentAvatar?: string;
  agentWhatsapp?: string;
  createdAt: string;
  publishedAt?: string;
  expiresAt: string; 
  isFeatured: boolean; 
  planType?: 'BASIC' | 'FEATURED' | 'SUPER_FEATURED';
  allowAdsUsage?: boolean;
  lat?: number;
  lng?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  date: string;
  isRead: boolean;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  agentId: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderDni?: string;
  message: string;
  date: string;
  isRead: boolean;
}

export interface CartItem {
  id: string; // unique id for the cart item (e.g. timestamp)
  package: Package;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  whatsapp?: string;
  propertiesRemaining: number;
  featuredRemaining: number;
  superFeaturedRemaining?: number;
}
