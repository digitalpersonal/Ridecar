
import React, { useState, useEffect } from 'react';
import type { Ride, Passenger, Driver, FareRule } from '../../types';
import Dashboard from './Dashboard';
import RideHistory from './RideHistory';
import ManagePassengers from './ManagePassengers';
import ManageDrivers from './ManageDrivers';
import ManageAdmins from './ManageAdmins';
import ManageFares from './ManageFares';
import Financials from './Financials';

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
}

type AdminTab = 'dashboard' | 'history' | 'passengers' | 'drivers' | 'admins' | 'fares' | 'financials';

const AdminPanel: React.FC<AdminPanelProps> = ({ rideHistory, passengers, drivers, fareRules, onSaveDrivers, onSavePassengers, onSaveFareRules, onExitAdminPanel, currentDriver, initialTab = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  useEffect(() => {
    // Validate if the passed string is a valid tab
    const validTabs: AdminTab[] = ['dashboard', 'history', 'passengers', 'drivers', 'admins', 'fares', 'financials'];
    if (validTabs.includes(initialTab as AdminTab)) {
        setActiveTab(initialTab as AdminTab);
    }
  }, [initialTab]);

  const isAdmin = currentDriver?.role === 'admin';

  // Se um usuário não-admin tentar acessar uma aba restrita, redireciona para dashboard
  useEffect(() => {
    if (!isAdmin && ['drivers', 'admins', 'fares'].includes(activeTab)) {
        setActiveTab('dashboard');
    }
  }, [isAdmin, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard rideHistory={rideHistory} currentDriver={currentDriver} />;
      case 'history':
        return <RideHistory rideHistory={rideHistory} currentDriver={currentDriver} />;
      case 'passengers':
        // Passageiros são compartilhados (base de clientes da empresa), então todos veem
        return <ManagePassengers passengers={passengers} onSave={onSavePassengers} />;
      case 'drivers':
        return isAdmin ? <ManageDrivers drivers={drivers} fareRules={fareRules} onSave={onSaveDrivers} /> : null;
      case 'admins':
        return isAdmin ? <ManageAdmins drivers={drivers} fareRules={fareRules} onSave={onSaveDrivers} currentDriverId={currentDriver?.id || ''} /> : null;
      case 'fares':
        return isAdmin ? <ManageFares fareRules={fareRules} onSave={onSaveFareRules} /> : null;
      case 'financials':
        return <Financials rideHistory={rideHistory} drivers={drivers} currentDriver={currentDriver} />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tab: AdminTab; label: string; icon?: string; restricted?: boolean}> = ({ tab, label, icon, restricted }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex-shrink-0 flex items-center whitespace-nowrap ${
        activeTab === tab 
          ? 'bg-orange-500 text-white shadow-lg' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      } ${restricted ? 'border border-orange-500/30' : ''}`}
    >
      {restricted && <i className="fa-solid fa-lock text-[10px] mr-2 text-orange-400"></i>}
      {icon && <i className={`fa-solid ${icon} mr-2`}></i>}
      {label}
    </button>
  );

  return (
    <div className="bg-gray-800 h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 shadow-md z-10">
        <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isAdmin ? 'bg-orange-600' : 'bg-blue-600'}`}>
                <i className={`fa-solid ${isAdmin ? 'fa-user-shield' : 'fa-id-card'} text-white`}></i>
            </div>
            <div>
                <h2 className="text-lg font-bold text-white leading-tight">
                    {isAdmin ? 'Painel Administrativo' : 'Painel do Motorista'}
                </h2>
                <p className="text-xs text-gray-400">
                    Olá, <span className="text-orange-400">{currentDriver?.name}</span>
                </p>
            </div>
        </div>
        <button
          onClick={onExitAdminPanel}
          className="bg-gray-700 text-gray-300 hover:text-white border border-gray-600 hover:bg-gray-600 font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center"
          title="Voltar para a tela inicial"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Voltar
        </button>
      </div>
      
      <div className="p-3 border-b border-gray-700 bg-gray-800 shadow-inner">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <TabButton tab="dashboard" label="Resumo" icon="fa-chart-pie" />
          <TabButton tab="financials" label="Financeiro" icon="fa-wallet" />
          <TabButton tab="history" label="Minhas Corridas" icon="fa-clock-rotate-left" />
          <TabButton tab="passengers" label="Passageiros" icon="fa-users" />
          
          {/* Tabs visible only to Admins */}
          {isAdmin && (
            <>
              <div className="w-px bg-gray-600 mx-2 h-8 self-center"></div>
              <TabButton tab="drivers" label="Equipe" icon="fa-car-side" restricted />
              <TabButton tab="fares" label="Tarifas" icon="fa-tags" restricted />
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
