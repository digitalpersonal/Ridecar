
import React, { useState } from 'react';
import type { Driver } from '../types';
import { RideCarLogo } from './icons';
import Footer from './Footer';

interface LoginScreenProps {
    onLogin: (email: string, password: string) => boolean;
    brandedDriver?: Driver | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, brandedDriver }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(true); // Sempre mostra o formulário para agilizar o acesso do motorista

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const success = onLogin(email, password);
        if (!success) setError('Acesso negado. Verifique os dados.');
    };

    const LegalNotice = () => (
        <div className="mt-8 p-6 bg-black/60 backdrop-blur-xl border border-primary/30 rounded-[24px] text-left max-w-sm w-full shadow-2xl animate-fadeIn ring-1 ring-white/10">
            <h4 className="text-primary font-black text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center">
                <i className="fa-solid fa-scale-balanced mr-3 text-sm"></i>
                Aviso Legal ao Motorista
            </h4>
            <div className="space-y-3">
                <p className="text-[10px] text-white leading-relaxed font-bold opacity-90">
                    Este sistema está em conformidade com a <span className="text-primary">Constituição Federal</span> e com a <span className="text-primary font-black underline decoration-2 underline-offset-2">Lei Federal nº 12.587/2012</span> (Política Nacional de Mobilidade Urbana).
                </p>
                <p className="text-[10px] text-gray-300 leading-relaxed">
                    A legislação federal permite que o motorista exerça a atividade como <span className="text-white font-bold">MEI</span> e utilize aplicativo próprio ou sistema próprio para registro das corridas.
                </p>
                <p className="text-[10px] text-white/80 leading-relaxed italic border-l-2 border-primary pl-3">
                    O uso deste sistema garante transparência, segurança e respaldo jurídico durante toda a operação.
                </p>
            </div>
        </div>
    );

    return (
        <div 
            className="h-full flex flex-col bg-bg-app overflow-y-auto bg-cover bg-center relative"
            style={{ 
                backgroundImage: brandedDriver?.photoUrl 
                    ? `url('${brandedDriver.photoUrl}')` 
                    : "url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1080&auto=format&fit=crop')" 
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/95 z-0"></div>

            <div className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 py-12 text-center">
                
                {/* Logo e Nome da Marca - Ícone removido conforme solicitado */}
                <div className="mb-10">
                     <RideCarLogo 
                        customName={brandedDriver?.brandName} 
                        customLogoUrl={brandedDriver?.customLogoUrl}
                        textSize="text-6xl md:text-7xl"
                        className="animate-fadeIn"
                        hideIcon={true}
                     />
                     {brandedDriver && (
                         <div className="mt-4 inline-block px-3 py-1 bg-primary/20 border border-primary/30 rounded-full">
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Portal do Motorista Profissional</p>
                         </div>
                     )}
                </div>

                <div className="w-full max-w-sm mx-auto animate-fadeIn flex flex-col items-center">
                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i className="fa-solid fa-envelope text-gray-500"></i>
                            </div>
                            <input
                                type="email"
                                placeholder="Seu E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-gray-900/80 p-4 pl-12 w-full text-white placeholder-gray-500 rounded-2xl focus:ring-2 focus:ring-primary border border-gray-800 backdrop-blur-md transition-all font-bold"
                                required
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i className="fa-solid fa-lock text-gray-500"></i>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Sua Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-gray-900/80 p-4 pl-12 pr-12 w-full text-white placeholder-gray-500 rounded-2xl focus:ring-2 focus:ring-primary border border-gray-800 backdrop-blur-md transition-all font-bold"
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500"
                            >
                                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        
                        {error && <p className="text-red-400 text-xs font-bold bg-red-950/30 p-2 rounded-lg">{error}</p>}
                        
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-hover text-white font-black py-5 rounded-2xl shadow-xl transform active:scale-95 transition-all uppercase tracking-tight"
                        >
                            Acessar Agora
                        </button>
                    </form>

                    <LegalNotice />
                </div>
            </div>
            
            <div className="relative z-10 w-full mt-auto">
                <Footer />
            </div>
        </div>
    );
};

export default LoginScreen;
