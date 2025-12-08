import React, { useState, useMemo, useEffect } from 'react';
import type { Ride, Driver } from '../../types';

// Re-using the StatCard component structure from Dashboard for consistency.
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

interface FinancialsProps {
  rideHistory: Ride[];
  drivers: Driver[];
  currentDriver: Driver | null;
}

const Financials: React.FC<FinancialsProps> = ({ rideHistory, drivers, currentDriver }) => {
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');

    const isAdmin = useMemo(() => {
        // Admin is the first driver in the list.
        if (!currentDriver || drivers.length === 0) return false;
        return currentDriver.id === drivers[0].id;
    }, [currentDriver, drivers]);

    useEffect(() => {
        if (!isAdmin && currentDriver) {
            setSelectedDriverId(currentDriver.id);
        }
        // If the user is an admin, they can choose, so we don't set it automatically.
    }, [isAdmin, currentDriver]);


    const driverFinancials = useMemo(() => {
        if (!selectedDriverId) return null;

        const driverRides = rideHistory.filter(ride => ride.driverId === selectedDriverId);

        if (driverRides.length === 0) {
            return {
                totalRevenue: 0,
                totalRides: 0,
                averageTicket: 0,
                rides: []
            };
        }

        const totalRevenue = driverRides.reduce((sum, ride) => sum + ride.fare, 0);
        const totalRides = driverRides.length;
        const averageTicket = totalRides > 0 ? totalRevenue / totalRides : 0;

        return {
            totalRevenue,
            totalRides,
            averageTicket,
            rides: [...driverRides].reverse() // Show most recent first
        };
    }, [selectedDriverId, rideHistory]);
    
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
    };

    if (!currentDriver) {
        return (
             <div className="text-center py-16 bg-gray-900/50 rounded-lg">
                <i className="fa-solid fa-lock text-4xl text-yellow-400 mb-4"></i>
                <p className="text-gray-300">Acesso negado. Por favor, faça login para ver os dados financeiros.</p>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-2xl font-semibold text-white">
                    {isAdmin ? 'Movimento Financeiro por Motorista' : 'Meu Movimento Financeiro'}
                </h3>
                {isAdmin && (
                    <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full md:w-auto bg-gray-700 p-3 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                    >
                        <option value="">Selecione um motorista</option>
                        {drivers.map(driver => (
                            <option key={driver.id} value={driver.id}>{driver.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {!selectedDriverId ? (
                <div className="text-center py-16 bg-gray-900/50 rounded-lg">
                    <i className="fa-solid fa-hand-pointer text-4xl text-gray-500 mb-4"></i>
                    <p className="text-gray-400">
                        {isAdmin ? 'Selecione um motorista para ver o resumo financeiro.' : 'Carregando seus dados...'}
                    </p>
                </div>
            ) : !driverFinancials || driverFinancials.totalRides === 0 ? (
                <div className="text-center py-16 bg-gray-900/50 rounded-lg">
                    <i className="fa-solid fa-folder-open text-4xl text-gray-500 mb-4"></i>
                    <p className="text-gray-400">Nenhuma corrida encontrada para este motorista.</p>
                </div>
            ) : (
                <>
                    {/* Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard 
                            title="Faturamento Total" 
                            value={`R$${driverFinancials.totalRevenue.toFixed(2)}`}
                            icon="fa-brazilian-real-sign"
                        />
                        <StatCard 
                            title="Total de Corridas" 
                            value={driverFinancials.totalRides.toString()}
                            icon="fa-car"
                        />
                        <StatCard 
                            title="Ticket Médio" 
                            value={`R$${driverFinancials.averageTicket.toFixed(2)}`}
                            icon="fa-receipt"
                        />
                    </div>

                    {/* Ride List Section */}
                    <h4 className="text-xl font-semibold text-white mb-4">Detalhes das Corridas</h4>
                    <div className="space-y-4">
                        {driverFinancials.rides.map((ride, index) => (
                            <div key={index} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white">{ride.passenger.name}</p>
                                    <p className="text-sm text-gray-400">{ride.destination.address}, {ride.destination.city}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(ride.startTime)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-orange-400">R${ride.fare.toFixed(2)}</p>
                                    <p className="text-sm text-gray-400">{ride.distance.toFixed(2)} km</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Financials;
