
import React, { useState } from 'react';
import type { Driver } from '../../types';
import { UserIcon, CarIcon, PinIcon } from '../icons';

interface ManageDriversProps {
  drivers: Driver[];
  onSave: (drivers: Driver[]) => void;
}

const ManageDrivers: React.FC<ManageDriversProps> = ({ drivers, onSave }) => {
  // Only show regular drivers, not admins
  const regularDrivers = drivers.filter(d => d.role !== 'admin');
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Driver, 'id' | 'role'>>({ name: '', email: '', password: '', carModel: '', licensePlate: '', city: ''});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingDriverId(null);
    setFormData({ name: '', email: '', password: '', carModel: '', licensePlate: '', city: ''});
  };

  const handleAddNewClick = () => {
    setEditingDriverId(null);
    setFormData({ name: '', email: '', password: '', carModel: '', licensePlate: '', city: ''});
    setIsFormVisible(true);
  };
  
  const handleEditClick = (driver: Driver) => {
    setEditingDriverId(driver.id);
    setFormData({
        name: driver.name,
        email: driver.email,
        password: driver.password || '',
        carModel: driver.carModel,
        licensePlate: driver.licensePlate,
        city: driver.city
    });
    setIsFormVisible(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.password && formData.carModel && formData.licensePlate && formData.city) {
      // Get the list of admins to preserve them
      const admins = drivers.filter(d => d.role === 'admin');
      
      let updatedDriversList;
      if (editingDriverId) {
          // Update existing driver
          updatedDriversList = regularDrivers.map(d => 
            d.id === editingDriverId ? { id: d.id, ...formData, role: 'driver' as const } : d
          );
      } else {
          // Add new driver
          const newDriver: Driver = {
            id: `driver_${Date.now()}`,
            ...formData,
            role: 'driver' // Force role to driver
          };
          updatedDriversList = [...regularDrivers, newDriver];
      }
      
      // Combine regular drivers with admins and save
      onSave([...admins, ...updatedDriversList]);
      handleCancel(); // Reset and close form
    }
  };
  
  const handleDelete = (id: string) => {
    const confirmDelete = window.confirm("Tem certeza que deseja remover este motorista? Esta ação não pode ser desfeita.");
    if (confirmDelete) {
        const updatedDrivers = drivers.filter(d => d.id !== id);
        onSave(updatedDrivers);
    }
  };

  const isFormValid = formData.name.trim() && formData.email.trim() && formData.password?.trim() && formData.carModel.trim() && formData.licensePlate.trim() && formData.city.trim();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-white">Motoristas Cadastrados</h3>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNewClick}
          className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-orange-600 text-sm"
        >
          {isFormVisible ? 'Cancelar' : 'Adicionar Motorista'}
        </button>
      </div>
      
      {isFormVisible && (
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <h4 className="text-lg font-semibold text-white mb-4 text-center">
              {editingDriverId ? 'Editar Motorista' : 'Adicionar Novo Motorista'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Nome do Motorista"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
            </div>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-at text-gray-400"></i>
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email de Login"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
            </div>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-key text-gray-400"></i>
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Senha"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
            </div>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="carModel"
                  placeholder="Modelo do Veículo"
                  value={formData.carModel}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <span className="text-gray-400 font-mono text-sm">#</span>
                </div>
                <input
                  type="text"
                  name="licensePlate"
                  placeholder="Placa"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="city"
                  placeholder="Cidade de Atuação"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
            </div>
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors hover:bg-green-600"
            >
              {editingDriverId ? 'Salvar Alterações' : 'Salvar Motorista'}
            </button>
          </form>
        </div>
      )}

      {regularDrivers.length === 0 ? (
        <p className="text-gray-400 text-center mt-8">Nenhum motorista cadastrado ainda.</p>
      ) : (
        <div className="space-y-3">
          {regularDrivers.map((driver) => (
            <div key={driver.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center flex-wrap gap-2">
              <div>
                <p className="font-bold text-white">{driver.name}</p>
                 <p className="text-sm text-gray-300">{driver.email}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                  <span><i className="fa-solid fa-car mr-2 text-blue-400"></i>{driver.carModel}</span>
                  <span><i className="fa-solid fa-hashtag mr-2 text-gray-500"></i>{driver.licensePlate}</span>
                  <span><i className="fa-solid fa-map-marker-alt mr-2 text-green-400"></i>{driver.city}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                  <button 
                    onClick={() => handleEditClick(driver)}
                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-semibold flex items-center px-3 py-1 bg-gray-600/50 hover:bg-gray-600 rounded-md"
                    aria-label={`Editar ${driver.name}`}
                  >
                    <i className="fa-solid fa-pencil mr-2"></i>
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(driver.id)}
                    className="text-red-400 hover:text-red-300 transition-colors text-sm font-semibold flex items-center px-3 py-1 bg-gray-600/50 hover:bg-gray-600 rounded-md"
                    aria-label={`Remover ${driver.name}`}
                  >
                    <i className="fa-solid fa-trash-can mr-2"></i>
                    Remover
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageDrivers;
