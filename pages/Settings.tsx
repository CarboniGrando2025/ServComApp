import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Save } from 'lucide-react';

export const Settings = () => {
  const { settings, updateSettings } = useAppStore();
  const [companyForm, setCompanyForm] = useState(settings);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Configurações Gerais</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-2xl">
        <h2 className="text-lg font-bold mb-4">Dados da Empresa</h2>
        <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome Fantasia</label>
              <input 
                className="w-full border p-2 rounded" 
                value={companyForm.name} 
                onChange={e => setCompanyForm({...companyForm, name: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">CNPJ</label>
                    <input 
                        className="w-full border p-2 rounded" 
                        value={companyForm.cnpj} 
                        onChange={e => setCompanyForm({...companyForm, cnpj: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Regime Tributário</label>
                    <input 
                        className="w-full border p-2 rounded" 
                        value={companyForm.taxRegime} 
                        onChange={e => setCompanyForm({...companyForm, taxRegime: e.target.value})} 
                    />
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Endereço Completo</label>
              <input 
                className="w-full border p-2 rounded" 
                value={companyForm.address} 
                onChange={e => setCompanyForm({...companyForm, address: e.target.value})} 
              />
            </div>
            
            <div className="pt-4">
                <button 
                    onClick={() => {
                        updateSettings(companyForm);
                        alert('Configurações salvas com sucesso!');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                    <Save size={18}/> Salvar Alterações
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};