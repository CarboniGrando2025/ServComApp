import React, { useState } from 'react';
import { useAppStore } from '../store';
import { InstallmentStatus, Installment } from '../types';
import { CheckCircle, AlertCircle, Download, ChevronDown, ChevronUp, Plus, TrendingDown, TrendingUp, Calendar, DollarSign } from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    [InstallmentStatus.PAID]: 'bg-green-100 text-green-700',
    [InstallmentStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
    [InstallmentStatus.OVERDUE]: 'bg-red-100 text-red-700',
    [InstallmentStatus.PARTIAL]: 'bg-blue-100 text-blue-700',
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
};

const KPICard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
        <p className="text-sm text-slate-500 mb-1">{title}</p>
        <h3 className="text-xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon size={20} className="text-white" />
    </div>
  </div>
);

export const Financials = ({ defaultTab = 'receber' }: { defaultTab?: string }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { accountsReceivable, accountsPayable, payInstallment, payPayable, addPayable, bankAccounts, financialRecords } = useAppStore();
  
  // Payment Modal State
  const [selectedItem, setSelectedItem] = useState<{id: string, type: 'receive' | 'pay', amount: number} | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payBank, setPayBank] = useState('');

  // Add Payable State
  const [showAddPayable, setShowAddPayable] = useState(false);
  const [newPayable, setNewPayable] = useState({ description: '', amount: 0, dueDate: '', category: '' });

  const handleOpenPay = (item: Installment, type: 'receive' | 'pay') => {
    const remaining = item.amount - item.paidAmount;
    setSelectedItem({ id: item.id, type, amount: remaining });
    setPayAmount(remaining);
    setPayBank(bankAccounts[0]?.id || '');
  };

  const handleConfirmPay = () => {
    if (selectedItem && payBank) {
        const today = new Date().toISOString().split('T')[0];
        if (selectedItem.type === 'receive') {
            payInstallment(selectedItem.id, payAmount, payBank, today);
        } else {
            payPayable(selectedItem.id, payAmount, payBank, today);
        }
        setSelectedItem(null);
    }
  };

  const handleSavePayable = (e: React.FormEvent) => {
    e.preventDefault();
    if(newPayable.description && newPayable.amount > 0) {
        addPayable({
            id: Math.random().toString(36).substr(2, 9),
            description: newPayable.description,
            amount: newPayable.amount,
            dueDate: newPayable.dueDate,
            category: newPayable.category,
            status: InstallmentStatus.PENDING,
            paidAmount: 0
        });
        setShowAddPayable(false);
        setNewPayable({ description: '', amount: 0, dueDate: '', category: '' });
    }
  };

  // KPI Calculations
  const totalReceivable = accountsReceivable.reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);
  const overdueReceivable = accountsReceivable
    .filter(i => i.status === InstallmentStatus.OVERDUE || (i.status === InstallmentStatus.PENDING && new Date(i.dueDate) < new Date()))
    .reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);

  const totalPayable = accountsPayable.reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);
  const dueTodayPayable = accountsPayable
    .filter(i => i.dueDate === new Date().toISOString().split('T')[0] && i.status !== InstallmentStatus.PAID)
    .reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
        <div className="bg-white rounded-lg border border-slate-200 p-1 flex">
          <button 
            onClick={() => setActiveTab('receber')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'receber' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Contas a Receber
          </button>
          <button 
            onClick={() => setActiveTab('pagar')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'pagar' ? 'bg-red-100 text-red-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Contas a Pagar
          </button>
          <button 
            onClick={() => setActiveTab('extrato')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'extrato' ? 'bg-gray-100 text-gray-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Extrato
          </button>
        </div>
      </div>

      {/* ACCOUNTS RECEIVABLE */}
      {activeTab === 'receber' && (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard title="Total a Receber" value={`R$ ${totalReceivable.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} icon={TrendingUp} colorClass="bg-blue-500" />
                <KPICard title="Em Atraso" value={`R$ ${overdueReceivable.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} icon={AlertCircle} colorClass="bg-red-500" />
                <KPICard title="Títulos em Aberto" value={accountsReceivable.filter(i => i.status !== 'Pago').length} icon={Calendar} colorClass="bg-slate-500" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-slate-700">Títulos de Vendas e Serviços</h2>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr>
                        <th className="px-6 py-4">Vencimento</th>
                        <th className="px-6 py-4">Descrição / Cliente</th>
                        <th className="px-6 py-4">Valor Original</th>
                        <th className="px-6 py-4">Recebido</th>
                        <th className="px-6 py-4">Saldo</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {accountsReceivable.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 font-medium">{inst.description}</td>
                        <td className="px-6 py-4">R$ {inst.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-green-600">R$ {inst.paidAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">R$ {(inst.amount - inst.paidAmount).toFixed(2)}</td>
                        <td className="px-6 py-4"><StatusBadge status={inst.status} /></td>
                        <td className="px-6 py-4 text-center">
                            {inst.status !== InstallmentStatus.PAID && (
                            <button 
                                onClick={() => handleOpenPay(inst, 'receive')}
                                className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 bg-blue-50 px-3 py-1 rounded transition-colors hover:bg-blue-100"
                            >
                                Receber
                            </button>
                            )}
                        </td>
                        </tr>
                    ))}
                    {accountsReceivable.length === 0 && (
                        <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Nenhum título a receber encontrado.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* ACCOUNTS PAYABLE */}
      {activeTab === 'pagar' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard title="Total a Pagar" value={`R$ ${totalPayable.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} icon={TrendingDown} colorClass="bg-red-500" />
                <KPICard title="Vence Hoje" value={`R$ ${dueTodayPayable.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} icon={Calendar} colorClass="bg-amber-500" />
                <div className="flex items-center justify-end md:justify-center">
                     <button 
                        onClick={() => setShowAddPayable(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-sm transition-transform active:scale-95 w-full md:w-auto justify-center"
                    >
                        <Plus size={20} /> Nova Despesa
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-700">Contas e Despesas Operacionais</h2>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr>
                        <th className="px-6 py-4">Vencimento</th>
                        <th className="px-6 py-4">Descrição</th>
                        <th className="px-6 py-4">Categoria</th>
                        <th className="px-6 py-4">Valor Total</th>
                        <th className="px-6 py-4">Restante</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {accountsPayable.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 font-medium">{inst.description}</td>
                        <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{inst.category || 'Geral'}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-800">R$ {inst.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold text-red-600">R$ {(inst.amount - inst.paidAmount).toFixed(2)}</td>
                        <td className="px-6 py-4"><StatusBadge status={inst.status} /></td>
                        <td className="px-6 py-4 text-center">
                            {inst.status !== InstallmentStatus.PAID && (
                            <button 
                                onClick={() => handleOpenPay(inst, 'pay')}
                                className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 bg-red-50 px-3 py-1 rounded transition-colors hover:bg-red-100"
                            >
                                Pagar
                            </button>
                            )}
                        </td>
                        </tr>
                    ))}
                    {accountsPayable.length === 0 && (
                        <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Nenhuma conta a pagar registrada.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
         </div>
       )}

      {/* EXTRACT / STATEMENT */}
      {activeTab === 'extrato' && (
        <div className="space-y-4">
           <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
              <div>
                  <h2 className="text-lg font-bold text-slate-800">Fluxo de Caixa</h2>
                  <p className="text-sm text-slate-500">Histórico completo de movimentações</p>
              </div>
              <button className="flex items-center gap-2 text-slate-600 hover:text-slate-800 border bg-white px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Download size={18} /> Exportar CSV
              </button>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financialRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{new Date(rec.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-medium">{rec.description}</td>
                    <td className="px-6 py-4 text-slate-500">{rec.category}</td>
                    <td className="px-6 py-4">
                      {rec.type === 'RECEITA' 
                        ? <span className="flex items-center text-green-600 bg-green-50 w-fit px-2 py-1 rounded"><ChevronUp size={16} className="mr-1"/> Entrada</span> 
                        : <span className="flex items-center text-red-600 bg-red-50 w-fit px-2 py-1 rounded"><ChevronDown size={16} className="mr-1"/> Saída</span>
                      }
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${rec.type === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                      {rec.type === 'DESPESA' ? '-' : ''} R$ {rec.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {financialRecords.length === 0 && (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhuma movimentação registrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                    {selectedItem.type === 'receive' ? 'Baixar Recebimento' : 'Realizar Pagamento'}
                </h3>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <p className="text-sm text-slate-500">Valor Restante</p>
                  <p className="text-xl font-bold text-slate-800">R$ {selectedItem.amount.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor a {selectedItem.type === 'receive' ? 'Receber' : 'Pagar'}</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                    <input 
                    type="number" 
                    className="w-full border p-2 pl-9 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    value={payAmount} 
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conta Bancária</label>
                <select 
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  value={payBank}
                  onChange={(e) => setPayBank(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.holder}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setSelectedItem(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                <button 
                    onClick={handleConfirmPay} 
                    className={`px-6 py-2 text-white rounded-lg font-medium shadow-sm transition-colors ${selectedItem.type === 'receive' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    Confirmar {selectedItem.type === 'receive' ? 'Recebimento' : 'Pagamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payable Modal */}
      {showAddPayable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Lançar Nova Despesa</h3>
                    <button onClick={() => setShowAddPayable(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                
                <form onSubmit={handleSavePayable} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" 
                            value={newPayable.description} 
                            onChange={e => setNewPayable({...newPayable, description: e.target.value})} 
                            placeholder="Ex: Aluguel, Fornecedor X"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                        <input 
                            type="text" 
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" 
                            value={newPayable.category} 
                            onChange={e => setNewPayable({...newPayable, category: e.target.value})} 
                            placeholder="Ex: Operacional, Impostos" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                                <input 
                                    required 
                                    type="number" 
                                    step="0.01" 
                                    className="w-full border p-2 pl-9 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" 
                                    value={newPayable.amount} 
                                    onChange={e => setNewPayable({...newPayable, amount: Number(e.target.value)})} 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
                            <input 
                                required 
                                type="date" 
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" 
                                value={newPayable.dueDate} 
                                onChange={e => setNewPayable({...newPayable, dueDate: e.target.value})} 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <button type="button" onClick={() => setShowAddPayable(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors">Salvar Despesa</button>
                    </div>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};