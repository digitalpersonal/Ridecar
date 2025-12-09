
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
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (start: number, end?: number) => {
      if (!end) return 'Em andamento';
      const diffMs = end - start;
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} min`;
  };

  const toggleExpand = (rideId: string | undefined) => {
      if (!rideId) return;
      setExpandedRideId(prev => prev === rideId ? null : rideId);
  };

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
          {[...rideHistory].reverse().map((ride, index) => {
            const isExpanded = expandedRideId === ride.id;
            return (
                <div 
                    key={index} 
                    onClick={() => toggleExpand(ride.id)}
                    className={`bg-gray-700 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer border border-transparent hover:border-orange-500/30 ${isExpanded ? 'ring-2 ring-orange-500/50' : ''}`}
                >
                    {/* Resumo da Linha */}
                    <div className="p-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-white flex items-center">
                                {isExpanded ? <i className="fa-solid fa-chevron-down mr-2 text-orange-500 text-xs"></i> : <i className="fa-solid fa-chevron-right mr-2 text-gray-500 text-xs"></i>}
                                {ride.passenger.name}
                            </p>
                            <p className="text-sm text-gray-400">{ride.destination.address}, {ride.destination.city}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                <i className="fa-regular fa-calendar mr-1"></i>
                                {formatDate(ride.startTime)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-orange-400">R${ride.fare.toFixed(2)}</p>
                            <p className="text-sm text-gray-400">{ride.distance.toFixed(2)} km</p>
                        </div>
                    </div>

                    {/* Detalhes Expandidos */}
                    {isExpanded && (
                        <div className="bg-gray-800/50 p-4 border-t border-gray-600 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                
                                {/* Coluna 1: Passageiro */}
                                <div className="space-y-2">
                                    <h4 className="text-orange-400 font-bold uppercase text-xs tracking-wider mb-2">Passageiro</h4>
                                    <p className="text-gray-300"><span className="text-gray-500 w-20 inline-block">Nome:</span> {ride.passenger.name}</p>
                                    <p className="text-gray-300">
                                        <span className="text-gray-500 w-20 inline-block">WhatsApp:</span> 
                                        <a 
                                            href={`https://wa.me/55${ride.passenger.whatsapp}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-green-400 hover:text-green-300 hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <i className="fa-brands fa-whatsapp mr-1"></i>
                                            {ride.passenger.whatsapp}
                                        </a>
                                    </p>
                                    {ride.passenger.cpf && (
                                        <p className="text-gray-300"><span className="text-gray-500 w-20 inline-block">CPF:</span> {ride.passenger.cpf}</p>
                                    )}
                                </div>

                                {/* Coluna 2: Trajeto e Tempo */}
                                <div className="space-y-2">
                                    <h4 className="text-orange-400 font-bold uppercase text-xs tracking-wider mb-2">Detalhes da Viagem</h4>
                                    
                                    <div className="flex items-start">
                                        <i className="fa-solid fa-map-pin text-green-500 mt-1 mr-2 w-4 text-center"></i>
                                        <div>
                                            <span className="text-xs text-gray-500 block">Origem (GPS)</span>
                                            <span className="text-gray-300">
                                                {ride.startLocation 
                                                    ? `${ride.startLocation.latitude.toFixed(5)}, ${ride.startLocation.longitude.toFixed(5)}`
                                                    : 'Não registrado'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <i className="fa-solid fa-location-dot text-red-500 mt-1 mr-2 w-4 text-center"></i>
                                        <div>
                                            <span className="text-xs text-gray-500 block">Destino</span>
                                            <span className="text-gray-300">{ride.destination.address}, {ride.destination.city}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between border-t border-gray-700 mt-2">
                                        <div>
                                            <span className="text-xs text-gray-500 block">Início</span>
                                            <span className="text-gray-300 font-mono">{new Date(ride.startTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        {ride.endTime && (
                                            <div className="text-right">
                                                <span className="text-xs text-gray-500 block">Fim</span>
                                                <span className="text-gray-300 font-mono">{new Date(ride.endTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        )}
                                        <div className="bg-gray-700 px-2 py-1 rounded text-center">
                                            <span className="text-xs text-gray-500 block">Duração</span>
                                            <span className="text-white font-bold">{calculateDuration(ride.startTime, ride.endTime)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
          })}
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
