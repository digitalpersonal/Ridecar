
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
      const { data: fares } = await supabase.from('fare_rules').select('*');
      if (fares && fares.length > 0) {
        setFareRules(fares.map((f: any) => ({
          id: f.id,
          destinationCity: f.destination_city,
          fare: f.fare
        })));
      } else {
        setFareRules([]);
      }

      // 2. Fetch Drivers (and Admins)
      const { data: dbDrivers } = await supabase.from('drivers').select('*');
      
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
          role: d.role || 'driver',
          pixKey: d.pix_key // Map snake_case to camelCase
        }));
      }
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
          startTime: new Date(r.start_time).getTime(),
          endTime: r.end_time ? new Date(r.end_time).getTime() : undefined,
          distance: r.distance,
          fare: r.fare,
          startLocation: r.start_location_json
        }));
        setRideHistory(mappedRides);
      }

    } catch (error) {
      console.error("Erro ao buscar dados do Supabase:", error);
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
    const toUpsert = updatedDrivers;

    try {
      // Simple upsert strategy for this list
      if (toUpsert.length > 0) {
        const dbRows = toUpsert.map(d => ({
          id: d.id,
          name: d.name,
          email: d.email,
          password: d.password,
          car_model: d.carModel,
          license_plate: d.licensePlate,
          city: d.city,
          role: d.role,
          pix_key: d.pixKey // Save pixKey to snake_case column
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
    try {
      const dbRows = updatedFareRules.map(r => ({
            id: r.id,
            destination_city: r.destinationCity,
            fare: r.fare
      }));
      await supabase.from('fare_rules').upsert(dbRows);
      
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
    localStorage.removeItem(CURRENT_DRIVER_STORAGE_KEY);
  };

  const handleNavigateToDashboard = (tab: string = 'dashboard') => {
    setInitialDashboardTab(tab);
    setAppState(AppState.ADMIN_PANEL);
  };

  const handleStartRide = async (passenger: Passenger, destination: { address: string; city: string }, startLocation: GeolocationCoordinates | null, fare: number) => {
    if (!currentDriver || !startLocation) return;
    
    // Clean WhatsApp number (digits only) for DB consistency
    const cleanWhatsapp = passenger.whatsapp.replace(/\D/g, '');

    // 1. Prepare initial Ride object
    const tempRide: Ride = {
      passenger: { ...passenger, whatsapp: cleanWhatsapp },
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
        whatsapp: cleanWhatsapp,
        cpf: passenger.cpf
      }, { onConflict: 'whatsapp' }).select().single();

      if (savedPassengerData) {
        // Update tempRide with ID from DB
        tempRide.passenger = { ...passenger, id: savedPassengerData.id, whatsapp: cleanWhatsapp };
        
        // Update local state immediately so autocomplete works for next ride without refetch
        setSavedPassengers(prev => {
           // Remove if exists (by whatsapp) and add new/updated
           const others = prev.filter(p => p.whatsapp.replace(/\D/g, '') !== cleanWhatsapp);
           return [...others, savedPassengerData];
        });
      }

      // 3. Insert Ride into DB
      const dbRide = {
        driver_id: currentDriver.id,
        passenger_json: tempRide.passenger,
        destination_json: destination,
        start_time: new Date(tempRide.startTime).toISOString(),
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
        
        // Refresh passenger list in background (backup)
        // fetchAllData(); // Commented out to rely on optimistic update above for speed
      }
    } catch (e) {
      console.error("Error starting ride:", e);
      alert("Erro ao iniciar corrida. Verifique a conexão com o banco de dados.");
    }
  };

  const handleStopRide = async (finalDistance: number) => {
    if (currentRide) {
      const endTime = Date.now();
      
      try {
        if (currentRide.id) {
            // Update DB
            const { error } = await supabase.from('rides').update({
            end_time: new Date(endTime).toISOString(),
            distance: finalDistance,
            }).eq('id', currentRide.id);

            if (error) throw error;
        }

        // Update Local
        const updatedRide = { ...currentRide, distance: finalDistance, endTime };
        setCurrentRide(updatedRide);

        // Update History Local (Smart Update: Upsert)
        // Isso previne duplicatas se a corrida já foi carregada do DB durante um refresh
        setRideHistory(prev => {
           const existingIndex = prev.findIndex(r => r.id === updatedRide.id);
           if (existingIndex >= 0) {
               // Atualiza a entrada existente
               const newHistory = [...prev];
               newHistory[existingIndex] = updatedRide;
               return newHistory;
           } else {
               // Adiciona nova entrada no topo
               return [updatedRide, ...prev];
           }
        });

      } catch (e) {
        console.error("Error stopping ride:", e);
      }
    }
  };

  const handleUpdateDestination = async (newDestination: { address: string; city: string }) => {
    if (!currentRide) return;
    
    const updatedRide = { ...currentRide, destination: newDestination };
    setCurrentRide(updatedRide);

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
      // USA O PIX DO MOTORISTA OU O EMAIL COMO FALLBACK
      const pixKey = currentDriver.pixKey || currentDriver.email;

      // ATENÇÃO: Envia APENAS a chave PIX (sem texto adicional) para facilitar o "Copia e Cola" no banco
      const message = pixKey;
      
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/55${currentRide.passenger.whatsapp}?text=${encodedMessage}`, '_blank');
    }
  };

  const handleCompleteRide = () => {
    setCurrentRide(null);
    setAppState(AppState.START);
    // Force refresh history to ensure everything is synced
    fetchAllData();
  };

  if (isLoadingData && drivers.length === 0) {
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

  const displayFareRules = fareRules.length > 0 ? fareRules : [];

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
