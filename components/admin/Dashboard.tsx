
import React, { useState } from 'react';
import type { Ride, Driver } from '../../types';

interface DashboardProps {
  rideHistory: Ride[];
  currentDriver: Driver | null;
}

const StatCard: React.FC<{title: string, value: string, icon: string, color?: string}> = ({ title, value, icon, color = 'orange' }) => (
    <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 shadow-lg">
        <div className="flex items-center">
            <div className={`p-3 bg-${color}-500/20 rounded-lg mr-4`}>
                <i className={`fa-solid ${icon} text-${color}-400 text-2xl`}></i>
            </div>
            <div>
                <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ rideHistory, currentDriver }) => {
  const [copied, setCopied] = useState(false);
  const isAdmin = currentDriver?.role === 'admin';

  // Se for admin, vê tudo. Se for motorista, vê só as suas.
  const relevantRides = isAdmin 
    ? rideHistory 
    : rideHistory.filter(r => r.driverId === currentDriver?.id);

  const totalRevenue = relevantRides.reduce((sum, ride) => sum + ride.fare, 0);
  const totalRides = relevantRides.length;
  const totalDistance = relevantRides.reduce((sum, ride) => sum + ride.distance, 0);
  const averageTicket = totalRides > 0 ? totalRevenue / totalRides : 0;

  // Gerar Link de Divulgação
  const baseUrl = window.location.origin;
  const publicUrl = `${baseUrl}/${currentDriver?.slug || 'driver-' + currentDriver?.id.substring(0, 5)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentDriver?.brandName || 'Meu App de Transporte',
          text: `Reserve sua corrida comigo pelo meu aplicativo oficial!`,
          url: publicUrl,
        });
      } catch (err) {
        console.log('Erro ao compartilhar', err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6">
        <div>
            <h3 className="text-2xl font-semibold text-white mb-1">
                {isAdmin ? 'Visão Geral da Empresa' : 'Seu Resumo Profissional'}
            </h3>
            <p className="text-gray-400 text-sm">
                {isAdmin 
                    ? 'Métricas consolidadas de todos os motoristas.' 
                    : 'Acompanhe o desempenho do seu negócio.'}
            </p>
        </div>
      </div>

      {/* NOVO: Cartão de Divulgação (Link do Motorista) */}
      {!isAdmin && (
        <div className="mb-8 bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-primary/40 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <i className="fa-solid fa-share-nodes text-8xl text-primary"></i>
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center mb-4">
                    <span className="flex h-3 w-3 relative mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                    <h4 className="text-xs font-black text-primary uppercase tracking-widest">Link de Divulgação Ativo</h4>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-full flex-grow bg-black/40 border border-gray-600 rounded-xl px-4 py-3 flex items-center justify-between group-hover:border-primary/50 transition-colors">
                        <code className="text-gray-300 font-mono text-sm break-all">
                            {publicUrl}
                        </code>
                        <button 
                            onClick={handleCopyLink}
                            className={`ml-3 p-2 rounded-lg transition-all ${copied ? 'text-green-400 bg-green-400/10' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                        >
                            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                        </button>
                    </div>

                    <button 
                        onClick={handleShare}
                        className="w-full md:w-auto bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center shadow-lg transition-all transform active:scale-95"
                    >
                        <i className="fa-solid fa-share-nodes mr-2"></i>
                        Compartilhar
                    </button>
                </div>
                
                <p className="mt-4 text-[10px] text-gray-500 italic">
                    * Divulgue este link para que seus clientes possam solicitar corridas diretamente com você.
                </p>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Faturamento" 
            value={`R$${totalRevenue.toFixed(2)}`}
            icon="fa-brazilian-real-sign"
            color="green"
        />
        <StatCard 
            title="Corridas Realizadas" 
            value={totalRides.toString()}
            icon="fa-car"
            color="orange"
        />
        <StatCard 
            title="Ticket Médio" 
            value={`R$${averageTicket.toFixed(2)}`}
            icon="fa-receipt"
            color="blue"
        />
        <StatCard 
            title="Km Percorridos" 
            value={`${totalDistance.toFixed(1)} km`}
            icon="fa-road"
            color="gray"
        />
      </div>

      <div className="mt-8 bg-gray-700/50 p-6 rounded-xl border border-gray-600">
        <h4 className="text-lg font-bold text-white mb-4">Atividades Recentes</h4>
        {relevantRides.length === 0 ? (
             <div className="text-center py-6">
                 <p className="text-gray-400 italic">Nenhuma corrida registrada ainda.</p>
             </div>
        ) : (
            <div className="space-y-3">
                {relevantRides.slice(0, 5).map((ride, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-gray-600 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-3 border border-gray-700">
                                <i className="fa-solid fa-user text-gray-500 text-sm"></i>
                            </div>
                            <div>
                                <p className="text-white font-medium">{ride.passenger.name}</p>
                                <p className="text-xs text-gray-500">{new Date(ride.startTime).toLocaleDateString('pt-BR')} • {ride.destination.city}</p>
                            </div>
                        </div>
                        <span className="text-green-400 font-black text-sm">R$ {ride.fare.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
