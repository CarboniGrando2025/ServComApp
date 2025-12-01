import React, { useState } from 'react';
import { useAppStore } from '../store';
import { InvoiceStatus } from '../types';
import { FileCheck, FileWarning, Search } from 'lucide-react';

export const Invoices = () => {
  const { invoices, emitInvoice } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nfNumber, setNfNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'emitted'>('pending');

  const handleEmit = (id: string) => {
    if (!nfNumber) return;
    emitInvoice(id, nfNumber);
    setEditingId(null);
    setNfNumber('');
  };

  const filteredInvoices = invoices.filter(inv => 
    activeTab === 'pending' 
      ? inv.status === InvoiceStatus.PENDING 
      : inv.status === InvoiceStatus.EMITTED
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Controle de Notas Fiscais (NFS-e)</h1>
          <p className="text-slate-500">Gerencie a emissão fiscal.</p>
        </div>
        <div className="flex bg-white rounded-lg border p-1">
             <button 
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'pending' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
             >
                Pendentes (Não Emitidas)
             </button>
             <button 
                onClick={() => setActiveTab('emitted')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'emitted' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}
             >
                Emitidas
             </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
           <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
              <input type="text" placeholder="Filtrar por cliente..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none" />
           </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">ID Venda</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Valor</th>
              <th className="px-6 py-4">Número NF</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-500">#{inv.saleId.substr(0, 6)}</td>
                <td className="px-6 py-4 font-medium">{inv.clientName}</td>
                <td className="px-6 py-4">R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4">
                  {inv.status === InvoiceStatus.EMITTED ? (
                    <span className="font-mono text-slate-700">{inv.number}</span>
                  ) : (
                    <span className="text-slate-400 italic">--</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {inv.status === InvoiceStatus.EMITTED ? (
                    <span className="flex items-center text-green-600 gap-1 bg-green-50 px-2 py-1 rounded w-fit"><FileCheck size={14}/> Emitida</span>
                  ) : (
                    <span className="flex items-center text-amber-600 gap-1 bg-amber-50 px-2 py-1 rounded w-fit"><FileWarning size={14}/> Pendente</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {inv.status === InvoiceStatus.PENDING && (
                    editingId === inv.id ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Nº"
                          className="border rounded px-2 py-1 w-24"
                          value={nfNumber}
                          onChange={e => setNfNumber(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => handleEmit(inv.id)} className="text-green-600 font-bold hover:text-green-800">OK</button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">X</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingId(inv.id)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Informar Emissão
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhuma nota nesta categoria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};