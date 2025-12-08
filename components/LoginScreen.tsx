import React, { useState } from 'react';
import { RideCarLogo } from './icons';

interface LoginScreenProps {
    onLogin: (email: string, password: string) => boolean;
    onNavigateToAdmin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToAdmin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const success = onLogin(email, password);
        if (!success) {
            setError('Email ou senha inválidos.');
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <RideCarLogo className="h-20 w-auto text-orange-500 mb-6" />
            <h1 className="text-3xl font-bold text-white mb-2">Login do Motorista</h1>
            <p className="text-lg text-gray-300 mb-8">Acesse sua conta para iniciar.</p>

            <div className="w-full max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <i className="fa-solid fa-at text-gray-400"></i>
                         </div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-gray-700/80 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
                            required
                        />
                    </div>
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <i className="fa-solid fa-key text-gray-400"></i>
                         </div>
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-gray-700/80 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
                            required
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-red-400 bg-red-900/50 p-2 rounded-md">{error}</p>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-orange-500 shadow-lg shadow-orange-500/30"
                    >
                        Entrar
                    </button>
                </form>

                <div className="mt-8">
                    <button
                        onClick={onNavigateToAdmin}
                        className="bg-gray-600/50 text-orange-400 font-semibold py-3 px-6 rounded-lg hover:bg-gray-500/50 transition-colors backdrop-blur-sm"
                    >
                        Painel Administrativo
                    </button>
                </div>

                <div className="mt-6 p-4 bg-gray-800/80 rounded-lg text-sm text-gray-400 border border-gray-700 backdrop-blur-sm">
                    <p className="font-semibold text-gray-300 mb-2">Credenciais de Demonstração:</p>
                    <div className="flex justify-between items-center mb-1">
                        <span>Email:</span>
                        <span className="font-mono text-orange-400 bg-gray-900 px-2 py-0.5 rounded select-all">carlos@ridecar.com</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Senha:</span>
                        <span className="font-mono text-orange-400 bg-gray-900 px-2 py-0.5 rounded select-all">123</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;