import React, { useState } from 'react';
import { useAppStore } from '../store';
import { InstallmentStatus, Installment } from '../types';
import { TrendingUp, AlertCircle, Calendar, CheckCircle, PlusCircle } from 'lucide-react';

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

export const Receivables = () => {
  const { accountsReceivable, payInstallment, bankAccounts } = useAppStore();
  
  // Payment Modal State
  const [selectedItem, setSelectedItem] = useState<{id: string, amount: number, totalAmount: number} | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payBank, setPayBank] = useState('');
  
  const [diffAction, setDiffAction] = useState<'partial' | 'discount'>('partial');
  const [excessAction, setExcessAction] = useState<'interest' | 'update'>('interest');

  const handleOpenPay = (item: Installment) => {
    const remaining = item.amount - item.paidAmount;
    setSelectedItem({ id: item.id, amount: remaining, totalAmount: item.amount });
    setPayAmount(remaining);
    setPayBank(bankAccounts[0]?.id || '');
    setDiffAction('partial');
    setExcessAction('interest');
  };

  const handleConfirmPay = () => {
    if (selectedItem && payBank) {
        const today = new Date().toISOString().split('T')[0];
        const isUnderpayment = payAmount < selectedItem.amount - 0.01;
        const isOverpayment = payAmount > selectedItem.amount + 0.01;
        
        payInstallment(
            selectedItem.id, 
            payAmount, 
            payBank, 
            today, 
            isUnderpayment ? diffAction === 'discount' : false,
            isOverpayment ? excessAction === 'update' : false
        );
        setSelectedItem(null);
    }
  };

  // KPI Calculations
  const totalReceivable = accountsReceivable
    .filter(i => i.status !== InstallmentStatus.PAID)
    .reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);
    
  const overdueReceivable = accountsReceivable
    .filter(i => i.status === InstallmentStatus.OVERDUE || (i.status === InstallmentStatus.PENDING && new Date(i.dueDate) < new Date()))
    .reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Contas a Receber</h1>
      </div>

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
                  <th className="px-6 py-4">Saldo Restante</th>
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
                          onClick={() => handleOpenPay(inst)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 bg-blue-50 px-3 py-1 rounded transition-colors hover:bg-blue-100"
                      >
                          Baixar
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

      {/* Payment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Baixar Recebimento</h3>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Valor Original:</span>
                    <span className="font-medium text-slate-700">R$ {selectedItem.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Saldo Restante:</span>
                    <span className="text-xl font-bold text-slate-800">R$ {selectedItem.amount.toFixed(2)}</span>
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor a Receber Agora</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                    <input 
                      type="number" 
                      className="w-full border p-2 pl-9 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                      value={payAmount} 
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                    />
                </div>
                
                {/* UNDERPAYMENT LOGIC */}
                {payAmount < selectedItem.amount - 0.01 && payAmount > 0 && (
                   <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2">
                    <p className="text-sm text-amber-800 font-medium mb-2 flex items-center gap-1">
                      <AlertCircle size={14}/> Diferença de R$ {(selectedItem.amount - payAmount).toFixed(2)}
                    </p>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="diffAction" 
                          checked={diffAction === 'partial'} 
                          onChange={() => setDiffAction('partial')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Manter Pendente (Recebimento Parcial)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="diffAction" 
                          checked={diffAction === 'discount'} 
                          onChange={() => setDiffAction('discount')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Baixar como Desconto Concedido</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* OVERPAYMENT LOGIC */}
                {payAmount > selectedItem.amount + 0.01 && (
                   <div className="bg-green-50 p-3 rounded-lg border border-green-100 mt-2">
                    <p className="text-sm text-green-800 font-medium mb-2 flex items-center gap-1">
                      <CheckCircle size={14}/> Excedente de R$ {(payAmount - selectedItem.amount).toFixed(2)}
                    </p>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="excessAction" 
                          checked={excessAction === 'interest'} 
                          onChange={() => setExcessAction('interest')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Lançar como Juros/Multa</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="excessAction" 
                          checked={excessAction === 'update'} 
                          onChange={() => setExcessAction('update')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Atualizar valor original do título</span>
                      </label>
                    </div>
                   </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conta Bancária de Destino</label>
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
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                >
                    Confirmar Recebimento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};