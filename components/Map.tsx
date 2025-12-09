
import React, { useEffect, useRef } from 'react';
import type { GeolocationCoordinates } from '../types';

declare const L: any; // Informa ao TypeScript sobre a variável global L do Leaflet

interface MapProps {
  location: GeolocationCoordinates | null;
  isLoading: boolean;
}

const Map: React.FC<MapProps> = ({ location, isLoading }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Inicializa o mapa
      const map = L.map(mapContainerRef.current, {
          center: [-15.7801, -47.9292], // Centro do Brasil
          zoom: 4,
          zoomControl: false,
          attributionControl: false,
      });
      
      // Changed to Light tiles (Positron)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && location) {
        if (!markerRef.current) {
            // Darker blue for light map to ensure visibility
            const blueIcon = L.icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0369a1"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>'),
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            });
            markerRef.current = L.marker([location.latitude, location.longitude], { icon: blueIcon }).addTo(map);
            
            // Initial View Set
            map.setView([location.latitude, location.longitude], 18);
        } else {
            // Smooth update without full reset
            markerRef.current.setLatLng([location.latitude, location.longitude]);
            map.panTo([location.latitude, location.longitude]);
        }
    }
  }, [location]);

  return (
    <div className="absolute inset-0 h-full w-full bg-gray-100 overflow-hidden">
        <div ref={mapContainerRef} className="h-full w-full"></div>
        {isLoading && (
            <div className="absolute inset-0 bg-gray-800/70 flex items-center justify-center z-10">
                <div className="text-center text-white">
                    <i className="fa-solid fa-spinner fa-spin text-3xl mb-3"></i>
                    <p>Obtendo localização GPS...</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default Map;
