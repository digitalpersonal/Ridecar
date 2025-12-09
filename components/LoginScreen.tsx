
import React, { useState, useRef } from 'react';
import { RideCarLogo } from './icons';
import Footer from './Footer';

interface LoginScreenProps {
    onLogin: (email: string, password: string) => boolean;
    onNavigateToAdmin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // Secret Demo Logic
    const [secretCount, setSecretCount] = useState(0);
    const secretTimeoutRef = useRef<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const success = onLogin(email, password);
        if (!success) {
            setError('Email ou senha inválidos.');
        }
    };

    const fillDemoDriver = () => {
        setEmail('carlos@ridecar.com');
        setPassword('123');
        setError(null); // Clear errors
    };

    const handleLogoClick = () => {
        if (secretTimeoutRef.current) {
            clearTimeout(secretTimeoutRef.current);
        }

        const newCount = secretCount + 1;
        setSecretCount(newCount);

        if (newCount >= 5) {
            fillDemoDriver();
            setSecretCount(0);
            return;
        }

        // Reset count if no click for 1 second
        secretTimeoutRef.current = window.setTimeout(() => {
            setSecretCount(0);
        }, 1000);
    };

    return (
        <div 
            className="h-full flex flex-col bg-gray-900 overflow-y-auto bg-cover bg-center relative"
            style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1080&auto=format&fit=crop')" 
            }}
        >
            {/* Camada escura BEM LEVE para permitir ver as pessoas felizes no fundo */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90 z-0"></div>

            {/* Conteúdo principal */}
            <div className="relative z-10 flex-grow flex flex-col items-center justify-start pt-10 px-6 text-center">
                
                {/* Logo Centralizada com Segredo */}
                <button 
                    onClick={handleLogoClick} 
                    className="mb-4 focus:outline-none transform active:scale-95 transition-transform"
                    title="Toque 5 vezes para demo"
                >
                     {/* Reduzido para w-32 (aprox 128px) */}
                     <RideCarLogo className="w-32 h-32" />
                </button>
                
                <h2 className="text-xl font-medium text-gray-200 mb-6 max-w-xs drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    Ferramenta de gestão para motoristas profissionais.
                </h2>

                <div className="w-full max-w-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                               <i className="fa-solid fa-at text-gray-300"></i>
                             </div>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-black/60 p-4 pl-10 w-full text-white placeholder-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-500/50 backdrop-blur-md transition-all font-medium"
                                required
                            />
                        </div>
                        <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                               <i className="fa-solid fa-key text-gray-300"></i>
                             </div>
                            <input
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black/60 p-4 pl-10 w-full text-white placeholder-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-500/50 backdrop-blur-md transition-all font-medium"
                                required
                            />
                        </div>
                        {error && (
                            <div className="flex items-center space-x-2 text-sm text-red-200 bg-red-900/80 p-3 rounded-lg border border-red-500/50 backdrop-blur-sm">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <span>{error}</span>
                            </div>
                        )}
                        
                        {/* Botão Centralizado */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                className="mx-auto block w-auto bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-3 px-12 rounded-full transition-all hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-orange-500 shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5 border border-orange-400/20"
                            >
                                Entrar no Sistema
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            {/* Rodapé */}
            <div className="relative z-10 w-full mt-auto">
                <Footer />
            </div>
        </div>
    );
};

export default LoginScreen;
