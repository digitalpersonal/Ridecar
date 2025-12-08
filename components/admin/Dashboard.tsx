import React from 'react';
import type { Ride } from '../../types';

interface DashboardProps {
  rideHistory: Ride[];
}

const StatCard: React.FC<{title: string, value: string, icon: string}> = ({ title, value, icon }) => (
    <div className="bg-gray-700 p-6 rounded-lg">
        <div className="flex items-center">
            <div className="p-3 bg-orange-500/20 rounded-lg mr-4">
                <i className={`fa-solid ${icon} text-orange-400 text-2xl`}></i>
            </div>
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ rideHistory }) => {
  const totalRevenue = rideHistory.reduce((sum, ride) => sum + ride.fare, 0);
  const totalRides = rideHistory.length;
  const averageTicket = totalRides > 0 ? totalRevenue / totalRides : 0;

  return (
    <div>
      <h3 className="text-2xl font-semibold text-white mb-6">Resumo Financeiro</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            title="Faturamento Total" 
            value={`R$${totalRevenue.toFixed(2)}`}
            icon="fa-brazilian-real-sign"
        />
        <StatCard 
            title="Total de Corridas" 
            value={totalRides.toString()}
            icon="fa-car"
        />
        <StatCard 
            title="Ticket Médio" 
            value={`R$${averageTicket.toFixed(2)}`}
            icon="fa-receipt"
        />
      </div>
    </div>
  );
};

export default Dashboard;