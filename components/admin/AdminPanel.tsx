
import React, { useState } from 'react';
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
}

type AdminTab = 'dashboard' | 'history' | 'passengers' | 'drivers' | 'admins' | 'fares' | 'financials';

const AdminPanel: React.FC<AdminPanelProps> = ({ rideHistory, passengers, drivers, fareRules, onSaveDrivers, onSavePassengers, onSaveFareRules, onExitAdminPanel, currentDriver }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const isAdmin = currentDriver?.role === 'admin';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard rideHistory={rideHistory} />;
      case 'history':
        return <RideHistory rideHistory={rideHistory} />;
      case 'passengers':
        return <ManagePassengers passengers={passengers} onSave={onSavePassengers} />;
      case 'drivers':
        return isAdmin ? <ManageDrivers drivers={drivers} onSave={onSaveDrivers} /> : <div className="text-center text-gray-400 mt-10">Acesso restrito a administradores.</div>;
      case 'admins':
        return isAdmin ? <ManageAdmins drivers={drivers} onSave={onSaveDrivers} currentDriverId={currentDriver?.id || ''} /> : null;
      case 'fares':
        return isAdmin ? <ManageFares fareRules={fareRules} onSave={onSaveFareRules} /> : <div className="text-center text-gray-400 mt-10">Acesso restrito a administradores.</div>;
      case 'financials':
        return <Financials rideHistory={rideHistory} drivers={drivers} currentDriver={currentDriver} />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tab: AdminTab; label: string}> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${
        activeTab === tab 
          ? 'bg-orange-500 text-white' 
          : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-gray-800 h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Painel {isAdmin ? 'Administrativo' : 'do Motorista'}</h2>
        <button
          onClick={onExitAdminPanel}
          className="bg-gray-700 text-gray-300 hover:text-white border border-gray-600 hover:bg-gray-600 font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center"
          title="Ir para tela de corrida"
        >
          <i className="fa-solid fa-car-side mr-2"></i>
          Testar Corrida
        </button>
      </div>
      
      <div className="p-2 border-b border-gray-700">
        <div className="flex space-x-2 bg-gray-900 p-1 rounded-lg overflow-x-auto">
          <TabButton tab="dashboard" label="Dashboard" />
          <TabButton tab="financials" label="Financeiro" />
          <TabButton tab="history" label="Corridas" />
          <TabButton tab="passengers" label="Passageiros" />
          
          {/* Tabs visible only to Admins */}
          {isAdmin && (
            <>
              <TabButton tab="drivers" label="Motoristas" />
              <TabButton tab="admins" label="Admins" />
              <TabButton tab="fares" label="Tarifas" />
            </>
          )}
        </div>
      </div>
      
      <div className="flex-grow p-6 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPanel;
