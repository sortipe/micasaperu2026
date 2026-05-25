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

    const clearSchemaScripts = () => {
      const existingScripts = document.querySelectorAll('script[data-seo-schema="true"]');
      existingScripts.forEach(script => script.remove());
    };

    const injectSchema = (data: object) => {
      clearSchemaScripts();
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-schema', 'true');
      script.innerHTML = JSON.stringify(data);
      document.head.appendChild(script);
    };

    let title = 'Mi Casa Perú - Encuentra Casas, Departamentos y Terrenos';
    let description = 'El portal inmobiliario líder en Perú. Encuentra departamentos, casas, terrenos y oficinas en venta y alquiler directos de dueños, corredores e inmobiliarias.';
    let keywords = 'inmuebles en peru, comprar departamento lima, alquilar casa peru, terrenos en venta peru, micasaperu, departamentos de estreno';
    let ogUrl = window.location.origin;
    let ogImage = `${window.location.origin}/og-image.jpg`;

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
      ogUrl = `${window.location.origin}/properties/${property.id}`;
      if (property.featuredImage) {
        ogImage = property.featuredImage;
      }

      const schemaType = property.type === 'Departamento' ? 'Apartment' : 
                          property.type === 'Casa' ? 'SingleFamilyResidence' : 'House';
      
      const realEstateSchema = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        'name': property.title,
        'description': property.description,
        'image': property.gallery && property.gallery.length > 0 ? property.gallery : [property.featuredImage],
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
        'numberOfRooms': property.bedrooms || 0,
        'numberOfBathroomsTotal': property.bathrooms || 0,
        'floorSize': { '@type': 'QuantitativeValue', 'value': property.constructionArea || property.terrainArea || 0, 'unitCode': 'MTK' },
        'offers': {
          '@type': 'Offer',
          'priceCurrency': property.priceUSD ? 'USD' : 'PEN',
          'price': property.priceUSD || property.pricePEN || 0,
          'availability': 'https://schema.org/InStock',
          'url': ogUrl
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

      injectSchema([realEstateSchema, breadcrumb]);

      updateMetaTag('property', 'article:published_time', property.createdAt || '');
      if (property.publishedAt) {
        updateMetaTag('property', 'article:modified_time', property.publishedAt);
      }
      updateMetaTag('property', 'article:section', property.department || '');
      updateMetaTag('property', 'article:tag', `${property.type}, ${property.district}, ${property.department}`);

    } else if (view === 'SEARCH' && searchQuery) {
      const decoded = decodeURIComponent(searchQuery.replace(/\+/g, ' '));
      title = `${decoded} — Propiedades en Venta y Alquiler | Mi Casa Perú`;
      description = `Encuentra las mejores propiedades en ${decoded}. Casas, departamentos y terrenos en venta y alquiler en ${decoded}, Perú.`;
      ogUrl = `${window.location.origin}/?search=${searchQuery}`;

      const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': `Resultados de búsqueda para ${decoded} - Mi Casa Perú`,
        'numberOfItems': properties.length,
        'itemListElement': properties.slice(0, 15).map((p, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'url': `${window.location.origin}/properties/${p.id}`,
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
    } else if (view === 'PRICING') {
      title = 'Planes y Publicidad Inmobiliaria | Mi Casa Perú';
      description = 'Publica tus propiedades en Mi Casa Perú. Contamos con planes ideales para propietarios dueños directos, corredores e inmobiliarias. ¡Vende o alquila rápido!';
      keywords = 'publicar inmueble gratis, planes inmobiliarios peru, publicidad de casas, destacar anuncio inmobiliario';
      ogUrl = `${window.location.origin}/pricing`;
      clearSchemaScripts();
    } else if (view === 'COMPLAINTS_BOOK') {
      title = 'Libro de Reclamaciones | Mi Casa Perú';
      description = 'Ponemos a tu disposición nuestro Libro de Reclamaciones digital de acuerdo al reglamento de INDECOPI en Perú.';
      ogUrl = `${window.location.origin}/complaints`;
      clearSchemaScripts();
    } else if (view === 'ADMIN') {
      title = 'Panel de Administración | Mi Casa Perú';
      description = 'Panel administrativo interno de micasaperu.com.';
      updateMetaTag('name', 'robots', 'noindex, nofollow');
      updateMetaTag('name', 'googlebot', 'noindex, nofollow');
      clearSchemaScripts();
    } else if (view === 'DASHBOARD') {
      title = 'Mi Cuenta - Dashboard | Mi Casa Perú';
      description = 'Administra tus publicaciones, planes activos e información de contacto en Mi Casa Perú.';
      updateMetaTag('name', 'robots', 'noindex, nofollow');
      updateMetaTag('name', 'googlebot', 'noindex, nofollow');
      clearSchemaScripts();
    } else {
      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        'name': 'Mi Casa Perú',
        'url': window.location.origin,
        'logo': `${window.location.origin}/favicon.ico`,
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
          'email': 'hola@micasaperu.com'
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
          'url': `${window.location.origin}/properties/${p.id}`,
          'name': p.title
        }))
      } : null;

      const schemas: any[] = [websiteSchema, breadcrumb];
      if (itemListSchema) {
        schemas.push(itemListSchema);
      }
      injectSchema(schemas);
    }

    document.title = title;

    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);

    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:image:width', '1200');
    updateMetaTag('property', 'og:image:height', '630');
    updateMetaTag('property', 'og:url', ogUrl);
    updateMetaTag('property', 'og:type', view === 'DETAILS' ? 'article' : 'website');
    updateMetaTag('property', 'og:site_name', 'Mi Casa Perú');
    updateMetaTag('property', 'og:locale', 'es_PE');

    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImage);

  }, [view, property, searchQuery]);

  return null;
};

export default SEOManager;
