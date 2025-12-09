
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
  onNavigateToAdmin: (tab: string) => void;
  currentDriver: Driver;
  onLogout: () => void;
  fareRules: FareRule[];
}

const StartRideForm: React.FC<StartRideFormProps> = ({ savedPassengers, onStartRide, onNavigateToAdmin, currentDriver, onLogout, fareRules }) => {
  const [passenger, setPassenger] = useState<Passenger>({ name: '', whatsapp: '', cpf: '' });
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  
  // Suggestion States
  const [destSuggestions, setDestSuggestions] = useState<AddressSuggestion[]>([]);
  const [passengerSuggestions, setPassengerSuggestions] = useState<Passenger[]>([]);
  
  // UI States
  const [isSearching, setIsSearching] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const debouncedDestination = useDebounce(destinationAddress, 500);
  const debouncedPassengerName = useDebounce(passenger.name, 300);
  
  const { location, isLoading: isLocationLoading, error: locationError } = useGeolocation();
  
  const availableDestinations = [...fareRules].sort((a, b) => a.destinationCity.localeCompare(b.destinationCity));
  const currentFareRule = availableDestinations.find(rule => rule.destinationCity === destinationCity);

  // Effect: Fetch Address Suggestions
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

  // Effect: Fetch Passenger Suggestions
  useEffect(() => {
      if (debouncedPassengerName.length > 1) {
          const matches = savedPassengers.filter(p => 
              p.name.toLowerCase().includes(debouncedPassengerName.toLowerCase())
          );
          // Only show if it's not an exact match preventing the menu from closing
          if (matches.length > 0 && matches[0].name !== debouncedPassengerName) {
            setPassengerSuggestions(matches);
          } else {
             setPassengerSuggestions([]);
          }
      } else {
          setPassengerSuggestions([]);
      }
  }, [debouncedPassengerName, savedPassengers]);

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
    // Just update the text, suggestions appear via useEffect
    setPassenger(prev => ({ ...prev, name: newName }));
  };

  const handlePassengerSelect = (selected: Passenger) => {
      setPassenger(selected);
      setPassengerSuggestions([]);
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

  // Sidebar Component
  const Sidebar = () => (
      <>
        {/* Overlay */}
        <div 
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 w-64 bg-gray-800 z-50 transform transition-transform duration-300 shadow-2xl ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white italic">Ride<span className="text-orange-500">Car</span></h2>
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white">
                    <i className="fa-solid fa-times text-xl"></i>
                </button>
            </div>
            
            <div className="p-4">
                <div className="mb-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2 border-2 border-orange-500">
                         <i className="fa-solid fa-user text-2xl text-gray-300"></i>
                    </div>
                    <p className="text-white font-bold">{currentDriver.name}</p>
                    <p className="text-xs text-gray-400">{currentDriver.role === 'admin' ? 'Administrador' : 'Motorista'}</p>
                </div>

                <nav className="space-y-2">
                    <button onClick={() => { setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                        <i className="fa-solid fa-car-side w-8"></i> Nova Corrida
                    </button>
                    
                    <button onClick={() => { onNavigateToAdmin('financials'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors">
                        <i className="fa-solid fa-wallet w-8"></i> Financeiro
                    </button>

                    <button onClick={() => { onNavigateToAdmin('history'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors">
                        <i className="fa-solid fa-clock-rotate-left w-8"></i> Histórico
                    </button>

                    <button onClick={() => { onNavigateToAdmin('passengers'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors">
                        <i className="fa-solid fa-users w-8"></i> Passageiros
                    </button>
                    
                    {currentDriver.role === 'admin' && (
                        <>
                             <div className="my-2 border-t border-gray-700"></div>
                             <p className="text-xs text-gray-500 px-4 mb-1 uppercase tracking-wider">Admin</p>
                             <button onClick={() => { onNavigateToAdmin('dashboard'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors">
                                <i className="fa-solid fa-chart-line w-8"></i> Dashboard
                            </button>
                            <button onClick={() => { onNavigateToAdmin('drivers'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors">
                                <i className="fa-solid fa-id-card-clip w-8"></i> Motoristas
                            </button>
                        </>
                    )}
                </nav>
            </div>

            <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
                <button onClick={onLogout} className="w-full flex items-center justify-center px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                    <i className="fa-solid fa-right-from-bracket mr-2"></i> Sair
                </button>
            </div>
        </div>
      </>
  );

  return (
    <div className="h-full flex flex-col bg-gray-900">
       <Sidebar />
       
       {/* Compact Header */}
       <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center flex-shrink-0 shadow-md z-20">
        <div className="flex items-center">
            <button 
                onClick={() => setIsMenuOpen(true)}
                className="text-white p-2 mr-3 focus:outline-none"
            >
                <i className="fa-solid fa-bars text-2xl"></i>
            </button>
            <div className="flex flex-col">
                 <span className="text-xs text-gray-400 leading-none">Motorista</span>
                 <span className="text-sm font-bold text-white leading-tight truncate max-w-[150px]">{currentDriver.name}</span>
            </div>
        </div>
        
        {/* Small Logo fixed size */}
        <div className="w-10 h-10">
             <RideCarLogo className="w-10 h-10" />
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
          
          {/* Location Status Inline Block - Fix for blinking map */}
          {locationError ? (
            <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-3 mb-4 text-center backdrop-blur-sm">
                <i className="fa-solid fa-satellite-dish text-2xl text-red-400 mb-2"></i>
                <p className="text-red-300 text-xs">{locationError}</p>
            </div>
          ) : (
            <div className="bg-gray-700/80 rounded-lg p-2 mb-4 backdrop-blur-sm border border-gray-600">
                <h3 className="font-bold text-white mb-2 text-center text-xs uppercase tracking-wider">Localização</h3>
                <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-800 flex items-center justify-center border border-gray-600 shadow-inner">
                {isLocationLoading ? (
                    <div className="text-center text-gray-400 text-xs">
                    <i className="fa-solid fa-spinner fa-spin text-lg mb-1"></i>
                    <p>Buscando...</p>
                    </div>
                ) : location ? (
                    <Map location={location} isLoading={isLocationLoading} />
                ) : (
                    <div className="text-center text-gray-500 px-4 text-xs">
                    <i className="fa-solid fa-satellite-dish text-lg mb-1"></i>
                    <p>Aguardando GPS...</p>
                    </div>
                )}
                </div>
            </div>
          )}
          
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4 relative">
              <h3 className="text-orange-500 font-semibold text-sm uppercase tracking-wider mb-2">Dados do Passageiro</h3>
              
              {/* Name Input with Autocomplete */}
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
                
                {/* Suggestions Dropdown */}
                {passengerSuggestions.length > 0 && (
                     <ul className="absolute z-30 w-full mt-1 bg-gray-700 rounded-lg shadow-xl max-h-40 overflow-y-auto border border-gray-600">
                        {passengerSuggestions.map((p, i) => (
                            <li 
                                key={i} 
                                onClick={() => handlePassengerSelect(p)} 
                                className="px-4 py-3 text-white cursor-pointer hover:bg-gray-600 border-b border-gray-600 last:border-0 flex justify-between items-center"
                            >
                                <span className="font-medium">{p.name}</span>
                                <span className="text-xs text-gray-400"><i className="fa-brands fa-whatsapp mr-1"></i>{p.whatsapp}</span>
                            </li>
                        ))}
                    </ul>
                )}
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
                  autoComplete="off"
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
                  autoComplete="off"
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
                placeholder={destinationCity ? `Endereço em ${destinationCity}` : "Selecione a cidade primeiro"}
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

        <div className="mt-8 pb-4">
            <Footer />
        </div>
      </div>
    </div>
  );
};

export default StartRideForm;
