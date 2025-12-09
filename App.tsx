
import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import type { Passenger, Ride, Driver, GeolocationCoordinates, FareRule } from './types';
import StartRideForm from './components/StartRideForm';
import InRideDisplay from './components/InRideDisplay';
import AdminPanel from './components/admin/AdminPanel';
import LoginScreen from './components/LoginScreen';
import { supabase } from './supabaseClient';

const APP_STATE_STORAGE_KEY = 'ridecar_app_state';
const CURRENT_RIDE_STORAGE_KEY = 'ridecar_current_ride';
const CURRENT_DRIVER_STORAGE_KEY = 'ridecar_current_driver';

// Dados de fallback caso o Supabase falhe ou esteja vazio
const DEMO_ADMIN: Driver = {
  id: 'admin_master',
  name: 'Administrador Master',
  email: 'ridecar@digitalfreeshop.com.br',
  password: 'Mld3602#?+',
  carModel: 'Escritório',
  licensePlate: 'ADM-001',
  city: 'Matriz',
  role: 'admin'
};

const DEMO_DRIVER: Driver = {
  id: 'driver_demo',
  name: 'Carlos Silva',
  email: 'carlos@ridecar.com',
  password: '123',
  carModel: 'Toyota Corolla',
  licensePlate: 'BRA2E19',
  city: 'Guaxupé',
  role: 'driver'
};

// Limitando estritamente às cidades solicitadas: Guaxupé e Guaranésia
const DEMO_FARES: FareRule[] = [
  { id: 'f1', destinationCity: 'Guaxupé', fare: 20.00 },
  { id: 'f2', destinationCity: 'Guaranésia', fare: 25.00 }
];

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.START);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [initialDashboardTab, setInitialDashboardTab] = useState<string>('dashboard');
  
  // Data fetched from Supabase
  const [savedPassengers, setSavedPassengers] = useState<Passenger[]>([]);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);
  
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load basic local state (session persistence) and fetch initial data
  useEffect(() => {
    const initializeApp = async () => {
      // Restore session state
      const storedAppState = localStorage.getItem(APP_STATE_STORAGE_KEY);
      if (storedAppState) {
        const parsedState = JSON.parse(storedAppState) as AppState;
        if (Object.values(AppState).includes(parsedState) && parsedState !== AppState.IN_RIDE) {
          setAppState(parsedState);
        }
      }

      const storedRide = localStorage.getItem(CURRENT_RIDE_STORAGE_KEY);
      if (storedRide) {
        setCurrentRide(JSON.parse(storedRide));
        setAppState(AppState.IN_RIDE); // Force ride state if ride exists locally
      }

      const storedCurrentDriver = localStorage.getItem(CURRENT_DRIVER_STORAGE_KEY);
      if (storedCurrentDriver) {
        setCurrentDriver(JSON.parse(storedCurrentDriver));
      }

      // Fetch Global Data
      await fetchAllData();
    };

    initializeApp();
  }, []);

  const fetchAllData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch Fare Rules
      const { data: fares, error: fareError } = await supabase.from('fare_rules').select('*');
      if (fares && fares.length > 0) {
        // We prioritize DB fares, but filter or ensure only Guaxupe/Guaranesia if required strictly.
        // For this user request, let's keep it flexible but default to DEMO_FARES if DB is empty regarding these cities.
        setFareRules(fares.map((f: any) => ({
          id: f.id,
          destinationCity: f.destination_city,
          fare: f.fare
        })));
      } else {
        // Fallback fares
        setFareRules(DEMO_FARES);
      }

      // 2. Fetch Drivers (and Admins)
      const { data: dbDrivers, error: driverError } = await supabase.from('drivers').select('*');
      
      let loadedDrivers: Driver[] = [];
      if (dbDrivers && dbDrivers.length > 0) {
        loadedDrivers = dbDrivers.map((d: any) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          password: d.password,
          carModel: d.car_model,
          licensePlate: d.license_plate,
          city: d.city,
          role: d.role || 'driver' // Default to driver if null
        }));
      }
      
      // Ensure we always have the fallbacks locally if none found
      // This ensures the Admin credentials works even if DB is empty
      const hasAdmin = loadedDrivers.some(d => d.role === 'admin');
      const hasDemoDriver = loadedDrivers.some(d => d.email === DEMO_DRIVER.email);

      if (!hasAdmin) loadedDrivers.push(DEMO_ADMIN);
      if (!hasDemoDriver) loadedDrivers.push(DEMO_DRIVER);

      setDrivers(loadedDrivers);


      // 3. Fetch Passengers
      const { data: dbPassengers } = await supabase.from('passengers').select('*');
      if (dbPassengers) setSavedPassengers(dbPassengers);

      // 4. Fetch Ride History
      const { data: dbRides } = await supabase.from('rides').select('*').order('created_at', { ascending: false }).limit(100);
      
      if (dbRides) {
        const mappedRides: Ride[] = dbRides.map((r: any) => ({
          id: r.id,
          driverId: r.driver_id,
          passenger: r.passenger_json,
          destination: r.destination_json,
          startTime: r.start_time,
          endTime: r.end_time,
          distance: r.distance,
          fare: r.fare,
          startLocation: r.start_location_json
        }));
        setRideHistory(mappedRides);
      }

    } catch (error) {
      console.error("Erro ao buscar dados do Supabase:", error);
      // Ensure app is usable even offline
      setDrivers([DEMO_ADMIN, DEMO_DRIVER]);
      setFareRules(DEMO_FARES);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Persist local session state only
  useEffect(() => {
    localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(appState));
    if (currentRide) {
      localStorage.setItem(CURRENT_RIDE_STORAGE_KEY, JSON.stringify(currentRide));
    } else {
      localStorage.removeItem(CURRENT_RIDE_STORAGE_KEY);
    }
    if (currentDriver) {
      localStorage.setItem(CURRENT_DRIVER_STORAGE_KEY, JSON.stringify(currentDriver));
    } else {
      localStorage.removeItem(CURRENT_DRIVER_STORAGE_KEY);
    }
  }, [appState, currentRide, currentDriver]);


  // --- Handlers for Admin/State Sync ---

  const handleSavePassengers = async (updatedPassengers: Passenger[]) => {
    await fetchAllData();
  };
  
  const handleSaveDrivers = async (updatedDrivers: Driver[]) => {
    // This handler now handles both Admins and Drivers since they are in the same list
    const currentIds = drivers.map(d => d.id);
    const newIds = updatedDrivers.map(d => d.id);
    // Don't delete demo accounts locally, but allow DB sync
    const toDelete = currentIds.filter(id => !newIds.includes(id) && id !== 'driver_demo' && id !== 'admin_master'); 
    const toUpsert = updatedDrivers.filter(d => d.id !== 'driver_demo' && d.id !== 'admin_master');

    try {
      if (toDelete.length > 0) {
        await supabase.from('drivers').delete().in('id', toDelete);
      }

      if (toUpsert.length > 0) {
        const dbRows = toUpsert.map(d => ({
          id: d.id,
          name: d.name,
          email: d.email,
          password: d.password,
          car_model: d.carModel,
          license_plate: d.licensePlate,
          city: d.city,
          role: d.role // Important: Save the role
        }));
        await supabase.from('drivers').upsert(dbRows);
      }
      
      // Update local state immediately for UI responsiveness
      setDrivers(updatedDrivers);
    } catch (e) {
      console.error("Error saving drivers:", e);
      alert("Erro ao salvar dados. Verifique a conexão.");
    }
  };
  
  const handleSaveFareRules = async (updatedFareRules: FareRule[]) => {
    const currentIds = fareRules.map(r => r.id);
    const newIds = updatedFareRules.map(r => r.id);
    const toDelete = currentIds.filter(id => !newIds.includes(id) && !id.startsWith('f')); // Avoid deleting demo data
    const toUpsert = updatedFareRules.filter(r => !r.id.startsWith('f')); // Avoid upserting demo data
    
    try {
      if (toDelete.length > 0) {
        await supabase.from('fare_rules').delete().in('id', toDelete);
      }

      if (toUpsert.length > 0) {
        const dbRows = toUpsert.map(r => ({
            id: r.id,
            destination_city: r.destinationCity,
            fare: r.fare
        }));
        await supabase.from('fare_rules').upsert(dbRows);
      }

      setFareRules(updatedFareRules);
    } catch (e) {
      console.error("Error saving fares:", e);
      alert("Erro ao salvar tarifas.");
    }
  };

  const handleLogin = (email: string, password: string): boolean => {
    // Verify against loaded drivers
    const driver = drivers.find(d => d.email.toLowerCase() === email.toLowerCase() && d.password === password);
    if (driver) {
      setCurrentDriver(driver);
      // Auto-redirect based on role
      if (driver.role === 'admin') {
        setAppState(AppState.ADMIN_PANEL);
      } else {
        setAppState(AppState.START);
      }
      return true;
    }
    return false;
  };
  
  const handleLogout = () => {
    setCurrentDriver(null);
    setAppState(AppState.START);
    // Clear persisted driver to prevent auto-relogin issues
    localStorage.removeItem(CURRENT_DRIVER_STORAGE_KEY);
  };

  const handleNavigateToDashboard = (tab: string = 'dashboard') => {
    setInitialDashboardTab(tab);
    setAppState(AppState.ADMIN_PANEL);
  };

  const handleStartRide = async (passenger: Passenger, destination: { address: string; city: string }, startLocation: GeolocationCoordinates | null, fare: number) => {
    if (!currentDriver || !startLocation) return;
    
    // 1. Prepare initial Ride object
    const tempRide: Ride = {
      passenger,
      destination,
      startTime: Date.now(),
      distance: 0,
      fare,
      driverId: currentDriver.id,
      startLocation,
    };

    try {
      // 2. Save/Update passenger in DB (upsert by whatsapp)
      const { data: savedPassengerData } = await supabase.from('passengers').upsert({
        name: passenger.name,
        whatsapp: passenger.whatsapp,
        cpf: passenger.cpf
      }, { onConflict: 'whatsapp' }).select().single();

      if (savedPassengerData) {
        tempRide.passenger = { ...passenger, id: savedPassengerData.id };
      }

      // 3. Insert Ride into DB
      const dbRide = {
        driver_id: currentDriver.id,
        passenger_json: tempRide.passenger,
        destination_json: destination,
        start_time: tempRide.startTime,
        start_location_json: startLocation,
        fare: fare,
        distance: 0
      };

      const { data: insertedRide, error } = await supabase.from('rides').insert(dbRide).select().single();

      if (error) throw error;

      if (insertedRide) {
        // Update local state with the DB ID
        const finalRide = { ...tempRide, id: insertedRide.id };
        setCurrentRide(finalRide);
        setAppState(AppState.IN_RIDE);
        
        // Refresh passenger list in background
        fetchAllData(); 
      }
    } catch (e) {
      console.error("Error starting ride:", e);
      // Fallback for offline (optional: you could allow offline start here)
      // Allow starting ride locally even if DB fails
      setCurrentRide(tempRide);
      setAppState(AppState.IN_RIDE);
    }
  };

  const handleStopRide = async (finalDistance: number) => {
    if (currentRide) {
      const endTime = Date.now();
      
      try {
        if (currentRide.id) {
            // Update DB
            const { error } = await supabase.from('rides').update({
            end_time: endTime,
            distance: finalDistance,
            }).eq('id', currentRide.id);

            if (error) throw error;
        }

        // Update Local
        const updatedRide = { ...currentRide, distance: finalDistance, endTime };
        setCurrentRide(updatedRide);

        // Update History Local
        setRideHistory(prev => [updatedRide, ...prev]);
      } catch (e) {
        console.error("Error stopping ride:", e);
        // Still update UI to show completion even if sync failed
        const updatedRide = { ...currentRide, distance: finalDistance, endTime };
        setCurrentRide(updatedRide);
        setRideHistory(prev => [updatedRide, ...prev]);
      }
    }
  };

  const handleUpdateDestination = async (newDestination: { address: string; city: string }) => {
    if (!currentRide) return;
    
    // Update local state immediately for UI response
    const updatedRide = { ...currentRide, destination: newDestination };
    setCurrentRide(updatedRide);

    // Update DB
    if (updatedRide.id) {
        try {
            await supabase.from('rides').update({
                destination_json: newDestination
            }).eq('id', updatedRide.id);
        } catch (e) {
            console.error("Error updating destination:", e);
        }
    }
  };

  const handleSendWhatsApp = () => {
    if (currentRide && currentDriver) {
      const message = `Olá ${currentRide.passenger.name}, sua corrida com ${currentDriver.name} foi finalizada.\n\n` +
        `*Destino:* ${currentRide.destination.address}\n` +
        `*Distância:* ${currentRide.distance.toFixed(2)} km\n` +
        `*Total a pagar:* R$ ${currentRide.fare.toFixed(2)}\n\n` +
        `Chave PIX: ${currentDriver.email}\n` + 
        `Obrigado pela preferência!`;
      
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/55${currentRide.passenger.whatsapp}?text=${encodedMessage}`, '_blank');
    }
  };

  const handleCompleteRide = () => {
    setCurrentRide(null);
    setAppState(AppState.START);
    // Refresh history
    fetchAllData();
  };

  if (isLoadingData && !drivers.length) {
      return (
          <div className="h-full w-full bg-gray-900 flex items-center justify-center text-white">
              <div className="text-center">
                <i className="fa-solid fa-spinner fa-spin text-4xl mb-4 text-orange-500"></i>
                <p>Carregando sistema...</p>
              </div>
          </div>
      )
  }

  if (!currentDriver) {
    return <LoginScreen onLogin={handleLogin} onNavigateToAdmin={() => handleNavigateToDashboard('dashboard')} />;
  }

  // Filtrando para garantir que apenas Guaxupé e Guaranésia sejam opções principais no dropdown de início
  const displayFareRules = fareRules.filter(r => 
      r.destinationCity === 'Guaxupé' || r.destinationCity === 'Guaranésia'
  ).length > 0 
    ? fareRules.filter(r => r.destinationCity === 'Guaxupé' || r.destinationCity === 'Guaranésia')
    : DEMO_FARES;


  return (
    <div className="h-full w-full bg-gray-900 text-white overflow-hidden font-sans flex flex-col">
      {appState === AppState.START && (
        <StartRideForm 
          savedPassengers={savedPassengers}
          onStartRide={handleStartRide}
          onNavigateToAdmin={(tab) => handleNavigateToDashboard(tab)}
          currentDriver={currentDriver}
          onLogout={handleLogout}
          fareRules={displayFareRules}
        />
      )}

      {appState === AppState.IN_RIDE && currentRide && (
        <InRideDisplay 
          ride={currentRide}
          driver={currentDriver}
          onStopRide={handleStopRide}
          onSendWhatsApp={handleSendWhatsApp}
          onComplete={handleCompleteRide}
          onUpdateDestination={handleUpdateDestination}
          fareRules={displayFareRules}
        />
      )}

      {appState === AppState.ADMIN_PANEL && (
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
          initialTab={initialDashboardTab}
        />
      )}
    </div>
  );
}

export default App;
