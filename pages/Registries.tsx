import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Users, Briefcase, Landmark } from 'lucide-react';

export const Registries = () => {
  const [tab, setTab] = useState<'clientes' | 'servicos' | 'bancos'>('clientes');
  const { clients, services, bankAccounts, addClient, addService, addBankAccount } = useAppStore();

  const [newClientName, setNewClientName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newBankName, setNewBankName] = useState('');
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Cadastros</h1>
      
      <div className="flex space-x-4 border-b border-slate-200">
        <button 
          onClick={() => setTab('clientes')} 
          className={`pb-3 px-2 flex items-center gap-2 ${tab === 'clientes' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-slate-500'}`}
        >
          <Users size={18} /> Clientes
        </button>
        <button 
          onClick={() => setTab('servicos')} 
          className={`pb-3 px-2 flex items-center gap-2 ${tab === 'servicos' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-slate-500'}`}
        >
          <Briefcase size={18} /> Serviços
        </button>
        <button 
          onClick={() => setTab('bancos')} 
          className={`pb-3 px-2 flex items-center gap-2 ${tab === 'bancos' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-slate-500'}`}
        >
          <Landmark size={18} /> Contas Bancárias
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        {tab === 'clientes' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nome do novo cliente" 
                className="flex-1 border p-2 rounded" 
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
              />
              <button 
                className="bg-blue-600 text-white px-4 rounded"
                onClick={() => {
                  if(newClientName) {
                    addClient({ id: Math.random().toString(), name: newClientName, document: '', email: '', phone: '', address: '' });
                    setNewClientName('');
                  }
                }}
              >Adicionar Rápido</button>
            </div>
            <ul className="divide-y">
              {clients.map(c => (
                <li key={c.id} className="py-3 flex justify-between">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-slate-500 text-sm">{c.document || 'Sem documento'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'servicos' && (
          <div className="space-y-6">
             <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nome do serviço" 
                className="flex-1 border p-2 rounded" 
                value={newServiceDesc}
                onChange={e => setNewServiceDesc(e.target.value)}
              />
              <button 
                 className="bg-blue-600 text-white px-4 rounded"
                 onClick={() => {
                  if(newServiceDesc) {
                    addService({ id: Math.random().toString(), name: newServiceDesc, price: 100, description: '', taxCode: '' });
                    setNewServiceDesc('');
                  }
                }}
              >Adicionar Rápido</button>
            </div>
            <ul className="divide-y">
              {services.map(s => (
                <li key={s.id} className="py-3 flex justify-between">
                  <span>{s.name}</span>
                  <span className="font-mono text-slate-600">R$ {s.price}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'bancos' && (
          <div className="space-y-6">
             <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nome do banco / conta" 
                className="flex-1 border p-2 rounded" 
                value={newBankName}
                onChange={e => setNewBankName(e.target.value)}
              />
              <button 
                 className="bg-blue-600 text-white px-4 rounded"
                 onClick={() => {
                  if(newBankName) {
                    addBankAccount({ id: Math.random().toString(), bankName: newBankName, agency: '', accountNumber: '', holder: '', initialBalance: 0 });
                    setNewBankName('');
                  }
                }}
              >Adicionar Rápido</button>
            </div>
            <ul className="divide-y">
              {bankAccounts.map(b => (
                <li key={b.id} className="py-3 flex justify-between">
                  <span>{b.bankName}</span>
                  <span className="font-mono text-slate-600">{b.agency}/{b.accountNumber}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};