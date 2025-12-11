
import React, { useState, useEffect } from 'react';
import type { Ride, Driver, GeolocationCoordinates, FareRule, AddressSuggestion } from '../types';
import { useRideTracking } from '../hooks/useRideTracking';
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
  onUpdateDestination: (destination: { address: string; city: string }) => void;
  fareRules: FareRule[];
}

const InRideDisplay: React.FC<InRideDisplayProps> = ({ ride, driver, onStopRide, onSendWhatsApp, onComplete, onUpdateDestination, fareRules }) => {
  const [elapsedTime, setElapsedTime] = useState(Date.now() - ride.startTime);
  const isRideFinished = !!ride.endTime;
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<GeolocationCoordinates | null>(null);
  
  // Estado para o endereço de origem
  const [startAddress, setStartAddress] = useState<string>('Buscando endereço...');

  // Edit Destination State
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [editAddress, setEditAddress] = useState(ride.destination.address);
  const [editCity, setEditCity] = useState(ride.destination.city);
  const [destSuggestions, setDestSuggestions] = useState<AddressSuggestion[]>([]);
  const debouncedAddress = useDebounce(editAddress, 500);

  // Rastreamento GPS Ativo
  const { distance, currentPosition, path } = useRideTracking(!isRideFinished);
  
  // Busca o endereço legível da origem (Reverse Geocoding)
  useEffect(() => {
    const fetchStartAddress = async () => {
      if (ride.startLocation) {
        const address = await getAddressFromCoordinates(ride.startLocation.latitude, ride.startLocation.longitude);
        if (address) {
          setStartAddress(address);
        } else {
          setStartAddress(`${ride.startLocation.latitude.toFixed(4)}, ${ride.startLocation.longitude.toFixed(4)}`);
        }
      } else {
        setStartAddress('Localização desconhecida');
      }
    };
    fetchStartAddress();
  }, [ride.startLocation]);

  // Atualiza coordenadas do destino quando o endereço muda
  useEffect(() => {
    const fetchDestinationCoords = async () => {
      if (ride.destination.address && ride.destination.city) {
        const coords = await getCoordinatesForAddress(
          ride.destination.address,
          ride.destination.city // Passa a cidade correta
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

  // Sync edit state with ride changes
  useEffect(() => {
     if (!isEditingDest) {
         setEditAddress(ride.destination.address);
         setEditCity(ride.destination.city);
     }
  }, [ride.destination, isEditingDest]);

  // Fetch suggestions when editing
  useEffect(() => {
    if (isEditingDest && debouncedAddress.length > 2 && editCity) {
        const fetchSuggestions = async () => {
            const results = await geocodeAddress(debouncedAddress, editCity);
            setDestSuggestions(results);
        }
        fetchSuggestions();
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
      if (editAddress.trim() && editCity.trim()) {
          onUpdateDestination({ address: editAddress, city: editCity });
          setIsEditingDest(false);
          setDestSuggestions([]);
      }
  };

  const handleCancelEdit = () => {
      setIsEditingDest(false);
      setEditAddress(ride.destination.address);
      setEditCity(ride.destination.city);
      setDestSuggestions([]);
  }

  const handleDestSuggestionClick = (suggestion: AddressSuggestion) => {
    setEditAddress(suggestion.description);
    setDestSuggestions([]);
  };

  // Determine values to display
  const displayDistance = isRideFinished ? ride.distance : distance;
  const displayTime = isRideFinished && ride.endTime ? ride.endTime - ride.startTime : elapsedTime;
  
  const availableCities = [...fareRules].sort((a, b) => a.destinationCity.localeCompare(b.destinationCity));

  const renderButtons = () => {
    if (isRideFinished) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-gray-900 rounded-lg text-center">
            <label className="text-lg text-gray-300">Total da Corrida</label>
            <div className="flex items-center justify-center mt-1">
              <span className="text-5xl font-bold text-orange-400">R${ride.fare.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={onSendWhatsApp}
            className="w-full flex items-center justify-center bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors hover:bg-green-600 shadow-lg"
          >
            <WhatsAppIcon className="text-2xl mr-3" />
            Enviar Chave PIX
          </button>
          <button
            onClick={onComplete}
            className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors hover:bg-gray-500"
          >
            Concluir Corrida
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => onStopRide(distance)}
        className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg transition-colors hover:bg-red-600 shadow-lg"
      >
        Finalizar Viagem
      </button>
    );
  };

  const rideMapProps = {
    startLocation: ride.startLocation,
    currentLocation: currentPosition,
    path,
    destination: ride.destination,
    destinationCoords,
    driverName: driver.name
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* HEADER FIXO DA CORRIDA */}
      <div className="absolute top-0 left-0 w-full z-20 p-4 bg-gradient-to-b from-gray-900/90 to-transparent flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto bg-gray-900/40 backdrop-blur-md rounded-full px-4 py-2 border border-orange-500/20 shadow-lg">
              <RideCarLogo className="h-10 w-auto" horizontal={true} />
          </div>
          
          {!isRideFinished && (
            <button
                onClick={() => setIsMapExpanded(true)}
                className="pointer-events-auto p-2 bg-gray-800/80 rounded-full text-white backdrop-blur-sm hover:bg-gray-700 transition-colors shadow-lg border border-gray-700"
                aria-label="Expandir mapa"
            >
                <ExpandIcon className="w-6 h-6" />
            </button>
          )}
      </div>

      {/* Map Section */}
      <div className="flex-grow relative">
        <RideMap {...rideMapProps} />
      </div>
      
      {/* Bottom Panel Section */}
      <div className="bg-gray-800 rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.5)] p-6 flex-shrink-0 z-10 border-t border-gray-700">
        {/* Ride Info Header */}
        <div className="mb-4 border-b border-gray-700 pb-4">
          <div className="flex items-start justify-between">
            {/* Passageiro */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Passageiro</p>
              <p className="text-2xl font-bold text-orange-400 leading-tight">{ride.passenger.name}</p>
            </div>

            {/* Motorista e Carro - AGORA COM FOTO */}
            <div className="flex items-center text-right">
              <div className="mr-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Motorista</p>
                  <p className="text-lg font-bold text-white leading-tight">{driver.name}</p>
                  <div className="mt-1 flex flex-col items-end">
                      <span className="text-xs text-gray-300 font-medium">{driver.carModel}</span>
                      <span className="text-[10px] font-mono bg-gray-900 px-1.5 py-0.5 rounded text-orange-400 border border-gray-600 mt-0.5 uppercase tracking-wide">
                          {driver.licensePlate}
                      </span>
                  </div>
              </div>
              
              {/* Foto do Motorista (Avatar) */}
              <div className="w-14 h-14 rounded-full bg-gray-700 border-2 border-orange-500 overflow-hidden shadow-lg flex-shrink-0">
                  {driver.photoUrl ? (
                      <img src={driver.photoUrl} alt={driver.name} className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <i className="fa-solid fa-user-astronaut text-2xl text-gray-400"></i>
                      </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Route Info (Start & End) */}
        <div className="mb-6 bg-gray-700/50 p-3 rounded-lg border border-gray-600 space-y-3">
           
           {/* Origem */}
           <div className="flex items-center">
                <div className="flex flex-col items-center mr-3 w-6 flex-shrink-0">
                    <i className="fa-solid fa-circle-dot text-green-500 text-sm"></i>
                    <div className="h-8 w-0.5 bg-gray-600 my-1"></div>
                </div>
                <div className="overflow-hidden w-full">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Origem</p>
                    <p className="text-white font-medium text-sm truncate" title={startAddress}>
                        {startAddress}
                    </p>
                </div>
           </div>

           {/* Destino Info & Edit */}
           {!isEditingDest ? (
               <div className="flex items-center justify-between">
                   <div className="flex items-center overflow-hidden w-full">
                       <div className="flex flex-col items-center mr-3 w-6 flex-shrink-0">
                            <i className="fa-solid fa-location-dot text-red-500 text-lg"></i>
                       </div>
                       <div className="truncate flex-grow">
                           <p className="text-[10px] text-gray-400 uppercase tracking-wider">Destino</p>
                           <p className="text-white font-medium truncate">{ride.destination.address}</p>
                           <p className="text-xs text-gray-400">{ride.destination.city}</p>
                       </div>
                   </div>
                   {!isRideFinished && (
                       <button 
                           onClick={() => setIsEditingDest(true)}
                           className="ml-2 p-2 text-gray-400 hover:text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors flex-shrink-0"
                           title="Editar Destino"
                       >
                           <i className="fa-solid fa-pencil"></i>
                       </button>
                   )}
               </div>
           ) : (
               <div className="space-y-3 pl-9">
                   <p className="text-xs text-orange-400 font-bold uppercase">Editar Destino</p>
                   
                   {/* City Select */}
                    <select
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="bg-gray-800 p-2 w-full text-white text-sm rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                    >
                        <option value="">Selecione a cidade...</option>
                        {availableCities.map(rule => (
                        <option key={rule.id} value={rule.destinationCity}>{rule.destinationCity}</option>
                        ))}
                    </select>

                   {/* Address Input */}
                   <div className="relative">
                        <input 
                            type="text" 
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="Endereço"
                            autoComplete="off"
                            className="bg-gray-800 p-2 w-full text-white text-sm rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                        />
                         {destSuggestions.length > 0 && (
                            <ul className="absolute z-50 w-full mt-1 bg-gray-700 rounded-lg shadow-xl max-h-32 overflow-y-auto border border-gray-600 bottom-full mb-1">
                            {destSuggestions.map((s, i) => (
                                <li key={i} onClick={() => handleDestSuggestionClick(s)} className="px-3 py-2 text-sm text-white cursor-pointer hover:bg-gray-600 border-b border-gray-600 last:border-0">{s.description}</li>
                            ))}
                            </ul>
                        )}
                   </div>

                   {/* Actions */}
                   <div className="flex space-x-2">
                       <button 
                           onClick={handleSaveDestination}
                           disabled={!editAddress.trim() || !editCity}
                           className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           Salvar
                       </button>
                       <button 
                           onClick={handleCancelEdit}
                           className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-sm font-bold py-2 rounded"
                       >
                           Cancelar
                       </button>
                   </div>
               </div>
           )}
        </div>

        {/* Ride stats */}
        <div className="grid grid-cols-3 gap-4 text-center bg-gray-700/80 p-4 rounded-lg mb-6 border border-gray-600">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Tempo</p>
            <p className="text-xl font-semibold font-mono">{formatTime(displayTime)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Distância</p>
            <p className="text-xl font-semibold font-mono">{displayDistance.toFixed(2)} <span className="text-sm">km</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Valor</p>
            <p className="text-xl font-semibold font-mono text-orange-400">R${ride.fare.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        {renderButtons()}
      </div>

      {/* Fullscreen Map Overlay */}
      <div 
        className={`
          absolute inset-0 z-20 flex flex-col bg-gray-800
          transition-opacity duration-300 ease-in-out
          ${isMapExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <div className="flex-grow relative">
          <RideMap {...rideMapProps} />
          <button
            onClick={() => setIsMapExpanded(false)}
            className="absolute top-4 right-4 z-[1000] p-2 bg-gray-800/60 rounded-full text-white backdrop-blur-sm hover:bg-gray-700/80 transition-colors"
            aria-label="Recolher mapa"
          >
            <CompressIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="bg-gray-900/80 p-3 text-center backdrop-blur-sm flex-shrink-0 z-10 border-t border-gray-700">
          <p className="text-xs text-gray-400">Destino</p>
          <p className="text-lg font-bold text-white truncate">{ride.destination.address}</p>
        </div>
      </div>
    </div>
  );
};

export default InRideDisplay;
