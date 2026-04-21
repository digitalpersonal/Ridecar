
import React, { useState } from 'react';
import type { FareRule } from '../../types';

interface ManageFaresProps {
  fareRules: FareRule[];
  onSave: (fareRules: FareRule[]) => void;
}

const ManageFares: React.FC<ManageFaresProps> = ({ fareRules, onSave }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingFareId, setEditingFareId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ originCity: '', destinationCity: '', fare: ''});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingFareId(null);
    setFormData({ originCity: '', destinationCity: '', fare: '' });
  };

  const handleAddNewClick = () => {
    // Fixed typo: setEditingId -> setEditingFareId
    setEditingFareId(null);
    setFormData({ originCity: '', destinationCity: '', fare: '' });
    setIsFormVisible(true);
  };

  const handleEditClick = (rule: FareRule) => {
    setEditingFareId(rule.id);
    setFormData({
      originCity: rule.originCity || '',
      destinationCity: rule.destinationCity,
      fare: String(rule.fare),
    });
    setIsFormVisible(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fareValue = parseFloat(formData.fare);
    if (formData.originCity && formData.destinationCity && !isNaN(fareValue) && fareValue > 0) {
      let updatedFareRules;
      if (editingFareId) {
        updatedFareRules = fareRules.map(rule => 
          rule.id === editingFareId 
            ? { ...rule, originCity: formData.originCity, destinationCity: formData.destinationCity, fare: fareValue } 
            : rule
        );
      } else {
        const newFareRule: FareRule = {
          id: `fare_${Date.now()}`,
          originCity: formData.originCity,
          destinationCity: formData.destinationCity,
          fare: fareValue,
        };
        updatedFareRules = [...fareRules, newFareRule];
      }
      onSave(updatedFareRules);
      handleCancel();
    }
  };
  
  const handleDelete = (id: string) => {
    const confirmDelete = window.confirm("Tem certeza que deseja remover esta tarifa?");
    if (confirmDelete) {
        const updatedFareRules = fareRules.filter(rule => rule.id !== id);
        onSave(updatedFareRules);
    }
  };

  const isFormValid = formData.originCity.trim() && formData.destinationCity.trim() && formData.fare.trim();

  // Agrupa tarifas por origem para melhor visualização
  const groupedFares = fareRules.reduce((acc, rule) => {
    const origin = rule.originCity || 'Sem Origem';
    if (!acc[origin]) acc[origin] = [];
    acc[origin].push(rule);
    return acc;
  }, {} as Record<string, FareRule[]>);

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Tabelas de Tarifas</h3>
            <p className="text-gray-400 text-sm">Gerencie preços específicos por cidade de origem.</p>
        </div>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNewClick}
          className="bg-primary text-white font-black py-3 px-6 rounded-xl transition-all hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center uppercase text-xs tracking-widest"
        >
          <i className={`fa-solid ${isFormVisible ? 'fa-times' : 'fa-plus'} mr-2 text-sm`}></i>
          {isFormVisible ? 'Cancelar' : 'Nova Tarifa'}
        </button>
      </div>
      
      {isFormVisible && (
        <div className="bg-gray-700/50 backdrop-blur-md border border-primary/30 p-6 rounded-2xl mb-8 shadow-2xl animate-slideDown">
          <h4 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-6 text-center">
            {editingFareId ? 'Editar Regra de Preço' : 'Cadastrar Novo Preço'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-black uppercase ml-1">Cidade de Origem</label>
                    <input
                        type="text"
                        name="originCity"
                        placeholder="Ex: Guaxupé"
                        value={formData.originCity}
                        onChange={handleInputChange}
                        className="bg-gray-800 border border-gray-600 p-4 w-full text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-black uppercase ml-1">Cidade de Destino</label>
                    <input
                        type="text"
                        name="destinationCity"
                        placeholder="Ex: Guaranésia"
                        value={formData.destinationCity}
                        onChange={handleInputChange}
                        className="bg-gray-800 border border-gray-600 p-4 w-full text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold"
                        required
                    />
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-black uppercase ml-1">Valor da Corrida (R$)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">R$</span>
                    <input
                        type="number"
                        name="fare"
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                        value={formData.fare}
                        onChange={handleInputChange}
                        className="bg-gray-800 border border-gray-600 p-4 pl-12 w-full text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-primary outline-none text-xl font-black"
                        required
                    />
                </div>
            </div>
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-green-600 text-white font-black py-4 px-4 rounded-xl disabled:bg-gray-800 disabled:text-gray-600 transition-all hover:bg-green-700 shadow-xl active:scale-95 uppercase tracking-widest text-xs"
            >
              {editingFareId ? 'Atualizar Tarifa' : 'Salvar na Tabela'}
            </button>
          </form>
        </div>
      )}

      {fareRules.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-700">
            <i className="fa-solid fa-tags text-5xl text-gray-700 mb-4"></i>
            <p className="text-gray-500 font-bold italic">Nenhuma tarifa cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Fixed: Added explicit type cast to Object.entries to resolve 'unknown' type inference for 'rules' */}
          {(Object.entries(groupedFares) as [string, FareRule[]][]).map(([origin, rules]) => (
            <div key={origin} className="space-y-4">
                <div className="flex items-center space-x-3 border-b border-gray-700 pb-2">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <i className="fa-solid fa-location-dot text-primary"></i>
                    </div>
                    <h4 className="text-white font-black uppercase tracking-widest text-sm">Partindo de: <span className="text-primary italic">{origin}</span></h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rules.map((rule) => (
                        <div key={rule.id} className="bg-gray-800/80 border border-gray-700 p-4 rounded-2xl flex justify-between items-center hover:border-primary/50 transition-all group shadow-lg">
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Destino</p>
                                <p className="font-black text-white italic text-lg">{rule.destinationCity}</p>
                            </div>
                            <div className="flex items-center">
                                <p className="text-xl font-black text-primary italic mr-4">R$ {rule.fare.toFixed(2)}</p>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => handleEditClick(rule)}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <i className="fa-solid fa-pencil text-xs"></i>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(rule.id)}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-red-600 text-white rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <i className="fa-solid fa-trash-can text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageFares;
