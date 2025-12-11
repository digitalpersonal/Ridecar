
import React from 'react';
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
  const isAdmin = currentDriver?.role === 'admin';

  // Se for admin, vê tudo. Se for motorista, vê só as suas.
  const relevantRides = isAdmin 
    ? rideHistory 
    : rideHistory.filter(r => r.driverId === currentDriver?.id);

  const totalRevenue = relevantRides.reduce((sum, ride) => sum + ride.fare, 0);
  const totalRides = relevantRides.length;
  const totalDistance = relevantRides.reduce((sum, ride) => sum + ride.distance, 0);
  const averageTicket = totalRides > 0 ? totalRevenue / totalRides : 0;

  return (
    <div>
      <h3 className="text-2xl font-semibold text-white mb-2">
        {isAdmin ? 'Visão Geral da Empresa' : 'Seu Resumo'}
      </h3>
      <p className="text-gray-400 mb-6 text-sm">
        {isAdmin 
            ? 'Métricas consolidadas de todos os motoristas.' 
            : 'Acompanhe o desempenho das suas corridas.'}
      </p>

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

      {/* Gráfico ou Lista Recente Simples */}
      <div className="mt-8 bg-gray-700/50 p-6 rounded-xl border border-gray-600">
        <h4 className="text-lg font-bold text-white mb-4">Últimas Atividades</h4>
        {relevantRides.length === 0 ? (
             <p className="text-gray-400 italic">Nenhuma corrida registrada ainda.</p>
        ) : (
            <div className="space-y-3">
                {relevantRides.slice(0, 5).map((ride, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-gray-600 pb-2 last:border-0 last:pb-0">
                        <div>
                            <p className="text-white font-medium">{ride.passenger.name}</p>
                            <p className="text-xs text-gray-400">{new Date(ride.startTime).toLocaleDateString('pt-BR')} • {ride.destination.city}</p>
                        </div>
                        <span className="text-green-400 font-bold text-sm">+ R$ {ride.fare.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
