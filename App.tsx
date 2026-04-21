
import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import type { Passenger, Ride, Driver, GeolocationCoordinates, FareRule } from './types';
import StartRideForm from './components/StartRideForm';
import InRideDisplay from './components/InRideDisplay';
import AdminPanel from './components/admin/AdminPanel';
import LoginScreen from './components/LoginScreen';
import PublicProfile from './components/PublicProfile';
import LoadingSpinner from './components/LoadingSpinner';
import { supabase } from './supabaseClient';

const CURRENT_DRIVER_STORAGE_KEY = 'ridecar_current_driver';
const CURRENT_RIDE_STORAGE_KEY = 'ridecar_current_ride';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.START);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [initialDashboardTab, setInitialDashboardTab] = useState<string>('dashboard');
  
  const [savedPassengers, setSavedPassengers] = useState<Passenger[]>([]);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);
  
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [brandedContext, setBrandedContext] = useState<Driver | null>(null); 
  const [isInitializing, setIsInitializing] = useState(true);

  // Aplica cores dinâmicas baseadas no motorista atual ou no contexto da página (White Label)
  useEffect(() => {
    const driver = currentDriver || brandedContext;
    if (driver) {
      const color = driver.primaryColor || '#f97316';
      const bgColor = driver.backgroundColor || '#030712';
      document.documentElement.style.setProperty('--primary-color', color);
      document.documentElement.style.setProperty('--bg-color', bgColor);
      // Calcula uma cor de hover um pouco mais escura
      document.documentElement.style.setProperty('--primary-hover', color === '#f97316' ? '#ea580c' : color);
    }
  }, [currentDriver, brandedContext]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Verificar se estamos em uma página de White Label (ex: ridecar.app/motorista-slug)
        const path = window.location.pathname.replace('/', '');
        if (path && path !== 'index.html' && path.length > 2) {
          const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .eq('slug', path)
            .single();
            
          if (data && !error) {
            setBrandedContext({
              id: data.id,
              name: data.name,
              email: data.email,
              carModel: data.car_model,
              licensePlate: data.license_plate,
              city: data.city,
              pixKey: data.pix_key,
              photoUrl: data.photo_url,
              brandName: data.brand_name, 
              primaryColor: data.primary_color,
              backgroundColor: data.background_color,
              customLogoUrl: data.custom_logo_url,
              slug: data.slug
            });
          }
        }

        // 2. Carregar dados globais necessários
        await fetchGlobalData();

        // 3. Verificar sessão de motorista logado
        const storedCurrentDriver = localStorage.getItem(CURRENT_DRIVER_STORAGE_KEY);
        if (storedCurrentDriver) {
          const parsedDriver = JSON.parse(storedCurrentDriver);
          setCurrentDriver(parsedDriver);
          await fetchDriverSpecificData(parsedDriver);
        }

        // 4. Verificar se existe uma corrida em andamento interrompida
        const storedRide = localStorage.getItem(CURRENT_RIDE_STORAGE_KEY);
        if (storedRide) {
          try {
            const parsedRide = JSON.parse(storedRide);
            // Validação mínima para evitar crashes em InRideDisplay
            if (parsedRide && typeof parsedRide === 'object' && parsedRide.passenger && parsedRide.destination) {
              setCurrentRide(parsedRide);
              setAppState(AppState.IN_RIDE);
            } else {
              console.warn("Corrida inválida no armazenamento, limpando...");
              localStorage.removeItem(CURRENT_RIDE_STORAGE_KEY);
            }
          } catch (e) {
            console.error("Erro ao ler corrida salva:", e);
            localStorage.removeItem(CURRENT_RIDE_STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error("Erro crítico na inicialização do App:", e);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  const fetchGlobalData = async () => {
    try {
      console.log("DATABASE: Sincronizando dados globais...");
      const { data: fares } = await supabase.from('fare_rules').select('*');
      if (fares) {
        console.log(`DATABASE: ${fares.length} regras de tarifa carregadas.`);
        setFareRules(fares.map((f: any) => ({ 
          id: f.id, originCity: f.origin_city, destinationCity: f.destination_city, fare: f.fare 
        })));
      }

      const { data: dbDrivers } = await supabase.from('drivers').select('*');
      if (dbDrivers) {
        console.log(`DATABASE: ${dbDrivers.length} motoristas carregados.`);
        setDrivers(dbDrivers.map((d: any) => ({
          id: d.id, name: d.name, email: d.email, password: d.password,
          carModel: d.car_model, licensePlate: d.license_plate, city: d.city,
          role: d.role || 'driver', pixKey: d.pix_key, photoUrl: d.photo_url,
          brandName: d.brand_name, primaryColor: d.primary_color, backgroundColor: d.background_color, customLogoUrl: d.custom_logo_url,
          slug: d.slug
        })));
      }
    } catch (error) {
      console.error("DATABASE ERROR: Erro ao buscar dados globais:", error);
    }
  };

  const fetchDriverSpecificData = async (driver: Driver) => {
    try {
      // Clientes
      let passengerQuery = supabase.from('passengers').select('*');
      if (driver.role !== 'admin') passengerQuery = passengerQuery.eq('driver_id', driver.id);
      const { data: dbPassengers } = await passengerQuery;
      if (dbPassengers) setSavedPassengers(dbPassengers);

      // Histórico
      let rideQuery = supabase.from('rides').select('*').order('start_time', { ascending: false });
      if (driver.role !== 'admin') rideQuery = rideQuery.eq('driver_id', driver.id);
      const { data: dbRides } = await rideQuery.limit(100);
      if (dbRides) setRideHistory(dbRides.map((r: any) => ({
          id: r.id, driverId: r.driver_id, passenger: r.passenger_json, originAddress: r.origin_address,
          destination: r.destination_json, startTime: new Date(r.start_time).getTime(),
          endTime: r.end_time ? new Date(r.end_time).getTime() : undefined,
          distance: r.distance, fare: r.fare, startLocation: r.start_location_json
      })));
    } catch (err) {
      console.error("Erro ao buscar dados do motorista:", err);
    }
  };

  const handleStartRide = async (passenger: Passenger, destination: { address: string, city: string }, startLocation: GeolocationCoordinates | null, fare: number, originAddress?: string) => {
    if (!currentDriver) return;

    try {
        const existingPassenger = savedPassengers.find(p => p.whatsapp === passenger.whatsapp);
        let passengerToUse = existingPassenger || { ...passenger, driverId: currentDriver.id };

        if (!existingPassenger) {
            const { data, error } = await supabase.from('passengers').insert([{
                name: passenger.name, whatsapp: passenger.whatsapp, cpf: passenger.cpf, driver_id: currentDriver.id
            }]).select();
            if (data && !error) passengerToUse = data[0];
        }

        const rideId = crypto.randomUUID();
        const newRide: Ride = {
            id: rideId, passenger: passengerToUse, destination, startTime: Date.now(),
            distance: 0, fare, driverId: currentDriver.id, startLocation, originAddress
        };
        
        setCurrentRide(newRide);
        localStorage.setItem(CURRENT_RIDE_STORAGE_KEY, JSON.stringify(newRide));
        setAppState(AppState.IN_RIDE);

        await supabase.from('rides').insert([{
            id: rideId, 
            driver_id: newRide.driverId, 
            passenger_json: newRide.passenger, 
            destination_json: newRide.destination,
            origin_address: newRide.originAddress, 
            start_time: new Date(newRide.startTime).toISOString(), 
            distance: 0, 
            fare: newRide.fare,
            start_location_json: newRide.startLocation
        }]);
        setRideHistory(prev => [newRide, ...prev]);
    } catch (e) {
        console.error("Erro ao iniciar corrida:", e);
        alert("Erro ao iniciar corrida. Verifique sua conexão.");
    }
  };

  const handleStopRide = async (finalDistance: number) => {
    if (!currentRide) return;
    try {
        const endTime = Date.now();
        const updatedRide = { ...currentRide, endTime, distance: finalDistance };
        setCurrentRide(updatedRide);
        localStorage.setItem(CURRENT_RIDE_STORAGE_KEY, JSON.stringify(updatedRide));
        setRideHistory(prev => prev.map(r => r.id === currentRide.id ? updatedRide : r));
        await supabase.from('rides').update({ 
            end_time: new Date(endTime).toISOString(), 
            distance: finalDistance 
        }).eq('id', currentRide.id);
    } catch (e) {
        console.error("Erro ao finalizar corrida no DB:", e);
    }
  };

  if (isInitializing) return (
    <div className="h-full flex items-center justify-center bg-bg-app">
      <LoadingSpinner />
    </div>
  );

  // Se não estiver logado e houver um contexto de marca, mostra o perfil público para o cliente
  if (!currentDriver && brandedContext) return <PublicProfile driver={brandedContext} />;
  
  // Se não estiver logado, mostra tela de login (com suporte a branding se houver slug)
  if (!currentDriver) return <LoginScreen onLogin={(e, p) => {
      const driver = drivers.find(d => d.email === e && d.password === p);
      if (driver) { 
        setCurrentDriver(driver); 
        localStorage.setItem(CURRENT_DRIVER_STORAGE_KEY, JSON.stringify(driver));
        fetchDriverSpecificData(driver); 
        setAppState(AppState.START); 
        return true; 
      }
      return false;
  }} brandedDriver={brandedContext} />;

  // Fluxo Principal do Aplicativo Logado
  return (
    <>
      {appState === AppState.START && (
        <StartRideForm 
            savedPassengers={savedPassengers} 
            onStartRide={handleStartRide} 
            onNavigateToAdmin={(t) => { setInitialDashboardTab(t); setAppState(AppState.ADMIN_PANEL); }} 
            currentDriver={currentDriver} 
            onLogout={() => { setCurrentDriver(null); localStorage.clear(); window.location.reload(); }} 
        />
      )}
      {appState === AppState.IN_RIDE && currentRide && currentDriver && (
        <InRideDisplay 
            ride={currentRide} 
            driver={currentDriver} 
            onStopRide={handleStopRide} 
            onSendWhatsApp={() => {
              const msg = `Olá ${currentRide.passenger.name}, aqui é o motorista ${currentDriver.name}.\nValor da corrida: *R$ ${currentRide.fare.toFixed(2)}*\nPIX: *${currentDriver.pixKey || currentDriver.email}*\nObrigado pela preferência!`;
              window.open(`https://wa.me/55${currentRide.passenger.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
            }} 
            onComplete={() => { setCurrentRide(null); localStorage.removeItem(CURRENT_RIDE_STORAGE_KEY); setAppState(AppState.START); }} 
            onUpdateDestination={(nd, nf) => {
              setCurrentRide(p => p ? { ...p, destination: nd, fare: nf } : null);
              setRideHistory(p => p.map(r => r.id === currentRide.id ? { ...r, destination: nd, fare: nf } : r));
              supabase.from('rides').update({ destination_json: nd, fare: nf }).eq('id', currentRide.id);
            }} 
            fareRules={fareRules} 
        />
      )}
      {appState === AppState.ADMIN_PANEL && (
        <AdminPanel 
            rideHistory={rideHistory} 
            passengers={savedPassengers} 
            drivers={drivers} 
            fareRules={fareRules} 
            onSaveDrivers={async (l) => { 
                const oldDriverIds = drivers.map(d => d.id);
                const newDriverIds = l.map(d => d.id);
                const deletedIds = oldDriverIds.filter(id => !newDriverIds.includes(id));

                setDrivers(l); 
                
                // 1. Upsert (Adicionar/Atualizar)
                await supabase.from('drivers').upsert(l.map(d => ({ 
                    id: d.id, name: d.name, email: d.email, password: d.password, 
                    car_model: d.carModel, license_plate: d.licensePlate, city: d.city, 
                    role: d.role, pix_key: d.pixKey, photo_url: d.photoUrl, 
                    brand_name: d.brandName, primary_color: d.primaryColor, background_color: d.backgroundColor,
                    custom_logo_url: d.customLogoUrl, slug: d.slug 
                }))); 

                // 2. Delete (Remover os que não estão na lista nova)
                if (deletedIds.length > 0) {
                    console.log("DATABASE: Removendo motoristas:", deletedIds);
                    await supabase.from('drivers').delete().in('id', deletedIds);
                }
                
                if (currentDriver) {
                    const updatedMe = l.find(d => d.id === currentDriver.id);
                    if (updatedMe) {
                        setCurrentDriver(updatedMe);
                        localStorage.setItem(CURRENT_DRIVER_STORAGE_KEY, JSON.stringify(updatedMe));
                    }
                }
            }} 
            onSavePassengers={setSavedPassengers} 
            onSaveFareRules={async (f) => {
                const oldRulesIds = fareRules.map(r => r.id).filter(id => id && !id.includes('fare_'));
                const newRulesIds = f.map(r => r.id).filter(id => id && !id.includes('fare_'));
                const deletedIds = oldRulesIds.filter(id => !newRulesIds.includes(id as string));

                setFareRules(f);

                // 1. Upsert
                await supabase.from('fare_rules').upsert(f.map(rule => ({
                    id: (rule.id && typeof rule.id === 'string' && rule.id.includes('fare_')) ? undefined : rule.id,
                    origin_city: rule.originCity,
                    destination_city: rule.destinationCity,
                    fare: rule.fare
                })));

                // 2. Delete
                if (deletedIds.length > 0) {
                    console.log("DATABASE: Removendo tarifas:", deletedIds);
                    await supabase.from('fare_rules').delete().in('id', deletedIds);
                }
            }} 
            onExitAdminPanel={() => setAppState(AppState.START)} 
            currentDriver={currentDriver} 
            initialTab={initialDashboardTab} 
            onUpdateBranding={async (u) => { 
                try {
                    const upd = { ...currentDriver, ...u }; 
                    const { error } = await supabase.from('drivers').update({ 
                        brand_name: u.brandName, 
                        primary_color: u.primaryColor, 
                        background_color: u.backgroundColor,
                        custom_logo_url: u.customLogoUrl, 
                        slug: u.slug 
                    }).eq('id', currentDriver.id); 

                    if (error) {
                        if (error.code === '23505') return { success: false, error: 'Este link (slug) já está em uso. Escolha outro.' };
                        return { success: false, error: 'Erro ao salvar: ' + error.message };
                    }

                    setCurrentDriver(upd); 
                    localStorage.setItem(CURRENT_DRIVER_STORAGE_KEY, JSON.stringify(upd));
                    return { success: true };
                } catch (e) {
                    return { success: false, error: 'Ocorreu um erro inesperado.' };
                }
            }} 
        />
      )}
    </>
  );
}

export default App;
