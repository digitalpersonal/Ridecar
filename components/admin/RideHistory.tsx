
import React, { useState, useEffect, useRef } from 'react';
import type { Ride, Driver } from '../../types';

declare const L: any;

interface RideHistoryProps {
  rideHistory: Ride[];
  currentDriver: Driver | null;
}

const RideHistoryMap: React.FC<{rides: Ride[]}> = ({ rides }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const clusterGroupRef = useRef<any>(null); // Referência persistente para o grupo de clusters

    // 1. Inicialização do Mapa (Roda apenas uma vez)
    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [-15.7801, -47.9292], // Centro do Brasil
                zoom: 4,
                zoomControl: false,
                attributionControl: true,
            });
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);
            
            // Inicializa o grupo de clusters vazio e adiciona ao mapa
            const markers = L.markerClusterGroup({
                showCoverageOnHover: false,
                maxClusterRadius: 50, // Agrupa marcadores num raio de 50 pixels
            });
            map.addLayer(markers);
            
            clusterGroupRef.current = markers;
            mapInstanceRef.current = map;
        }
    }, []);

    // 2. Atualização dos Marcadores (Roda quando a lista de rides muda)
    useEffect(() => {
        const map = mapInstanceRef.current;
        const clusterGroup = clusterGroupRef.current;

        if (map && clusterGroup) {
             // Limpa marcadores antigos para evitar duplicatas e vazamento de memória
             clusterGroup.clearLayers();

            const validRides = rides.filter(ride => ride.startLocation);

            if (validRides.length > 0) {
                const markersToAdd: any[] = [];

                validRides.forEach(ride => {
                    const marker = L.marker([ride.startLocation!.latitude, ride.startLocation!.longitude]);
                    
                    const dateStr = new Date(ride.startTime).toLocaleDateString('pt-BR');
                    const popupContent = `
                        <div class="p-2 text-gray-800 min-w-[150px]">
                            <h4 class="font-bold text-sm border-b border-gray-300 pb-1 mb-1">${ride.passenger.name}</h4>
                            <p class="text-xs mb-1"><b>Destino:</b> <br/>${ride.destination.city}</p>
                            <div class="flex justify-between items-center mt-2">
                                <span class="text-xs font-mono bg-gray-100 px-1 rounded">${dateStr}</span>
                                <span class="font-bold text-orange-600">R$${ride.fare.toFixed(2)}</span>
                            </div>
                        </div>
                    `;

                    marker.bindPopup(popupContent);
                    markersToAdd.push(marker);
                });
                
                // Adiciona todos os novos marcadores de uma vez (Bulk add é mais performático)
                clusterGroup.addLayers(markersToAdd);
                
                // Ajusta o zoom para mostrar todos os marcadores
                try {
                    map.fitBounds(clusterGroup.getBounds(), { padding: [50, 50] });
                } catch (e) {
                    console.warn("Could not fit bounds (possibly single point or invalid bounds)", e);
                }
            }
        }
    }, [rides]);

    return <div ref={mapContainerRef} className="h-full w-full rounded-lg bg-gray-100" />;
};


const RideHistory: React.FC<RideHistoryProps> = ({ rideHistory, currentDriver }) => {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);

  const isAdmin = currentDriver?.role === 'admin';

  // Filter rides: Admin sees all, Driver sees own
  const filteredHistory = isAdmin 
    ? rideHistory 
    : rideHistory.filter(r => r.driverId === currentDriver?.id);

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

  if (filteredHistory.length === 0) {
    return (
        <div className="text-center py-12">
            <i className="fa-solid fa-road text-4xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhuma corrida encontrada no histórico.</p>
        </div>
    );
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
        <div>
            <h3 className="text-2xl font-semibold text-white">Histórico de Corridas</h3>
            {!isAdmin && <p className="text-sm text-gray-400">Suas viagens realizadas</p>}
        </div>
        <div className="w-full md:w-auto">
            <ViewToggle />
        </div>
      </div>
      
      {view === 'list' ? (
        <div className="space-y-4">
          {[...filteredHistory].reverse().map((ride, index) => {
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
                        <div className="bg-gray-800/50 p-4 border-t border-gray-600 animate-fadeIn cursor-auto" onClick={(e) => e.stopPropagation()}>
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
            <RideHistoryMap rides={filteredHistory} />
        </div>
      )}
    </div>
  );
};

export default RideHistory;
