import React, { useEffect } from 'react';
import { Property } from '../types';

interface SEOManagerProps {
  view: 'HOME' | 'ADMIN' | 'DETAILS' | 'SEARCH' | 'PRICING' | 'DASHBOARD' | 'AUTH' | 'PAYMENT' | 'COMPLAINTS_BOOK' | 'CART';
  property?: Property | null;
  searchQuery?: string;
  properties?: Property[];
}

const SEOManager: React.FC<SEOManagerProps> = ({ view, property, searchQuery, properties = [] }) => {
  useEffect(() => {
    const updateMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const removeMetaTag = (attributeName: string, attributeValue: string) => {
      const element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (element) element.remove();
    };

    const clearSchemaScripts = () => {
      const existingScripts = document.querySelectorAll('script[data-seo-schema="true"]');
      existingScripts.forEach(script => script.remove());
    };

    const injectSchema = (data: object | object[]) => {
      clearSchemaScripts();
      const scripts = Array.isArray(data) ? data : [data];
      scripts.forEach(item => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-schema', 'true');
        script.innerHTML = JSON.stringify(item);
        document.head.appendChild(script);
      });
    };

    const baseUrl = 'https://micasaperu.com';

    let title = 'Mi Casa Perú - Encuentra Casas, Departamentos y Terrenos';
    let description = 'El portal inmobiliario líder en Perú. Encuentra departamentos, casas, terrenos y oficinas en venta y alquiler directos de dueños, corredores e inmobiliarias.';
    let keywords = 'inmuebles en peru, comprar departamento lima, alquilar casa peru, terrenos en venta peru, micasaperu, departamentos de estreno';
    let ogUrl = window.location.origin;
    let ogImage = `${window.location.origin}/og-image.jpg`;
    let canonicalUrl = window.location.href.split('?')[0].split('#')[0];

    if (view === 'DETAILS' && property) {
      const formattedPricePEN = property.pricePEN ? `S/ ${property.pricePEN.toLocaleString('es-PE')}` : '';
      const formattedPriceUSD = property.priceUSD ? `$ ${property.priceUSD.toLocaleString('en-US')}` : '';
      const priceString = [formattedPriceUSD, formattedPricePEN].filter(Boolean).join(' / ');
      const operationType = property.status === 'FOR_RENT' ? 'Alquiler' :
                            property.status === 'FOR_SALE' ? 'Venta' :
                            property.status === 'PROJECT' ? 'Proyecto' : 'Traspaso/Otro';

      title = `${property.title} - ${property.district}, ${property.department} | Mi Casa Perú`;
      description = `${property.type} en ${operationType} en ${property.district} - ${priceString}. ${property.bedrooms} dormitorios, ${property.bathrooms} baños, ${property.constructionArea || property.terrainArea || 0} m². ¡Contáctanos!`;
      keywords = `${property.type} en ${property.district}, ${property.type} ${operationType} ${property.department}, inmobiliaria ${property.district}, ${property.title}`;
      canonicalUrl = `${baseUrl}/properties/${property.id}`;
      ogUrl = canonicalUrl;
      if (property.featuredImage) {
        ogImage = property.featuredImage;
      }

      const propertyTypeSchema = property.type === 'Departamento' ? 'https://schema.org/Apartment' :
                                  property.type === 'Casa' ? 'https://schema.org/SingleFamilyResidence' :
                                  property.type === 'Terreno' ? 'https://schema.org/Land' :
                                  property.type === 'Oficina' || property.type === 'Local Comercial' ? 'https://schema.org/Office' :
                                  'https://schema.org/House';

      const realEstateSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        'name': property.title,
        'description': property.description,
        'image': property.gallery && property.gallery.length > 0 ? property.gallery : [property.featuredImage],
        'url': ogUrl,
        'datePosted': property.publishedAt || property.createdAt || new Date().toISOString().split('T')[0],
        ...(property.status === 'FOR_RENT' ? {
          'leaseLength': property.deliveryMonth && property.deliveryYear
            ? `Hasta ${property.deliveryMonth} ${property.deliveryYear}`
            : 'Mensual'
        } : {}),
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': property.address || '',
          'addressLocality': property.district || '',
          'addressRegion': property.department || '',
          'addressCountry': 'PE'
        },
        ...(property.lat && property.lng ? {
          'geo': { '@type': 'GeoCoordinates', 'latitude': property.lat, 'longitude': property.lng }
        } : {}),
        'numberOfBedrooms': property.bedrooms || 0,
        'numberOfBathroomsTotal': property.bathrooms || 0,
        'floorSize': {
          '@type': 'QuantitativeValue',
          'value': property.constructionArea || property.terrainArea || 0,
          'unitCode': 'MTK'
        },
        'propertyType': propertyTypeSchema,
        'offers': {
          '@type': 'Offer',
          'priceCurrency': property.priceUSD ? 'USD' : 'PEN',
          'price': property.priceUSD || property.pricePEN || 0,
          'availability': 'https://schema.org/InStock',
          'url': ogUrl
        },
        'seller': {
          '@type': 'RealEstateAgent',
          'name': property.agentName || 'Mi Casa Perú',
          'url': 'https://micasaperu.com'
        }
      };

      const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://micasaperu.com' },
          { '@type': 'ListItem', position: 2, name: `${property.type} en ${operationType}`, item: `https://micasaperu.com/?type=${encodeURIComponent(property.type)}&status=${property.status}` },
          { '@type': 'ListItem', position: 3, name: property.title, item: ogUrl }
        ]
      };

      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Mi Casa Perú',
        'url': 'https://micasaperu.com',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': 'https://micasaperu.com/?search={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      };

      injectSchema([realEstateSchema, breadcrumb, websiteSchema]);

      updateMetaTag('property', 'article:published_time', property.createdAt || '');
      updateMetaTag('property', 'article:modified_time', property.publishedAt || property.createdAt || '');
      updateMetaTag('property', 'article:section', property.department || '');
      updateMetaTag('property', 'article:tag', `${property.type}, ${property.district}, ${property.department}`);
      updateMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large');
      updateMetaTag('name', 'googlebot', 'index, follow, max-snippet:-1, max-image-preview:large');

    } else if (view === 'SEARCH' && searchQuery) {
      const decoded = decodeURIComponent(searchQuery.replace(/\+/g, ' '));
      title = `${decoded} — Propiedades en Venta y Alquiler | Mi Casa Perú`;
      description = `Encuentra las mejores propiedades en ${decoded}. Casas, departamentos y terrenos en venta y alquiler en ${decoded}, Perú.`;
      canonicalUrl = `${baseUrl}/?search=${searchQuery}`;
      ogUrl = canonicalUrl;

      const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': `Resultados de búsqueda para ${decoded} - Mi Casa Perú`,
        'numberOfItems': properties.length,
        'itemListElement': properties.slice(0, 15).map((p, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'url': `${baseUrl}/properties/${p.id}`,
          'name': p.title
        }))
      };

      const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://micasaperu.com' },
          { '@type': 'ListItem', position: 2, name: `Búsqueda: ${decoded}`, item: ogUrl }
        ]
      };

      injectSchema([itemListSchema, breadcrumb]);
      updateMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large');

    } else if (view === 'PRICING') {
      title = 'Planes y Publicidad Inmobiliaria | Publica tu Propiedad en Mi Casa Perú';
      description = 'Publica tus propiedades en Mi Casa Perú. Planes desde S/100 para dueños directos, corredores e inmobiliarias. Destaca tu anuncio y vende más rápido.';
      keywords = 'publicar inmueble gratis, planes inmobiliarios peru, publicidad de casas, destacar anuncio inmobiliario, cuanto cuesta publicar una propiedad';
      canonicalUrl = `${baseUrl}/pricing`;
      ogUrl = canonicalUrl;

      const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://micasaperu.com' },
          { '@type': 'ListItem', position: 2, name: 'Planes de Publicidad', item: canonicalUrl }
        ]
      };
      injectSchema([breadcrumb]);
      updateMetaTag('name', 'robots', 'index, follow');

    } else if (view === 'COMPLAINTS_BOOK') {
      title = 'Libro de Reclamaciones | Mi Casa Perú - INDECOPI';
      description = 'Ponemos a tu disposición nuestro Libro de Reclamaciones digital de acuerdo al reglamento de INDECOPI en Perú. Ley 29571.';
      canonicalUrl = `${baseUrl}/complaints`;
      ogUrl = canonicalUrl;

      const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://micasaperu.com' },
          { '@type': 'ListItem', position: 2, name: 'Libro de Reclamaciones', item: canonicalUrl }
        ]
      };
      injectSchema([breadcrumb]);
      updateMetaTag('name', 'robots', 'index, follow');

    } else if (view === 'SEARCH') {
      title = 'Buscador de Inmuebles - Casas, Departamentos y Terrenos | Mi Casa Perú';
      description = 'Busca y encuentra las mejores propiedades en venta y alquiler en todo el Perú. Filtra por distrito, precio, tipo de inmueble y más.';
      canonicalUrl = `${baseUrl}/search`;
      ogUrl = canonicalUrl;
      updateMetaTag('name', 'robots', 'index, follow');

    } else if (view === 'ADMIN') {
      title = 'Panel de Administración | Mi Casa Perú';
      description = 'Panel administrativo interno de micasaperu.com.';
      updateMetaTag('name', 'robots', 'noindex, nofollow');
      updateMetaTag('name', 'googlebot', 'noindex, nofollow');
      clearSchemaScripts();
      removeMetaTag('property', 'article:published_time');
      return;

    } else if (view === 'DASHBOARD') {
      title = 'Mi Cuenta - Dashboard | Mi Casa Perú';
      description = 'Administra tus publicaciones, planes activos e información de contacto en Mi Casa Perú.';
      updateMetaTag('name', 'robots', 'noindex, nofollow');
      updateMetaTag('name', 'googlebot', 'noindex, nofollow');
      clearSchemaScripts();
      removeMetaTag('property', 'article:published_time');
      return;

    } else if (view === 'CART') {
      title = 'Carrito de Compras - Planes Inmobiliarios | Mi Casa Perú';
      description = 'Revisa los planes inmobiliarios que has seleccionado para publicar tus propiedades en Mi Casa Perú.';
      canonicalUrl = `${baseUrl}/cart`;
      ogUrl = canonicalUrl;
      updateMetaTag('name', 'robots', 'noindex, nofollow');
      clearSchemaScripts();
      return;

    } else if (view === 'AUTH') {
      title = 'Iniciar Sesión o Registrarse | Mi Casa Perú';
      description = 'Accede a tu cuenta de Mi Casa Perú o regístrate para publicar y gestionar tus propiedades inmobiliarias.';
      updateMetaTag('name', 'robots', 'noindex, nofollow');
      clearSchemaScripts();
      return;

    } else if (view === 'PAYMENT') {
      title = 'Procesar Pago - Plan Inmobiliario | Mi Casa Perú';
      description = 'Completa el pago de tu plan inmobiliario en Mi Casa Perú de forma segura.';
      updateMetaTag('name', 'robots', 'noindex, nofollow');
      clearSchemaScripts();
      return;

    } else {
      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Mi Casa Perú',
        'url': 'https://micasaperu.com',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': 'https://micasaperu.com/?search={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      };

      const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        'name': 'Mi Casa Perú',
        'url': 'https://micasaperu.com',
        'logo': `${baseUrl}/favicon.ico`,
        'description': 'El principal portal inmobiliario en el Perú para la compra, venta y alquiler de bienes raíces.',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': 'Miraflores',
          'addressRegion': 'Lima',
          'addressCountry': 'PE'
        },
        'contactPoint': {
          '@type': 'ContactPoint',
          'contactType': 'customer support',
          'email': 'soporte@micasaperu.com',
          'availableLanguage': ['Spanish', 'English']
        },
        'sameAs': [
          'https://facebook.com/micasaperu',
          'https://instagram.com/micasaperu',
          'https://linkedin.com/company/micasaperu'
        ]
      };

      const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://micasaperu.com' }
        ]
      };

      const itemListSchema = properties.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': 'Propiedades Destacadas en Mi Casa Perú',
        'numberOfItems': Math.min(properties.length, 12),
        'itemListElement': properties.slice(0, 12).map((p, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'url': `${baseUrl}/properties/${p.id}`,
          'name': p.title
        }))
      } : null;

      const schemas: any[] = [websiteSchema, organizationSchema, breadcrumb];
      if (itemListSchema) schemas.push(itemListSchema);
      injectSchema(schemas);
      updateMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large');
    }

    document.title = title;
    document.documentElement.lang = 'es-PE';

    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);
    updateMetaTag('name', 'author', 'Mi Casa Perú');

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:image:secure_url', ogImage);
    updateMetaTag('property', 'og:image:width', '1200');
    updateMetaTag('property', 'og:image:height', '630');
    updateMetaTag('property', 'og:image:alt', title);
    updateMetaTag('property', 'og:url', ogUrl);
    updateMetaTag('property', 'og:type', view === 'DETAILS' ? 'article' : 'website');
    updateMetaTag('property', 'og:site_name', 'Mi Casa Perú');
    updateMetaTag('property', 'og:locale', 'es_PE');

    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImage);
    updateMetaTag('name', 'twitter:image:alt', title);
    updateMetaTag('name', 'twitter:site', '@micasaperu');
    updateMetaTag('name', 'twitter:creator', '@micasaperu');

  }, [view, property, searchQuery]);

  return null;
};

export default SEOManager;
