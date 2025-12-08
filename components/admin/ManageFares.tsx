import React, { useState } from 'react';
import type { FareRule } from '../../types';

interface ManageFaresProps {
  fareRules: FareRule[];
  onSave: (fareRules: FareRule[]) => void;
}

const ManageFares: React.FC<ManageFaresProps> = ({ fareRules, onSave }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingFareId, setEditingFareId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ destinationCity: '', fare: ''});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingFareId(null);
    setFormData({ destinationCity: '', fare: '' });
  };

  const handleAddNewClick = () => {
    setEditingFareId(null);
    setFormData({ destinationCity: '', fare: '' });
    setIsFormVisible(true);
  };

  const handleEditClick = (rule: FareRule) => {
    setEditingFareId(rule.id);
    setFormData({
      destinationCity: rule.destinationCity,
      fare: String(rule.fare), // Form input needs a string
    });
    setIsFormVisible(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fareValue = parseFloat(formData.fare);
    if (formData.destinationCity && !isNaN(fareValue) && fareValue > 0) {
      let updatedFareRules;
      if (editingFareId) {
        // Editing existing fare
        updatedFareRules = fareRules.map(rule => 
          rule.id === editingFareId 
            ? { ...rule, destinationCity: formData.destinationCity, fare: fareValue } 
            : rule
        );
      } else {
        // Adding new fare
        const newFareRule: FareRule = {
          id: `fare_${Date.now()}`,
          destinationCity: formData.destinationCity,
          fare: fareValue,
        };
        updatedFareRules = [...fareRules, newFareRule];
      }
      onSave(updatedFareRules);
      handleCancel(); // Reset and close form
    }
  };
  
  const handleDelete = (id: string) => {
    const confirmDelete = window.confirm("Tem certeza que deseja remover esta tarifa?");
    if (confirmDelete) {
        const updatedFareRules = fareRules.filter(rule => rule.id !== id);
        onSave(updatedFareRules);
    }
  };

  const isFormValid = formData.destinationCity.trim() && formData.fare.trim();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-white">Tarifas Cadastradas</h3>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNewClick}
          className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:bg-orange-600 text-sm"
        >
          {isFormVisible ? 'Cancelar' : 'Adicionar Tarifa'}
        </button>
      </div>
      
      {isFormVisible && (
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
           <h4 className="text-lg font-semibold text-white mb-4 text-center">
            {editingFareId ? 'Editar Tarifa' : 'Adicionar Nova Tarifa'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="relative">
                <input
                  type="text"
                  name="destinationCity"
                  placeholder="Cidade de Destino"
                  value={formData.destinationCity}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
            </div>
            <div className="relative">
                <input
                  type="number"
                  name="fare"
                  placeholder="Valor (R$)"
                  step="0.01"
                  min="0"
                  value={formData.fare}
                  onChange={handleInputChange}
                  className="bg-gray-600 p-3 w-full text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
            </div>
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors hover:bg-green-600"
            >
              {editingFareId ? 'Salvar Alterações' : 'Salvar Tarifa'}
            </button>
          </form>
        </div>
      )}

      {fareRules.length === 0 ? (
        <p className="text-gray-400 text-center mt-8">Nenhuma tarifa cadastrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {fareRules.map((rule) => (
            <div key={rule.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center flex-wrap gap-2">
              <div>
                <p className="font-semibold text-white">{rule.destinationCity}</p>
                <p className="text-xs text-gray-400">Tarifa fixa</p>
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-lg font-bold text-orange-400 mr-4">R${rule.fare.toFixed(2)}</p>
                 <button 
                  onClick={() => handleEditClick(rule)}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-semibold flex items-center px-3 py-1 bg-gray-600/50 hover:bg-gray-600 rounded-md"
                  aria-label={`Editar tarifa para ${rule.destinationCity}`}
                >
                  <i className="fa-solid fa-pencil mr-2"></i>
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(rule.id)}
                  className="text-red-400 hover:text-red-300 transition-colors text-sm font-semibold flex items-center px-3 py-1 bg-gray-600/50 hover:bg-gray-600 rounded-md"
                  aria-label={`Remover tarifa para ${rule.destinationCity}`}
                >
                  <i className="fa-solid fa-trash-can mr-2"></i>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageFares;