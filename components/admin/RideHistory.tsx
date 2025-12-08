import React, { useState, useEffect, useRef } from 'react';
import type { Ride } from '../../types';

declare const L: any;

interface RideHistoryProps {
  rideHistory: Ride[];
}

const RideHistoryMap: React.FC<{rides: Ride[]}> = ({ rides }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [-15.7801, -47.9292], // Centro do Brasil
                zoom: 4,
                zoomControl: false,
                attributionControl: true,
            });
            
            // Changed to Light tiles (Positron)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);
            
            mapInstanceRef.current = map;

            const validRides = rides.filter(ride => ride.startLocation);
            if (validRides.length > 0) {
                const markers = L.markerClusterGroup();
                validRides.forEach(ride => {
                    const marker = L.marker([ride.startLocation!.latitude, ride.startLocation!.longitude]);
                    marker.bindPopup(`
                        <b>Passageiro:</b> ${ride.passenger.name}<br/>
                        <b>Destino:</b> ${ride.destination.city}<br/>
                        <b>Valor:</b> R$${ride.fare.toFixed(2)}<br/>
                        <b>Data:</b> ${new Date(ride.startTime).toLocaleDateString('pt-BR')}
                    `);
                    markers.addLayer(marker);
                });
                
                map.addLayer(markers);
                map.fitBounds(markers.getBounds(), { padding: [50, 50] });
            }
        }
    }, [rides]);

    return <div ref={mapContainerRef} className="h-full w-full rounded-lg bg-gray-100" />;
};


const RideHistory: React.FC<RideHistoryProps> = ({ rideHistory }) => {
  const [view, setView] = useState<'list' | 'map'>('list');

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (rideHistory.length === 0) {
    return <p className="text-gray-400 text-center mt-8">Nenhuma corrida no histórico ainda.</p>;
  }

  const ViewToggle = () => (
    <div className="flex bg-gray-900 p-1 rounded-lg">
        <button 
            onClick={() => setView('list')}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === 'list' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
            <i className="fa-solid fa-list mr-2"></i>
            Lista
        </button>
        <button 
            onClick={() => setView('map')}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === 'map' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
            <i className="fa-solid fa-map-location-dot mr-2"></i>
            Mapa
        </button>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-2xl font-semibold text-white">Histórico de Corridas</h3>
        <div className="w-full md:w-auto">
            <ViewToggle />
        </div>
      </div>
      
      {view === 'list' ? (
        <div className="space-y-4">
          {[...rideHistory].reverse().map((ride, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold text-white">{ride.passenger.name}</p>
                <p className="text-sm text-gray-400">{ride.destination.address}, {ride.destination.city}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(ride.startTime)}</p>
              </div>
              <div className="text-right">
                  <p className="text-xl font-bold text-orange-400">R${ride.fare.toFixed(2)}</p>
                  <p className="text-sm text-gray-400">{ride.distance.toFixed(2)} km</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[60vh] bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
            <RideHistoryMap rides={rideHistory} />
        </div>
      )}
    </div>
  );
};

export default RideHistory;