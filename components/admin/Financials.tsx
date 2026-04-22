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
        return currentDriver?.role === 'admin';
    }, [currentDriver]);

    useEffect(() => {
        if (!isAdmin && currentDriver) {
            setSelectedDriverId(currentDriver.id);
        } else if (isAdmin) {
            setSelectedDriverId('all'); // Admins começam vendo tudo por padrão
        }
    }, [isAdmin, currentDriver]);


    const driverFinancials = useMemo(() => {
        const finishedRides = rideHistory.filter(ride => !!ride.endTime);
        const ridesToProcess = selectedDriverId === 'all' 
            ? finishedRides 
            : finishedRides.filter(ride => ride.driverId === selectedDriverId);

        if (ridesToProcess.length === 0) {
            return {
                totalRevenue: 0,
                totalRides: 0,
                averageTicket: 0,
                totalDistance: 0,
                rides: []
            };
        }

        const totalRevenue = ridesToProcess.reduce((sum, ride) => sum + ride.fare, 0);
        const totalDistance = ridesToProcess.reduce((sum, ride) => sum + ride.distance, 0);
        const totalRides = ridesToProcess.length;
        const averageTicket = totalRides > 0 ? totalRevenue / totalRides : 0;

        return {
            totalRevenue,
            totalDistance,
            totalRides,
            averageTicket,
            rides: [...ridesToProcess].sort((a, b) => b.startTime - a.startTime)
        };
    }, [selectedDriverId, rideHistory]);
    
    const handlePrint = () => {
        window.print();
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
    };

    const selectedDriverName = useMemo(() => {
        if (selectedDriverId === 'all') return 'Todos os Motoristas';
        const driver = drivers.find(d => d.id === selectedDriverId);
        return driver ? driver.name : '';
    }, [selectedDriverId, drivers]);

    if (!currentDriver) {
        return (
             <div className="text-center py-16 bg-gray-900/50 rounded-lg">
                <i className="fa-solid fa-lock text-4xl text-yellow-400 mb-4"></i>
                <p className="text-gray-300">Acesso negado. Por favor, faça login para ver os dados financeiros.</p>
            </div>
        )
    }

    return (
        <div className="printable-report">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">
                    {isAdmin ? 'Movimento Financeiro' : 'Meu Movimento Financeiro'}
                </h3>
                <div className="flex gap-2 w-full md:w-auto">
                    {isAdmin && (
                        <select
                            value={selectedDriverId}
                            onChange={(e) => setSelectedDriverId(e.target.value)}
                            className="bg-gray-700 p-3 text-white rounded-xl border border-gray-600 focus:ring-2 focus:ring-primary font-bold text-sm"
                        >
                            <option value="all">Todos os Motoristas</option>
                            {drivers.map(driver => (
                                <option key={driver.id} value={driver.id}>{driver.name}</option>
                            ))}
                        </select>
                    )}
                    <button 
                        onClick={handlePrint}
                        className="bg-primary hover:bg-primary-hover text-white font-black py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center shrink-0"
                    >
                        <i className="fa-solid fa-print mr-2"></i> PDF
                    </button>
                </div>
            </div>

            {/* Cabeçalho de Impressão */}
            <div className="print-only mb-8 border-b-2 border-gray-200 pb-4">
                <h1 className="text-3xl font-black uppercase italic">Relatório Financeiro - RideCar</h1>
                <p className="text-gray-600 font-bold uppercase tracking-widest">Motorista: {selectedDriverName}</p>
                <p className="text-gray-500 text-xs">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
            </div>

            {!selectedDriverId && isAdmin ? (
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                         <StatCard 
                            title="Km Rodados" 
                            value={`${driverFinancials.totalDistance.toFixed(1)} km`}
                            icon="fa-route"
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
