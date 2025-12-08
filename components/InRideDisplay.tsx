import React, { useState, useEffect } from 'react';
import type { Ride, Driver, GeolocationCoordinates } from '../types';
import { useRideTracking } from '../hooks/useRideTracking';
import { getCoordinatesForAddress } from '../services/geocodingService';
import { WhatsAppIcon, ExpandIcon, CompressIcon } from './icons';
import RideMap from './RideMap';

interface InRideDisplayProps {
  ride: Ride;
  driver: Driver;
  onStopRide: (finalDistance: number) => void;
  onSendWhatsApp: () => void;
  onComplete: () => void;
}

const InRideDisplay: React.FC<InRideDisplayProps> = ({ ride, driver, onStopRide, onSendWhatsApp, onComplete }) => {
  const [elapsedTime, setElapsedTime] = useState(Date.now() - ride.startTime);
  const isRideFinished = !!ride.endTime;
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<GeolocationCoordinates | null>(null);

  const { distance, currentPosition, path } = useRideTracking(!isRideFinished);
  
  useEffect(() => {
    const fetchDestinationCoords = async () => {
      if (ride.startLocation && ride.destination.address) {
        const coords = await getCoordinatesForAddress(
          ride.destination.address,
          ride.startLocation
        );
        setDestinationCoords(coords);
      }
    };
    fetchDestinationCoords();
  }, [ride.destination.address, ride.startLocation]);

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

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Determine values to display
  const displayDistance = isRideFinished ? ride.distance : distance;
  const displayTime = isRideFinished && ride.endTime ? ride.endTime - ride.startTime : elapsedTime;
  
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
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Passageiro</p>
              <p className="text-2xl font-bold text-orange-400">{ride.passenger.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{driver.carModel}</p>
              <p className="text-xs font-mono bg-gray-700 px-2 py-1 rounded text-gray-300 mt-1">{driver.licensePlate}</p>
            </div>
          </div>
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