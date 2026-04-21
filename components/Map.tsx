
import React, { useEffect, useRef } from 'react';
import type { GeolocationCoordinates } from '../types';

declare const L: any; 

interface MapProps {
  location: GeolocationCoordinates | null;
  isLoading: boolean;
}

const Map: React.FC<MapProps> = ({ location, isLoading }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current && typeof L !== 'undefined') {
      // Coordenadas padrão (São Paulo) para o mapa não começar vazio
      const defaultCenter: [number, number] = [-23.5505, -46.6333];
      
      const map = L.map(mapContainerRef.current, {
          center: location ? [location.latitude, location.longitude] : defaultCenter, 
          zoom: location ? 16 : 12,
          zoomControl: false,
          attributionControl: false,
      });
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;

      // Força o redimensionamento quando o elemento aparece na tela
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && location && typeof L !== 'undefined') {
        if (!markerRef.current) {
            const blueIcon = L.divIcon({
                html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-xl"></div>`,
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            markerRef.current = L.marker([location.latitude, location.longitude], { icon: blueIcon, zIndexOffset: 1000 }).addTo(map);
            map.panTo([location.latitude, location.longitude]);
        } else {
            markerRef.current.setLatLng([location.latitude, location.longitude]);
            // Só move o mapa automaticamente se ele estiver longe do centro atual
            const currentCenter = map.getCenter();
            const dist = L.latLng(location.latitude, location.longitude).distanceTo(currentCenter);
            if (dist > 100) {
                map.panTo([location.latitude, location.longitude]);
            }
        }
    }
  }, [location]);

  return (
    <div className="relative h-full w-full bg-gray-950 overflow-hidden">
        <div ref={mapContainerRef} className="h-full w-full outline-none"></div>
        
        {/* Camada de Gradiente Inferior */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>

        {isLoading && !location && (
            <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-white text-xs font-black uppercase tracking-widest animate-pulse">Iniciando Mapa...</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default Map;
