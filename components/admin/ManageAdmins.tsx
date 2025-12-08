
import React, { useState } from 'react';
import type { Driver } from '../../types';
import { UserIcon } from '../icons';

interface ManageAdminsProps {
  drivers: Driver[];
  onSave: (drivers: Driver[]) => void;
  currentDriverId: string;
}

const ManageAdmins: React.FC<ManageAdminsProps> = ({ drivers, onSave, currentDriverId }) => {
  // Filter specifically for users with role 'admin'
  const admins = drivers.filter(d => d.role === 'admin');
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Driver, 'id' | 'role'>>({ 
    name: '', email: '', password: '', carModel: 'Escritório', licensePlate: 'ADM', city: 'Matriz'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', carModel: 'Escritório', licensePlate: 'ADM', city: 'Matriz' });
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', carModel: 'Escritório', licensePlate: 'ADM', city: 'Matriz' });
    setIsFormVisible(true);
  };

  const handleEditClick = (admin: Driver) => {
    setEditingId(admin.id);
    setFormData({
        name: admin.name,
        email: admin.email,
        password: admin.password || '',
        carModel: admin.carModel,
        licensePlate: admin.licensePlate,
        city: admin.city
    });
    setIsFormVisible(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.password) {
      const nonAdmins = drivers.filter(d => d.role !== 'admin');
      let updatedAdmins;

      if (editingId) {
          // Update existing
          updatedAdmins = admins.map(d => 
            d.id === editingId ? { ...d, ...formData } : d
          );
      } else {
          // Add new admin
          const newAdmin: Driver = {
            id: `admin_${Date.now()}`,
            ...formData,
            role: 'admin'
          };
          updatedAdmins = [...admins, newAdmin];
      }
      
      // Combine back with regular drivers
      onSave([...nonAdmins, ...updatedAdmins]);
      handleCancel();
    }
  };
  
  const handleDelete = (id: string) => {
    if (id === currentDriverId) {
        alert("Você não pode excluir a si mesmo.");
        return;
    }
    const confirmDelete = window.confirm("Tem certeza? Esta ação removerá o acesso administrativo deste usuário.");
    if (confirmDelete) {
        // Remove admin from list
        const updatedDrivers = drivers.filter(d => d.id !== id);
        onSave(updatedDrivers);
    }
  };

  const isFormValid = formData.name.trim() && formData.email.trim() && formData.password?.trim();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-white">Administradores do Sistema</h3>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNewClick}
          className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-orange-600 text-sm"
        >
          {isFormVisible ? 'Cancelar' : 'Adicionar Admin'}
        </button>
      </div>
      
      {isFormVisible && (
        <div className="bg-gray-700 p-4 rounded-lg mb-6 border border-orange-500/30">
          <h4 className="text-lg font-semibold text-white mb-4 text-center">
              {editingId ? 'Editar Administrador' : 'Novo Administrador'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Nome"
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
                  type="text"
                  name="password"
                  placeholder="Senha"
                  value={formData.password}
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
              Salvar Administrador
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center border-l-4 border-orange-500">
            <div>
              <p className="font-bold text-white">{admin.name} {admin.id === currentDriverId && '(Você)'}</p>
               <p className="text-sm text-gray-300">{admin.email}</p>
            </div>
            <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleEditClick(admin)}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-semibold p-2"
                >
                  <i className="fa-solid fa-pencil"></i>
                </button>
                <button 
                  onClick={() => handleDelete(admin.id)}
                  disabled={admin.id === currentDriverId}
                  className={`text-red-400 hover:text-red-300 transition-colors text-sm font-semibold p-2 ${admin.id === currentDriverId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageAdmins;
