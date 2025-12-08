import React, { useState } from 'react';
import type { Passenger } from '../../types';
import { UserIcon, WhatsAppIcon, IdCardIcon } from '../icons';

interface ManagePassengersProps {
  passengers: Passenger[];
  onSave: (passengers: Passenger[]) => void;
}

const ManagePassengers: React.FC<ManagePassengersProps> = ({ passengers, onSave }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Passenger>({ name: '', whatsapp: '', cpf: ''});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.whatsapp) {
      const updatedPassengers = [...passengers, formData];
      onSave(updatedPassengers);
      setFormData({ name: '', whatsapp: '', cpf: ''});
      setIsFormVisible(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.whatsapp.trim();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-white">Passageiros Cadastrados</h3>
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-orange-600 text-sm"
        >
          {isFormVisible ? 'Cancelar' : 'Adicionar Passageiro'}
        </button>
      </div>
      
      {isFormVisible && (
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Nome do Passageiro"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
            </div>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <WhatsAppIcon className="text-lg text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="whatsapp"
                  placeholder="WhatsApp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IdCardIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="cpf"
                  placeholder="CPF (Opcional)"
                  value={formData.cpf || ''}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 pl-10 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
            </div>
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors hover:bg-green-600"
            >
              Salvar Passageiro
            </button>
          </form>
        </div>
      )}

      {passengers.length === 0 ? (
        <p className="text-gray-400 text-center mt-8">Nenhum passageiro salvo ainda.</p>
      ) : (
        <div className="space-y-3">
          {passengers.map((passenger, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg">
              <p className="font-bold text-white">{passenger.name}</p>
              <div className="flex space-x-4 text-sm text-gray-400 mt-1">
                <span><i className="fa-brands fa-whatsapp mr-2 text-green-400"></i>{passenger.whatsapp}</span>
                {passenger.cpf && <span><i className="fa-solid fa-id-card mr-2 text-blue-400"></i>{passenger.cpf}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagePassengers;