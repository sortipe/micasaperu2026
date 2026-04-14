
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Property, User, Role, Package, Transaction, PaymentMethod, LocationItem, Complaint, LegalDoc, LegalDocType, Notification, Inquiry, SocialLink, OfficeInfo, CartItem } from './types';
import { INITIAL_PROPERTIES, PACKAGES as INITIAL_PACKAGES, PERU_LOCATIONS } from './constants';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PropertyList from './components/PropertyList';
import PublicationFlow from './components/PublicationFlow';
import PropertyDetails from './components/PropertyDetails';
import SearchHero from './components/SearchHero';
import MapView from './components/MapView';
import PricingPage from './components/PricingPage';
import ClientDashboard from './components/ClientDashboard';
import AuthPage from './components/AuthPage';
import PaymentFlow from './components/PaymentFlow';
import ComplaintsBook from './components/ComplaintsBook';
import LegalModal from './components/LegalModal';
import Toast, { ToastType } from './components/Toast';
import CookieConsent from './components/CookieConsent';
import DevelopmentOptions from './components/DevelopmentOptions';
import SupportButton from './components/SupportButton';
import CartPage from './components/CartPage';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { initMercadoPago } from '@mercadopago/sdk-react';


const ADMIN_EMAIL = 'jorgejoelifzyape@gmail.com';

const App: React.FC = () => {
  const isAppInitialized = useRef(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isFetchingProperties, setIsFetchingProperties] = useState(false);
  const [packages, setPackages] = useState<Package[]>(INITIAL_PACKAGES);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartCheckout, setIsCartCheckout] = useState(false);
  const [locations, setLocations] = useState<LocationItem[]>(PERU_LOCATIONS as LocationItem[]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [legalDocs, setLegalDocs] = useState<LegalDoc[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [homeBanner, setHomeBanner] = useState<string | null>(null);
  const [homeBannerMobile, setHomeBannerMobile] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingTime, setLoadingTime] = useState(0);
  const [officeInfo, setOfficeInfo] = useState<OfficeInfo>({ 
    address: 'Av. Benavides 768, Int. 1303, Miraflores, Lima', 
    email: 'hola@aquivivir.com', 
    phone: '',
    constructoraWhatsapp: ''
  });
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { platform: 'FACEBOOK', url: '' }, { platform: 'INSTAGRAM', url: '' }, { platform: 'LINKEDIN', url: '' }, { platform: 'TIKTOK', url: '' }, { platform: 'WHATSAPP', url: '' }
  ]);
  const [mpPublicKey, setMpPublicKey] = useState<string>('APP_USR-c72f0355-efb1-4510-b26b-0ae474fb71b3');
  const [mpAccessToken, setMpAccessToken] = useState<string>('APP_USR-196044625653701-040114-066c31d3a85d0124177981fb2c7966a8-3296424329');
  const [mpClientId, setMpClientId] = useState<string>('1960446256553701');
  const [mpClientSecret, setMpClientSecret] = useState<string>('vB3NvBI7MC4mZaqZoO5228Fu0SgjOChG');
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '11111111-1111-1111-1111-111111111111', name: 'BCP Soles', type: 'TRANSFER', bankName: 'BCP', accountNumber: '193-99238472-0-12', cci: '002-193009923847201211', instructions: 'Realiza la transferencia y adjunta una captura del comprobante con el número de operación.', isActive: true },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Yape Oficial', type: 'QR', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Yape-Demo', instructions: 'Escanea el código QR desde tu app Yape y adjunta la captura de pantalla del pago.', isActive: true },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Mercado Pago', type: 'MERCADOPAGO', instructions: 'Paga de forma rápida y segura a través de Mercado Pago. Luego de pagar, el sistema confirmará tu pago automáticamente.', isActive: true }
  ]);

  const [view, setView] = useState<'HOME' | 'ADMIN' | 'DETAILS' | 'SEARCH' | 'PRICING' | 'DASHBOARD' | 'AUTH' | 'PAYMENT' | 'COMPLAINTS_BOOK' | 'CART'>('HOME');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalDocType | null>(null);
  const [searchLayout, setSearchLayout] = useState<'LIST' | 'MAP'>('LIST');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [spatialFilterIds, setSpatialFilterIds] = useState<string[] | null>(null);
  const [focusedLocation, setFocusedLocation] = useState<LocationItem | null>(null);
  
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'INFO') => {
    setToast({ message, type });
  };

  const handleAddToCart = (pkg: Package) => {
    setCart(prev => {
      const existing = prev.find(item => item.package.id === pkg.id);
      if (existing) {
        return prev.map(item => item.package.id === pkg.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: crypto.randomUUID(), package: pkg, quantity: 1 }];
    });
    showToast(`${pkg.name} agregado al carrito`, 'SUCCESS');
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    showToast('Producto eliminado del carrito', 'INFO');
  };

  const handleUpdateCartQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const [filters, setFilters] = useState({ 
    query: '', 
    selectedLocations: [] as LocationItem[], 
    type: '', 
    status: '', 
    minPrice: 0, 
    maxPrice: Infinity, 
    currency: 'USD' as 'USD' | 'PEN', 
    sortBy: 'RELEVANT', 
    includeMaintenance: false,
    bedrooms: 0,
    maxBedrooms: Infinity,
    bathrooms: 0,
    parking: 0,
    minArea: 0,
    maxArea: Infinity,
    areaType: 'total' as 'total' | 'built',
    advertiserType: 'all' as 'all' | 'real_estate' | 'direct_owner',
    age: 'any' as 'any' | 'under_construction' | 'brand_new' | 'up_to_5_years',
    publicationDate: 'any' as 'any' | 'yesterday' | 'today' | 'last_week',
    selectedFeatures: [] as string[]
  });

  const [committedFilters, setCommittedFilters] = useState(filters);

  // Limpiar foco del mapa si el buscador está vacío o se elimina la ubicación enfocada
  useEffect(() => {
    if (filters.selectedLocations.length === 0) {
      setFocusedLocation(null);
    } else if (focusedLocation && !filters.selectedLocations.some(l => l.name === focusedLocation.name)) {
      // Si la ubicación que estaba enfocada ya no está seleccionada, quitamos el foco
      setFocusedLocation(null);
    }
  }, [filters.selectedLocations, focusedLocation]);

  useEffect(() => {
    if (favicon) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = favicon;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = favicon;
        document.head.appendChild(newLink);
      }
    }
  }, [favicon]);

  const handleOpenProperty = (id: string) => {
    setVisitedIds(p => new Set(p).add(id));
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('propertyId', id);
    window.open(url.toString(), '_blank');
  };

  useEffect(() => {
    if (mpPublicKey) {
      console.log("Initializing Mercado Pago with Public Key:", mpPublicKey.substring(0, 15) + "...");
      initMercadoPago(mpPublicKey, { locale: 'es-PE' });
    }
  }, [mpPublicKey]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isInitialLoading) {
      timer = setInterval(() => {
        setLoadingTime(prev => prev + 1000);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isInitialLoading]);

  const handleRescueReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, selectedPropertyId]);



  useEffect(() => {
    if (isAppInitialized.current) return;
    isAppInitialized.current = true;
    
    const initApp = async () => {
      const runSafe = async (name: string, fn: () => Promise<any>) => {
        try {
          await fn();
        } catch (err) {
          console.error(`Error in ${name}:`, err);
        }
      };

      // 1. Prepare critical background tasks
      const fetchPropertiesTask = runSafe('fetchProperties', fetchProperties);
      
      const otherBackgroundTasks = [
        runSafe('fetchSettings', fetchSettings),
        runSafe('fetchPackages', fetchPackages),
        runSafe('fetchLegalDocs', fetchLegalDocs),
        runSafe('fetchLocations', fetchLocations),
        runSafe('fetchPaymentMethods', fetchPaymentMethods)
      ];

      // 2. Safety Timeout (12 seconds)
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 12000));

      // 3. Wait for Properties OR Timeout
      // Rely on onAuthStateChange for session restoration
      await Promise.race([
        fetchPropertiesTask, 
        timeoutPromise
      ]);

      // Release the splash screen
      setIsInitialLoading(false);
      
      // 4. Ensure Auth is checked if not already fired by event
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !currentUser) {
           await fetchProfile(session.user.id);
        }
      }
      
      // Ensure all other tasks complete in background
      Promise.all(otherBackgroundTasks).catch(err => console.error("Background fetch error:", err));
      
      // Check URL for propertyId to open details directly
      const urlParams = new URLSearchParams(window.location.search);
      const propertyIdFromUrl = urlParams.get('propertyId');
      if (propertyIdFromUrl) {
        setSelectedPropertyId(propertyIdFromUrl);
        setView('DETAILS');
      }
    };
    initApp();
    
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.info(`🔐 Auth Event: ${event}`, session?.user?.email || 'No Session');
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
          if (session?.user) {
            try {
              await fetchProfile(session.user.id);
            } catch (err) {
              console.error("Authentication error during profile fetch:", err);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          // Opcional: Limpiar estados específicos del usuario si es necesario
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
       fetchTransactions();
       fetchComplaints();
       fetchPaymentMethods();
       fetchNotifications();
       fetchInquiries();
    }
  }, [currentUser]);

  const fetchProfile = async (userId: string) => {
    try {
      const controller = new AbortController();
      const profileTimeout = setTimeout(() => controller.abort(), 8000);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      clearTimeout(profileTimeout);
      
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
          console.error("⛔ Error de permisos en RLS (profiles). Ejecuta el SQL facilitado en Supabase.");
          showToast("Error de permisos: Comunícate con soporte para habilitar tu perfil.", "ERROR");
        } else {
          console.error("Error fetching profile:", error);
        }
        throw error;
      }

      if (data) {
        if (data.email === ADMIN_EMAIL) {
          data.role = 'ADMINISTRADOR';
        } else if (data.email === 'jorgejoel-ifz@hotmail.com') {
          data.role = 'PARTICULAR DUEÑO DIRECTO';
        }
        setCurrentUser(data as User);
        return data as User;
      } else {
        console.warn("No profile found for user in 'profiles' table:", userId);
        return null;
      }
    } catch (err) {
      console.error("fetchProfile critical error:", err);
      return null;
    }
  };

  const fetchInquiries = async () => {
    if (!currentUser) return;
    let query = supabase.from('inquiries').select('*');
    if (currentUser.role !== 'ADMINISTRADOR') query = query.eq('agentId', currentUser.id);
    const { data, error } = await query.order('date', { ascending: false });
    if (!error && data) setInquiries(data as Inquiry[]);
  };

  const handleSyncCredits = async (silent = false, targetUserId?: string) => {
    const userId = targetUserId || currentUser?.id;
    if (!userId) return;
    
    try {
      if (!silent) showToast("Sincronizando saldo...", "INFO");
      
      // 1. Get all completed transactions for this user
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('userId', userId)
        .eq('status', 'COMPLETED');
      
      if (txError) throw txError;
      
      if (!txs || txs.length === 0) {
        if (!silent) showToast("No se encontraron transacciones aprobadas para sincronizar.", "INFO");
        return;
      }

      // 2. Get all packages to know the limits
      const { data: pkgs, error: pkgError } = await supabase.from('packages').select('*');
      if (pkgError) throw pkgError;

      // 3. Calculate total credits ever purchased
      let totalProps = 0;
      let totalFeatured = 0;
      let totalSuper = 0;

      for (const tx of txs) {
        const pkg = pkgs.find(p => p.id === tx.packageId);
        if (pkg) {
          totalProps += (pkg.propertyLimit || 0);
          totalFeatured += (pkg.featuredLimit || 0);
          totalSuper += (pkg.superFeaturedLimit || 0);
        }
      }

      // 4. Get all properties published by this user to calculate used credits
      const { data: props, error: propsError } = await supabase
        .from('properties')
        .select('planType')
        .eq('agentId', userId);
      
      if (propsError) throw propsError;

      let usedProps = 0;
      let usedFeatured = 0;
      let usedSuper = 0;

      if (props) {
        for (const p of props) {
          if (p.planType === 'SUPER_FEATURED') usedSuper++;
          else if (p.planType === 'FEATURED') usedFeatured++;
          else usedProps++;
        }
      }

      // 5. Calculate remaining
      const updatedProfile = {
        propertiesRemaining: Math.max(0, totalProps - usedProps),
        featuredRemaining: Math.max(0, totalFeatured - usedFeatured),
        superFeaturedRemaining: Math.max(0, totalSuper - usedSuper)
      };

      const { error: updateError } = await supabase.from('profiles').update(updatedProfile).eq('id', userId);
      if (updateError) throw updateError;

      if (currentUser && currentUser.id === userId) {
        setCurrentUser({ ...currentUser, ...updatedProfile });
      }
      
      if (!silent) showToast("Saldo sincronizado con éxito", "SUCCESS");
    } catch (err) {
      console.error("Error syncing credits:", err);
      if (!silent) showToast("Error al sincronizar el saldo", "ERROR");
    }
  };

  const handleSendMessage = async (inquiryData: Partial<Inquiry>) => {
    if (!isSupabaseConfigured) {
      showToast("Supabase no está configurado. No se puede enviar el mensaje en modo demostración.", "ERROR");
      return;
    }
    try {
      const isDummyAgent = inquiryData.agentId?.startsWith('00000000');
      const finalAgentId = (isDummyAgent && currentUser) ? currentUser.id : inquiryData.agentId;

      const { error } = await supabase.from('inquiries').insert([{
        propertyId: inquiryData.propertyId,
        propertyTitle: inquiryData.propertyTitle,
        agentId: finalAgentId,
        senderName: inquiryData.senderName,
        senderEmail: inquiryData.senderEmail,
        senderPhone: inquiryData.senderPhone,
        senderDni: inquiryData.senderDni,
        message: inquiryData.message,
        date: new Date().toISOString(),
        isRead: false
      }]);
      if (error) throw error;
      if (currentUser) await fetchInquiries();
    } catch (err) {
      console.error("Error al enviar lead:", err);
      throw err;
    }
  };

  const fetchSettings = async () => {
    try {
      if (!isSupabaseConfigured) return;
      const { data, error } = await supabase.from('settings').select('*');
      if (error) {
        console.error('Error fetching settings:', error);
        if (error.message.includes('Failed to fetch')) {
          showToast("Error de red: Verifica que tu VITE_SUPABASE_URL sea correcta y no tengas extensiones bloqueando la conexión.", "ERROR");
        }
        return;
      }
      if (data) {
        data.forEach(item => {
          try {
            const parsedValue = JSON.parse(item.value);
            if (item.key === 'office_info') setOfficeInfo(parsedValue);
            if (item.key === 'social_links') setSocialLinks(parsedValue);
            if (item.key === 'mp_public_key') setMpPublicKey(item.value);
            if (item.key === 'mp_access_token') setMpAccessToken(item.value);
            if (item.key === 'mp_client_id') setMpClientId(item.value);
            if (item.key === 'mp_client_secret') setMpClientSecret(item.value);
          } catch (e) {
            // If parsing fails, it might just be a plain string
            if (item.key === 'app_logo') setAppLogo(item.value);
            if (item.key === 'home_banner') setHomeBanner(item.value);
            if (item.key === 'home_banner_mobile') setHomeBannerMobile(item.value);
            if (item.key === 'favicon') setFavicon(item.value);
            if (item.key === 'mp_public_key') setMpPublicKey(item.value);
            if (item.key === 'mp_access_token') setMpAccessToken(item.value);
            if (item.key === 'mp_client_id') setMpClientId(item.value);
            if (item.key === 'mp_client_secret') setMpClientSecret(item.value);
            // For office_info and social_links, we expect JSON, so we don't set if it fails
          }
        });
      }
    } catch (err) {
      console.error('Unexpected error in fetchSettings:', err);
    }
  };

  const handleUpdateProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    const { error } = await supabase.from('profiles').update(data).eq('id', currentUser.id);
    if (!error) {
      setCurrentUser({ ...currentUser, ...data });
      showToast("Perfil actualizado correctamente", "SUCCESS");
    }
    else {
      showToast("Error al actualizar perfil", "ERROR");
      throw error;
    }
  };

  const fetchProperties = async (retryCount = 0): Promise<void> => {
    setIsFetchingProperties(true);
    try {
      if (!isSupabaseConfigured) {
        setProperties(INITIAL_PROPERTIES);
        return;
      }

      setFetchError(null);
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles:agentId (*)
        `)
        .order('publishedAt', { ascending: false });

      if (error) {
        console.error(`Error fetching properties (Attempt ${retryCount + 1}):`, error);
        if (retryCount < 2) {
          await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
          return fetchProperties(retryCount + 1);
        }
        setFetchError(`Error de conexión: ${error.message}`);
        // setProperties([]); // Preserve existing properties on error
        return;
      }

      if (data) {
        const mapped = data.map((p: any) => ({
          ...p,
          agentName: p.profiles?.name || 'Asesor',
          agentAvatar: p.profiles?.avatar_url || '',
          agentWhatsapp: p.profiles?.whatsapp || '51900000000',
          contactEmail: p.profiles?.email || ''
        }));
        setProperties(mapped as Property[]);
      } else {
        // setProperties([]); // Preserve existing properties on error
      }
    } catch (err: any) {
      console.error('Unexpected error in fetchProperties:', err);
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchProperties(retryCount + 1);
      }
      setFetchError('Error interno al cargar datos.');
      // setProperties([]); // Preserve existing properties on error
    } finally {
      setIsFetchingProperties(false);
    }
  };

  const fetchPackages = async () => {
    try {
      if (!isSupabaseConfigured) return;
      const { data, error } = await supabase.from('packages').select('*').order('price', { ascending: true });
      if (error) throw error;
      if (data) setPackages(data as Package[]);
    } catch (err) {
      console.error('Error in fetchPackages:', err);
    }
  };

  const fetchLegalDocs = async () => {
    try {
      if (!isSupabaseConfigured) return;
      const { data, error } = await supabase.from('legal_documents').select('*');
      if (error) throw error;
      if (data) setLegalDocs(data as LegalDoc[]);
    } catch (err) {
      console.error('Error in fetchLegalDocs:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      if (!isSupabaseConfigured) return;
      const { data, error } = await supabase.from('locations').select('*');
      if (error) throw error;
      if (data) setLocations([...PERU_LOCATIONS, ...data] as LocationItem[]);
    } catch (err) {
      console.error('Error in fetchLocations:', err);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.from('payment_methods').select('*');
    if (data) setPaymentMethods(data as PaymentMethod[]);
  };

  const fetchTransactions = async () => {
    if (!currentUser) return;
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (data) setTransactions(data as Transaction[]);
  };

  const fetchComplaints = async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.from('complaints').select('*').order('date', { ascending: false });
    if (data) setComplaints(data as Complaint[]);
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    const { data } = await supabase.from('notifications').select('*').eq('userId', currentUser.id);
    if (data) setNotifications(data as Notification[]);
  };

  const handleLogout = async () => { 
    if (isSupabaseConfigured) {
      await supabase.auth.signOut(); 
    }
    setCurrentUser(null); 
    setView('HOME'); 
    handleClearFilters(); 
  };

  const handleLogin = async (email: string, role: string, password?: string, isReg: boolean = false, name?: string) => {
    if (!isSupabaseConfigured) {
      showToast("Supabase no está configurado. No se puede iniciar sesión en modo demostración.", "ERROR");
      return;
    }

    setIsInitialLoading(true); // Mostrar loader durante el proceso
    try {
      let result;
      if (isReg) {
        console.info("Intentando registro para:", email);
        result = await supabase.auth.signUp({ 
          email, 
          password: password || '123456',
          options: {
            data: {
              role: role || 'INMOBILARIA CORREDOR'
            }
          }
        });

        if (result.error) throw result.error;

        if (result.data.user) {
          let finalRole = role || 'INMOBILARIA CORREDOR';
          if (email.toLowerCase() === ADMIN_EMAIL) {
            finalRole = 'ADMINISTRADOR';
          } else if (email.toLowerCase() === 'jorgejoel-ifz@hotmail.com') {
            finalRole = 'PARTICULAR DUEÑO DIRECTO';
          }

          console.info("Creando perfil en tabla 'profiles'...");
          const { error: profileError } = await supabase.from('profiles').upsert([{ 
            id: result.data.user.id, 
            email: email.toLowerCase(), 
            name: name || email.split('@')[0], 
            role: finalRole, 
            propertiesRemaining: 0, 
            featuredRemaining: 0, 
            superFeaturedRemaining: 0 
          }]);

          if (profileError) {
            console.error("Error al crear perfil:", profileError);
            showToast(`Usuario creado pero error en perfil: ${profileError.message}`, "WARNING");
          } else {
            showToast("Cuenta creada con éxito", "SUCCESS");
          }
        }
      } else {
        console.info("Intentando inicio de sesión...");
        result = await supabase.auth.signInWithPassword({ email, password: password || '' });
        if (result.error) throw result.error;
      }

      if (result.data.user) {
        // En registro, damos más margen para que Supabase actualice sus índices internos
        if (isReg) {
          console.info("Esperando propagación de datos en base de datos...");
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        let profile = await fetchProfile(result.data.user.id);
        
        // Si no hay perfil y venimos de un inicio de sesión exitoso (Auth OK)
        // intentamos auto-crearlo para evitar el "bloqueo" por falta de registro previo
        if (!profile) {
           console.warn("Perfil ausente. Intentando auto-creación de emergencia...");
           let finalRole = (result.data.user.user_metadata?.role as Role) || 'PARTICULAR DUEÑO DIRECTO';
           
           // Normalización de roles según requerimiento del usuario
           if (finalRole.includes('PARTICULAR')) finalRole = 'PARTICULAR DUEÑO DIRECTO';
           else if (finalRole.includes('INMOBILARIA')) finalRole = 'INMOBILARIA CORREDOR';
           else if (finalRole.includes('CONSTRUCTORA')) finalRole = 'CONSTRUCTORA DESARROLLADORA';

           const { error: recoveryError } = await supabase.from('profiles').upsert([{ 
             id: result.data.user.id, 
             email: email.toLowerCase(), 
             name: name || email.split('@')[0], 
             role: finalRole, 
             propertiesRemaining: 0, 
             featuredRemaining: 0, 
             superFeaturedRemaining: 0 
           }]);

           if (!recoveryError) {
             profile = await fetchProfile(result.data.user.id);
           } else {
             console.error("Error crítico de recuperación de perfil:", recoveryError);
           }
        }

        if (profile) {
          if (selectedPackage) {
            setView('PAYMENT');
          } else {
            setView('DASHBOARD'); 
          }
        } else {
          showToast("Tu cuenta está activa pero no pudimos cargar tu perfil. Contacta a soporte.", "ERROR");
          setView('HOME');
        }
      } else if (isReg && !result.data.session) {
        // Caso donde aunque el usuario dijo que está desactivado, Supabase pide confirmación
        showToast("Registro exitoso. Por favor, verifica tu correo antes de entrar.", "INFO");
        setView('HOME');
      }
    } catch (err: any) {
      console.error("Error en flujo de auth:", err);
      showToast(err.message || "Error al procesar la autenticación", "ERROR");
    } finally {
      setIsInitialLoading(false);
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (committedFilters.status && p.status !== committedFilters.status) return false;
      if (committedFilters.type && p.type !== committedFilters.type) return false;
      const price = committedFilters.currency === 'USD' ? p.priceUSD : p.pricePEN;
      if (price < committedFilters.minPrice) return false;
      if (committedFilters.maxPrice !== Infinity && price > committedFilters.maxPrice) return false;
      
      const matchesLocations = committedFilters.selectedLocations.length === 0 || 
        (spatialFilterIds !== null) ||
        committedFilters.selectedLocations.some(loc => {
          const locName = loc.name.toLowerCase();
          const pDist = (p.district || '').toLowerCase();
          const pDep = (p.department || '').toLowerCase();
          const pAddr = (p.address || '').toLowerCase();
          
          // Check acronyms (e.g., "San Martín de Porres" -> "smp")
          const ignoreWords = ['de', 'del', 'la', 'las', 'los', 'el', 'y'];
          const acronym = locName.split(/[\s-]/)
            .filter(w => w.length > 0 && !ignoreWords.includes(w))
            .map(w => w[0])
            .join('');
          
          return pDist.includes(locName) || 
                 pDep.includes(locName) ||
                 pAddr.includes(locName) ||
                 (acronym.length >= 2 && pDist === acronym);
        });
      if (!matchesLocations) return false;
      
      // Si hay filtro espacial (polígono/radio), aplicarlo estrictamente
      if (spatialFilterIds !== null && !spatialFilterIds.includes(p.id)) return false;
      
      if (committedFilters.bedrooms > 0 && p.bedrooms < committedFilters.bedrooms) return false;
      if (committedFilters.maxBedrooms !== Infinity && p.bedrooms > committedFilters.maxBedrooms) return false;
      if (committedFilters.bathrooms > 0 && p.bathrooms < committedFilters.bathrooms) return false;
      if (committedFilters.parking > 0 && p.parking < committedFilters.parking) return false;
      
      const area = committedFilters.areaType === 'built' ? (p.builtArea || p.constructionArea) : p.terrainArea;
      if (area < committedFilters.minArea) return false;
      if (committedFilters.maxArea !== Infinity && area > committedFilters.maxArea) return false;

      // Age (Antigüedad)
      if (committedFilters.age !== 'any') {
        const age = p.yearBuilt || 0;
        if (committedFilters.age === 'under_construction' && p.status !== 'PROJECT') return false;
        if (committedFilters.age === 'brand_new' && age > 1) return false;
        if (committedFilters.age === 'up_to_5_years' && age > 5) return false;
      }

      // Publication Date
      if (committedFilters.publicationDate !== 'any') {
        const createdDate = new Date(p.createdAt);
        const now = new Date();
        const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
        if (committedFilters.publicationDate === 'today' && diffDays > 1) return false;
        if (committedFilters.publicationDate === 'yesterday' && diffDays > 2) return false;
        if (committedFilters.publicationDate === 'last_week' && diffDays > 7) return false;
      }

      return true;
    }).sort((a, b) => {
      // 1. Super Destacado
      // 2. Destacado
      // 3. Simple (Normal)
      const getPlanWeight = (p: Property) => {
        if (p.planType === 'SUPER_FEATURED') return 3;
        if (p.planType === 'FEATURED' || p.isFeatured) return 2;
        return 1;
      };

      const weightA = getPlanWeight(a);
      const weightB = getPlanWeight(b);

      if (weightA !== weightB) {
        return weightB - weightA; // Higher weight first
      }

      // Within same category, sort by createdAt descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [properties, committedFilters, spatialFilterIds]);

  const handlePerformSearch = (layout?: 'LIST' | 'MAP', focusLoc?: LocationItem, overrideFilters?: typeof filters) => {
    setSpatialFilterIds(null);
    const finalFilters = overrideFilters || filters;
    setCommittedFilters(finalFilters);
    
    // Prioridad absoluta al focusLoc pasado por parámetro
    if (focusLoc) {
      setFocusedLocation(focusLoc);
    } else if (finalFilters.selectedLocations.length > 0) {
      setFocusedLocation(finalFilters.selectedLocations[0]);
    } else {
      setFocusedLocation(null);
    }
    
    if (layout) setSearchLayout(layout);
    setView('SEARCH');
  };

  const handleClearFilters = () => {
    const defaultFilters = { query: '', selectedLocations: [], type: '', status: '', minPrice: 0, maxPrice: Infinity, currency: 'USD' as const, sortBy: 'RELEVANT', includeMaintenance: false, bedrooms: 0, maxBedrooms: Infinity, bathrooms: 0, parking: 0, minArea: 0, maxArea: Infinity, areaType: 'total' as const, advertiserType: 'all' as const, age: 'any' as const, publicationDate: 'any' as const, selectedFeatures: [] };
    setFilters(defaultFilters);
    setCommittedFilters(defaultFilters);
    setFocusedLocation(null);
    setSpatialFilterIds(null);
  };

  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 bg-[#091F4F] flex flex-col items-center justify-center z-[9999]">
        <div className="w-16 h-16 border-4 border-white/10 rounded-full relative mb-8">
           <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-white text-xs font-black uppercase tracking-[0.3em] mb-4">Cargando MICASAPERU...</p>
        
        {loadingTime > 6000 && (
          <div className="mt-8 flex flex-col items-center gap-4 px-6 text-center animate-fade-in">
             <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold max-w-xs leading-relaxed">¿Tarda demasiado? Es probable que tu conexión sea inestable.</p>
             <button 
               onClick={handleRescueReset}
               className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all active:scale-95 shadow-2xl"
             >
               Limpiar memoria y reiniciar
             </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={currentUser} onNavigate={(v) => { setView(v); if(v === 'SEARCH') setSpatialFilterIds(null); if(v === 'HOME') handleClearFilters(); }} currentView={view} logo={appLogo} cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} isSupabaseConnected={isSupabaseConfigured} />
      {!isSupabaseConfigured && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 px-4 py-3 text-sm text-center flex flex-col sm:flex-row items-center justify-center gap-2">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span><strong>Modo de demostración:</strong> Supabase no está configurado. Los datos mostrados son de prueba. Configura <code className="bg-amber-200 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> y <code className="bg-amber-200 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>.</span>
        </div>
      )}
      <main className="flex-grow flex flex-col">
        {view === 'HOME' && (
          <>
            <SearchHero locations={locations} filters={filters} bannerUrl={homeBanner} bannerUrlMobile={homeBannerMobile} onFilterChange={setFilters} onSearch={handlePerformSearch} />
            <DevelopmentOptions properties={properties} onPropertySelect={handleOpenProperty} currency={filters.currency} />
            <div className="container mx-auto px-4 py-16">
              {properties.filter(p => p.planType === 'SUPER_FEATURED').length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black uppercase border-l-8 border-red-600 pl-6">Super Destacados</h2>
                  </div>
                  <PropertyList layout="slider" properties={properties.filter(p => p.planType === 'SUPER_FEATURED').slice(0, 6)} onPropertySelect={handleOpenProperty} currency={filters.currency} onClearFilters={handleClearFilters} visitedIds={visitedIds} />
                </div>
              )}

              {properties.filter(p => p.planType === 'FEATURED' || (p.isFeatured && p.planType !== 'SUPER_FEATURED')).length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black uppercase border-l-8 border-blue-600 pl-6">Destacados</h2>
                    {properties.filter(p => p.planType === 'SUPER_FEATURED').length === 0 && (
                      <button onClick={() => handlePerformSearch('MAP')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                         Buscar por Mapa
                      </button>
                    )}
                  </div>
                  <PropertyList layout="slider" properties={properties.filter(p => p.planType === 'FEATURED' || (p.isFeatured && p.planType !== 'SUPER_FEATURED')).slice(0, 6)} onPropertySelect={handleOpenProperty} currency={filters.currency} onClearFilters={handleClearFilters} visitedIds={visitedIds} />
                </div>
              )}

              {/* Mostrar inmuebles recientes si no hay destacados */}
              {properties.length > 0 && properties.filter(p => p.planType === 'SUPER_FEATURED' || p.planType === 'FEATURED' || p.isFeatured).length === 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black uppercase border-l-8 border-slate-900 pl-6">Nuevos Inmuebles</h2>
                    <button onClick={() => setView('SEARCH')} className="text-red-600 font-black uppercase text-[10px] tracking-widest hover:underline">Ver Todos</button>
                  </div>
                  <PropertyList layout="slider" properties={properties.slice(0, 6)} onPropertySelect={handleOpenProperty} currency={filters.currency} onClearFilters={handleClearFilters} visitedIds={visitedIds} />
                </div>
              )}



              {properties.length === 0 && (
                <div className="flex flex-col items-center">
                  {isFetchingProperties ? (
                    <div className="flex flex-col items-center py-20 animate-fade-in">
                       <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                       <p className="text-slate-500 font-extrabold uppercase text-[10px] tracking-widest text-center px-4">Conectando con Supabase...</p>
                    </div>
                  ) : (
                    <>
                      <PropertyList properties={[]} onPropertySelect={() => {}} currency={filters.currency} onClearFilters={handleClearFilters} />
                      {fetchError && (
                        <div className="mt-4 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm max-w-lg text-center shadow-sm">
                          <div className="flex items-center justify-center gap-2 mb-3 text-red-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span className="font-black uppercase tracking-wider text-xs">Error de Conexión</span>
                          </div>
                          <p className="font-bold mb-2">No se pudo cargar la información de Supabase.</p>
                          <div className="bg-white/50 p-3 rounded-lg border border-red-100 font-mono text-[10px] break-all mb-4 text-left">
                            {fetchError}
                          </div>
                          <button 
                            onClick={() => fetchProperties()}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-md active:scale-95"
                          >
                            Reintentar carga ahora
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {view === 'SEARCH' && (
          <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
            <div className="p-4 bg-white border-b shadow-sm z-[1100]">
               <SearchHero locations={locations} filters={filters} bannerUrl={homeBanner} bannerUrlMobile={homeBannerMobile} onFilterChange={setFilters} compact={true} activeLayout={searchLayout} onSearch={handlePerformSearch} />
            </div>
            
            {/* Results Summary Bar */}
            <div className="bg-white border-b px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-base font-bold text-slate-900">
                  {filteredProperties.length.toLocaleString()} Propiedades e inmuebles {
                    filters.status === 'FOR_RENT' ? 'en alquiler' : 
                    filters.status === 'FOR_SALE' ? 'en venta' : 
                    filters.status === 'TEMPORAL' ? 'temporales' :
                    filters.status === 'PROJECT' ? 'en proyectos' :
                    filters.status === 'TRASPASO' ? 'en traspaso' : ''
                  } - Perú
                </span>
              </div>
              
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setSearchLayout(searchLayout === 'LIST' ? 'MAP' : 'LIST')}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900 hover:text-red-600 transition-colors"
                >
                  <span>{searchLayout === 'LIST' ? 'Ver mapa' : 'Ver lista'}</span>
                  {searchLayout === 'LIST' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                  )}
                </button>
                
                <div className="h-4 w-px bg-gray-200 hidden md:block"></div>
                
                <div className="relative flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900 cursor-pointer hover:text-red-600 transition-colors">
                  <span>Ordenar</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
            </div>

                    <div className={`flex-grow overflow-y-auto custom-scrollbar ${searchLayout === 'LIST' ? 'block' : 'hidden'}`}>
                      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-6 w-full">
                        {fetchError ? (
                          <div className="p-12 bg-red-50 border border-red-200 rounded-[2.5rem] text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Error de Conexión</h3>
                            <p className="text-slate-500 mb-8 font-medium max-w-md mx-auto">{fetchError}</p>
                            <button onClick={() => fetchProperties()} className="bg-red-600 text-white px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-red-100 hover:shadow-blue-100">Reintentar Carga</button>
                          </div>
                        ) : (
                          <PropertyList layout="list" properties={filteredProperties} onPropertySelect={handleOpenProperty} currency={filters.currency} onClearFilters={handleClearFilters} visitedIds={visitedIds} />
                        )}
                      </div>
                    </div>
            
            <div className={`flex-grow relative ${searchLayout === 'MAP' ? 'block' : 'hidden'}`}>
              <MapView 
                isVisible={searchLayout === 'MAP'}
                properties={filteredProperties} 
                fullProperties={properties} 
                onSelectProperty={handleOpenProperty} 
                currency={filters.currency} 
                onSwitchToList={() => setSearchLayout('LIST')} 
                onSpatialFilter={setSpatialFilterIds} 
                visitedIds={visitedIds} 
                focusedLocation={focusedLocation} 
                onStateChange={() => {}} 
              />
            </div>
          </div>
        )}
        {view === 'DASHBOARD' && (
          currentUser ? (
            <ClientDashboard 
              user={currentUser} properties={properties} packages={packages} transactions={transactions} complaints={complaints} legalDocs={legalDocs} inquiries={inquiries} notifications={notifications} locations={locations} paymentMethods={paymentMethods}
              appLogo={appLogo} homeBanner={homeBanner} homeBannerMobile={homeBannerMobile} favicon={favicon} socialLinks={socialLinks} officeInfo={officeInfo}
              mpPublicKey={mpPublicKey} mpAccessToken={mpAccessToken} mpClientId={mpClientId} mpClientSecret={mpClientSecret}
              onUpdateLogo={async url => { 
                const { error } = await supabase.from('settings').upsert({key: 'app_logo', value: url}, { onConflict: 'key' });
                if (error) { showToast("Error al guardar logo", "ERROR"); console.error(error); }
                else { setAppLogo(url); showToast("Logo actualizado", "SUCCESS"); }
              }} 
              onUpdateBanner={async url => { 
                const { error } = await supabase.from('settings').upsert({key: 'home_banner', value: url}, { onConflict: 'key' });
                if (error) { showToast("Error al guardar banner", "ERROR"); console.error(error); }
                else { setHomeBanner(url); showToast("Banner actualizado", "SUCCESS"); }
              }} 
              onUpdateBannerMobile={async url => { 
                const { error } = await supabase.from('settings').upsert({key: 'home_banner_mobile', value: url}, { onConflict: 'key' });
                if (error) { showToast("Error al guardar banner móvil", "ERROR"); console.error(error); }
                else { setHomeBannerMobile(url); showToast("Banner móvil actualizado", "SUCCESS"); }
              }} 
              onUpdateFavicon={async url => { 
                const { error } = await supabase.from('settings').upsert({key: 'favicon', value: url}, { onConflict: 'key' });
                if (error) { showToast("Error al guardar favicon", "ERROR"); console.error(error); }
                else { setFavicon(url); showToast("Favicon actualizado", "SUCCESS"); }
              }} 
              onUpdateOfficeInfo={async info => { 
                const { error } = await supabase.from('settings').upsert({key: 'office_info', value: JSON.stringify(info)}, { onConflict: 'key' });
                if (error) { showToast("Error al guardar oficina", "ERROR"); console.error(error); }
                else { setOfficeInfo(info); showToast("Información de oficina guardada", "SUCCESS"); }
              }} 
              onUpdateSocialLinks={async links => { 
                const { error } = await supabase.from('settings').upsert({key: 'social_links', value: JSON.stringify(links)}, { onConflict: 'key' });
                if (error) { showToast("Error al guardar redes", "ERROR"); console.error(error); }
                else { setSocialLinks(links); showToast("Redes sociales actualizadas", "SUCCESS"); }
              }}
              onUpdateMpPublicKey={async key => {
                const { error } = await supabase.from('settings').upsert({key: 'mp_public_key', value: key}, { onConflict: 'key' });
                if (error) { showToast("Error al guardar MP Public Key", "ERROR"); console.error(error); }
                else { setMpPublicKey(key); showToast("MP Public Key actualizada", "SUCCESS"); }
              }}
              onUpdateMpAccessToken={async token => {
                const { error } = await supabase.from('settings').upsert({key: 'mp_access_token', value: token}, { onConflict: 'key' });
                if (error) { showToast("Error al guardar MP Access Token", "ERROR"); console.error(error); }
                else { setMpAccessToken(token); showToast("MP Access Token actualizado", "SUCCESS"); }
              }}
              onUpdateMpClientId={async id => {
                const { error } = await supabase.from('settings').upsert({key: 'mp_client_id', value: id}, { onConflict: 'key' });
                if (error) { showToast("Error al guardar MP Client ID", "ERROR"); console.error(error); }
                else { setMpClientId(id); showToast("MP Client ID actualizado", "SUCCESS"); }
              }}
              onUpdateMpClientSecret={async secret => {
                const { error } = await supabase.from('settings').upsert({key: 'mp_client_secret', value: secret}, { onConflict: 'key' });
                if (error) { showToast("Error al guardar MP Client Secret", "ERROR"); console.error(error); }
                else { setMpClientSecret(secret); showToast("MP Client Secret actualizado", "SUCCESS"); }
              }}
              onAddProperty={() => { setSelectedPropertyId(null); setView('ADMIN'); }} 
              onEditProperty={id => { setSelectedPropertyId(id); setView('ADMIN'); }} 
              onDeleteProperty={async id => { 
                try {
                  const { error } = await supabase.from('properties').delete().eq('id', id); 
                  if (error) throw error;
                  await fetchProperties(); 
                  showToast("Inmueble eliminado", "SUCCESS"); 
                } catch (err) {
                  showToast("Error al eliminar el inmueble", "ERROR");
                  console.error(err);
                }
              }}
              onLogout={handleLogout} 
              onUpdateTransactionStatus={async (id, s) => { 
                try {
                  const { data: transaction, error: txError } = await supabase.from('transactions').update({status: s}).eq('id', id).select().single();
                  if (txError) throw txError;
  
                  if (s === 'COMPLETED' && transaction) {
                    await handleSyncCredits(true, transaction.userId);
                  }
  
                  fetchTransactions(); 
                  showToast(`Transacción ${s === 'COMPLETED' ? 'aprobada' : s === 'CANCELLED' ? 'rechazada' : 'actualizada'}`, "SUCCESS"); 
                } catch (err) {
                  console.error("Error updating transaction status:", err);
                  showToast("Error al actualizar el estado", "ERROR");
                }
              }} 
              onSaveLegalDoc={async d => { await supabase.from('legal_documents').upsert(d); fetchLegalDocs(); showToast("Documento legal guardado", "SUCCESS"); }} 
              onSavePackage={async p => { 
                try {
                  // Filter out empty features before saving
                  const packageToSave = {
                    ...p,
                    features: p.features ? p.features.filter(f => f.trim() !== '') : []
                  };
                  const { error } = await supabase.from('packages').upsert(packageToSave); 
                  if (error) {
                    console.error("Error al guardar plan en Supabase:", error);
                    if (error.code === 'PGRST204' || error.message?.includes('column')) {
                      // Intento de guardado sin columnas que podrían faltar en la DB
                      const { superFeaturedLimit, features, allowedRoles, ...fallbackP } = packageToSave as any;
                      const { error: error2 } = await supabase.from('packages').upsert(fallbackP);
                      if (error2) throw error2;
                      fetchPackages();
                      showToast("Plan guardado (sin beneficios/roles/super-destacados por falta de columnas en DB)", "WARNING");
                    } else {
                      throw error;
                    }
                  } else {
                    fetchPackages(); 
                    showToast("Plan guardado", "SUCCESS"); 
                  }
                } catch (err: any) {
                  if (err.code === '42P01') {
                    showToast("Falta crear la tabla 'packages' in Supabase", "ERROR");
                  } else {
                    showToast("Error al guardar plan", "ERROR");
                    console.error(err);
                  }
                }
              }} 
              onDeletePackage={async id => { 
                try {
                  const { error } = await supabase.from('packages').delete().eq('id', id); 
                  if (error) {
                    if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('schema cache')) {
                      setPackages(prev => prev.filter(p => p.id !== id));
                      showToast("Eliminado mock (falta tabla)", "INFO");
                      return;
                    }
                    throw error;
                  }
                  setPackages(prev => prev.filter(p => p.id !== id));
                  showToast("Plan eliminado", "SUCCESS"); 
                } catch (err: any) {
                  showToast(err.message || "Error al eliminar plan", "ERROR");
                  console.error(err);
                }
              }}
              onUpdatePaymentMethod={async m => { 
                 // Actualización optimista del estado local
                 setPaymentMethods(prev => {
                   const exists = prev.find(item => item.id === m.id);
                   if (exists) {
                     return prev.map(item => item.id === m.id ? m : item);
                   }
                   return [...prev, m];
                 });
  
                 try {
                   const { error } = await supabase.from('payment_methods').upsert(m); 
                   if (error) {
                     if (error.code === 'PGRST204' || error.code === '42P01') {
                       showToast("Falta crear tabla 'payment_methods' en Supabase", "ERROR");
                       return;
                     }
                     throw error;
                   }
                   showToast("Método de pago guardado", "SUCCESS"); 
                   fetchPaymentMethods(); // Sincronizar con el servidor para obtener IDs reales si aplica
                 } catch (err: any) {
                   showToast(err.message || "Error al actualizar método de pago", "ERROR");
                   console.error(err);
                   // Opcional: Revertir el estado local en caso de error crítico
                   fetchPaymentMethods();
                 }
               }} 
               onDeletePaymentMethod={async id => { 
               // Actualización optimista: eliminar de la lista local inmediatamente
               setPaymentMethods(prev => prev.filter(m => m.id !== id));

               try {
                 const { error } = await supabase.from('payment_methods').delete().eq('id', id); 
                 if (error) {
                   if (error.code === '22P02' || error.code === '42P01' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
                      showToast("Eliminado de la vista (Falta tabla en Supabase)", "INFO");
                      return;
                   }
                   throw error;
                 }
                 showToast("Método de pago eliminado", "SUCCESS"); 
               } catch (err: any) {
                 showToast(err.message || "Error al eliminar el método de pago", "ERROR");
                 console.error(err);
                 fetchPaymentMethods(); // Re-sincronizar en caso de error
               }
             }} 
            onSaveLocation={async l => { 
              try {
                const { error } = await supabase.from('locations').upsert(l); 
                if (error) {
                  if (error.code === 'PGRST204' || error.code === '42P01') {
                    showToast("Falta crear tabla 'locations'", "ERROR");
                    return;
                  }
                  throw error;
                }
                fetchLocations(); 
                showToast("Ubicación guardada", "SUCCESS"); 
              } catch (err: any) {
                showToast(err.message || "Error al guardar ubicación", "ERROR");
                console.error(err);
              }
            }} 
            onDeleteLocation={async id => { 
              try {
                const { error } = await supabase.from('locations').delete().eq('id', id); 
                if (error) {
                  if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('schema cache')) {
                    setLocations(prev => prev.filter(loc => loc.id !== id));
                    showToast("Eliminada mock (Falta tabla)", "INFO");
                    return;
                  }
                  throw error;
                }
                setLocations(prev => prev.filter(loc => loc.id !== id));
                showToast("Ubicación eliminada", "SUCCESS"); 
              } catch (err: any) {
                showToast(err.message || "Error al eliminar ubicación", "ERROR");
                console.error(err);
              }
            }}
            onUpdateProfile={handleUpdateProfile} onNavigate={setView}
            onSyncCredits={handleSyncCredits}
            showToast={showToast}
          />
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-20">
              <div className="w-12 h-12 border-4 border-[#091F4F] border-t-red-600 rounded-full animate-spin mb-6"></div>
              <h3 className="text-xl font-black text-[#091F4F] uppercase tracking-tighter">Cargando tu perfil...</h3>
              <p className="text-gray-400 text-sm font-medium mt-2">Estamos preparando tu panel personalizado.</p>
            </div>
          )
        )}
        {view === 'ADMIN' && (
          <PublicationFlow 
            user={currentUser!} 
            properties={properties} 
            editingId={selectedPropertyId} 
            packages={packages}
            paymentMethods={paymentMethods}
            mpAccessToken={mpAccessToken}
            mpPublicKey={mpPublicKey}
            onAdd={async p => { 
              const { 
                agentName, agentAvatar, agentWhatsapp, profiles, 
                constructionArea, documents, yearBuilt,
                ...cleanP 
              } = p as any;
              
              const dbData = {
                ...cleanP
              };
              
              let finalPlanType = cleanP.planType || 'BASIC';
              let finalPublishedAt = new Date().toISOString();
              
              // Buscar la duración del plan en los paquetes disponibles
              const pkg = packages.find(pkg => {
                if (finalPlanType === 'SUPER_FEATURED') return pkg.superFeaturedLimit > 0;
                if (finalPlanType === 'FEATURED') return pkg.featuredLimit > 0;
                return pkg.propertyLimit > 0;
              });
              
              const duration = pkg?.durationDays || 30;
              let finalExpiresAt = new Date(Date.now() + duration * 86400000).toISOString();

              if (currentUser && currentUser.role !== 'ADMINISTRADOR') {
                // Validar si el usuario tiene un plan que permita esta operación (Alquiler/Venta)
                const userTransactions = transactions.filter(t => t.userId === currentUser.id && t.status === 'COMPLETED');
                const userPackages = packages.filter(pkg => userTransactions.some(t => t.packageId === pkg.id));
                
                const isOperationAllowed = userPackages.some(pkg => {
                  const allowed = pkg.allowedOperation || 'BOTH';
                  if (allowed === 'BOTH') return true;
                  if (cleanP.status === 'FOR_RENT' && allowed === 'RENT') return true;
                  if (cleanP.status === 'FOR_SALE' && allowed === 'SALE') return true;
                  // Si el plan es para otros estados (TRASPASO, etc), permitir si es BOTH
                  return false;
                });

                if (!isOperationAllowed && userPackages.length > 0) {
                  showToast("Tu plan actual no permite este tipo de operación", "ERROR");
                  return;
                }

                // Decrement credits
                const updatedProfile = { ...currentUser };
                if (finalPlanType === 'SUPER_FEATURED') {
                  if ((updatedProfile.superFeaturedRemaining || 0) > 0) updatedProfile.superFeaturedRemaining!--;
                } else if (finalPlanType === 'FEATURED') {
                  if ((updatedProfile.featuredRemaining || 0) > 0) updatedProfile.featuredRemaining!--;
                } else {
                  if ((updatedProfile.propertiesRemaining || 0) > 0) updatedProfile.propertiesRemaining!--;
                }

                const { error: profileError } = await supabase.from('profiles').update({
                  propertiesRemaining: updatedProfile.propertiesRemaining,
                  featuredRemaining: updatedProfile.featuredRemaining,
                  superFeaturedRemaining: updatedProfile.superFeaturedRemaining
                }).eq('id', currentUser.id);
                
                if (profileError) {
                  console.error("Error updating credits on publish:", profileError);
                } else {
                  setCurrentUser(updatedProfile);
                }
              }

              const { error } = await supabase.from('properties').insert({
                  ...dbData,
                  planType: finalPlanType,
                  publishedAt: finalPublishedAt,
                  expiresAt: finalExpiresAt,
                  agentId: currentUser?.id
              }); 
              
              if (error) {
                console.error("Supabase insert error details:", error);
                showToast(`Error al subir inmueble: ${error.message}`, "ERROR");
                throw error; 
              }

              await fetchProperties(); 
              showToast("Inmueble publicado con éxito", "SUCCESS");
              setView('DASHBOARD'); 
            }} 
            onUpdate={async p => { 
              const { 
                agentName, agentAvatar, agentWhatsapp, profiles, 
                constructionArea, documents, yearBuilt,
                ...cleanP 
              } = p as any;

              const dbData = {
                ...cleanP
              };

              const { error } = await supabase.from('properties').update(dbData).eq('id', p.id); 
              if (error) {
                console.error("Supabase update error details:", error);
                showToast(`Error al actualizar inmueble: ${error.message}`, "ERROR");
                throw error; 
              }
              await fetchProperties(); 
              showToast("Inmueble actualizado con éxito", "SUCCESS");
              setView('DASHBOARD'); 
            }} 
            onCancel={() => { setSelectedPropertyId(null); setView('DASHBOARD'); }} 
            showToast={showToast}
          />
        )}
        {view === 'DETAILS' && selectedPropertyId && (
          properties.some(p => p.id === selectedPropertyId) ? (
            <PropertyDetails property={properties.find(p => p.id === selectedPropertyId)!} onBack={() => { setView('SEARCH'); window.history.pushState({}, '', window.location.pathname); }} onSendMessage={handleSendMessage} showToast={showToast} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Propiedad no encontrada</h2>
              <p className="text-slate-500 mb-8 font-medium">El inmueble que buscas no existe o ha sido eliminado.</p>
              <button onClick={() => { setView('SEARCH'); window.history.pushState({}, '', '/'); }} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-600 transition-all">Volver al inicio</button>
            </div>
          )
        )}
        {view === 'PRICING' && (
          <PricingPage 
            onSelectPackage={p => { 
              setSelectedPackage(p); 
              setIsCartCheckout(false); 
              if (currentUser) setView('PAYMENT'); 
              else setView('AUTH'); 
            }} 
            onAddToCart={handleAddToCart} 
            customPackages={packages.filter(p => p.isActive)} 
            userRole={currentUser?.role}
          />
        )}
        {view === 'CART' && (
          <CartPage 
            cart={cart} 
            onRemove={handleRemoveFromCart} 
            onUpdateQuantity={handleUpdateCartQuantity} 
            onCheckout={() => { setIsCartCheckout(true); if (currentUser) setView('PAYMENT'); else setView('AUTH'); }} 
            onContinueShopping={() => setView('PRICING')} 
          />
        )}
        {view === 'PAYMENT' && (selectedPackage || (isCartCheckout && cart.length > 0)) && currentUser && (
          <PaymentFlow
            pkg={isCartCheckout ? undefined : selectedPackage!}
            cartItems={isCartCheckout ? cart : undefined}
            allPackages={packages}
            user={currentUser}
            paymentMethods={paymentMethods}
            mpAccessToken={mpAccessToken}
            mpPublicKey={mpPublicKey}
            onSuccess={() => {
              setSelectedPackage(null);
              setCart([]);
              setIsCartCheckout(false);
              setView('DASHBOARD');
            }}
            onCancel={() => {
              setSelectedPackage(null);
              setIsCartCheckout(false);
              setView(isCartCheckout ? 'CART' : 'PRICING');
            }}
            onUpdateProfile={async (data) => {
              if (!currentUser) return;
              const { error } = await supabase.from('profiles').update(data).eq('id', currentUser.id);
              if (error) {
                console.error("Error updating profile:", error);
                throw error;
              }
              setCurrentUser({ ...currentUser, ...data });
            }}
            onRecordTransaction={async (methodName, operationNumber, securityCode) => {
              if (isCartCheckout) {
                for (const item of cart) {
                  // Create one transaction per unit purchased to keep it simple for admin
                  for (let i = 0; i < item.quantity; i++) {
                    const { error } = await supabase.from('transactions').insert([{
                      id: crypto.randomUUID(),
                      userId: currentUser.id,
                      userName: currentUser.name,
                      packageId: item.package.id,
                      packageName: item.package.name,
                      amount: item.package.price,
                      date: new Date().toISOString(),
                      status: 'PENDING',
                      paymentMethodName: methodName,
                      operationNumber,
                      securityCode
                    }]);
                    if (error) throw error;
                  }
                }
              } else {
                const { error } = await supabase.from('transactions').insert([{
                  id: crypto.randomUUID(),
                  userId: currentUser.id,
                  userName: currentUser.name,
                  packageId: selectedPackage!.id,
                  packageName: selectedPackage!.name,
                  amount: selectedPackage!.price,
                  date: new Date().toISOString(),
                  status: 'PENDING',
                  paymentMethodName: methodName,
                  operationNumber,
                  securityCode
                }]);
                if (error) throw error;
              }
            }}
            showToast={showToast}
          />
        )}
        {view === 'AUTH' && <AuthPage onLogin={handleLogin} onBack={() => { setView('HOME'); handleClearFilters(); }} officeInfo={officeInfo} />}
        {view === 'COMPLAINTS_BOOK' && <ComplaintsBook onSave={async c => { 
          if (!isSupabaseConfigured) {
            showToast("Supabase no está configurado. No se puede enviar el reclamo en modo demostración.", "ERROR");
            throw new Error("Supabase no configurado");
          }
          await supabase.from('complaints').insert(c); 
        }} onClose={() => { setView('HOME'); handleClearFilters(); }} showToast={showToast} />}
      </main>
      {view !== 'SEARCH' && <Footer socialLinks={socialLinks} officeInfo={officeInfo} onNavigate={(v) => { setView(v); if(v === 'HOME') handleClearFilters(); }} onOpenLegal={setActiveLegalModal} logo={appLogo} />}
      {activeLegalModal && <LegalModal doc={legalDocs.find(d => d.type === activeLegalModal) || null} onClose={() => setActiveLegalModal(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <CookieConsent onLearnMore={() => setActiveLegalModal('PRIVACY')} />
      <SupportButton whatsappNumber={officeInfo.supportWhatsapp} />
    </div>
  );
};

export default App;
