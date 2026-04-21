
import React, { useState } from 'react';
import type { Driver, FareRule } from '../../types';
import { UserIcon, CarIcon, PinIcon } from '../icons';

interface ManageDriversProps {
  drivers: Driver[];
  fareRules: FareRule[];
  onSave: (drivers: Driver[]) => void;
}

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const ManageDrivers: React.FC<ManageDriversProps> = ({ drivers, fareRules, onSave }) => {
  const regularDrivers = drivers.filter(d => d.role !== 'admin');
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Driver, 'id' | 'role'>>({ 
    name: '', email: '', password: '', carModel: '', licensePlate: '', city: '', pixKey: '', photoUrl: '', brandName: '', customLogoUrl: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          setError("A imagem é muito grande. Escolha uma foto com menos de 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingDriverId(null);
    setFormData({ name: '', email: '', password: '', carModel: '', licensePlate: '', city: '', pixKey: '', photoUrl: '', brandName: '', customLogoUrl: '' });
    setError(null);
  };

  const handleAddNewClick = () => {
    setEditingDriverId(null);
    const defaultCity = fareRules.find(r => r.destinationCity === 'Guaranésia')?.destinationCity || (fareRules.length > 0 ? fareRules[0].destinationCity : '');
    setFormData({ name: '', email: '', password: '', carModel: '', licensePlate: '', city: defaultCity, pixKey: '', photoUrl: '', brandName: '', customLogoUrl: '' });
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
        city: driver.city,
        pixKey: driver.pixKey || '',
        photoUrl: driver.photoUrl || '',
        brandName: driver.brandName || '',
        customLogoUrl: driver.customLogoUrl || ''
    });
    setIsFormVisible(true);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.password && formData.carModel && formData.licensePlate && formData.city) {
      const emailExists = drivers.some(d => d.email.toLowerCase() === formData.email.toLowerCase() && d.id !== editingDriverId);
      if (emailExists) {
          setError("Este endereço de e-mail já está em uso por outro motorista.");
          return;
      }
      const admins = drivers.filter(d => d.role === 'admin');
      let updatedDriversList;
      if (editingDriverId) {
          updatedDriversList = regularDrivers.map(d => d.id === editingDriverId ? { ...d, ...formData, role: 'driver' as const } : d);
      } else {
          const newDriver: Driver = { id: generateUUID(), ...formData, role: 'driver' };
          updatedDriversList = [...regularDrivers, newDriver];
      }
      onSave([...admins, ...updatedDriversList]);
      handleCancel();
    }
  };
  
  const handleDelete = (id: string) => {
    const confirmDelete = window.confirm("Tem certeza que deseja remover este motorista?");
    if (confirmDelete) onSave(drivers.filter(d => d.id !== id));
  };

  const isFormValid = formData.name.trim() && formData.email.trim() && formData.password?.trim();
  const availableCities = [...fareRules].sort((a, b) => a.destinationCity.localeCompare(b.destinationCity));

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h3 className="text-2xl font-semibold text-white">Gestão de Equipe</h3>
            <p className="text-gray-400 text-sm">Cadastre e gerencie motoristas e suas marcas.</p>
        </div>
        <button onClick={isFormVisible ? handleCancel : handleAddNewClick} className="bg-primary text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-primary-hover text-sm shadow-lg flex items-center">
          <i className={`fa-solid ${isFormVisible ? 'fa-times' : 'fa-plus'} mr-2`}></i>
          {isFormVisible ? 'Cancelar' : 'Cadastrar Motorista'}
        </button>
      </div>
      
      {isFormVisible && (
        <div className="bg-gray-700/80 border border-primary/30 p-6 rounded-xl mb-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
             {/* Foto de Perfil */}
             <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer w-24 h-24">
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-600 group-hover:border-primary transition-colors bg-gray-800 flex items-center justify-center">
                        {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" /> : <i className="fa-solid fa-camera text-2xl text-gray-500"></i>}
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 uppercase font-black">Foto do Motorista</p>
             </div>

             {/* Identidade Visual */}
             <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-600 space-y-4">
                <p className="text-[10px] text-primary font-black uppercase tracking-widest border-b border-gray-700 pb-2">Identidade do App (White Label)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <i className="fa-solid fa-star absolute left-4 top-1/2 -translate-y-1/2 text-orange-400"></i>
                        <input type="text" name="brandName" placeholder="Nome Fantasia (Ex: João Vip)" value={formData.brandName} onChange={handleInputChange} className="bg-gray-900 border border-gray-700 p-3 pl-11 w-full text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="relative">
                        <i className="fa-solid fa-link absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                        <input type="text" name="customLogoUrl" placeholder="URL da Logo (Opcional)" value={formData.customLogoUrl} onChange={handleInputChange} className="bg-gray-900 border border-gray-700 p-3 pl-11 w-full text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary" />
                    </div>
                </div>
             </div>

             {/* Dados Pessoais */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="name" placeholder="Nome Completo" value={formData.name} onChange={handleInputChange} className="bg-gray-800 border border-gray-600 p-3 w-full text-white rounded-lg" required />
                <input type="email" name="email" placeholder="Email de Acesso" value={formData.email} onChange={handleInputChange} className="bg-gray-800 border border-gray-600 p-3 w-full text-white rounded-lg" required />
                <input type="text" name="password" placeholder="Senha" value={formData.password} onChange={handleInputChange} className="bg-gray-800 border border-gray-600 p-3 w-full text-white rounded-lg font-mono" required />
                <input type="text" name="pixKey" placeholder="Chave PIX" value={formData.pixKey} onChange={handleInputChange} className="bg-gray-800 border border-gray-600 p-3 w-full text-white rounded-lg" />
             </div>

             {/* Veículo */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" name="carModel" placeholder="Carro" value={formData.carModel} onChange={handleInputChange} className="bg-gray-800 border border-gray-600 p-3 w-full text-white rounded-lg" required />
                <input type="text" name="licensePlate" placeholder="Placa" value={formData.licensePlate} onChange={handleInputChange} className="bg-gray-800 border border-gray-600 p-3 w-full text-white rounded-lg uppercase" required />
                <select name="city" value={formData.city} onChange={handleInputChange} className="bg-gray-800 border border-gray-600 p-3 w-full text-white rounded-lg" required>
                    <option value="">Cidade...</option>
                    {availableCities.map(r => <option key={r.id} value={r.destinationCity}>{r.destinationCity}</option>)}
                </select>
             </div>
            
            <div className="flex justify-end pt-4">
                <button type="submit" disabled={!isFormValid} className="bg-green-600 text-white font-black py-4 px-10 rounded-xl hover:bg-green-700 shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest">
                {editingDriverId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regularDrivers.map(driver => (
          <div key={driver.id} className="bg-gray-800 border border-gray-700 p-5 rounded-2xl shadow-xl hover:border-primary/50 transition-all group">
            <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-primary overflow-hidden shadow-lg shrink-0">
                    {driver.photoUrl ? <img src={driver.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-900"><i className="fa-solid fa-user text-xl text-gray-700"></i></div>}
                </div>
                <div className="overflow-hidden">
                    <h5 className="font-black text-white truncate text-lg">{driver.name}</h5>
                    <p className="text-[10px] text-primary font-black uppercase tracking-tighter truncate">{driver.brandName || 'RideCar Standard'}</p>
                </div>
            </div>
            
            <div className="bg-gray-950/50 rounded-xl p-3 space-y-2 text-xs mb-4 border border-gray-700">
                <div className="flex justify-between"><span className="text-gray-500">Carro:</span><span className="text-gray-300 font-bold">{driver.carModel}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Placa:</span><span className="text-gray-300 font-mono font-bold">{driver.licensePlate}</span></div>
            </div>

            <div className="flex gap-2">
                <button onClick={() => handleEditClick(driver)} className="flex-1 bg-gray-700 hover:bg-blue-600 text-white p-2 rounded-lg text-[10px] font-black uppercase transition-colors"><i className="fa-solid fa-pencil mr-1"></i> Editar</button>
                <button onClick={() => handleDelete(driver.id)} className="flex-1 bg-gray-700 hover:bg-red-600 text-white p-2 rounded-lg text-[10px] font-black uppercase transition-colors"><i className="fa-solid fa-trash-can mr-1"></i> Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageDrivers;
