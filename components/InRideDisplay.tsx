
import React, { useState, useEffect } from 'react';
import type { Ride, Driver, GeolocationCoordinates, FareRule, AddressSuggestion } from '../types';
import { useRideTracking } from '../hooks/useRideTracking';
import { useWakeLock } from '../hooks/useWakeLock';
import { getCoordinatesForAddress, geocodeAddress, getAddressFromCoordinates } from '../services/geocodingService';
import { useDebounce } from '../hooks/useDebounce';
import { WhatsAppIcon, ExpandIcon, CompressIcon, PinIcon, RideCarLogo } from './icons';
import RideMap from './RideMap';

interface InRideDisplayProps {
  ride: Ride;
  driver: Driver;
  onStopRide: (finalDistance: number) => void;
  onSendWhatsApp: () => void;
  onComplete: () => void;
  onUpdateDestination: (destination: { address: string; city: string }, fare: number) => void;
}

const InRideDisplay: React.FC<InRideDisplayProps> = ({ ride, driver, onStopRide, onSendWhatsApp, onComplete, onUpdateDestination }) => {
  // Guard clause initial check
  if (!ride || !driver || !ride.destination || !ride.passenger) {
    console.warn("InRideDisplay: Dados incompletos. Encerrando exibição.");
    setTimeout(onComplete, 0);
    return null;
  }

  const [elapsedTime, setElapsedTime] = useState(Date.now() - ride.startTime);
  const isRideFinished = !!ride.endTime;
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<GeolocationCoordinates | null>(null);
  
  // Usa o endereço capturado pelo GPS no início se disponível
  const [startAddress, setStartAddress] = useState<string>(ride.originAddress || 'Partida atual');

  const [isEditingDest, setIsEditingDest] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editCity, setEditCity] = useState(ride.destination.city);
  const [editFare, setEditFare] = useState(ride.fare.toString());
  const [destSuggestions, setDestSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedAddress = useDebounce(editAddress, 500);

  const { distance, currentPosition, path } = useRideTracking(!isRideFinished, ride.distance);
  const normalize = (s: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

  // Ativa o Wake Lock para impedir que a tela apague durante a corrida
  useWakeLock(!isRideFinished);

  // Persiste a distância atual no localStorage periodicamente para evitar perda em caso de recarregamento
  useEffect(() => {
    if (!isRideFinished && distance > 0) {
      const interval = setInterval(() => {
        const storedRide = localStorage.getItem('ridecar_current_ride');
        if (storedRide) {
          try {
            const parsed = JSON.parse(storedRide);
            if (parsed.id === ride.id) {
              parsed.distance = distance;
              localStorage.setItem('ridecar_current_ride', JSON.stringify(parsed));
            }
          } catch (e) {
            console.error("Erro ao persistir distância:", e);
          }
        }
      }, 5000); // Salva a cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [distance, isRideFinished, ride.id]);

  useEffect(() => {
    const fetchDestinationCoords = async () => {
      if (ride.destination.address && ride.destination.city) {
        const coords = await getCoordinatesForAddress(
          ride.destination.address,
          ride.destination.city
        );
        setDestinationCoords(coords);
      }
    };
    fetchDestinationCoords();
  }, [ride.destination.address, ride.destination.city]);

  useEffect(() => {
    let timer: number | undefined;
    if (!isRideFinished) {
      timer = window.setInterval(() => {
        setElapsedTime(Date.now() - ride.startTime);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [ride.startTime, isRideFinished]);

  useEffect(() => {
     if (!isEditingDest) {
         const parts = ride.destination.address.split(', ');
         setEditAddress(parts[0] || '');
         setEditNumber(parts[1] || '');
         setEditCity(ride.destination.city);
         setEditFare(ride.fare.toString());
     }
  }, [ride.destination, ride.fare, isEditingDest]);

  useEffect(() => {
    if (isEditingDest && debouncedAddress.length > 2 && editCity) {
        setIsSearching(true);
        geocodeAddress(debouncedAddress, editCity).then(results => {
            setDestSuggestions(results);
            setIsSearching(false);
        });
    } else {
        setDestSuggestions([]);
    }
  }, [debouncedAddress, editCity, isEditingDest]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleSaveDestination = () => {
      const finalFare = parseFloat(editFare.replace(',', '.'));
      const finalStreet = editAddress.trim() || "Centro";
      const fullAddress = editNumber.trim() ? `${finalStreet}, ${editNumber}` : finalStreet;
      
      if (finalStreet && editCity.trim() && !isNaN(finalFare)) {
          onUpdateDestination({ address: fullAddress, city: editCity }, finalFare);
          setIsEditingDest(false);
          setDestSuggestions([]);
      }
  };

  const displayDistance = isRideFinished ? ride.distance : distance;
  const displayTime = isRideFinished && ride.endTime ? ride.endTime - ride.startTime : elapsedTime;

  // Modal expandido será gerenciado pelo próprio container principal agora.

  return (
    <div className="absolute inset-0 bg-gray-950 overflow-hidden flex flex-col">
      {/* HEADER DINÂMICO */}
      <div className="absolute top-0 left-0 w-full z-[2000] p-4 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto bg-gray-900/80 backdrop-blur-xl rounded-full px-5 py-2.5 border border-primary/30 shadow-2xl flex items-center">
              <RideCarLogo className="h-9 w-auto" horizontal={true} customName={driver.brandName} customLogoUrl={driver.customLogoUrl || driver.photoUrl} />
          </div>
      </div>

      {/* MAPA EM TEMPO REAL */}
      <div className={`relative w-full z-0 transition-all duration-500 ease-in-out ${isMapExpanded ? 'h-screen' : 'h-[50vh]'}`}>
        <RideMap 
            startLocation={ride.startLocation} 
            currentLocation={currentPosition} 
            path={path} 
            destination={ride.destination} 
            destinationCoords={destinationCoords} 
            driverName={driver.name} 
        />
        {/* Sombra de transição do mapa */}
        <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-gray-950 to-transparent z-[1000] pointer-events-none"></div>

        {/* Botão de Fechar Mapa Expandido */}
        {isMapExpanded && (
            <button onClick={() => setIsMapExpanded(false)} className="absolute top-1/2 right-6 -translate-y-1/2 z-[1000] p-4 bg-gray-900/90 rounded-full text-white backdrop-blur-xl shadow-2xl active:scale-90 border border-white/10 transition-transform">
                <CompressIcon className="w-8 h-8" />
            </button>
        )}
      </div>
      
      {/* CARD PRINCIPAL COM DADOS (BOTTOM SHEET) */}
      <div className={`absolute bottom-0 w-full z-10 bg-gray-950 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-in-out ${isMapExpanded ? 'translate-y-[calc(100%-60px)]' : 'translate-y-0'} border-t border-white/10 flex flex-col h-[60vh] max-h-[600px]`}>
        {/* Linha indicadora de arraste */}
        <div className="w-full flex justify-center pt-4 pb-2 cursor-pointer shrink-0" onClick={() => setIsMapExpanded(!isMapExpanded)}>
            <div className="w-16 h-1.5 bg-gray-800 rounded-full shadow-inner hover:bg-gray-700 transition-colors"></div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 scrollbar-hide">
          {/* INFO MOTORISTA E PASSAGEIRO */}
          <div className="mb-6 space-y-4">
              
              {/* Box Motorista / Viagem */}
              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                      <div className="relative w-14 h-14 rounded-full bg-gray-800 border-2 border-primary overflow-hidden shadow-xl shrink-0">
                          {driver.photoUrl ? <img src={driver.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-700"><i className="fa-solid fa-user text-xl"></i></div>}
                      </div>
                      <div className="overflow-hidden">
                          <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">Motorista ({driver.brandName || 'RideCar'})</p>
                          <p className="text-xl font-black text-white leading-tight truncate">{driver.name}</p>
                          <div className="flex items-center mt-0.5 space-x-2">
                              <p className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap overflow-hidden text-ellipsis">{driver.carModel}</p>
                              <span className="font-mono text-[9px] border border-gray-700 bg-gray-800 px-1.5 py-0.5 rounded text-white">{driver.licensePlate}</span>
                          </div>
                      </div>
                  </div>
                  {!isRideFinished && (
                      <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-center animate-pulse shadow-md shrink-0 flex flex-col items-center justify-center min-w-[70px]">
                          <p className="text-[7px] text-primary font-black uppercase mb-0.5">Viagem</p>
                          <p className="text-base font-black text-white font-mono leading-none">{formatTime(displayTime)}</p>
                      </div>
                  )}
              </div>

              {/* Box Passageiro */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                      <i className="fa-solid fa-user-astronaut"></i>
                  </div>
                  <div className="overflow-hidden w-full">
                      <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.1em] mb-0.5">Passageiro</p>
                      <p className="text-base font-black text-white truncate">{ride.passenger.name}</p>
                      <div className="flex items-center mt-0.5">
                          <i className="fa-brands fa-whatsapp text-green-500 mr-1.5 text-[10px]"></i>
                          <p className="text-[10px] text-gray-300 font-mono tracking-widest">{ride.passenger.whatsapp}</p>
                      </div>
                  </div>
              </div>

          </div>

        {/* ROTA */}
        <div className="mb-6 bg-black/40 p-5 rounded-3xl border border-gray-800 space-y-4 relative">
           <div className="absolute left-[26px] top-[38px] bottom-[35px] w-0.5 bg-gray-800"></div>
           
           <div className="flex items-start relative z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 mr-4 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                <div className="overflow-hidden">
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Ponto de Partida</p>
                    <p className="text-white text-xs truncate font-bold">{startAddress}</p>
                </div>
           </div>

           {!isEditingDest ? (
               <div className="flex items-center justify-between pt-2 relative z-10">
                   <div className="flex items-center overflow-hidden w-full">
                       <div className="w-2.5 h-2.5 bg-red-600 mt-0.5 mr-4 shrink-0 shadow-[0_0_8px_rgba(220,38,38,0.4)]"></div>
                       <div className="truncate">
                           <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Destino Final</p>
                           <p className="text-white text-xs font-black truncate">{ride.destination.address}</p>
                           <p className="text-[9px] text-primary font-black uppercase">{ride.destination.city}</p>
                       </div>
                   </div>
                   {!isRideFinished && <button onClick={() => setIsEditingDest(true)} className="ml-2 p-3 text-gray-400 hover:text-white bg-gray-800 rounded-xl transition-all active:scale-90"><i className="fa-solid fa-pen-to-square"></i></button>}
               </div>
           ) : (
               <div className="space-y-4 pt-3 animate-fadeIn relative z-10 pl-7">
                   <div className="grid grid-cols-2 gap-3">
                        <select value={editCity} onChange={(e) => {
                            const selectedCity = e.target.value;
                            setEditCity(selectedCity);
                            const rule = availableCities.find(r => r.destinationCity === selectedCity);
                            if (rule) setEditFare(rule.fare.toString());
                        }} className="bg-gray-800 p-3 text-white text-xs rounded-xl border border-gray-700 font-bold focus:ring-2 focus:ring-primary">
                            {availableCities.map(r => <option key={r.id} value={r.destinationCity}>{r.destinationCity}</option>)}
                        </select>
                        <input type="text" value={editFare} onChange={(e) => setEditFare(e.target.value)} className="bg-gray-800 p-3 text-white text-xs rounded-xl border border-primary/30 font-black text-primary text-center" />
                   </div>
                   <div className="flex gap-2">
                        <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Endereço" className="flex-grow bg-gray-800 p-3 text-white text-xs rounded-xl border border-gray-700" />
                        <input type="text" value={editNumber} onChange={(e) => setEditNumber(e.target.value)} placeholder="Nº" className="w-16 bg-gray-800 p-3 text-center text-white text-xs rounded-xl border border-gray-700" />
                   </div>
                   <div className="flex space-x-2">
                       <button onClick={handleSaveDestination} className="flex-1 bg-primary text-white text-[10px] font-black py-3 rounded-xl uppercase tracking-widest shadow-lg active:scale-95">Salvar</button>
                       <button onClick={() => setIsEditingDest(false)} className="flex-1 bg-gray-800 text-white text-[10px] font-black py-3 rounded-xl uppercase tracking-widest active:scale-95">Cancelar</button>
                   </div>
               </div>
           )}
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-3 gap-3 text-center bg-gray-950 p-5 rounded-3xl mb-6 border border-white/5 shadow-inner">
          <div className="border-r border-gray-800">
              <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Km</p>
              <p className="text-xl font-black text-white font-mono tracking-tighter">{displayDistance.toFixed(2)}</p>
          </div>
          <div className="border-r border-gray-800">
              <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Tempo</p>
              <p className="text-xl font-black text-white font-mono tracking-tighter">{formatTime(displayTime)}</p>
          </div>
          <div>
              <p className="text-[9px] text-primary font-black uppercase mb-1">Valor</p>
              <p className="text-xl font-black text-primary italic tracking-tighter">R${ride.fare.toFixed(2)}</p>
          </div>
        </div>
        
        {/* BOTÕES DE AÇÃO */}
        {isRideFinished ? (
            <div className="space-y-3">
                <button onClick={onSendWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center uppercase text-xs tracking-widest">
                    <WhatsAppIcon className="text-2xl mr-3" /> Enviar Cobrança PIX
                </button>
                <button onClick={onComplete} className="w-full bg-gray-800 text-gray-400 font-black py-5 rounded-2xl transition-all active:scale-95 uppercase text-[10px] tracking-[0.2em] border border-gray-700">
                    Encerrar e Voltar
                </button>
            </div>
        ) : (
            <button onClick={() => onStopRide(distance)} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl shadow-2xl transition-all active:scale-95 uppercase text-sm tracking-widest italic">
                Finalizar Viagem Agora
            </button>
        )}
      </div>
     </div>
    </div>
  );
};

export default InRideDisplay;
