import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Save } from 'lucide-react';

export const Settings = () => {
  const { settings, updateSettings } = useAppStore();
  const [companyForm, setCompanyForm] = useState(settings);

  const handleAddressChange = (field: keyof typeof settings.address, value: string) => {
    setCompanyForm({
      ...companyForm,
      address: {
        ...companyForm.address,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Configurações Gerais</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-4xl">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">Dados Cadastrais e Fiscais (Emissor)</h2>
        
        <div className="space-y-6">
            
            {/* BASIC INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Razão Social</label>
                <input 
                  className="w-full border p-2 rounded" 
                  value={companyForm.name} 
                  onChange={e => setCompanyForm({...companyForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CNPJ</label>
                <input 
                    className="w-full border p-2 rounded" 
                    value={companyForm.cnpj} 
                    onChange={e => setCompanyForm({...companyForm, cnpj: e.target.value})} 
                />
              </div>
            </div>

            {/* FISCAL INFO */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <h3 className="text-sm font-bold text-slate-600 uppercase mb-3">Dados para Emissão de NFSe (ABRASF)</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label className="block text-sm font-medium mb-1">Inscrição Municipal</label>
                      <input 
                          className="w-full border p-2 rounded" 
                          value={companyForm.municipalInscription} 
                          onChange={e => setCompanyForm({...companyForm, municipalInscription: e.target.value})} 
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">Inscrição Estadual</label>
                      <input 
                          className="w-full border p-2 rounded" 
                          value={companyForm.stateInscription || ''} 
                          onChange={e => setCompanyForm({...companyForm, stateInscription: e.target.value})} 
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">CNAE Principal</label>
                      <input 
                          className="w-full border p-2 rounded" 
                          value={companyForm.cnae} 
                          onChange={e => setCompanyForm({...companyForm, cnae: e.target.value})} 
                          placeholder="Ex: 6201-5/00"
                      />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                   <div>
                      <label className="block text-sm font-medium mb-1">Regime Tributário</label>
                      <select 
                        className="w-full border p-2 rounded bg-white"
                        value={companyForm.taxRegime}
                        onChange={e => setCompanyForm({...companyForm, taxRegime: e.target.value})}
                      >
                         <option value="Simples Nacional">Simples Nacional</option>
                         <option value="Lucro Presumido">Lucro Presumido</option>
                         <option value="Lucro Real">Lucro Real</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Regime Especial de Tributação</label>
                      <select 
                        className="w-full border p-2 rounded bg-white"
                        value={companyForm.specialTaxRegime}
                        onChange={e => setCompanyForm({...companyForm, specialTaxRegime: e.target.value})}
                      >
                         <option value="0">0 - Sem Regime Especial</option>
                         <option value="1">1 - Microempresa Municipal</option>
                         <option value="2">2 - Estimativa</option>
                         <option value="3">3 - Sociedade de Profissionais</option>
                         <option value="4">4 - Cooperativa</option>
                         <option value="5">5 - MEI (Microempresário Individual)</option>
                         <option value="6">6 - ME EPP (Simples Nacional)</option>
                      </select>
                   </div>
               </div>
               
               <div className="mt-4 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                        type="checkbox" 
                        checked={companyForm.optanteSimplesNacional} 
                        onChange={e => setCompanyForm({...companyForm, optanteSimplesNacional: e.target.checked})}
                        className="rounded text-blue-600 focus:ring-blue-500"
                     />
                     <span className="text-sm font-medium">Optante Simples Nacional</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                        type="checkbox" 
                        checked={companyForm.incentivadorCultural} 
                        onChange={e => setCompanyForm({...companyForm, incentivadorCultural: e.target.checked})}
                        className="rounded text-blue-600 focus:ring-blue-500"
                     />
                     <span className="text-sm font-medium">Incentivador Cultural</span>
                  </label>
               </div>
            </div>

            {/* ADDRESS INFO */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <h3 className="text-sm font-bold text-slate-600 uppercase mb-3">Endereço Completo (Obrigatório para XML)</h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                      <label className="block text-sm font-medium mb-1">CEP</label>
                      <input 
                          className="w-full border p-2 rounded" 
                          value={companyForm.address.zipCode} 
                          onChange={e => handleAddressChange('zipCode', e.target.value)}
                      />
                  </div>
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Logradouro</label>
                      <input 
                          className="w-full border p-2 rounded" 
                          value={companyForm.address.street} 
                          onChange={e => handleAddressChange('street', e.target.value)}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">Número</label>
                      <input 
                          className="w-full border p-2 rounded" 
                          value={companyForm.address.number} 
                          onChange={e => handleAddressChange('number', e.target.value)}
                      />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="md:col-span-1">
                      <label className="block text-sm font-medium mb-1">Bairro</label>
                      <input 
                          className="w-full border p-2 rounded" 
                          value={companyForm.address.neighborhood} 
                          onChange={e => handleAddressChange('neighborhood', e.target.value)}
                      />
                  </div>
                  <div className="md:col-span-1">
                      <label className="block text-sm font-medium mb-1">Cidade</label>
                      <input 
                          className="w-full border p-2 rounded" 
                          value={companyForm.address.city} 
                          onChange={e => handleAddressChange('city', e.target.value)}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">UF</label>
                      <input 
                          className="w-full border p-2 rounded" 
                          maxLength={2}
                          value={companyForm.address.state} 
                          onChange={e => handleAddressChange('state', e.target.value)}
                      />
                  </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Cód. IBGE Cidade</label>
                      <input 
                          className="w-full border p-2 rounded" 
                          value={companyForm.address.cityCode} 
                          onChange={e => handleAddressChange('cityCode', e.target.value)}
                          placeholder="Ex: 4108304"
                      />
                  </div>
               </div>
            </div>
            
            <div className="pt-4 flex justify-end">
                <button 
                    onClick={() => {
                        updateSettings(companyForm);
                        alert('Configurações salvas com sucesso!');
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md"
                >
                    <Save size={18}/> Salvar Alterações
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};