
import React, { useState, useEffect } from 'react';
import type { Ride, Driver, GeolocationCoordinates, FareRule, AddressSuggestion } from '../types';
import { useRideTracking } from '../hooks/useRideTracking';
import { getCoordinatesForAddress, geocodeAddress } from '../services/geocodingService';
import { useDebounce } from '../hooks/useDebounce';
import { WhatsAppIcon, ExpandIcon, CompressIcon, PinIcon } from './icons';
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

  // Edit Destination State
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [editAddress, setEditAddress] = useState(ride.destination.address);
  const [editCity, setEditCity] = useState(ride.destination.city);
  const [destSuggestions, setDestSuggestions] = useState<AddressSuggestion[]>([]);
  const debouncedAddress = useDebounce(editAddress, 500);

  // Rastreamento GPS Ativo
  const { distance, currentPosition, path } = useRideTracking(!isRideFinished);
  
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
            className="w-full flex items-center justify-center bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors hover:bg-green-600"
          >
            <WhatsAppIcon className="text-2xl mr-3" />
            Enviar PIX via WhatsApp
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
        className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg transition-colors hover:bg-red-600"
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
      {/* Map Section */}
      <div className="flex-grow relative">
        <RideMap {...rideMapProps} />
        {!isRideFinished && (
          <button
            onClick={() => setIsMapExpanded(true)}
            className="absolute top-4 right-4 z-[1000] p-2 bg-gray-800/60 rounded-full text-white backdrop-blur-sm hover:bg-gray-700/80 transition-colors"
            aria-label="Expandir mapa"
          >
            <ExpandIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      
      {/* Bottom Panel Section */}
      <div className="bg-gray-800 rounded-t-2xl shadow-lg p-6 flex-shrink-0 z-10">
        {/* Ride Info Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Passageiro</p>
              <p className="text-2xl font-bold text-orange-400">{ride.passenger.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Motorista</p>
              <p className="text-lg font-bold text-white">{driver.name}</p>
            </div>
          </div>
        </div>

        {/* Destination Info & Edit */}
        <div className="mb-6 bg-gray-700/50 p-3 rounded-lg border border-gray-600">
           {!isEditingDest ? (
               <div className="flex items-center justify-between">
                   <div className="flex items-center overflow-hidden">
                       <PinIcon className="h-6 w-6 text-orange-500 mr-3 flex-shrink-0" />
                       <div className="truncate">
                           <p className="text-xs text-gray-400">Destino</p>
                           <p className="text-white font-medium truncate">{ride.destination.address}</p>
                           <p className="text-xs text-gray-400">{ride.destination.city}</p>
                       </div>
                   </div>
                   {!isRideFinished && (
                       <button 
                           onClick={() => setIsEditingDest(true)}
                           className="ml-2 p-2 text-gray-400 hover:text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                           title="Editar Destino"
                       >
                           <i className="fa-solid fa-pencil"></i>
                       </button>
                   )}
               </div>
           ) : (
               <div className="space-y-3">
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
        <div className="grid grid-cols-3 gap-4 text-center bg-gray-700 p-4 rounded-lg mb-6">
          <div>
            <p className="text-sm text-gray-400">Tempo</p>
            <p className="text-2xl font-semibold font-mono">{formatTime(displayTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Distância</p>
            <p className="text-2xl font-semibold font-mono">{displayDistance.toFixed(2)} <span className="text-base">km</span></p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Valor</p>
            <p className="text-2xl font-semibold font-mono">R${ride.fare.toFixed(2)}</p>
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
        <div className="bg-gray-900/80 p-3 text-center backdrop-blur-sm flex-shrink-0 z-10">
          <p className="text-sm text-gray-400">Destino</p>
          <p className="text-lg font-bold text-white truncate">{ride.destination.address}</p>
        </div>
      </div>
    </div>
  );
};

export default InRideDisplay;
