
import React, { useEffect, useRef, useState } from 'react';
import type { GeolocationCoordinates } from '../types';

declare const L: any; 

interface RideMapProps {
  startLocation: GeolocationCoordinates | null;
  currentLocation: GeolocationCoordinates | null;
  path: GeolocationCoordinates[];
  destination: {
    address: string;
    city: string;
  };
  destinationCoords: GeolocationCoordinates | null;
  driverName?: string;
}

const getPinIconHtml = (iconClass: string, colorClass: string) => `
  <div class="relative flex flex-col items-center" style="transform: translate(0, -50%);">
    <i class="fa-solid ${iconClass} ${colorClass} text-4xl drop-shadow-md" style="font-size: 36px;"></i>
    <div class="w-3 h-3 bg-black/30 rounded-full mt-[-2px] blur-sm"></div>
  </div>
`;

const getCarIconHtml = (rotation: number) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="text-orange-600 drop-shadow-md" style="width: 32px; height: 32px; transform: rotate(${rotation}deg); color: #ea580c; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
`;

const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const RideMap: React.FC<RideMapProps> = ({ startLocation, currentLocation, path, destination, destinationCoords, driverName }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const carMarkerRef = useRef<any>(null);
  const pathPolylineRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  
  const routePolylineRef = useRef<any>(null);
  const routeBorderRef = useRef<any>(null);
  const straightLineRef = useRef<any>(null);
  
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [isAutoCenter, setIsAutoCenter] = useState(true);
  const [lastRouteFetchLoc, setLastRouteFetchLoc] = useState<GeolocationCoordinates | null>(null);

  const getCarIcon = (rotation: number = 0) => {
    return L.divIcon({
      html: getCarIconHtml(rotation),
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };
  
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current && typeof L !== 'undefined') {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        center: [-23.5505, -46.6333],
        zoom: 12
      });
      
      map.on('dragstart', () => setIsAutoCenter(false));
      map.on('zoomstart', () => setIsAutoCenter(false));

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;

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
    setLastRouteFetchLoc(null);
  }, [destinationCoords]);

  useEffect(() => {
    const fetchRoute = async () => {
      const origin = currentLocation || startLocation;
      if (!origin || !destinationCoords || typeof L === 'undefined') return;

      if (lastRouteFetchLoc && currentLocation) {
          const distFromLastFetch = getDistanceFromLatLonInMeters(
              origin.latitude, origin.longitude,
              lastRouteFetchLoc.latitude, lastRouteFetchLoc.longitude
          );
          if (distFromLastFetch < 50) return; 
      }

      try {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        if (data && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const geometry = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
            setRoutePath(geometry);
            setLastRouteFetchLoc(origin);
        }
      } catch (error) {
        console.warn("Falha no roteamento OSRM:", error);
      }
    };
    fetchRoute();
  }, [currentLocation, destinationCoords, startLocation]);

  // Efecto para marcadores estáticos e infraestrutura da rota
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof L === 'undefined') return;
    
    // START MARKER
    if (startLocation) {
      const latLng = [startLocation.latitude, startLocation.longitude] as [number, number];
      if (!startMarkerRef.current) {
        const startIcon = L.divIcon({
          html: getPinIconHtml('fa-flag', 'text-green-600'),
          className: '', iconSize: [40, 50], iconAnchor: [20, 50],
        });
        startMarkerRef.current = L.marker(latLng, { icon: startIcon }).addTo(map);
      } else {
        startMarkerRef.current.setLatLng(latLng);
      }
    } else if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
  
    // DESTINATION MARKER
    if (destinationCoords) {
      const latLng = [destinationCoords.latitude, destinationCoords.longitude] as [number, number];
      if (!destinationMarkerRef.current) {
        const destIcon = L.divIcon({
          html: getPinIconHtml('fa-flag-checkered', 'text-red-600'),
          className: '', iconSize: [40, 50], iconAnchor: [20, 50],
        });
        destinationMarkerRef.current = L.marker(latLng, { icon: destIcon })
          .addTo(map)
          .bindTooltip(destination.address, {
            permanent: true, direction: 'top', offset: [0, -45], className: 'map-label-tooltip'
          });
      } else {
        destinationMarkerRef.current.setLatLng(latLng);
        if (destinationMarkerRef.current.getTooltip()) {
          destinationMarkerRef.current.setTooltipContent(destination.address);
        }
      }
    } else if (destinationMarkerRef.current) {
      map.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }
  }, [startLocation, destinationCoords, destination.address]);

  // Efecto para as polilinhas de rota (baseado no routePath)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof L === 'undefined') return;

    if (routePath.length > 0) {
      // Limpar linha reta se existir
      if (straightLineRef.current) {
        map.removeLayer(straightLineRef.current);
        straightLineRef.current = null;
      }

      if (!routePolylineRef.current) {
        routeBorderRef.current = L.polyline(routePath, { color: 'white', weight: 10, opacity: 0.8 }).addTo(map);
        routePolylineRef.current = L.polyline(routePath, { color: '#3b82f6', weight: 6, opacity: 1 }).addTo(map);
      } else {
        routeBorderRef.current.setLatLngs(routePath);
        routePolylineRef.current.setLatLngs(routePath);
      }
    } else {
      // Remover polilinhas de rota se não houver path
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
        map.removeLayer(routeBorderRef.current);
        routePolylineRef.current = null;
        routeBorderRef.current = null;
      }

      // Desenhar linha reta temporária se necessário
      const origin = currentLocation || startLocation;
      if (origin && destinationCoords) {
        const straightLatLngs = [
          [origin.latitude, origin.longitude],
          [destinationCoords.latitude, destinationCoords.longitude]
        ];
        if (!straightLineRef.current) {
          straightLineRef.current = L.polyline(straightLatLngs, { 
            color: '#6b7280', weight: 4, dashArray: '10, 10', opacity: 0.5 
          }).addTo(map);
        } else {
          straightLineRef.current.setLatLngs(straightLatLngs);
        }
      }
    }
  }, [routePath, destinationCoords, startLocation, currentLocation]);

  // Controle de ajuste de zoom e centralização (AutoCenter)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isAutoCenter || typeof L === 'undefined') return;

    const bounds = L.latLngBounds([]);
    let hasPoints = false;
    
    if (startLocation) { bounds.extend([startLocation.latitude, startLocation.longitude]); hasPoints = true; }
    if (destinationCoords) { bounds.extend([destinationCoords.latitude, destinationCoords.longitude]); hasPoints = true; }
    if (currentLocation) { bounds.extend([currentLocation.latitude, currentLocation.longitude]); hasPoints = true; }
    
    if (hasPoints && bounds.isValid()) {
      // Usar debounce ou apenas disparar se for a primeira vez ou se a mudança for significativa
      // Para evitar animações constantes, vamos usar fitBounds com opções que não sejam tão agressivas
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17, animate: true, duration: 1 });
    }
  }, [isAutoCenter, startLocation, destinationCoords, routePath]); // Removemos currentLocation daqui para evitar pulos constantes. 
  // O currentLocation é processado no efeito de movimento do carro separadamente.

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation || typeof L === 'undefined') return;
    
    const latLng = [currentLocation.latitude, currentLocation.longitude] as [number, number];

    if (!carMarkerRef.current) {
      carMarkerRef.current = L.marker(latLng, { icon: getCarIcon(0), zIndexOffset: 1000 }).addTo(map);
    } else {
       let rotation = 0;
       if (path.length > 1) {
         const p1 = path[path.length - 2];
         const p2 = path[path.length - 1];
         // Pequeno ajuste para evitar rotações absurdas com jitter de GPS
         const dLon = p2.longitude - p1.longitude;
         const dLat = p2.latitude - p1.latitude;
         if (Math.abs(dLon) > 0.00001 || Math.abs(dLat) > 0.00001) {
           rotation = (Math.atan2(dLon, dLat) * 180 / Math.PI);
         } else {
           // Manter a rotação anterior se o movimento for insignificante
           rotation = carMarkerRef.current.options.rotationAngle || 0;
         }
       }
       
       // Sincronizar posição e ícone
       carMarkerRef.current.setLatLng(latLng);
       
       // Só atualizamos o ícone/rotação se houve mudança perceptível para evitar flickering
       const currentIconHtml = carMarkerRef.current.options.icon.options.html;
       const newIconHtml = getCarIconHtml(rotation);
       if (currentIconHtml !== newIconHtml) {
          carMarkerRef.current.setIcon(getCarIcon(rotation));
       }
    }
    
    const pathLatLngs = path.map(p => [p.latitude, p.longitude]);
    if (!pathPolylineRef.current) {
      pathPolylineRef.current = L.polyline(pathLatLngs, { color: '#ea580c', weight: 4, opacity: 0.8, dashArray: '1, 8' }).addTo(map);
    } else {
      pathPolylineRef.current.setLatLngs(pathLatLngs);
    }
  }, [currentLocation, path]); 

  return (
    <div className="relative h-full w-full bg-gray-100 overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full outline-none"></div>
      
      {!isAutoCenter && (
        <button 
          onClick={() => setIsAutoCenter(true)}
          className="absolute bottom-6 right-6 z-[500] bg-primary text-white p-4 rounded-full shadow-2xl border-2 border-white/20"
        >
          <i className="fa-solid fa-location-crosshairs text-xl"></i>
        </button>
      )}
    </div>
  );
};

export default RideMap;
