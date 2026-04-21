
import React, { useState, useEffect } from 'react';
import type { Ride, Passenger, Driver, FareRule } from '../../types';
import Dashboard from './Dashboard';
import RideHistory from './RideHistory';
import ManagePassengers from './ManagePassengers';
import ManageDrivers from './ManageDrivers';
import ManageAdmins from './ManageAdmins';
import ManageFares from './ManageFares';
import Financials from './Financials';
import ManageBranding from './ManageBranding';

interface AdminPanelProps {
  rideHistory: Ride[];
  passengers: Passenger[];
  drivers: Driver[];
  fareRules: FareRule[];
  onSaveDrivers: (drivers: Driver[]) => void;
  onSavePassengers: (passengers: Passenger[]) => void;
  onSaveFareRules: (fareRules: FareRule[]) => void;
  onExitAdminPanel: () => void;
  currentDriver: Driver | null;
  initialTab?: string;
  onUpdateBranding: (updates: Partial<Driver>) => Promise<{ success: boolean; error?: string }>;
}

type AdminTab = 'dashboard' | 'history' | 'passengers' | 'drivers' | 'admins' | 'fares' | 'financials' | 'branding';

const AdminPanel: React.FC<AdminPanelProps> = ({ 
    rideHistory, passengers, drivers, fareRules, onSaveDrivers, 
    onSavePassengers, onSaveFareRules, onExitAdminPanel, 
    currentDriver, initialTab = 'dashboard', onUpdateBranding 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  useEffect(() => {
    const validTabs: AdminTab[] = ['dashboard', 'history', 'passengers', 'drivers', 'admins', 'fares', 'financials', 'branding'];
    if (validTabs.includes(initialTab as AdminTab)) setActiveTab(initialTab as AdminTab);
  }, [initialTab]);

  const isAdmin = currentDriver?.role === 'admin';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard rideHistory={rideHistory} currentDriver={currentDriver} />;
      case 'history': return <RideHistory rideHistory={rideHistory} currentDriver={currentDriver} drivers={drivers} />;
      case 'passengers': return <ManagePassengers passengers={passengers} onSave={onSavePassengers} />;
      case 'branding': return currentDriver ? <ManageBranding currentDriver={currentDriver} onUpdate={onUpdateBranding} /> : null;
      case 'drivers': return isAdmin ? <ManageDrivers drivers={drivers} onSave={onSaveDrivers} /> : null;
      case 'admins': return isAdmin ? <ManageAdmins drivers={drivers} onSave={onSaveDrivers} currentDriverId={currentDriver?.id || ''} /> : null;
      case 'financials': return <Financials rideHistory={rideHistory} drivers={drivers} currentDriver={currentDriver} />;
      default: return null;
    }
  };

  const TabButton: React.FC<{tab: AdminTab; label: string; icon?: string; restricted?: boolean}> = ({ tab, label, icon, restricted }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex-shrink-0 flex items-center whitespace-nowrap ${
        activeTab === tab 
          ? 'bg-primary text-white shadow-lg' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {restricted && <i className="fa-solid fa-lock text-[10px] mr-2 text-orange-400"></i>}
      {icon && <i className={`fa-solid ${icon} mr-2`}></i>}
      {label}
    </button>
  );

  return (
    <div className="bg-gray-800 h-full flex flex-col">
      {/* Cabeçalho do Painel */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 shadow-md z-[1001]">
        <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-primary/20 border border-primary/40`}>
                <i className={`fa-solid ${isAdmin ? 'fa-user-shield' : 'fa-star'} text-primary`}></i>
            </div>
            <div>
                <h2 className="text-lg font-black text-white italic leading-tight uppercase tracking-tight">
                    {isAdmin ? 'Painel Administrativo' : (currentDriver?.brandName || 'Meu App Profissional')}
                </h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Acessado por: <span className="text-gray-300">{currentDriver?.name}</span></p>
            </div>
        </div>
        <button onClick={onExitAdminPanel} className="bg-gray-800 text-gray-400 hover:text-white border border-gray-700 font-black py-2 px-6 rounded-xl text-[10px] transition-all uppercase tracking-widest flex items-center active:scale-95 shadow-lg">
          <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
        </button>
      </div>
      
      <div className="p-3 border-b border-gray-700 bg-gray-800 shadow-inner">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <TabButton tab="dashboard" label="Resumo" icon="fa-chart-pie" />
          <TabButton tab="financials" label="Financeiro" icon="fa-wallet" />
          <TabButton tab="history" label="Minhas Corridas" icon="fa-clock-rotate-left" />
          <TabButton tab="passengers" label="Meus Clientes" icon="fa-users" />
          <TabButton tab="branding" label="Personalizar App" icon="fa-palette" />
          
          {isAdmin && (
            <>
              <div className="w-px bg-gray-600 mx-2 h-8 self-center"></div>
              <TabButton tab="drivers" label="Equipe" icon="fa-car-side" restricted />
              <TabButton tab="admins" label="Acessos" icon="fa-shield-halved" restricted />
            </>
          )}
        </div>
      </div>
      
      <div className="flex-grow p-6 overflow-y-auto bg-gray-800">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPanel;
