
import React, { useState } from 'react';
import type { Driver } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { RideCarLogo, WhatsAppIcon } from './icons';
import Map from './Map';
import Footer from './Footer';

interface PublicProfileProps {
  driver: Driver;
}

const PublicProfile: React.FC<PublicProfileProps> = ({ driver }) => {
  const [passengerName, setPassengerName] = useState('');
  const [destination, setDestination] = useState('');
  const { location, error: locationError } = useGeolocation();
  const [mockLocation, setMockLocation] = useState<{latitude: number, longitude: number} | null>(null);

  const effectiveLocation = location || mockLocation;

  const handleRequestRide = () => {
    if (!passengerName.trim()) {
        alert("Por favor, informe seu nome.");
        return;
    }

    const mapsLink = effectiveLocation 
        ? `https://www.google.com/maps?q=${effectiveLocation.latitude},${effectiveLocation.longitude}`
        : "(Localização não compartilhada)";

    const message = `Olá ${driver.name}, meu nome é *${passengerName.trim()}*.\nEstou precisando de uma corrida!\n\n📍 *Destino:* ${destination || 'A combinar'}\n📍 *Minha localização:* ${mapsLink}\n\nVi seu link oficial e gostaria de solicitar agora.`;
    
    // Tenta abrir WhatsApp do motorista (usa PixKey se for número, ou tenta email se não tiver)
    const whatsapp = driver.pixKey?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/55${whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="relative h-screen w-full bg-bg-app overflow-hidden flex flex-col">
       {/* Mapa de Fundo */}
       <div className="absolute inset-0 z-0 opacity-60">
          <Map location={effectiveLocation} isLoading={!effectiveLocation && !locationError} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none"></div>
       </div>

       {/* Header */}
       <div className="relative z-10 p-6 flex flex-col items-center">
            <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-primary/20 shadow-2xl mb-4">
                 <RideCarLogo className="h-10 w-auto" horizontal={true} hideIcon={true} customName={driver.brandName} customLogoUrl={driver.customLogoUrl} />
            </div>
            <p className="text-white font-black uppercase tracking-widest text-[10px] animate-pulse">Solicite agora pelo link oficial</p>
       </div>

       {/* Card do Motorista */}
       <div className="relative z-10 mt-auto w-full max-w-md mx-auto p-4 flex flex-col items-center">
            
            <div className="w-full bg-gray-900/95 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl border border-gray-800 space-y-6">
                
                {/* Info do Motorista */}
                <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden shadow-xl shrink-0">
                        {driver.photoUrl ? (
                            <img src={driver.photoUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800"><i className="fa-solid fa-user text-3xl text-gray-600"></i></div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white italic leading-tight">{driver.name}</h2>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] bg-primary text-white font-black px-2 py-0.5 rounded uppercase">{driver.carModel}</span>
                            <span className="text-[10px] text-gray-400 font-mono border border-gray-700 px-2 py-0.5 rounded uppercase">{driver.licensePlate}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i className="fa-solid fa-user text-primary"></i>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Seu nome" 
                            value={passengerName}
                            onChange={(e) => setPassengerName(e.target.value)}
                            className="bg-gray-800 p-4 pl-12 w-full text-white rounded-2xl border border-gray-700 focus:ring-2 focus:ring-primary outline-none font-bold"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i className="fa-solid fa-location-dot text-red-500"></i>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Para onde você vai? (Opcional)" 
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="bg-gray-800 p-4 pl-12 w-full text-white rounded-2xl border border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                </div>

                {locationError && !mockLocation && (
                    <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-center">
                        <p className="text-[10px] text-red-400 font-bold mb-2 uppercase">GPS Desativado: Compartilhe para facilitar sua coleta</p>
                        <button 
                            onClick={() => setMockLocation({latitude: -21.3217, longitude: -46.7956})}
                            className="text-[9px] text-white underline font-bold"
                        >
                            Ignorar e continuar sem GPS
                        </button>
                    </div>
                )}

                <button 
                    onClick={handleRequestRide}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center space-x-3 transform active:scale-95 transition-all text-lg uppercase tracking-tight"
                >
                    <WhatsAppIcon className="text-2xl" />
                    <span>CHAMAR PELO WHATSAPP</span>
                </button>

                <div className="pt-2 text-center">
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-4">Desenvolvido por RideCar</p>
                    <Footer />
                </div>
            </div>
       </div>
    </div>
  );
};

export default PublicProfile;
