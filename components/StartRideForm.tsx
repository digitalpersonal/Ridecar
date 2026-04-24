
import React, { useState, useEffect, useRef } from 'react';
import type { Passenger, AddressSuggestion, Driver, GeolocationCoordinates, FareRule } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useGeolocation } from '../hooks/useGeolocation';
import { geocodeAddress, getAddressFromCoordinates } from '../services/geocodingService';
import { parseRideInfoFromText } from '../services/geminiService';
import { RideCarLogo, UserIcon, WhatsAppIcon } from './icons';
import Map from './Map';
import Footer from './Footer';

interface StartRideFormProps {
  savedPassengers: Passenger[];
  onStartRide: (passenger: Passenger, destination: { address: string, city: string }, startLocation: GeolocationCoordinates | null, fare: number, originAddress?: string) => void;
  onNavigateToAdmin: (tab: string) => void;
  currentDriver: Driver;
  onLogout: () => void;
}

const StartRideForm: React.FC<StartRideFormProps> = ({ savedPassengers, onStartRide, onNavigateToAdmin, currentDriver, onLogout }) => {
  const [passenger, setPassenger] = useState<Passenger>({ name: '', whatsapp: '', cpf: '' });
  const [originAddressText, setOriginAddressText] = useState('Buscando localização...');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationNumber, setDestinationNumber] = useState(''); 
  const [destinationCity, setDestinationCity] = useState('');
  const [customFare, setCustomFare] = useState('');
  const [destSuggestions, setDestSuggestions] = useState<AddressSuggestion[]>([]);
  const [passengerSuggestions, setPassengerSuggestions] = useState<Passenger[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const numberInputRef = useRef<HTMLInputElement>(null);
  const [mockLocation, setMockLocation] = useState<GeolocationCoordinates | null>(null);
  const { location, accuracy, isLoading: isLocationLoading, error: locationError } = useGeolocation();
  
  const effectiveLocation = location || mockLocation;
  const debouncedDestination = useDebounce(destinationAddress, 500);
  const debouncedPassengerName = useDebounce(passenger.name, 300);
  
  const normalize = (s: any) => {
    if (typeof s !== 'string') return "";
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const accumulatedTextRef = useRef<string>('');
    const isRecordingRef = useRef(false);

    const [activeVoiceContext, setActiveVoiceContext] = useState<'passenger' | 'route' | null>(null);

    const handleVoiceRecord = (context: 'passenger' | 'route') => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        console.log("BRAIN: Inicializando reconhecimento de voz...", { supported: !!SpeechRecognition });

        if (!SpeechRecognition) {
            alert("Seu navegador não suporta reconhecimento de voz (SpeechRecognition). No iPhone, use o Safari.");
            return;
        }

        if (isRecordingRef.current) {
            if (activeVoiceContext !== context) return; // Prevent clicking one while other is recording
            if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
            recognitionRef.current?.stop();
            setVoiceStatus("Processando áudio...");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'pt-BR';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = false; // Mudar para false para capturar 'uma frase' e parar rápido

        accumulatedTextRef.current = '';

        recognition.onstart = () => {
            isRecordingRef.current = true;
            setIsRecording(true);
            setActiveVoiceContext(context);
            setVoiceStatus("Ouvindo... fale agora");
        };

        const processFinalTranscription = async (text: string, context: 'passenger' | 'route' | 'all') => {
            const finalQuery = text.trim();
            console.log(`BRAIN: Analisando transcrição [${context}]:`, finalQuery);
            
            if (!finalQuery || finalQuery.length < 2) {
                setVoiceStatus(null);
                isRecordingRef.current = false;
                setIsRecording(false);
                setActiveVoiceContext(null);
                return;
            }
            
            setVoiceStatus("Identificando dados...");
            const parsed = await parseRideInfoFromText(finalQuery, context);
            
            if (parsed) {
                console.log("BRAIN: Dados extraídos:", parsed);
                setVoiceStatus("Dados aplicados!");
                
                const isValid = (val: any) => 
                    val !== null && 
                    val !== undefined && 
                    val !== "null" && 
                    val !== "NULL" && 
                    val !== "" &&
                    String(val).toLowerCase().trim() !== "desconhecido" &&
                    String(val).toLowerCase().trim() !== "não informado" &&
                    String(val).toLowerCase().trim() !== "n/a";

                // Atualização do Nome e WhatsApp (Contexto Passageiro ou Geral)
                if (context === 'passenger' || context === 'all') {
                    if (isValid(parsed.passengerName)) setPassenger(prev => ({ ...prev, name: String(parsed.passengerName) }));
                    
                    if (isValid(parsed.whatsapp)) {
                        let cleanWa = String(parsed.whatsapp).replace(/\D/g, '');
                        if (cleanWa.length > 11) {
                            const possibleMatch = cleanWa.match(/(\d{8,11})$/);
                            if (possibleMatch) cleanWa = possibleMatch[1];
                            else cleanWa = cleanWa.substring(0, 11);
                        }
                        if (cleanWa.startsWith('55') && cleanWa.length > 11) cleanWa = cleanWa.substring(2);
                        if (cleanWa.length >= 8 && cleanWa.length <= 11) {
                            setPassenger(prev => ({ ...prev, whatsapp: cleanWa }));
                        }
                    }
                }

                // Atualização do Destino e Cidade (Contexto Rota ou Geral)
                if (context === 'route' || context === 'all') {
                    if (isValid(parsed.destinationAddress)) setDestinationAddress(String(parsed.destinationAddress));
                    if (isValid(parsed.destinationNumber)) setDestinationNumber(String(parsed.destinationNumber));
                    if (isValid(parsed.destinationCity)) setDestinationCity(String(parsed.destinationCity));
                    
                    if (isValid(parsed.fare)) {
                        let cleanFare = String(parsed.fare).replace(/[^\d.,]/g, '').replace(',', '.');
                        if (cleanFare && !isNaN(parseFloat(cleanFare))) {
                            setCustomFare(cleanFare);
                        }
                    }
                }
                setTimeout(() => setVoiceStatus(null), 2000);
            } else {
                setVoiceStatus("Não entendi o áudio.");
                setTimeout(() => setVoiceStatus(null), 3000);
            }
            isRecordingRef.current = false;
            setIsRecording(false);
            setActiveVoiceContext(null);
        };

        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';
            
            for (let i = 0; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                } else {
                    interim = transcript;
                }
            }

            const totalText = (final + interim).trim();
            accumulatedTextRef.current = totalText;
            
            setVoiceStatus("Captado: " + (totalText || "fale..."));

            if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
            voiceTimeoutRef.current = setTimeout(() => {
                if (isRecordingRef.current) {
                    recognition.stop();
                }
            }, 1300); // 1.3s de silêncio para cortar rápido
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
            const errorMsg = event.error === 'not-allowed' ? "Microfone bloqueado pelo navegador. Verifique as permissões de HTTPS." :
                            event.error === 'service-not-allowed' ? "Serviço de voz não disponível." :
                            event.error === 'network' ? "Erro de conexão/internet." : event.error;
            
            if (event.error !== 'no-speech') {
                setVoiceStatus("Erro: " + errorMsg);
                alert("Erro no Microfone: " + errorMsg + "\nCertifique-se que o site usa HTTPS e o acesso ao microfone foi permitido.");
                setTimeout(() => setVoiceStatus(null), 5000);
            }
            isRecordingRef.current = false;
            setIsRecording(false);
            if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
        };

        recognition.onend = () => {
            if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
            // Agora usamos a Ref para saber se devemos processar, evitando problemas de closure
            if (isRecordingRef.current) {
                processFinalTranscription(accumulatedTextRef.current, context);
            }
        };

        recognition.start();
    };

    useEffect(() => {
        return () => {
            if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    useEffect(() => {
        let retryTimer: any;
        let isMounted = true;

    const fetchAddress = async () => {
      if (effectiveLocation) {
        try {
          const res = await getAddressFromCoordinates(effectiveLocation.latitude, effectiveLocation.longitude);
          if (isMounted) {
            if (res) {
              const fullAddress = res.city ? `${res.address}, ${res.city}` : res.address;
              setOriginAddressText(fullAddress);
            } else {
              // Se falhou, tenta novamente em 5 segundos se o texto ainda for o padrão
              if (originAddressText === 'Buscando localização...' || originAddressText === 'Localização Atual') {
                retryTimer = setTimeout(fetchAddress, 5000);
              }
              setOriginAddressText("Localização Atual");
            }
          }
        } catch (e) {
          if (isMounted) {
            retryTimer = setTimeout(fetchAddress, 8000);
            setOriginAddressText("Localização Atual");
          }
        }
      }
    };

    fetchAddress();

    return () => {
      isMounted = false;
      clearTimeout(retryTimer);
    };
  }, [effectiveLocation?.latitude, effectiveLocation?.longitude]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedDestination.length > 2 && destinationCity) {
        const results = await geocodeAddress(debouncedDestination, destinationCity);
        setDestSuggestions(results);
      } else { setDestSuggestions([]); }
    };
    fetchSuggestions();
  }, [debouncedDestination, destinationCity]);

  useEffect(() => {
      if (debouncedPassengerName.length > 1) {
          const matches = savedPassengers.filter(p => p.name.toLowerCase().includes(debouncedPassengerName.toLowerCase()));
          if (matches.length > 0 && matches[0].name !== debouncedPassengerName) setPassengerSuggestions(matches);
          else setPassengerSuggestions([]);
      } else { setPassengerSuggestions([]); }
  }, [debouncedPassengerName, savedPassengers]);

  const handleSuggestionSelect = (description: string) => {
      setDestinationAddress(description);
      setDestSuggestions([]);
      setTimeout(() => numberInputRef.current?.focus(), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalStreet = destinationAddress.trim() || "Centro";
    const fullAddress = destinationNumber.trim() ? `${finalStreet}, ${destinationNumber}` : finalStreet;
    const finalFare = parseFloat(customFare.replace(',', '.'));

    if (passenger.name && passenger.whatsapp && destinationCity && effectiveLocation && finalFare > 0) {
      onStartRide(passenger, { address: fullAddress, city: destinationCity }, effectiveLocation, finalFare, originAddressText);
    }
  };

  const isFormValid = passenger.name.trim() && passenger.whatsapp.trim() && destinationCity.trim() && !!customFare && !!effectiveLocation;

  const Sidebar = () => (
      <>
        <div className={`fixed inset-0 bg-black/60 z-[2001] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />
        <div className={`fixed inset-y-0 left-0 w-72 bg-gray-900 z-[2002] transform transition-transform duration-300 shadow-2xl ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-950">
                <RideCarLogo className="h-8 w-auto" horizontal={true} customName={currentDriver.brandName} customLogoUrl={currentDriver.customLogoUrl} />
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white p-2"><i className="fa-solid fa-times text-2xl"></i></button>
            </div>
            <div className="p-6">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gray-800 rounded-full mb-3 border-2 border-primary overflow-hidden shadow-xl">
                         {currentDriver.photoUrl ? <img src={currentDriver.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><i className="fa-solid fa-user text-3xl"></i></div>}
                    </div>
                    <p className="text-white font-bold text-lg leading-tight">{currentDriver.name}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Status Ativo</p>
                </div>
                <nav className="space-y-2">
                    <button onClick={() => setIsMenuOpen(false)} className="w-full text-left px-5 py-4 rounded-2xl bg-primary text-white font-bold flex items-center shadow-lg shadow-primary/20">
                        <i className="fa-solid fa-car-side w-8 text-xl"></i> Nova Corrida
                    </button>
                    <button onClick={() => onNavigateToAdmin('history')} className="w-full text-left px-5 py-4 rounded-2xl hover:bg-gray-800 text-gray-300 transition-colors flex items-center">
                        <i className="fa-solid fa-clock-rotate-left w-8 text-xl"></i> Histórico
                    </button>
                    <button onClick={() => onNavigateToAdmin('financials')} className="w-full text-left px-5 py-4 rounded-2xl hover:bg-gray-800 text-gray-300 transition-colors flex items-center">
                        <i className="fa-solid fa-wallet w-8 text-xl"></i> Financeiro
                    </button>
                </nav>
            </div>
            <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
                <button onClick={onLogout} className="w-full flex items-center justify-center px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-xl transition-colors font-bold uppercase text-xs tracking-widest">
                    <i className="fa-solid fa-power-off mr-2"></i> Encerrar Sessão
                </button>
            </div>
        </div>
      </>
  );

  return (
    <div className="relative h-screen w-full bg-gray-950 overflow-hidden flex flex-col">
       <Sidebar />
       <div className="absolute inset-x-0 top-0 z-0 w-full aspect-square">
          <Map location={effectiveLocation} isLoading={isLocationLoading && !mockLocation} />
       </div>

       <div className="relative z-10 p-4 flex justify-between items-center pointer-events-none">
            <button onClick={() => setIsMenuOpen(true)} className="pointer-events-auto bg-gray-900/90 backdrop-blur-md text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border border-gray-700 active:scale-95 transition-all">
                <i className="fa-solid fa-bars text-xl"></i>
            </button>
            <div className="bg-gray-900/90 backdrop-blur-md rounded-full px-5 py-2 border border-primary/20 shadow-2xl pointer-events-auto">
                 <RideCarLogo className="h-8 w-auto" horizontal={true} customName={currentDriver.brandName} customLogoUrl={currentDriver.customLogoUrl || currentDriver.photoUrl} />
            </div>
            <div className="w-12 h-12 bg-gray-900/90 backdrop-blur-md rounded-full border border-gray-700 overflow-hidden shadow-2xl pointer-events-auto">
                 {currentDriver.photoUrl ? <img src={currentDriver.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><i className="fa-solid fa-user"></i></div>}
            </div>
       </div>

       <div className="relative z-10 mt-auto w-full max-w-2xl mx-auto flex flex-col items-center max-h-[92vh]">
            <form onSubmit={handleSubmit} className="w-full bg-gray-900/95 backdrop-blur-2xl rounded-t-[40px] p-6 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] border-t border-white/5 space-y-5 overflow-y-auto animate-slideUp">
                <div className="w-16 h-1.5 bg-gray-800 rounded-full mx-auto -mt-2 mb-4 shrink-0 shadow-inner"></div>

                {/* DADOS PASSAGEIRO */}
                <div className="bg-gray-800/20 p-5 rounded-3xl border border-white/5 space-y-4 relative">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <p className="text-[12px] text-gray-300 font-black uppercase tracking-widest">Passageiro</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Diga o Nome e o Celular</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => handleVoiceRecord('passenger')}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:scale-105 active:scale-95 shrink-0 ${isRecording && activeVoiceContext === 'passenger' ? 'bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-primary/20 hover:bg-primary border-2 border-primary/50 text-primary hover:text-gray-900'}`}
                        >
                            <i className={`fa-solid ${isRecording && activeVoiceContext === 'passenger' ? 'fa-stop text-white' : 'fa-microphone'} text-xl`}></i>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-primary" />
                            </div>
                            <input type="text" placeholder="Nome do passageiro" value={passenger.name} onChange={(e) => setPassenger(prev => ({...prev, name: e.target.value}))} className="bg-gray-800/50 p-4 pl-12 w-full text-white rounded-2xl focus:ring-2 focus:ring-primary border border-gray-700/50 font-bold placeholder-gray-500 transition-all" />
                            {passengerSuggestions.length > 0 && (
                                <ul className="absolute bottom-full mb-2 z-30 w-full bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden max-h-48 overflow-y-auto">
                                    {passengerSuggestions.map((p, i) => (
                                        <li key={i} onClick={() => {setPassenger(p); setPassengerSuggestions([]);}} className="px-5 py-4 text-white cursor-pointer hover:bg-primary/20 border-b border-gray-700 last:border-0 flex justify-between items-center transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{p.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono tracking-wider">{p.whatsapp}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <WhatsAppIcon className="text-xl text-green-500" />
                            </div>
                            <input type="tel" placeholder="WhatsApp" value={passenger.whatsapp} onChange={(e) => setPassenger(prev => ({ ...prev, whatsapp: e.target.value }))} className="bg-gray-800/50 p-4 pl-12 w-full text-white rounded-2xl focus:ring-2 focus:ring-primary border border-gray-700/50 placeholder-gray-500 font-bold" />
                        </div>
                    </div>
                </div>

                {/* CONTAINER DE ROTA COM LINHA VERTICAL */}
                <div className="bg-black/40 p-5 rounded-[32px] border border-gray-800 space-y-6 relative">
                    
                    {/* Linha Vertical Uber-Style */}
                    <div className="absolute left-[31px] top-[45px] bottom-[115px] w-0.5 bg-gradient-to-b from-green-500 via-gray-700 to-red-500 z-0"></div>

                    {/* ORIGEM (Automática via GPS / Editável) */}
                    <div className="flex items-start space-x-4 relative z-10">
                        <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] mt-4 shrink-0 border-2 border-white"></div>
                        <div className="flex-grow">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] mb-0.5 ml-1">Local de Partida</p>
                             <input 
                                type="text" 
                                value={originAddressText} 
                                onChange={(e) => setOriginAddressText(e.target.value)}
                                className="bg-transparent text-white text-sm font-black w-full border-none focus:ring-0 p-0 placeholder-gray-600 tracking-tight"
                                placeholder="Informe o ponto de partida"
                             />
                             {locationError ? (
                                 <div className="flex flex-col mt-1">
                                    <p className="text-[10px] text-red-500 font-bold uppercase">
                                        <i className="fa-solid fa-triangle-exclamation mr-1"></i> {locationError}
                                    </p>
                                    <button type="button" onClick={() => window.location.reload()} className="text-[9px] text-primary font-black uppercase mt-1 underline decoration-primary/30">Tentar Novamente</button>
                                 </div>
                             ) : (isLocationLoading || originAddressText === 'Buscando localização...') ? (
                                 <div className="flex items-center mt-1">
                                     <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                                     <span className="text-[10px] text-gray-500 font-bold animate-pulse uppercase">Sinal GPS aguardando...</span>
                                 </div>
                             ) : effectiveLocation && accuracy && accuracy > 40 ? (
                                 <div className="flex items-center mt-1">
                                     <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping mr-2"></div>
                                     <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider">Ajuste fino GPS (Margem: {Math.round(accuracy)}m)</span>
                                 </div>
                             ) : effectiveLocation && accuracy && accuracy <= 40 ? (
                                <div className="flex items-center mt-1">
                                     <i className="fa-solid fa-location-crosshairs text-[10px] text-green-500 mr-1"></i>
                                     <span className="text-[9px] text-green-500/70 font-bold uppercase tracking-wider">GPS Alta Precisão</span>
                                 </div>
                             ) : null}
                        </div>
                    </div>

                    {/* DESTINO */}
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                                <div className="w-3.5 h-3.5 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.6)] mr-3 shrink-0 border-2 border-white rounded-full"></div>
                                <div className="flex flex-col">
                                    <p className="text-[12px] text-gray-300 font-black uppercase tracking-widest">Destino da Viagem</p>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Diga Cidade e Local</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 shrink-0">
                                <button 
                                    type="button"
                                    onClick={() => handleVoiceRecord('route')}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:scale-105 active:scale-95 shrink-0 ${isRecording && activeVoiceContext === 'route' ? 'bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-primary/20 hover:bg-primary border-2 border-primary/50 text-primary hover:text-gray-900'}`}
                                >
                                    <i className={`fa-solid ${isRecording && activeVoiceContext === 'route' ? 'fa-stop text-white' : 'fa-microphone'} text-xl`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 pl-[31px]">
                            <div className="relative">
                                <input type="text" placeholder="Cidade de destino" value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} className="bg-gray-800/80 p-4 w-full text-white rounded-2xl border border-gray-700 font-bold focus:ring-2 focus:ring-primary transition-all" />
                            </div>

                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <input type="text" placeholder="Rua, Hospital, Banco..." value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} className="bg-gray-800/80 p-4 w-full text-white rounded-2xl border border-gray-700 font-bold focus:ring-2 focus:ring-primary transition-all" />
                                    {destSuggestions.length > 0 && (
                                        <ul className="absolute bottom-full mb-2 z-30 w-full bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                                            {destSuggestions.map((s, i) => (
                                                <li key={i} onClick={() => handleSuggestionSelect(s.description)} className="px-5 py-3 text-sm text-white cursor-pointer hover:bg-primary/20 border-b border-gray-700 last:border-0">{s.description}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <input ref={numberInputRef} type="text" placeholder="Nº" value={destinationNumber} onChange={(e) => setDestinationNumber(e.target.value)} className="w-20 bg-gray-800/80 p-4 text-center text-white rounded-2xl border border-gray-700 font-black focus:ring-2 focus:ring-primary transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="ml-[31px] flex items-center bg-gray-900/80 rounded-2xl p-2 border border-green-500/30">
                        <span className="pl-4 font-black text-green-500">R$</span>
                        <input type="number" placeholder="0,00" value={customFare} onChange={(e) => setCustomFare(e.target.value)} className="bg-transparent p-3 w-full text-white text-3xl font-black focus:outline-none placeholder-gray-700" />
                    </div>
                </div>
                
                <button type="submit" disabled={!isFormValid} className="w-full bg-primary hover:bg-primary-hover text-white font-black py-5 rounded-[20px] disabled:bg-gray-800 disabled:text-gray-600 shadow-2xl transform active:scale-[0.98] transition-all text-xl uppercase italic tracking-tighter">
                    {effectiveLocation ? 'Iniciar Corrida Agora' : 'Aguardando GPS...'}
                </button>
                <div className="pb-2"><Footer /></div>
            </form>
       </div>
    </div>
  );
};

export default StartRideForm;
