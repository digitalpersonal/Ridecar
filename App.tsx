
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
          pixKey: d.pix_key, 
          photoUrl: d.photo_url // Mapeando a foto vinda do banco
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

  const handleLogin = (email: string, pass: string): boolean => {
      const driver = drivers.find(d => d.email.toLowerCase() === email.toLowerCase() && d.password === pass);
      if (driver) {
          setCurrentDriver(driver);
          setAppState(AppState.START);
          return true;
      }
      return false;
  };

  const handleLogout = () => {
      setCurrentDriver(null);
      setCurrentRide(null);
      setAppState(AppState.START);
      localStorage.removeItem(CURRENT_DRIVER_STORAGE_KEY);
      localStorage.removeItem(CURRENT_RIDE_STORAGE_KEY);
  };

  const handleStartRide = async (passenger: Passenger, destination: { address: string, city: string }, startLocation: GeolocationCoordinates | null, fare: number) => {
    if (!currentDriver) return;

    // 1. AUTO-SAVE PASSENGER: Check if exists, if not, save to DB
    // Verifica se já existe um passageiro com esse whatsapp ou nome exato
    const existingPassenger = savedPassengers.find(p => 
        (p.whatsapp === passenger.whatsapp) || (p.name.toLowerCase() === passenger.name.toLowerCase() && p.whatsapp === passenger.whatsapp)
    );

    let passengerToUse = existingPassenger || passenger;

    if (!existingPassenger) {
        try {
            const { data, error } = await supabase.from('passengers').insert([{
                name: passenger.name,
                whatsapp: passenger.whatsapp,
                cpf: passenger.cpf
            }]).select();

            if (data && data.length > 0) {
                passengerToUse = data[0];
                setSavedPassengers(prev => [...prev, passengerToUse]);
            }
        } catch (err) {
            console.error("Erro ao salvar passageiro automático:", err);
        }
    }

    // 2. Create Ride Object
    const newRide: Ride = {
      id: crypto.randomUUID(), // Temp ID for UI until DB confirms
      passenger: passengerToUse,
      destination,
      startTime: Date.now(),
      distance: 0,
      fare,
      driverId: currentDriver.id,
      startLocation
    };
    
    setCurrentRide(newRide);
    setAppState(AppState.IN_RIDE);

    // 3. Save Ride to DB
    try {
        await supabase.from('rides').insert([{
            driver_id: newRide.driverId,
            passenger_json: newRide.passenger,
            destination_json: newRide.destination,
            start_time: new Date(newRide.startTime).toISOString(),
            distance: 0,
            fare: newRide.fare,
            start_location_json: newRide.startLocation
        }]);
    } catch (err) {
        console.error("Erro ao criar corrida no DB:", err);
    }
  };

  const handleStopRide = async (finalDistance: number) => {
    if (!currentRide) return;
    
    const endTime = Date.now();
    const updatedRide = { ...currentRide, endTime, distance: finalDistance };
    
    setCurrentRide(updatedRide);
    // Note: We stay in IN_RIDE state, but the InRideDisplay will show "Finished" view because endTime is set.
    
    // Update Ride in DB
    try {
        // Need to find the ride in DB. Since we generated a UUID or reliance on order, 
        // ideally we would use the ID returned from insert. For simplicity in this demo, 
        // we assume we can match by start time/driver or just insert a new completed record if we didn't store the ID properly.
        // Better approach: Update the last active ride for this driver.
        
        // Simple update logic finding by approximately start time and driver
        const startTimeISO = new Date(currentRide.startTime).toISOString();
        
        await supabase.from('rides')
            .update({ 
                end_time: new Date(endTime).toISOString(),
                distance: finalDistance
            })
            .eq('driver_id', currentRide.driverId)
            .eq('start_time', startTimeISO);
            
    } catch (err) {
        console.error("Erro ao finalizar corrida no DB:", err);
    }
  };

  const handleCompleteRide = () => {
    if (currentRide) {
        setRideHistory(prev => [currentRide, ...prev]);
    }
    setCurrentRide(null);
    setAppState(AppState.START);
  };

  const handleSendWhatsApp = () => {
    if (!currentRide || !currentDriver) return;
    
    const message = `Olá ${currentRide.passenger.name}, aqui é o motorista ${currentDriver.name}.\n\nO valor da sua corrida ficou em *R$ ${currentRide.fare.toFixed(2)}*.\n\nMinha chave PIX: *${currentDriver.pixKey || currentDriver.email}*\n\nObrigado pela preferência!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${currentRide.passenger.whatsapp}?text=${encodedMessage}`, '_blank');
  };
  
  const handleUpdateDestination = async (newDest: { address: string; city: string }) => {
      if (!currentRide) return;
      
      const updatedRide = { ...currentRide, destination: newDest };
      setCurrentRide(updatedRide);
      
      // Update DB
      try {
           const startTimeISO = new Date(currentRide.startTime).toISOString();
           await supabase.from('rides')
            .update({ destination_json: newDest })
            .eq('driver_id', currentRide.driverId)
            .eq('start_time', startTimeISO);
      } catch (err) {
          console.error("Erro ao atualizar destino:", err);
      }
  };

  // Admin Handlers
  const handleNavigateToAdmin = (tab: string) => {
      setInitialDashboardTab(tab);
      setAppState(AppState.ADMIN_PANEL);
  };

  const handleSaveDrivers = async (updatedDrivers: Driver[]) => {
      setDrivers(updatedDrivers);
      
      // Upsert to DB
      try {
          const { error } = await supabase.from('drivers').upsert(
              updatedDrivers.map(d => ({
                  id: d.id,
                  name: d.name,
                  email: d.email,
                  password: d.password,
                  car_model: d.carModel,
                  license_plate: d.licensePlate,
                  city: d.city,
                  role: d.role,
                  pix_key: d.pixKey,
                  photo_url: d.photoUrl // Salvando a URL da foto (Base64)
              }))
          );
          if (error) throw error;
      } catch (err) {
          console.error("Erro ao salvar motoristas:", err);
          alert("Erro ao salvar no banco de dados.");
      }
  };

  const handleSavePassengers = async (updatedPassengers: Passenger[]) => {
      setSavedPassengers(updatedPassengers);
      // Upsert handled individually or batch here if needed
      // For this demo, passengers are mostly read-only in admin or added individually
  };

  const handleSaveFareRules = async (updatedRules: FareRule[]) => {
      setFareRules(updatedRules);
      try {
          // First delete all (simple sync) or upsert. Simple sync:
          await supabase.from('fare_rules').delete().neq('id', '0'); // Delete all
          
          await supabase.from('fare_rules').insert(
              updatedRules.map(r => ({
                  id: r.id,
                  destination_city: r.destinationCity,
                  fare: r.fare
              }))
          );
      } catch (err) {
          console.error("Erro ao salvar tarifas:", err);
      }
  };


  if (!currentDriver) {
      return <LoginScreen onLogin={handleLogin} onNavigateToAdmin={() => {}} />;
  }

  return (
    <>
      {appState === AppState.START && (
        <StartRideForm 
            savedPassengers={savedPassengers}
            onStartRide={handleStartRide}
            onNavigateToAdmin={handleNavigateToAdmin}
            currentDriver={currentDriver}
            onLogout={handleLogout}
            fareRules={fareRules}
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
            fareRules={fareRules}
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
    </>
  );
}

export default App;
