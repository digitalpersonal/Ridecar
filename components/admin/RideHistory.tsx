
import React, { useState, useEffect, useRef } from 'react';
import type { Ride, Driver } from '../../types';

declare const L: any;

interface RideHistoryProps {
  rideHistory: Ride[];
  currentDriver: Driver | null;
  drivers: Driver[];
}

const RideHistoryMap: React.FC<{rides: Ride[]}> = ({ rides }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const clusterGroupRef = useRef<any>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [-15.7801, -47.9292],
                zoom: 4,
                zoomControl: false,
                attributionControl: true,
            });
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);
            
            const markers = L.markerClusterGroup({
                showCoverageOnHover: false,
                maxClusterRadius: 50,
            });
            map.addLayer(markers);
            
            clusterGroupRef.current = markers;
            mapInstanceRef.current = map;
        }
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        const clusterGroup = clusterGroupRef.current;

        if (map && clusterGroup) {
             clusterGroup.clearLayers();
            const validRides = rides.filter(ride => ride.startLocation);

            if (validRides.length > 0) {
                const markersToAdd: any[] = [];
                validRides.forEach(ride => {
                    const marker = L.marker([ride.startLocation!.latitude, ride.startLocation!.longitude]);
                    const dateStr = new Date(ride.startTime).toLocaleDateString('pt-BR');
                    const popupContent = `
                        <div class="p-2 text-gray-800 min-w-[150px]">
                            <h4 class="font-bold text-sm border-b pb-1 mb-1">${ride.passenger.name}</h4>
                            <p class="text-xs">Destino: ${ride.destination.city}</p>
                            <p class="font-bold text-orange-600 mt-1 text-sm">R$${ride.fare.toFixed(2)}</p>
                        </div>
                    `;
                    marker.bindPopup(popupContent);
                    markersToAdd.push(marker);
                });
                clusterGroup.addLayers(markersToAdd);
                try {
                    map.fitBounds(clusterGroup.getBounds(), { padding: [50, 50] });
                } catch (e) {}
            }
        }
    }, [rides]);

    return <div ref={mapContainerRef} className="h-full w-full rounded-lg bg-gray-100" />;
};

const RideHistory: React.FC<RideHistoryProps> = ({ rideHistory, currentDriver, drivers }) => {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);

  const isAdmin = currentDriver?.role === 'admin';
  const filteredHistory = isAdmin 
    ? rideHistory 
    : rideHistory.filter(r => r.driverId === currentDriver?.id);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const formatFullDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const calculateDuration = (start: number, end?: number) => {
      if (!end) return 'Em andamento';
      const diffMs = end - start;
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      return `${minutes}min ${seconds}s`;
  };

  if (filteredHistory.length === 0) {
    return (
        <div className="text-center py-20 bg-gray-700/20 rounded-2xl border-2 border-dashed border-gray-600">
            <i className="fa-solid fa-receipt text-5xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum registro de corrida encontrado.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight flex items-center">
                <i className="fa-solid fa-clock-rotate-left mr-3 text-primary"></i>
                Histórico
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Total de {filteredHistory.length} registros</p>
        </div>
        <div className="flex bg-gray-900 p-1 rounded-xl w-full md:w-auto">
            <button onClick={() => setView('list')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${view === 'list' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                <i className="fa-solid fa-list-ul mr-2"></i> LISTA
            </button>
            <button onClick={() => setView('map')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${view === 'map' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                <i className="fa-solid fa-earth-americas mr-2"></i> MAPA
            </button>
            <button onClick={() => window.print()} className="ml-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-[10px] font-black border border-gray-700 hover:bg-gray-700 uppercase tracking-widest">
                <i className="fa-solid fa-print"></i>
            </button>
        </div>
      </div>

      <div className="printable-report">
        {/* Cabeçalho de Impressão */}
        <div className="print-only mb-8 border-b-2 border-gray-200 pb-4">
            <h1 className="text-3xl font-black uppercase italic">Relatório de Viagens - RideCar</h1>
            <p className="text-gray-500 text-xs mt-1">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
        </div>

        {view === 'list' ? (
        <div className="grid grid-cols-1 gap-4">
          {[...filteredHistory].reverse().map((ride) => {
            const isExpanded = expandedRideId === ride.id;
            const rideDriver = drivers.find(d => d.id === ride.driverId) || currentDriver;
            
            return (
              <div 
                key={ride.id} 
                className={`bg-gray-700/50 rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-primary ring-4 ring-primary/10' : 'border-gray-600 hover:border-gray-500'}`}
              >
                {/* Cabeçalho do Card */}
                <div 
                    onClick={() => setExpandedRideId(isExpanded ? null : (ride.id || null))}
                    className="p-5 flex justify-between items-center cursor-pointer"
                >
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mr-4 border border-gray-600">
                            <i className="fa-solid fa-car text-primary text-xl"></i>
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg">{ride.passenger.name}</p>
                            <p className="text-xs text-gray-400 font-medium">
                                <i className="fa-solid fa-calendar-day mr-1"></i> {formatDate(ride.startTime)} 
                                <span className="mx-2">•</span> 
                                <i className="fa-solid fa-map-pin mr-1 text-red-400"></i> {ride.destination.city}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-primary">R$ {ride.fare.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Concluída</p>
                    </div>
                </div>

                {/* Detalhes Expandidos (Dossiê) */}
                {isExpanded && (
                  <div className="bg-gray-800/80 p-6 border-t border-gray-600 animate-slideDown">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Coluna 1: Cliente e Veículo */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Informações do Cliente</h4>
                                <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700">
                                    <p className="text-sm text-white font-bold">{ride.passenger.name}</p>
                                    <p className="text-xs text-green-400 mb-1"><i className="fa-brands fa-whatsapp mr-1"></i> {ride.passenger.whatsapp}</p>
                                    {ride.passenger.cpf && <p className="text-[10px] text-gray-500">CPF: {ride.passenger.cpf}</p>}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Veículo e Motorista</h4>
                                <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700 flex items-center">
                                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                                        <i className="fa-solid fa-id-badge text-primary"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm text-white font-bold">{rideDriver?.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase">{rideDriver?.carModel} • <span className="text-primary font-mono">{rideDriver?.licensePlate}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Coluna 2: Trajeto e Logística */}
                        <div className="lg:col-span-2">
                             <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Logística da Viagem</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                    <div className="flex items-start mb-4">
                                        <i className="fa-solid fa-circle-play text-green-500 mt-1 mr-3"></i>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Endereço de Partida</p>
                                            <p className="text-xs text-white font-bold leading-relaxed">{ride.originAddress || "Buscando endereço..."}</p>
                                            <p className="text-[10px] text-gray-400 italic">GPS: {ride.startLocation ? `${ride.startLocation.latitude.toFixed(6)}, ${ride.startLocation.longitude.toFixed(6)}` : 'Não capturado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <i className="fa-solid fa-location-dot text-red-500 mt-1 mr-3"></i>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Destino Final</p>
                                            <p className="text-xs text-white font-bold leading-relaxed">{ride.destination.address}</p>
                                            <p className="text-[10px] text-gray-400">{ride.destination.city}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 flex flex-col justify-between">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Início</p>
                                            <p className="text-xs text-white font-mono">{formatFullDate(ride.startTime)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Fim</p>
                                            <p className="text-xs text-white font-mono">{ride.endTime ? formatFullDate(ride.endTime) : '---'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Duração Total</p>
                                            <p className="text-sm text-primary font-bold">{calculateDuration(ride.startTime, ride.endTime)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Distância</p>
                                            <p className="text-sm text-white font-bold">{ride.distance.toFixed(2)} km</p>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 no-print">
                         <button className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-bold border border-primary/30 transition-all">
                            <i className="fa-solid fa-share-nodes mr-2"></i> COMPARTILHAR
                         </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-[65vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 no-print">
            <RideHistoryMap rides={filteredHistory} />
        </div>
      )}
      </div>
    </div>
  );
};

export default RideHistory;
