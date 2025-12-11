
import React, { useEffect, useRef, useState } from 'react';
import type { GeolocationCoordinates } from '../types';

declare const L: any; // Informa ao TypeScript sobre a variável global L do Leaflet

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

// Helpers para ícones SVG em String (Evita uso de ReactDOMServer que causa erro no browser)
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

// Função auxiliar para calcular distância em metros
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius of the earth in km
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
  
  // Refs para as linhas da rota (Borda branca e linha azul)
  const routePolylineRef = useRef<any>(null);
  const routeBorderRef = useRef<any>(null);
  const straightLineRef = useRef<any>(null);
  
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [isAutoCenter, setIsAutoCenter] = useState(true);
  
  // Estado para controlar a última localização onde a rota foi calculada
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
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
      });
      
      map.on('dragstart', () => setIsAutoCenter(false));
      map.on('zoomstart', () => setIsAutoCenter(false));
      map.on('movestart', (e: any) => {
         // Opcional: detectar interações mais sutis
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Se o destino mudar, força o reset do cálculo de rota para atualizar imediatamente
  // Isso previne que a regra dos 30m bloqueie a atualização quando o motorista edita o destino.
  useEffect(() => {
    setLastRouteFetchLoc(null);
  }, [destinationCoords]);

  // Fetch Optimal Route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      // Calculamos a rota a partir da POSIÇÃO ATUAL (se houver) ou do INÍCIO para o destino
      const origin = currentLocation || startLocation;
      
      if (!origin || !destinationCoords) return;

      // Validação básica de coordenadas
      if (isNaN(origin.latitude) || isNaN(origin.longitude) || isNaN(destinationCoords.latitude) || isNaN(destinationCoords.longitude)) {
          return;
      }

      // ESTABILIZAÇÃO DA ROTA:
      // Só recalcula se moveu mais de 30 metros da última vez que calculou
      if (lastRouteFetchLoc) {
          const dist = getDistanceFromLatLonInMeters(
              origin.latitude, origin.longitude,
              lastRouteFetchLoc.latitude, lastRouteFetchLoc.longitude
          );
          if (dist < 30) {
              return; // Não atualiza a rota se moveu pouco
          }
      }

      const fetchFromUrl = async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
              throw new Error("Invalid content type (not JSON)");
          }
          return res.json();
      };

      try {
        let data;
        
        // Tentativa 1: Servidor OSRM Alemão (Geralmente mais estável e rápido para demos)
        try {
            data = await fetchFromUrl(
            `https://routing.openstreetmap.de/routed-car/route/v1/driving/${origin.longitude},${origin.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson`
            );
        } catch (e) {
            console.warn("Primary routing server failed, trying backup...");
            // Tentativa 2: Servidor OSRM Principal (Fallback)
            data = await fetchFromUrl(
            `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson`
            );
        }
        
        if (data && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const geometry = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
            setRoutePath(geometry);
            setLastRouteFetchLoc(origin); // Atualiza a posição de referência para o próximo cálculo
        } else {
            // Se não achou rota, desenha linha reta no render (fallback visual)
            if (routePath.length === 0) setRoutePath([]);
        }
      } catch (error) {
        console.warn("Routing unavailable:", error);
        // Mantém rota anterior ou vazio
      }
    };

    fetchRoute();
  }, [currentLocation, destinationCoords, startLocation]); // Recalcula se mudar posição ou destino


  // Renderização do Mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    map.invalidateSize();
  
    // 1. Marcadores (Início e Fim)
    if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
    if (destinationMarkerRef.current) map.removeLayer(destinationMarkerRef.current);
  
    // Marcador de Início
    if (startLocation) {
      const startIcon = L.divIcon({
        html: getPinIconHtml('fa-flag', 'text-green-600'),
        className: '',
        iconSize: [40, 50],
        iconAnchor: [20, 50],
      });
      startMarkerRef.current = L.marker([startLocation.latitude, startLocation.longitude], { icon: startIcon }).addTo(map);
    }
  
    // Marcador de Destino
    if (destinationCoords) {
      const destIcon = L.divIcon({
        html: getPinIconHtml('fa-flag-checkered', 'text-red-600'),
        className: '',
        iconSize: [40, 50],
        iconAnchor: [20, 50],
      });
      destinationMarkerRef.current = L.marker([destinationCoords.latitude, destinationCoords.longitude], { icon: destIcon })
        .addTo(map)
        .bindTooltip(destination.address, {
          permanent: true,
          direction: 'top',
          offset: [0, -45],
          className: 'map-label-tooltip'
        });
    }

    // 2. Linhas de Rota (Visual Melhorado)
    if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
    if (routeBorderRef.current) map.removeLayer(routeBorderRef.current);
    if (straightLineRef.current) map.removeLayer(straightLineRef.current);

    const origin = currentLocation || startLocation;

    if (routePath.length > 0) {
        // CAMADA 1: Borda Branca (Casing) para destacar a rota
        routeBorderRef.current = L.polyline(routePath, {
            color: 'white',
            weight: 10, // Mais grosso que a linha azul
            opacity: 0.8,
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(map);

        // CAMADA 2: Rota Azul Principal
        routePolylineRef.current = L.polyline(routePath, {
            color: '#3b82f6', // blue-500
            weight: 6,
            opacity: 1,
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(map);
    } else if (origin && destinationCoords) {
        // Fallback: Linha reta se não houver rota OSRM
        straightLineRef.current = L.polyline([
            [origin.latitude, origin.longitude],
            [destinationCoords.latitude, destinationCoords.longitude]
        ], {
            color: '#6b7280',
            weight: 4,
            dashArray: '10, 10',
            opacity: 0.5
        }).addTo(map);
    }
  
    // 3. Auto Center (Zoom)
    if (isAutoCenter) {
      const bounds = L.latLngBounds([]);
      let hasPoints = false;

      if (startLocation) {
          bounds.extend([startLocation.latitude, startLocation.longitude]);
          hasPoints = true;
      }
      if (destinationCoords) {
          bounds.extend([destinationCoords.latitude, destinationCoords.longitude]);
          hasPoints = true;
      }
      if (currentLocation) {
          bounds.extend([currentLocation.latitude, currentLocation.longitude]);
          hasPoints = true;
      }

      if (routePath.length > 0) {
          // Adiciona pontos estratégicos da rota para garantir o zoom correto
          // Início, meio e fim, mais alguns passos
          const step = Math.max(1, Math.floor(routePath.length / 10));
          for(let i=0; i<routePath.length; i+=step) {
              bounds.extend(routePath[i]);
          }
          bounds.extend(routePath[routePath.length-1]);
          hasPoints = true;
      }

      if (hasPoints && bounds.isValid()) {
          map.fitBounds(bounds, { 
              padding: [80, 80],
              maxZoom: 17,
              animate: true,
              duration: 1.0
          });
      }
    }
  
  }, [startLocation, destinationCoords, destination.address, routePath, currentLocation, isAutoCenter]);


  // Efeito do Carro e Rastro
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation) return;
    
    const latLng = [currentLocation.latitude, currentLocation.longitude];

    if (!carMarkerRef.current) {
      carMarkerRef.current = L.marker(latLng, { icon: getCarIcon(0), zIndexOffset: 1000 }).addTo(map);
      if (driverName) {
        carMarkerRef.current.bindTooltip(driverName, {
            permanent: true, direction: 'bottom', offset: [0, 10], className: 'map-label-tooltip'
        });
      }
    } else {
       let rotation = 0;
       if (path.length > 1) {
         const p1 = path[path.length - 2];
         const p2 = path[path.length - 1];
         const toRad = (deg: number) => deg * Math.PI / 180;
         const toDeg = (rad: number) => rad * 180 / Math.PI;
         const lat1 = toRad(p1.latitude);
         const lat2 = toRad(p2.latitude);
         const dLon = toRad(p2.longitude - p1.longitude);
         const y = Math.sin(dLon) * Math.cos(lat2);
         const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
         const bearing = toDeg(Math.atan2(y, x));
         rotation = (bearing + 360) % 360;
       }
      carMarkerRef.current.setLatLng(latLng).setIcon(getCarIcon(rotation));
    }
    
    // Rastro percorrido (Laranja Escuro)
    const pathLatLngs = path.map(p => [p.latitude, p.longitude]);
    if (!pathPolylineRef.current) {
      pathPolylineRef.current = L.polyline(pathLatLngs, { color: '#ea580c', weight: 4, opacity: 0.8 }).addTo(map);
    } else {
      pathPolylineRef.current.setLatLngs(pathLatLngs);
    }

  }, [currentLocation, path, driverName]); 

  return (
    <div className="relative h-full w-full bg-gray-100 overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full"></div>
      
       <div className="absolute top-4 left-4 z-[500] p-2 bg-gray-900/80 rounded-lg text-white backdrop-blur-sm shadow-lg border border-gray-700 max-w-[60%]">
        <p className="text-xs text-gray-400">Destino</p>
        <p className="text-sm font-semibold truncate">{destination.address}</p>
      </div>

      {!isAutoCenter && (
        <button 
          onClick={() => {
              setIsAutoCenter(true);
              const map = mapInstanceRef.current;
              if (map) map.invalidateSize();
          }}
          className="absolute bottom-6 right-6 z-[500] bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center animate-bounce"
          title="Centralizar Mapa"
        >
          <i className="fa-solid fa-location-crosshairs text-xl"></i>
        </button>
      )}
    </div>
  );
};

export default RideMap;
