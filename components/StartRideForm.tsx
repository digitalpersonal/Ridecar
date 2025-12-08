
import React, { useState, useEffect } from 'react';
import type { Passenger, AddressSuggestion, Driver, GeolocationCoordinates, FareRule } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useGeolocation } from '../hooks/useGeolocation';
import { geocodeAddress } from '../services/geocodingService';
import { RideCarLogo, UserIcon, WhatsAppIcon, IdCardIcon, PinIcon } from './icons';
import Map from './Map';
import Footer from './Footer';

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
      setPassenger({
        name: newName,
        whatsapp: matchedPassenger.whatsapp,
        cpf: matchedPassenger.cpf || '',
      });
    } else {
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
      <div className="bg-gray-700/80 rounded-lg p-4 mb-4 backdrop-blur-sm border border-gray-600">
        <h3 className="font-bold text-white mb-2 text-center text-sm uppercase tracking-wider">Localização Atual</h3>
        <div className="relative h-40 w-full rounded-md overflow-hidden bg-gray-800 flex items-center justify-center border border-gray-600">
          {isLocationLoading ? (
             <div className="text-center text-gray-400">
               <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
               <p>Obtendo GPS...</p>
             </div>
          ) : location ? (
            <>
              <Map location={location} isLoading={isLocationLoading} />
            </>
          ) : (
            <div className="text-center text-gray-500 px-4">
              <i className="fa-solid fa-satellite-dish text-2xl mb-2"></i>
              <p>Aguardando sinal...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
       <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center flex-shrink-0 shadow-md z-20">
        <div className="flex items-center">
            <RideCarLogo className="h-8 w-auto text-orange-500 mr-3" />
        </div>
        <div className="flex items-center">
             <div className="text-right mr-3 hidden xs:block">
                <p className="text-xs text-gray-400">Motorista</p>
                <p className="text-sm font-bold text-white leading-tight">{currentDriver.name}</p>
            </div>
            <button
                onClick={onLogout}
                className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
                title="Sair da conta"
            >
                <i className="fa-solid fa-right-from-bracket text-lg"></i>
            </button>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
          <LocationStatus />
          
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
              <h3 className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-2">Dados do Passageiro</h3>
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
                  className="bg-gray-700/80 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm border border-gray-600"
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
                  className="bg-gray-700/80 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm border border-gray-600"
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
                  className="bg-gray-700/80 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm border border-gray-600"
                />
              </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
            <h3 className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-2">Destino e Tarifa</h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fa-solid fa-city text-gray-400"></i>
              </div>
              <select
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                onFocus={handleInputFocus}
                className="bg-gray-700/80 p-3 pl-10 w-full text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none border border-gray-600"
              >
                <option value="">Selecione a cidade...</option>
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
                placeholder="Endereço (Rua e Número)"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                onFocus={handleInputFocus}
                className="bg-gray-700/80 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                autoComplete="off"
                disabled={!destinationCity}
              />
              {destSuggestions.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-gray-700 rounded-lg shadow-xl max-h-40 overflow-y-auto border border-gray-600">
                  {destSuggestions.map((s, i) => (
                    <li key={i} onClick={() => handleDestSuggestionClick(s)} className="px-4 py-3 text-white cursor-pointer hover:bg-gray-600 border-b border-gray-600 last:border-0">{s.description}</li>
                  ))}
                </ul>
              )}
            </div>
            
            {currentFareRule && (
              <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-lg border border-orange-500/30">
                <span className="text-gray-300 font-medium">Valor Estimado</span>
                <span className="text-2xl font-bold text-orange-400">R$ {currentFareRule.fare.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-4 rounded-xl disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-orange-500 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transform active:scale-95"
          >
            {isLocationLoading ? 'Carregando GPS...' : !location ? 'Sem GPS' : 'INICIAR CORRIDA'}
          </button>
        </form>
      </div>

      <div className="bg-gray-900">
          {/* Admin shortcut ONLY for Admins */}
          {currentDriver.role === 'admin' && (
              <div className="flex justify-center py-2 border-t border-gray-800">
                  <button 
                      onClick={onNavigateToAdmin}
                      className="text-xs text-gray-500 hover:text-orange-500 transition-colors flex items-center"
                  >
                      <i className="fa-solid fa-lock mr-1"></i>
                      Voltar ao Painel Admin
                  </button>
              </div>
          )}
          <Footer />
      </div>
    </div>
  );
};

export default StartRideForm;
