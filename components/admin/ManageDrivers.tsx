
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
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error on edit
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingDriverId(null);
    setFormData({ name: '', email: '', password: '', carModel: '', licensePlate: '', city: ''});
    setError(null);
  };

  const handleAddNewClick = () => {
    setEditingDriverId(null);
    setFormData({ name: '', email: '', password: '', carModel: '', licensePlate: '', city: ''});
    setIsFormVisible(true);
    setError(null);
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
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.password && formData.carModel && formData.licensePlate && formData.city) {
      
      // Validação de E-mail Duplicado
      const emailExists = drivers.some(d => 
          d.email.toLowerCase() === formData.email.toLowerCase() && d.id !== editingDriverId
      );

      if (emailExists) {
          setError("Este endereço de e-mail já está em uso por outro motorista.");
          return;
      }

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
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h3 className="text-2xl font-semibold text-white">Gestão de Motoristas</h3>
            <p className="text-gray-400 text-sm">Área restrita: cadastre e gerencie a equipe.</p>
        </div>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNewClick}
          className="bg-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-orange-600 text-sm shadow-lg flex items-center"
        >
          <i className={`fa-solid ${isFormVisible ? 'fa-times' : 'fa-plus'} mr-2`}></i>
          {isFormVisible ? 'Cancelar' : 'Cadastrar Motorista'}
        </button>
      </div>
      
      {isFormVisible && (
        <div className="bg-gray-700/80 border border-orange-500/30 p-6 rounded-xl mb-8 shadow-xl">
          <h4 className="text-lg font-bold text-white mb-6 flex items-center">
              <span className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <i className={`fa-solid ${editingDriverId ? 'fa-pencil' : 'fa-user-plus'} text-sm`}></i>
              </span>
              {editingDriverId ? 'Editar Dados do Motorista' : 'Novo Cadastro de Motorista'}
          </h4>
          
          {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-2"></i>
                  {error}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                    type="text"
                    name="name"
                    placeholder="Nome Completo"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-gray-800 border border-gray-600 p-3 pl-10 w-full text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
                    placeholder="Email de Acesso"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-gray-800 border border-gray-600 p-3 pl-10 w-full text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                    />
                </div>
             </div>

             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-key text-gray-400"></i>
                </div>
                <input
                  type="text"
                  name="password"
                  placeholder="Senha de Acesso"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-gray-800 border border-gray-600 p-3 pl-10 w-full text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono"
                  required
                />
            </div>

            <div className="border-t border-gray-600 my-4 pt-4">
                <p className="text-xs text-orange-400 uppercase tracking-wider mb-3 font-bold">Informações do Veículo</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CarIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                        type="text"
                        name="carModel"
                        placeholder="Modelo (Ex: Toyota Corolla)"
                        value={formData.carModel}
                        onChange={handleInputChange}
                        className="bg-gray-800 border border-gray-600 p-3 pl-10 w-full text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        required
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-mono text-sm font-bold">ABC</span>
                        </div>
                        <input
                        type="text"
                        name="licensePlate"
                        placeholder="Placa"
                        value={formData.licensePlate}
                        onChange={handleInputChange}
                        className="bg-gray-800 border border-gray-600 p-3 pl-10 w-full text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all uppercase"
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
                        placeholder="Cidade Base"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="bg-gray-800 border border-gray-600 p-3 pl-10 w-full text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        required
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end pt-2">
                <button
                type="submit"
                disabled={!isFormValid}
                className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-green-700 shadow-lg transform active:scale-95"
                >
                {editingDriverId ? 'Salvar Alterações' : 'Cadastrar Motorista'}
                </button>
            </div>
          </form>
        </div>
      )}

      {regularDrivers.length === 0 ? (
        <div className="text-center py-12 bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
            <i className="fa-solid fa-users-slash text-4xl text-gray-500 mb-3"></i>
            <p className="text-gray-400">Nenhum motorista cadastrado na equipe.</p>
            <button onClick={handleAddNewClick} className="text-orange-400 hover:text-orange-300 text-sm mt-2 underline">
                Cadastrar o primeiro
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularDrivers.map((driver) => (
            <div key={driver.id} className="bg-gray-800 border border-gray-700 p-5 rounded-xl flex flex-col justify-between hover:border-gray-500 transition-colors shadow-lg">
              <div>
                <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-white text-lg">{driver.name}</h5>
                    <span className="bg-gray-700 text-xs px-2 py-1 rounded text-gray-300 border border-gray-600">Motorista</span>
                </div>
                 <p className="text-sm text-gray-400 mb-4 flex items-center">
                    <i className="fa-solid fa-envelope mr-2 text-gray-500"></i>
                    {driver.email}
                 </p>
                 
                 <div className="bg-gray-900/50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Veículo</span>
                        <span className="text-gray-300">{driver.carModel}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Placa</span>
                        <span className="text-gray-300 font-mono uppercase">{driver.licensePlate}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Cidade</span>
                        <span className="text-gray-300">{driver.city}</span>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-700">
                  <button 
                    onClick={() => handleEditClick(driver)}
                    className="flex-1 text-blue-400 hover:text-white hover:bg-blue-600 transition-all text-sm font-semibold py-2 rounded-lg bg-blue-900/20 border border-blue-900/50"
                  >
                    <i className="fa-solid fa-pencil mr-1"></i> Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(driver.id)}
                    className="flex-1 text-red-400 hover:text-white hover:bg-red-600 transition-all text-sm font-semibold py-2 rounded-lg bg-red-900/20 border border-red-900/50"
                  >
                    <i className="fa-solid fa-trash-can mr-1"></i> Remover
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
