import React, { useState, useEffect } from 'react';
import type { Passenger, AddressSuggestion, Driver, GeolocationCoordinates, FareRule } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useGeolocation } from '../hooks/useGeolocation';
import { geocodeAddress } from '../services/geocodingService';
import { RideCarLogo, UserIcon, WhatsAppIcon, IdCardIcon, PinIcon } from './icons';
import Map from './Map';

interface StartRideFormProps {
  savedPassengers: Passenger[];
  onStartRide: (passenger: Passenger, destination: { address: string, city: string }, startLocation: GeolocationCoordinates | null, fare: number) => void;
  onNavigateToAdmin: () => void;
  currentDriver: Driver;
  onLogout: () => void;
  fareRules: FareRule[];
}

const StartRideForm: React.FC<StartRideFormProps> = ({ savedPassengers, onStartRide, onNavigateToAdmin, currentDriver, onLogout, fareRules }) => {
  const [passenger, setPassenger] = useState<Passenger>({ name: '', whatsapp: '', cpf: '' });
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destSuggestions, setDestSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedDestination = useDebounce(destinationAddress, 500);
  const { location, isLoading: isLocationLoading, error: locationError } = useGeolocation();
  
  const availableDestinations = [...fareRules].sort((a, b) => a.destinationCity.localeCompare(b.destinationCity));
  const currentFareRule = availableDestinations.find(rule => rule.destinationCity === destinationCity);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedDestination.length > 2 && destinationCity) {
        setIsSearching(true);
        const results = await geocodeAddress(debouncedDestination, destinationCity);
        setDestSuggestions(results);
        setIsSearching(false);
      } else {
        setDestSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [debouncedDestination, destinationCity]);

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTimeout(() => {
      event.target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 300);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    
    const matchedPassenger = savedPassengers.find(
      (p) => p.name.toLowerCase() === newName.trim().toLowerCase()
    );

    if (matchedPassenger) {
      // Encontrou um passageiro correspondente, preenche os outros campos
      // mantendo o nome exato que o usuário digitou para evitar saltos de maiúsculas/minúsculas.
      setPassenger({
        name: newName,
        whatsapp: matchedPassenger.whatsapp,
        cpf: matchedPassenger.cpf || '',
      });
    } else {
      // Nenhum passageiro correspondente, atualiza apenas o nome e limpa os outros campos.
      setPassenger({ name: newName, whatsapp: '', cpf: '' });
    }
  };

  const handleDestSuggestionClick = (suggestion: AddressSuggestion) => {
    setDestinationAddress(suggestion.description);
    setDestSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passenger.name && passenger.whatsapp && destinationAddress && destinationCity && location && currentFareRule) {
      onStartRide(
        passenger, 
        { address: destinationAddress, city: destinationCity }, 
        location,
        currentFareRule.fare
      );
    }
  };

  const isFormValid = passenger.name.trim() && passenger.whatsapp.trim() && destinationAddress.trim() && destinationCity.trim() && !!location && !!currentFareRule;

  const LocationStatus = () => {
    if (locationError) {
      return (
        <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-6 mb-4 text-center backdrop-blur-sm">
            <i className="fa-solid fa-satellite-dish text-4xl text-red-400 mb-3"></i>
            <h3 className="font-bold text-xl text-white mb-2">GPS Indisponível</h3>
            <p className="text-red-300 mb-4">{locationError}</p>
            <p className="text-sm text-yellow-300 bg-black/20 p-3 rounded-md">
                A viagem não pode ser iniciada sem um ponto de partida válido. Verifique as permissões de localização.
            </p>
        </div>
      );
    }

    return (
      <div className="bg-gray-700/80 rounded-lg p-4 mb-4 backdrop-blur-sm">
        <h3 className="font-bold text-white mb-2 text-center">Ponto de Partida</h3>
        <div className="relative h-40 w-full rounded-md overflow-hidden bg-gray-800 flex items-center justify-center">
          {isLocationLoading ? (
             <div className="text-center text-gray-400">
               <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
               <p>Obtendo localização GPS...</p>
             </div>
          ) : location ? (
            <>
              <Map location={location} isLoading={isLocationLoading} />
              <div className="absolute bottom-2 left-2 bg-gray-900/70 p-2 rounded-md text-xs">
                <p className="text-white font-mono">Lat: {location.latitude.toFixed(4)}</p>
                <p className="text-white font-mono">Lon: {location.longitude.toFixed(4)}</p>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 px-4">
              <i className="fa-solid fa-satellite-dish text-2xl mb-2"></i>
              <p>Aguardando sinal do GPS...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b border-white/20 flex justify-between items-center flex-shrink-0">
        <div className="text-sm">
            <span className="text-gray-400">Motorista: </span>
            <span className="font-bold text-white">{currentDriver.name}</span>
        </div>
        <div className="flex items-center space-x-2">
            <button
                onClick={onLogout}
                className="text-gray-300 hover:text-white text-xs font-semibold px-2"
                title="Sair da conta"
            >
                Sair
            </button>
            <span className="text-gray-600">|</span>
            <button 
                onClick={onNavigateToAdmin}
                className="bg-gray-700/50 text-orange-400 font-semibold py-2 px-3 rounded-lg text-sm hover:bg-gray-600/50 transition-colors backdrop-blur-sm"
            >
                Admin
            </button>
        </div>
      </div>
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="flex justify-center mb-6">
            <RideCarLogo className="h-10 w-auto text-orange-500" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 pb-24">
          <LocationStatus />
          {/* PASSENGER INFO */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Nome do Passageiro"
              value={passenger.name}
              onChange={handleNameChange}
              onFocus={handleInputFocus}
              className="bg-gray-700/80 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
              autoComplete="off"
            />
          </div>
           <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <WhatsAppIcon className="text-lg text-gray-400" />
            </div>
            <input
              type="tel"
              placeholder="WhatsApp (Ex: 11987654321)"
              value={passenger.whatsapp}
              onChange={(e) => setPassenger(prev => ({ ...prev, whatsapp: e.target.value }))}
              onFocus={handleInputFocus}
              className="bg-gray-700/80 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IdCardIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="CPF (Opcional)"
              value={passenger.cpf || ''}
              onChange={(e) => setPassenger(prev => ({ ...prev, cpf: e.target.value }))}
              onFocus={handleInputFocus}
              className="bg-gray-700/80 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
            />
          </div>
          {/* DESTINATION INFO */}
          <div className="bg-gray-700/80 p-4 rounded-lg space-y-4 backdrop-blur-sm">
            <h3 className="font-bold text-white text-center">Destino da Viagem</h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fa-solid fa-city text-gray-400"></i>
              </div>
              <select
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                onFocus={handleInputFocus}
                className="bg-gray-600 p-3 pl-10 w-full text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
              >
                <option value="">Selecione a cidade de destino</option>
                {availableDestinations.map(rule => (
                  <option key={rule.id} value={rule.destinationCity}>{rule.destinationCity}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PinIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Endereço de destino"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                onFocus={handleInputFocus}
                className="bg-gray-600 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoComplete="off"
                disabled={!destinationCity}
              />
              {destSuggestions.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-gray-500/95 rounded-lg shadow-xl max-h-40 overflow-y-auto backdrop-blur-sm">
                  {destSuggestions.map((s, i) => (
                    <li key={i} onClick={() => handleDestSuggestionClick(s)} className="px-4 py-3 text-white cursor-pointer hover:bg-gray-400/80">{s.description}</li>
                  ))}
                </ul>
              )}
            </div>
            
            {currentFareRule && (
              <div className="text-center bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-300">Valor da corrida</p>
                <p className="text-3xl font-bold text-orange-400">R$ {currentFareRule.fare.toFixed(2)}</p>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-all hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
          >
            {isLocationLoading ? 'Aguardando GPS...' : !location ? 'Localização Indisponível' : 'Iniciar Viagem'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartRideForm;