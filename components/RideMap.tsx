import React, { useEffect, useRef, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import type { GeolocationCoordinates } from '../types';
import { CarIcon } from './icons';

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
}

const MapPinIcon: React.FC<{ icon: string; color: string }> = ({ icon, color }) => (
  <div className="relative flex flex-col items-center">
    <i className={`fa-solid ${icon} ${color} text-4xl drop-shadow-md`}></i>
    <div className="w-3 h-3 bg-black/30 rounded-full -mt-1.5 blur-sm"></div>
  </div>
);


const RideMap: React.FC<RideMapProps> = ({ startLocation, currentLocation, path, destination, destinationCoords }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const carMarkerRef = useRef<any>(null);
  const pathPolylineRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  const getCarIcon = (rotation: number = 0) => {
    // Making the car icon slightly darker orange for better contrast on white
    const iconHTML = ReactDOMServer.renderToString(
      <CarIcon className="h-10 w-10 text-orange-600 drop-shadow-lg animate-pulse-car" style={{ transform: `rotate(${rotation}deg)` }}/>
    );
    return L.divIcon({
      html: iconHTML,
      className: '', // para não adicionar classes padrão do leaflet
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };
  
  // Efeito de inicialização do mapa
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
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

  // Fetch Optimal Route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      if (startLocation && destinationCoords) {
        try {
          // OSRM Public API
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${startLocation.longitude},${startLocation.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          
          if (data.routes && data.routes.length > 0) {
            // Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
            const coords = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
            setRoutePath(coords);
          }
        } catch (error) {
          console.error("Error fetching OSRM route:", error);
          // Fallback to straight line if routing fails
          setRoutePath([
            [startLocation.latitude, startLocation.longitude],
            [destinationCoords.latitude, destinationCoords.longitude]
          ]);
        }
      }
    };

    fetchRoute();
  }, [startLocation, destinationCoords]);


  // Efeito para gerenciar marcadores de início/destino e ajustar limites
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
  
    // Limpa marcadores existentes para evitar duplicatas
    if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
    if (destinationMarkerRef.current) map.removeLayer(destinationMarkerRef.current);
  
    // Adiciona marcador de início
    if (startLocation) {
      const startIconHTML = ReactDOMServer.renderToString(<MapPinIcon icon="fa-flag" color="text-green-600" />);
      const startIcon = L.divIcon({
        html: startIconHTML,
        className: '',
        iconSize: [40, 50],
        iconAnchor: [5, 50], // Ancorado na base do mastro da bandeira
      });
      startMarkerRef.current = L.marker([startLocation.latitude, startLocation.longitude], { icon: startIcon })
        .addTo(map)
        .bindTooltip("Ponto de Partida", {
          permanent: true,
          direction: 'right',
          offset: [20, -25],
          className: 'map-label-tooltip'
        });
    }
  
    // Adiciona marcador de destino
    if (destinationCoords) {
      const destIconHTML = ReactDOMServer.renderToString(<MapPinIcon icon="fa-flag-checkered" color="text-red-600" />);
      const destIcon = L.divIcon({
        html: destIconHTML,
        className: '',
        iconSize: [40, 50],
        iconAnchor: [5, 50],
      });
      destinationMarkerRef.current = L.marker([destinationCoords.latitude, destinationCoords.longitude], { icon: destIcon })
        .addTo(map)
        .bindTooltip(destination.address, {
          permanent: true,
          direction: 'right',
          offset: [20, -25],
          className: 'map-label-tooltip'
        });
    }
  
    // Ajusta os limites do mapa
    if (startLocation && destinationCoords) {
      // Create a bounds object that includes the route path if available, otherwise just start/end
      const bounds = L.latLngBounds([
        [startLocation.latitude, startLocation.longitude],
        [destinationCoords.latitude, destinationCoords.longitude]
      ]);
      
      if (routePath.length > 0) {
        routePath.forEach(coord => bounds.extend(coord));
      }

      map.fitBounds(bounds, { padding: [70, 70] });
    } else if (startLocation) {
      map.setView([startLocation.latitude, startLocation.longitude], 14);
    } else {
      map.setView([-15.7801, -47.9292], 4); // Visão geral do Brasil
    }
  
  }, [startLocation, destinationCoords, destination.address, routePath]);


  // Efeito para o marcador do carro e o traçado do caminho percorrido (Laranja)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation) return;
    
    const latLng = [currentLocation.latitude, currentLocation.longitude];

    // Atualiza ou cria o marcador do carro
    if (!carMarkerRef.current) {
      carMarkerRef.current = L.marker(latLng, { icon: getCarIcon(0), zIndexOffset: 1000 }).addTo(map);
    } else {
       // Calcula a rotação
       let rotation = 0;
       if (path.length > 1) {
         const p1 = path[path.length - 2];
         const p2 = path[path.length - 1];
         rotation = Math.atan2(p2.longitude - p1.longitude, p2.latitude - p1.latitude) * (180 / Math.PI);
       }
      carMarkerRef.current.setLatLng(latLng).setIcon(getCarIcon(rotation));
    }
    
    // Centraliza o mapa no carro
    map.panTo(latLng);

    // Atualiza ou cria a polilinha do caminho (Orange - Traveled)
    const pathLatLngs = path.map(p => [p.latitude, p.longitude]);
    if (!pathPolylineRef.current) {
      pathPolylineRef.current = L.polyline(pathLatLngs, { color: '#ea580c', weight: 4, opacity: 0.9 }).addTo(map); // Darker orange
    } else {
      pathPolylineRef.current.setLatLngs(pathLatLngs);
    }

  }, [currentLocation, path]);

  // Efeito para desenhar a rota OTIMIZADA (Azul)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePath.length > 0) {
        if (!routePolylineRef.current) {
            routePolylineRef.current = L.polyline(routePath, {
                color: '#0369a1', // Blue 700
                weight: 5,
                opacity: 0.6,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(map);
        } else {
            routePolylineRef.current.setLatLngs(routePath);
        }
    } else {
        if (routePolylineRef.current) {
            map.removeLayer(routePolylineRef.current);
            routePolylineRef.current = null;
        }
    }
  }, [routePath]);

  const handleOpenGoogleMaps = () => {
    if (destinationCoords && currentLocation) {
      // Use current location as origin to get real-time directions
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="relative h-full w-full bg-gray-100 overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full"></div>
      
       {/* Traffic/Route Button */}
       {destinationCoords && currentLocation && (
         <button
            onClick={handleOpenGoogleMaps}
            className="absolute top-4 right-16 z-[500] bg-white text-gray-800 hover:bg-gray-50 font-semibold py-2 px-3 rounded-lg shadow-md border border-gray-200 text-sm flex items-center transition-all"
            title="Ver trânsito real e rota no Google Maps"
         >
            <i className="fa-brands fa-google text-blue-500 mr-2"></i>
            <span className="hidden sm:inline">Trânsito/Rota</span>
            <span className="sm:hidden"><i className="fa-solid fa-traffic-light text-red-500"></i></span>
         </button>
       )}

       <div className="absolute top-4 left-4 z-[500] p-2 bg-gray-900/80 rounded-lg text-white backdrop-blur-sm shadow-lg border border-gray-700">
        <p className="text-xs text-gray-400">Destino</p>
        <p className="text-sm font-semibold truncate max-w-[200px]">{destination.address}</p>
      </div>
    </div>
  );
};

export default RideMap;