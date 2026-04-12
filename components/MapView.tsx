
import React, { useEffect, useRef, useState } from 'react';
import * as turf from '@turf/turf';
import L from 'leaflet';
import { CapacitorHttp } from '@capacitor/core';
import { Property, LocationItem } from '../types';
import { PERU_LOCATIONS } from '../constants';

interface MapViewProps {
  properties: Property[]; 
  fullProperties: Property[]; 
  onSelectProperty: (id: string) => void;
  currency: 'USD' | 'PEN';
  onSwitchToList: () => void;
  onSpatialFilter: (ids: string[] | null) => void;
  visitedIds: Set<string>; 
  initialState?: { center: [number, number]; zoom: number } | null;
  onStateChange: (state: { center: [number, number]; zoom: number }) => void;
  focusedLocation?: LocationItem | null;
  isVisible?: boolean;
}

const PERU_BOUNDS: [[number, number], [number, number]] = [[-18.35, -81.33], [0.01, -68.65]];

const MapView: React.FC<MapViewProps> = ({ 
  properties, fullProperties, onSelectProperty, currency, onSwitchToList, onSpatialFilter,
  visitedIds, initialState, onStateChange, focusedLocation, isVisible = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const boundaryLayerRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(null);
  const lastVectorized = useRef<string | null>(null);

  const handlePropertyClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    onSelectProperty(id);
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const initMap = () => {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false, attributionControl: false, maxBounds: PERU_BOUNDS, minZoom: 5, zoomSnap: 1
      }).setView(initialState?.center || [-12.046, -77.042], initialState?.zoom || 12);

      // Usamos el layer de Google para mejor visualización urbana en Perú
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es-419').addTo(mapInstanceRef.current);
      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      boundaryLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);

      mapInstanceRef.current.on('moveend', () => {
        onStateChange({ center: [mapInstanceRef.current.getCenter().lat, mapInstanceRef.current.getCenter().lng], zoom: mapInstanceRef.current.getZoom() });
      });

      // Asegurar que el mapa tome el tamaño correcto
      setTimeout(() => { 
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize(); 
          setIsMapReady(true); 
        }
      }, 300);
    };
    initMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  // Lógica de zoom a las propiedades (Fallback)
  const fitToMarkers = () => {
    if (!mapInstanceRef.current || properties.length === 0) return;
    try {
      const markers = properties
        .filter(p => p.lat && p.lng)
        .map(p => L.marker([p.lat, p.lng]));
      
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        mapInstanceRef.current.fitBounds(group.getBounds(), { 
          padding: [80, 80], 
          animate: true,
          maxZoom: 16
        });
      }
    } catch (e) {
      console.error("Error fitting bounds:", e);
    }
  };

  // Lógica de vectorización (Zoom al distrito/ciudad) con Fallback ante "Failed to fetch"
  useEffect(() => {
    if (isVisible && mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current.invalidateSize(), 100);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;
    
    // Si no hay ubicación, limpiamos el polígono y re-ajustamos a los marcadores si existen
    if (!focusedLocation) {
      boundaryLayerRef.current?.clearLayers();
      lastVectorized.current = null;
      // Por defecto en Lima cuando no hay ubicación específica (según requerimiento)
      mapInstanceRef.current?.setView([-12.046, -77.042], 12, { animate: true });
      return;
    }

    const locName = focusedLocation.name;
    const locParent = focusedLocation.parent;
    const fullLocName = locParent ? `${locName}, ${locParent}` : locName;

    // Evitar re-vectorizar lo mismo si ya está centrado
    if (lastVectorized.current === fullLocName) return;

    // FALLBACK LOCAL INMEDIATO: Si la ubicación está en nuestra lista de constantes con coordenadas,
    // movemos el mapa allí primero antes de intentar el fetch.
    const localLoc = PERU_LOCATIONS.find(l => l.name.toLowerCase() === locName.toLowerCase());
    if (localLoc && localLoc.lat && localLoc.lng) {
      mapInstanceRef.current.setView([localLoc.lat, localLoc.lng], 12, { animate: true });
    }

    const vectorize = async () => {
      try {
        // Si ya tenemos un punto local, nos movemos ahí de inmediato para dar feedback visual
        if (localLoc && localLoc.lat && localLoc.lng) {
          mapInstanceRef.current.setView([localLoc.lat, localLoc.lng], 12, { animate: true });
        }

        const query = fullLocName.toLowerCase().includes('peru') 
          ? fullLocName 
          : `${fullLocName}, Peru`;

        // Nominatim requiere un tiempo entre peticiones y a veces falla por CORS.
        // Intentamos la petición con un timeout corto.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await CapacitorHttp.get({
          url: `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&limit=1&countrycodes=pe&email=soporte@micasaperu.com`,
          headers: {
            'Accept-Language': 'es-PE,es;q=0.9',
            'User-Agent': 'MiCasaPeruApp/1.0.0'
          }
        });
        clearTimeout(timeoutId);

        if (res.status !== 200) throw new Error(`HTTP Error: ${res.status}`);
        
        const data = res.data;
        
        if (data && data[0]) {
          boundaryLayerRef.current?.clearLayers();
          const layer = L.geoJSON(data[0].geojson, { 
            style: { 
              color: '#ef4444', 
              weight: 3, 
              fillOpacity: 0.1,
              dashArray: '5, 10'
            } 
          }).addTo(boundaryLayerRef.current);
          
          const bounds = layer.getBounds();
          mapInstanceRef.current.fitBounds(bounds, { 
            padding: [50, 50], 
            maxZoom: 12,
            animate: true,
            duration: 1.5
          });
          
          // Filtrado espacial: Solo mostramos propiedades dentro del área
          const idsInArea = fullProperties.filter(p => {
            if (!p.lat || !p.lng) return false;
            
            // Primero verificamos con bounds por rendimiento
            if (!bounds.contains([p.lat, p.lng])) return false;
            
            // Si está en el bounding box, verificamos con turf si está dentro del polígono
            try {
              const pt = turf.point([p.lng, p.lat]); // turf usa [lng, lat]
              let isInside = false;
              
              const geojson = data[0].geojson;
              if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
                isInside = turf.booleanPointInPolygon(pt, geojson);
              } else if (geojson.type === 'GeometryCollection') {
                for (const geom of geojson.geometries) {
                  if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
                    if (turf.booleanPointInPolygon(pt, geom)) {
                      isInside = true;
                      break;
                    }
                  }
                }
              } else {
                isInside = true; // Fallback a bounds si no es un polígono
              }
              
              return isInside;
            } catch (e) {
              console.warn("Error checking point in polygon", e);
              return true; // Fallback a bounds
            }
          }).map(p => p.id);
          
          // Siempre aplicamos el filtro espacial si hay polígono, incluso si está vacío
          // Esto asegura que solo se muestren propiedades DENTRO del área seleccionada
          onSpatialFilter(idsInArea);
          
          lastVectorized.current = fullLocName;
        } else {
          // Fallback: Si no hay polígono, usamos el punto local para filtrar por cercanía (radio 3km)
          if (localLoc && localLoc.lat && localLoc.lng) {
            const center = L.latLng(localLoc.lat, localLoc.lng);
            const idsNearby = fullProperties.filter(p => {
              if (!p.lat || !p.lng) return false;
              return center.distanceTo([p.lat, p.lng]) < 3000; // 3km
            }).map(p => p.id);
            
            onSpatialFilter(idsNearby);
          } else {
            fitToMarkers();
            onSpatialFilter(null);
          }
          lastVectorized.current = fullLocName;
        }
      } catch (err) { 
        console.warn("Vectorization failed, using text-based search fallback:", err);
        // En caso de error de red, nos aseguramos de que no se quede la lista vacía
        onSpatialFilter(null); 
        if (!lastVectorized.current) fitToMarkers();
      }
    };
    
    vectorize();
  }, [isMapReady, focusedLocation, fullProperties.length]);

  // Renderizado de marcadores
  useEffect(() => {
    if (!markersLayerRef.current || !isMapReady) return;
    
    markersLayerRef.current.clearLayers();
    
    properties.forEach(p => {
      if (!p.lat || !p.lng) return;

      const price = currency === 'USD' ? `$${(p.priceUSD / 1000).toFixed(1)}k` : `S/${(p.pricePEN / 1000).toFixed(1)}k`;
      const isVisited = visitedIds.has(p.id);
      const isFocused = focusedPropertyId === p.id;

      const markerColorHex = isFocused ? '#0f172a' : (isVisited ? '#6b7280' : '#dc2626');
      
      const icon = L.divIcon({
        className: 'bg-transparent border-none', 
        html: `<div class="flex items-center justify-center w-0 h-0">
                 <div class="text-white px-3 py-1.5 rounded-full text-[11px] font-black border-2 border-white shadow-xl whitespace-nowrap animate-fade-in transform -translate-x-1/2 -translate-y-1/2 transition-all ${isFocused ? 'scale-110 z-50' : 'z-10'}" 
                      style="background-color: ${markerColorHex} !important; opacity: 1 !important; color: white !important;">
                   ${price}
                 </div>
               </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      L.marker([p.lat, p.lng], { icon }).addTo(markersLayerRef.current).on('click', () => {
        setFocusedPropertyId(p.id);
        mapInstanceRef.current.panTo([p.lat, p.lng], { animate: true });
      });
    });
  }, [properties, currency, focusedPropertyId, visitedIds, isMapReady]);

  const focusedProperty = properties.find(p => p.id === focusedPropertyId);

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col bg-[#aad3df]">
      <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />
      
      {/* Botón Volver a Lista */}
      <div className="absolute top-8 right-8 z-[1000]">
        <button onClick={onSwitchToList} className="bg-white px-8 py-4 rounded-2xl shadow-2xl border border-white font-black text-[10px] uppercase tracking-widest flex items-center space-x-3 hover:bg-[#091F4F] hover:text-white transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16M4 18h16"/></svg>
          <span>LISTADO</span>
        </button>
      </div>

      {/* Pre-view de propiedad enfocada */}
      {focusedProperty && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[3000] w-full max-w-sm px-4">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 flex p-3 animate-slide-up">
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
              <img src={focusedProperty.featuredImage} className="w-full h-full object-cover" alt="Thumb" />
            </div>
            <div className="pl-4 flex flex-col justify-center flex-grow">
               <span className="text-red-600 font-black text-xl tracking-tighter leading-none mb-1">
                 {currency === 'USD' ? '$' : 'S/'} {currency === 'USD' ? focusedProperty.priceUSD.toLocaleString() : focusedProperty.pricePEN.toLocaleString()}
               </span>
               <h4 className="text-gray-900 font-black text-[9px] uppercase line-clamp-1 mb-2 tracking-tight">
                 {focusedProperty.district} • {focusedProperty.type}
               </h4>
               <button 
                 onClick={(e) => handlePropertyClick(focusedProperty.id, e)} 
                 className="bg-[#091F4F] text-white font-black py-2.5 px-6 rounded-lg text-[9px] uppercase tracking-widest hover:bg-red-600 transition-colors w-full"
               >
                 Ver Detalles
               </button>
            </div>
            <button 
              onClick={() => setFocusedPropertyId(null)}
              className="absolute -top-2 -right-2 bg-white text-gray-400 p-1.5 rounded-full shadow-md hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
