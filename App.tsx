import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import type { Passenger, Ride, Driver, GeolocationCoordinates, FareRule } from './types';
import StartRideForm from './components/StartRideForm';
import InRideDisplay from './components/InRideDisplay';
import AdminPanel from './components/admin/AdminPanel';
import LoginScreen from './components/LoginScreen';

const PASSENGERS_STORAGE_KEY = 'ridecar_saved_passengers';
const RIDE_HISTORY_STORAGE_KEY = 'ridecar_ride_history';
const APP_STATE_STORAGE_KEY = 'ridecar_app_state';
const CURRENT_RIDE_STORAGE_KEY = 'ridecar_current_ride';
const DRIVERS_STORAGE_KEY = 'ridecar_drivers_list';
const CURRENT_DRIVER_STORAGE_KEY = 'ridecar_current_driver';
const FARE_RULES_STORAGE_KEY = 'ridecar_fare_rules';


function App() {
  const [appState, setAppState] = useState<AppState>(AppState.START);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [savedPassengers, setSavedPassengers] = useState<Passenger[]>([]);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);

  useEffect(() => {
    try {
      // Load saved passengers
      const storedPassengers = localStorage.getItem(PASSENGERS_STORAGE_KEY);
      if (storedPassengers) {
        setSavedPassengers(JSON.parse(storedPassengers));
      }
      // Load ride history
      const storedHistory = localStorage.getItem(RIDE_HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setRideHistory(JSON.parse(storedHistory));
      }
      // Load persisted app state
      const storedAppState = localStorage.getItem(APP_STATE_STORAGE_KEY);
      if (storedAppState) {
        const parsedState = JSON.parse(storedAppState) as AppState;
        if (Object.values(AppState).includes(parsedState) && parsedState !== AppState.IN_RIDE) {
          setAppState(parsedState);
        }
      }
      // Load persisted current ride
      const storedRide = localStorage.getItem(CURRENT_RIDE_STORAGE_KEY);
      if (storedRide) {
        setCurrentRide(JSON.parse(storedRide));
      }
      // Load drivers
      const storedDrivers = localStorage.getItem(DRIVERS_STORAGE_KEY);
      if (storedDrivers) {
        setDrivers(JSON.parse(storedDrivers));
      } else {
        const defaultDriver: Driver = {
          id: 'driver_1',
          name: 'Carlos Silva',
          email: 'carlos@ridecar.com',
          password: '123',
          carModel: 'Toyota Corolla',
          licensePlate: 'BRA2E19',
          city: 'São Paulo',
        };
        setDrivers([defaultDriver]);
      }
      // Load current driver
      const storedCurrentDriver = localStorage.getItem(CURRENT_DRIVER_STORAGE_KEY);
      if (storedCurrentDriver) {
        setCurrentDriver(JSON.parse(storedCurrentDriver));
      }
      // Load fare rules with enforced updates for Guaranésia and Guaxupé
      const storedFareRules = localStorage.getItem(FARE_RULES_STORAGE_KEY);
      let rules: FareRule[] = [];

      if (storedFareRules) {
          rules = JSON.parse(storedFareRules);
      }

      // Update or Add Guaranésia (R$ 12.00)
      const gIdx = rules.findIndex(r => r.destinationCity === 'Guaranésia');
      if (gIdx !== -1) {
         rules[gIdx].fare = 12.00;
      } else {
         rules.push({ id: 'rule_guaranesia', destinationCity: 'Guaranésia', fare: 12.00 });
      }

      // Update or Add Guaxupé (R$ 35.00)
      const gxIdx = rules.findIndex(r => r.destinationCity === 'Guaxupé');
      if (gxIdx !== -1) {
         rules[gxIdx].fare = 35.00;
      } else {
         rules.push({ id: 'rule_guaxupe', destinationCity: 'Guaxupé', fare: 35.00 });
      }

      setFareRules(rules);

    } catch (error) {
      console.error("Falha ao carregar dados do armazenamento", error);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(appState));
      if (currentRide) {
        localStorage.setItem(CURRENT_RIDE_STORAGE_KEY, JSON.stringify(currentRide));
      } else {
        localStorage.removeItem(CURRENT_RIDE_STORAGE_KEY);
      }
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(drivers));
      if (currentDriver) {
        localStorage.setItem(CURRENT_DRIVER_STORAGE_KEY, JSON.stringify(currentDriver));
      } else {
        localStorage.removeItem(CURRENT_DRIVER_STORAGE_KEY);
      }
      localStorage.setItem(FARE_RULES_STORAGE_KEY, JSON.stringify(fareRules));
    } catch (error) {
      console.error("Falha ao salvar o estado da aplicação", error);
    }
  }, [appState, currentRide, drivers, currentDriver, fareRules]);

  const handleSavePassengers = (updatedPassengers: Passenger[]) => {
    setSavedPassengers(updatedPassengers);
    localStorage.setItem(PASSENGERS_STORAGE_KEY, JSON.stringify(updatedPassengers));
  };
  
  const handleSaveDrivers = (updatedDrivers: Driver[]) => {
    setDrivers(updatedDrivers);
  };
  
  const handleSaveFareRules = (updatedFareRules: FareRule[]) => {
    setFareRules(updatedFareRules);
  };

  const handleLogin = (email: string, password: string): boolean => {
    const driver = drivers.find(d => d.email.toLowerCase() === email.toLowerCase() && d.password === password);
    if (driver) {
      setCurrentDriver(driver);
      setAppState(AppState.START);
      return true;
    }
    return false;
  };
  
  const handleLogout = () => {
    setCurrentDriver(null);
    setAppState(AppState.START); // Will redirect to LoginScreen as currentDriver is null
  };

  const handleStartRide = (passenger: Passenger, destination: { address: string; city: string }, startLocation: GeolocationCoordinates | null, fare: number) => {
    if (!currentDriver || !startLocation) return;
    const newRide: Ride = {
      passenger,
      destination,
      startTime: Date.now(),
      distance: 0,
      fare, // Use fixed fare
      driverId: currentDriver.id,
      startLocation,
    };
    setCurrentRide(newRide);
    setAppState(AppState.IN_RIDE);
  };

  const handleStopRide = (finalDistance: number) => {
    if (!currentRide) return;

    const endTime = Date.now();
    
    const finishedRide: Ride = {
      ...currentRide,
      endTime,
      distance: finalDistance,
      // Fare is already fixed, no need to recalculate
    };
    setCurrentRide(finishedRide);
  };

  const handleSendWhatsApp = () => {
    if (!currentRide) return;
    const { passenger, fare } = currentRide;
    const message = `Olá ${passenger.name}! O valor da sua corrida de ${currentDriver?.city} para ${currentRide.destination.city} foi de R$${fare.toFixed(2)}. Meu PIX para pagamento é: [SUA CHAVE PIX AQUI]`;
    const whatsappUrl = `https://wa.me/55${passenger.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCompleteAndReset = () => {
    if (!currentRide) return;

    const { passenger } = currentRide;
    if (passenger.name && passenger.whatsapp) {
      const updatedPassengers = [...savedPassengers];
      const existingIndex = updatedPassengers.findIndex(p => p.name.toLowerCase() === passenger.name.toLowerCase());
      
      if (existingIndex !== -1) {
        updatedPassengers[existingIndex] = passenger;
      } else {
        updatedPassengers.push(passenger);
      }
      
      handleSavePassengers(updatedPassengers);
    }

    const newHistory = [...rideHistory, currentRide];
    setRideHistory(newHistory);
    localStorage.setItem(RIDE_HISTORY_STORAGE_KEY, JSON.stringify(newHistory));

    setAppState(AppState.START);
    setCurrentRide(null);
  };
  
  const renderContent = () => {
    if (appState === AppState.ADMIN_PANEL) {
      return (
        <AdminPanel 
          rideHistory={rideHistory}
          passengers={savedPassengers}
          drivers={drivers}
          fareRules={fareRules}
          onSaveDrivers={handleSaveDrivers}
          onSavePassengers={handleSavePassengers}
          onSaveFareRules={handleSaveFareRules}
          onExitAdminPanel={() => setAppState(AppState.START)}
          currentDriver={currentDriver}
        />
      );
    }

    if (!currentDriver) {
      return (
        <div className="relative h-full w-full">
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=2071&auto=format&fit=crop')" }}
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            </div>
            <div className="absolute inset-0 overflow-y-auto">
              <LoginScreen
                onLogin={handleLogin}
                onNavigateToAdmin={() => setAppState(AppState.ADMIN_PANEL)}
              />
            </div>
        </div>
      );
    }

    switch (appState) {
      case AppState.START:
        return <StartRideForm 
                  onStartRide={handleStartRide} 
                  savedPassengers={savedPassengers} 
                  onNavigateToAdmin={() => setAppState(AppState.ADMIN_PANEL)}
                  currentDriver={currentDriver}
                  onLogout={handleLogout}
                  fareRules={fareRules}
                />;
      case AppState.IN_RIDE:
        return (
          <InRideDisplay 
            ride={currentRide!}
            driver={currentDriver}
            onStopRide={handleStopRide}
            onSendWhatsApp={handleSendWhatsApp}
            onComplete={handleCompleteAndReset}
          />
        );
      default:
        handleLogout();
        return null;
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col font-sans">
      <div className="relative flex-grow">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;