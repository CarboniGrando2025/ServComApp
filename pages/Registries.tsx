import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Users, Briefcase, Landmark, Plus, Search, Edit, Save, X } from 'lucide-react';
import { Client, Service, BankAccount } from '../types';

export const Registries = () => {
  const [tab, setTab] = useState<'clientes' | 'servicos' | 'bancos'>('clientes');
  const { clients, services, bankAccounts, addClient, addService, addBankAccount } = useAppStore();

  // Modal States
  const [showClientModal, setShowClientModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Form States
  const [clientForm, setClientForm] = useState<Partial<Client>>({});
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({});
  const [bankForm, setBankForm] = useState<Partial<BankAccount>>({});

  const handleOpenClient = (client?: Client) => {
    setClientForm(client || { 
        name: '', document: '', email: '', phone: '', notes: '', municipalInscription: '',
        zipCode: '', street: '', number: '', neighborhood: '', city: '', state: '', cityCode: '' 
    });
    setShowClientModal(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientForm.name) {
      addClient({
        id: clientForm.id || Math.random().toString(36).substr(2, 9),
        name: clientForm.name,
        document: clientForm.document || '',
        email: clientForm.email || '',
        phone: clientForm.phone || '',
        notes: clientForm.notes || '',
        municipalInscription: clientForm.municipalInscription,
        
        // Structured Address
        zipCode: clientForm.zipCode || '',
        street: clientForm.street || '',
        number: clientForm.number || '',
        neighborhood: clientForm.neighborhood || '',
        city: clientForm.city || '',
        state: clientForm.state || '',
        cityCode: clientForm.cityCode || ''
      });
      setShowClientModal(false);
    }
  };

  const handleOpenService = (service?: Service) => {
    setServiceForm(service || { 
        name: '', price: 0, description: '', 
        itemLCServico: '', municipalCode: '', cnae: '', issAliquot: 0,
        pis: 0, cofins: 0, csll: 0, ir: 0, inss: 0
    });
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (serviceForm.name && serviceForm.price !== undefined) {
      addService({
        id: serviceForm.id || Math.random().toString(36).substr(2, 9),
        name: serviceForm.name,
        price: Number(serviceForm.price),
        description: serviceForm.description || '',
        itemLCServico: serviceForm.itemLCServico || '',
        municipalCode: serviceForm.municipalCode || '',
        cnae: serviceForm.cnae || '',
        issAliquot: Number(serviceForm.issAliquot || 0),
        
        // Retentions
        pis: Number(serviceForm.pis || 0),
        cofins: Number(serviceForm.cofins || 0),
        csll: Number(serviceForm.csll || 0),
        ir: Number(serviceForm.ir || 0),
        inss: Number(serviceForm.inss || 0),
      });
      setShowServiceModal(false);
    }
  };

  const handleOpenBank = (bank?: BankAccount) => {
    setBankForm(bank || { bankName: '', agency: '', accountNumber: '', holder: '', initialBalance: 0 });
    setShowBankModal(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (bankForm.bankName) {
      addBankAccount({
        id: bankForm.id || Math.random().toString(36).substr(2, 9),
        bankName: bankForm.bankName,
        agency: bankForm.agency || '',
        accountNumber: bankForm.accountNumber || '',
        holder: bankForm.holder || '',
        initialBalance: Number(bankForm.initialBalance || 0)
      });
      setShowBankModal(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-slate-800">Cadastros</h1>
      </div>
      
      <div className="flex space-x-1 bg-white p-1 rounded-lg border border-slate-200 w-fit">
        <button 
          onClick={() => setTab('clientes')} 
          className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${tab === 'clientes' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Users size={18} /> Clientes
        </button>
        <button 
          onClick={() => setTab('servicos')} 
          className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${tab === 'servicos' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Briefcase size={18} /> Serviços
        </button>
        <button 
          onClick={() => setTab('bancos')} 
          className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${tab === 'bancos' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Landmark size={18} /> Contas Bancárias
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* CLIENTS TAB */}
        {tab === 'clientes' && (
          <div>
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="relative w-64">
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                 <input type="text" placeholder="Buscar cliente..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <button onClick={() => handleOpenClient()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                  <Plus size={18} /> Novo Cliente
               </button>
             </div>
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-600 font-medium">
                 <tr>
                   <th className="px-6 py-3">Nome</th>
                   <th className="px-6 py-3">CPF/CNPJ</th>
                   <th className="px-6 py-3">Cidade/UF</th>
                   <th className="px-6 py-3">Contato</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {clients.map(c => (
                   <tr key={c.id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => handleOpenClient(c)}>
                     <td className="px-6 py-4 font-medium text-slate-800">{c.name}</td>
                     <td className="px-6 py-4 text-slate-500">{c.document || '-'}</td>
                     <td className="px-6 py-4 text-slate-500">{c.city}/{c.state}</td>
                     <td className="px-6 py-4 text-slate-500">{c.phone}</td>
                   </tr>
                 ))}
                 {clients.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhum cliente cadastrado.</td></tr>}
               </tbody>
             </table>
          </div>
        )}

        {/* SERVICES TAB */}
        {tab === 'servicos' && (
          <div>
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="relative w-64">
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                 <input type="text" placeholder="Buscar serviço..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <button onClick={() => handleOpenService()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                  <Plus size={18} /> Novo Serviço
               </button>
             </div>
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-600 font-medium">
                 <tr>
                   <th className="px-6 py-3">Serviço</th>
                   <th className="px-6 py-3">Preço Base</th>
                   <th className="px-6 py-3">Item Lista (LC 116)</th>
                   <th className="px-6 py-3">Alíq. ISS</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {services.map(s => (
                   <tr key={s.id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => handleOpenService(s)}>
                     <td className="px-6 py-4 font-medium text-slate-800">{s.name}</td>
                     <td className="px-6 py-4 text-slate-700 font-semibold">R$ {s.price.toFixed(2)}</td>
                     <td className="px-6 py-4 text-slate-500">{s.itemLCServico || '-'}</td>
                     <td className="px-6 py-4 text-slate-500">{s.issAliquot ? `${s.issAliquot}%` : '-'}</td>
                   </tr>
                 ))}
                 {services.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhum serviço cadastrado.</td></tr>}
               </tbody>
             </table>
          </div>
        )}

        {/* BANKS TAB */}
        {tab === 'bancos' && (
          <div>
             <div className="p-4 border-b border-slate-100 flex justify-end items-center bg-slate-50/50">
               <button onClick={() => handleOpenBank()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                  <Plus size={18} /> Nova Conta
               </button>
             </div>
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-600 font-medium">
                 <tr>
                   <th className="px-6 py-3">Banco / Descrição</th>
                   <th className="px-6 py-3">Agência / Conta</th>
                   <th className="px-6 py-3">Titular</th>
                   <th className="px-6 py-3 text-right">Saldo Inicial</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {bankAccounts.map(b => (
                   <tr key={b.id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => handleOpenBank(b)}>
                     <td className="px-6 py-4 font-medium text-slate-800">{b.bankName}</td>
                     <td className="px-6 py-4 text-slate-500">{b.agency} / {b.accountNumber}</td>
                     <td className="px-6 py-4 text-slate-500">{b.holder}</td>
                     <td className="px-6 py-4 text-right font-mono text-slate-700">R$ {b.initialBalance.toFixed(2)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>

      {/* CLIENT MODAL */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50 sticky top-0 z-10">
              <h3 className="font-bold text-slate-800">Cadastro de Cliente (Completo para NFSe)</h3>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveClient} className="p-6 space-y-6">
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo / Razão Social</label>
                    <input required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CPF / CNPJ</label>
                    <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={clientForm.document} onChange={e => setClientForm({...clientForm, document: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Municipal (Opcional)</label>
                    <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={clientForm.municipalInscription} onChange={e => setClientForm({...clientForm, municipalInscription: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (Para envio da NF)</label>
                    <input type="email" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} />
                  </div>
              </div>

              {/* Address */}
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                 <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Endereço (Obrigatório para XML)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                        <input className="w-full border p-2 rounded bg-white" value={clientForm.zipCode} onChange={e => setClientForm({...clientForm, zipCode: e.target.value})} />
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Logradouro (Rua/Av)</label>
                        <input className="w-full border p-2 rounded bg-white" value={clientForm.street} onChange={e => setClientForm({...clientForm, street: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                        <input className="w-full border p-2 rounded bg-white" value={clientForm.number} onChange={e => setClientForm({...clientForm, number: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                        <input className="w-full border p-2 rounded bg-white" value={clientForm.neighborhood} onChange={e => setClientForm({...clientForm, neighborhood: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                        <input className="w-full border p-2 rounded bg-white" value={clientForm.city} onChange={e => setClientForm({...clientForm, city: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                        <input className="w-full border p-2 rounded bg-white" maxLength={2} value={clientForm.state} onChange={e => setClientForm({...clientForm, state: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cód. IBGE Cidade</label>
                        <input className="w-full border p-2 rounded bg-white" value={clientForm.cityCode} onChange={e => setClientForm({...clientForm, cityCode: e.target.value})} placeholder="7 dígitos" />
                     </div>
                 </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações Internas</label>
                <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" rows={2} value={clientForm.notes} onChange={e => setClientForm({...clientForm, notes: e.target.value})} />
              </div>
              
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
                <button type="button" onClick={() => setShowClientModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50 sticky top-0 z-10">
              <h3 className="font-bold text-slate-800">Cadastro de Serviço</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveService} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Serviço</label>
                <input required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço Base (R$)</label>
                <input type="number" step="0.01" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNAE (Opcional)</label>
                <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={serviceForm.cnae} onChange={e => setServiceForm({...serviceForm, cnae: e.target.value})} placeholder="Ex: 6201-5/00" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Detalhada (Vai na Nota)</label>
                <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" rows={2} value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} />
              </div>
              
              <div className="md:col-span-2 pt-2">
                 <h4 className="font-bold text-xs uppercase text-slate-400 border-b pb-1 mb-3">Dados Fiscais (NFS-e ABRASF)</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Lista Serviço (LC 116)</label>
                <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={serviceForm.itemLCServico} onChange={e => setServiceForm({...serviceForm, itemLCServico: e.target.value})} placeholder="Ex: 17.01" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Cód. Trib. Municipal</label>
                 <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={serviceForm.municipalCode} onChange={e => setServiceForm({...serviceForm, municipalCode: e.target.value})} placeholder="Ex: 01234" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alíquota ISS (%)</label>
                <input type="number" step="0.1" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={serviceForm.issAliquot} onChange={e => setServiceForm({...serviceForm, issAliquot: Number(e.target.value)})} />
              </div>

              <div className="md:col-span-2 pt-2">
                 <h4 className="font-bold text-xs uppercase text-slate-400 border-b pb-1 mb-3">Retenções Federais (%)</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:col-span-2">
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">PIS (%)</label>
                    <input type="number" step="0.01" className="w-full border p-2 rounded" value={serviceForm.pis} onChange={e => setServiceForm({...serviceForm, pis: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">COFINS (%)</label>
                    <input type="number" step="0.01" className="w-full border p-2 rounded" value={serviceForm.cofins} onChange={e => setServiceForm({...serviceForm, cofins: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">CSLL (%)</label>
                    <input type="number" step="0.01" className="w-full border p-2 rounded" value={serviceForm.csll} onChange={e => setServiceForm({...serviceForm, csll: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">IR (%)</label>
                    <input type="number" step="0.01" className="w-full border p-2 rounded" value={serviceForm.ir} onChange={e => setServiceForm({...serviceForm, ir: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">INSS (%)</label>
                    <input type="number" step="0.01" className="w-full border p-2 rounded" value={serviceForm.inss} onChange={e => setServiceForm({...serviceForm, inss: Number(e.target.value)})} />
                 </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
                <button type="button" onClick={() => setShowServiceModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> Salvar Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANK MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-800">Conta Bancária / Caixa</h3>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveBank} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Banco / Descrição</label>
                <input required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} placeholder="Ex: Banco Itaú ou Caixa Pequeno" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agência</label>
                    <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={bankForm.agency} onChange={e => setBankForm({...bankForm, agency: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Conta</label>
                    <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} />
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titular</label>
                <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={bankForm.holder} onChange={e => setBankForm({...bankForm, holder: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Inicial</label>
                <input type="number" step="0.01" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={bankForm.initialBalance} onChange={e => setBankForm({...bankForm, initialBalance: Number(e.target.value)})} />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                <button type="button" onClick={() => setShowBankModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};