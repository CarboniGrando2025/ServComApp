import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { InstallmentStatus, Installment } from '../types';
import { TrendingUp, AlertCircle, Calendar, CheckCircle, Search, RefreshCw } from 'lucide-react';

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
  const { accountsReceivable, payInstallment, reparcelReceivables, bankAccounts, sales } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Payment Modal State
  const [selectedItem, setSelectedItem] = useState<{id: string, amount: number, totalAmount: number} | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payBank, setPayBank] = useState('');
  const [diffAction, setDiffAction] = useState<'partial' | 'discount'>('partial');
  const [excessAction, setExcessAction] = useState<'interest' | 'update'>('interest');

  // Bulk Payment Modal State
  const [showBulkPayModal, setShowBulkPayModal] = useState(false);
  const [bulkPayItems, setBulkPayItems] = useState<{
      id: string;
      description: string;
      totalAmount: number;
      remainingAmount: number;
      payAmount: number;
      diffAction: 'partial' | 'discount';
      excessAction: 'interest' | 'update';
  }[]>([]);
  const [bulkPayBank, setBulkPayBank] = useState('');

  // Reparcel Modal State
  const [showReparcelModal, setShowReparcelModal] = useState(false);
  const [reparcelConfig, setReparcelConfig] = useState({
      count: 1,
      firstDueDate: '',
      totalValue: 0, // This can be edited (e.g. adding interest)
      preview: [] as Installment[]
  });

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

  // Selection Logic
  const handleToggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (filtered: Installment[]) => {
      if (selectedIds.length === filtered.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filtered.map(i => i.id));
      }
  };

  // Reparcel Logic
  const handleOpenReparcel = () => {
      const selectedItems = accountsReceivable.filter(i => selectedIds.includes(i.id));
      if (selectedItems.length === 0) return;

      // Check Client Consistency
      const firstItem = selectedItems[0];
      const firstSale = sales.find(s => s.id === firstItem.saleId);
      const firstClientId = firstSale?.clientId;

      const allSameClient = selectedItems.every(i => {
          const s = sales.find(sale => sale.id === i.saleId);
          return s?.clientId === firstClientId;
      });

      if (!allSameClient) {
          alert("Não é possível reparcelar contas de pessoas diferentes. Por favor, selecione apenas títulos do mesmo cliente.");
          return;
      }

      const totalValue = selectedItems.reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      setReparcelConfig({
          count: 1,
          firstDueDate: nextMonth.toISOString().split('T')[0],
          totalValue: totalValue,
          preview: []
      });
      setShowReparcelModal(true);
  };

  // Generate Preview
  useMemo(() => {
    if (!showReparcelModal) return;
    
    const selectedItems = accountsReceivable.filter(i => selectedIds.includes(i.id));
    const saleId = selectedItems[0]?.saleId;
    const sale = sales.find(s => s.id === saleId);
    const clientName = sale ? sale.clientName : 'Reparcelamento';

    const newPreview: Installment[] = [];
    const valPerInstallment = reparcelConfig.totalValue / reparcelConfig.count;

    for (let i = 0; i < reparcelConfig.count; i++) {
        const date = new Date(reparcelConfig.firstDueDate);
        date.setMonth(date.getMonth() + i);
        
        newPreview.push({
            id: `preview-${i}`,
            saleId: saleId, // Attach to first sale found to keep client link
            description: `Reparcelamento ${i+1}/${reparcelConfig.count} - ${clientName}`,
            amount: parseFloat(valPerInstallment.toFixed(2)),
            dueDate: date.toISOString().split('T')[0],
            status: InstallmentStatus.PENDING,
            paidAmount: 0
        });
    }
    setReparcelConfig(prev => ({ ...prev, preview: newPreview }));
  }, [reparcelConfig.count, reparcelConfig.firstDueDate, reparcelConfig.totalValue, showReparcelModal]);

  const handleConfirmReparcel = () => {
      const finalInstallments = reparcelConfig.preview.map(p => ({
          ...p,
          id: Math.random().toString(36).substr(2, 9)
      }));
      
      reparcelReceivables(selectedIds, finalInstallments);
      setShowReparcelModal(false);
      setSelectedIds([]);
  };

  // Bulk Pay Logic
  const handleOpenBulkPay = () => {
    const selectedItems = accountsReceivable.filter(i => selectedIds.includes(i.id));
    if (selectedItems.length === 0) return;

    const items = selectedItems.map(i => ({
        id: i.id,
        description: i.description,
        totalAmount: i.amount,
        remainingAmount: i.amount - i.paidAmount,
        payAmount: i.amount - i.paidAmount, // Default to paying full remainder
        diffAction: 'partial' as const,
        excessAction: 'interest' as const
    }));

    setBulkPayItems(items);
    setBulkPayBank(bankAccounts[0]?.id || '');
    setShowBulkPayModal(true);
  };

  const handleConfirmBulkPay = () => {
    if (!bulkPayBank) {
        alert("Selecione a conta de destino.");
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    bulkPayItems.forEach(item => {
         const isUnderpayment = item.payAmount < item.remainingAmount - 0.01;
         const isOverpayment = item.payAmount > item.remainingAmount + 0.01;

         payInstallment(
            item.id,
            item.payAmount,
            bulkPayBank,
            today,
            isUnderpayment ? item.diffAction === 'discount' : false,
            isOverpayment ? item.excessAction === 'update' : false
         );
    });

    setShowBulkPayModal(false);
    setSelectedIds([]);
  };

  const updateBulkItem = (index: number, field: string, value: any) => {
    const newItems = [...bulkPayItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBulkPayItems(newItems);
  };

  // KPI Calculations
  const totalReceivable = accountsReceivable
    .filter(i => i.status !== InstallmentStatus.PAID)
    .reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);
    
  const overdueReceivable = accountsReceivable
    .filter(i => i.status === InstallmentStatus.OVERDUE || (i.status === InstallmentStatus.PENDING && new Date(i.dueDate) < new Date()))
    .reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);

  // Helper to get Sale info and Filter
  const filteredReceivables = useMemo(() => {
    return accountsReceivable.filter(inst => {
      // Find related sale to get payment method and client name if not in description
      const sale = sales.find(s => s.id === inst.saleId);
      const paymentMethod = sale?.paymentMethod || '';
      const clientName = sale?.clientName || '';
      
      const searchLower = searchTerm.toLowerCase();

      return (
        inst.description.toLowerCase().includes(searchLower) ||
        clientName.toLowerCase().includes(searchLower) ||
        paymentMethod.toLowerCase().includes(searchLower) ||
        inst.amount.toString().includes(searchLower)
      );
    }).map(inst => {
       const sale = sales.find(s => s.id === inst.saleId);
       return {
         ...inst,
         paymentMethod: sale?.paymentMethod || '-',
         clientName: sale?.clientName || ''
       };
    });
  }, [accountsReceivable, sales, searchTerm]);

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
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <h2 className="font-bold text-slate-700">Títulos de Vendas e Serviços</h2>
                  {selectedIds.length > 0 && (
                      <div className="flex gap-2">
                        <button 
                            onClick={handleOpenBulkPay}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 shadow-sm transition-colors"
                        >
                            <CheckCircle size={16}/> Baixar ({selectedIds.length})
                        </button>
                        <button 
                            onClick={handleOpenReparcel}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 shadow-sm transition-colors"
                        >
                            <RefreshCw size={16}/> Reparcelar ({selectedIds.length})
                        </button>
                      </div>
                  )}
              </div>
              
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Pesquisar (Cliente, Forma Pagto...)" 
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
          </div>
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                  <th className="px-4 py-4 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectedIds.length === filteredReceivables.length && filteredReceivables.length > 0}
                        onChange={() => handleSelectAll(filteredReceivables)}
                      />
                  </th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4">Descrição / Cliente</th>
                  <th className="px-6 py-4">Forma Pagto</th>
                  <th className="px-6 py-4">Valor Original</th>
                  <th className="px-6 py-4">Recebido</th>
                  <th className="px-6 py-4">Saldo Restante</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Ações</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {filteredReceivables.map((inst) => (
                  <tr key={inst.id} className={`hover:bg-slate-50 ${selectedIds.includes(inst.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded" 
                        checked={selectedIds.includes(inst.id)}
                        onChange={() => handleToggleSelect(inst.id)}
                      />
                  </td>
                  <td className="px-6 py-4">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-medium">
                    {inst.description}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                     {inst.paymentMethod}
                  </td>
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
              {filteredReceivables.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-400">Nenhum título a receber encontrado.</td></tr>
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

      {/* BULK PAYMENT MODAL */}
      {showBulkPayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-500"/> Baixa em Lote ({bulkPayItems.length})
                    </h3>
                    <button onClick={() => setShowBulkPayModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3">Descrição</th>
                                <th className="px-6 py-3 text-right">Saldo Devedor</th>
                                <th className="px-6 py-3 text-right w-40">Valor a Pagar</th>
                                <th className="px-6 py-3">Ajuste de Diferença</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bulkPayItems.map((item, index) => {
                                const diff = item.payAmount - item.remainingAmount;
                                const hasDiff = Math.abs(diff) > 0.01;
                                
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-700">{item.description}</td>
                                        <td className="px-6 py-4 text-right text-slate-500">R$ {item.remainingAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                className="w-full border p-2 rounded text-right font-bold text-slate-800 focus:ring-2 focus:ring-green-500 outline-none"
                                                value={item.payAmount}
                                                onChange={(e) => updateBulkItem(index, 'payAmount', Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            {hasDiff ? (
                                                diff < 0 ? (
                                                    <select 
                                                        className="w-full p-2 border border-amber-200 bg-amber-50 text-amber-800 rounded text-xs focus:outline-none"
                                                        value={item.diffAction}
                                                        onChange={(e) => updateBulkItem(index, 'diffAction', e.target.value)}
                                                    >
                                                        <option value="partial">Manter Pendente (Parcial)</option>
                                                        <option value="discount">Desconto Concedido</option>
                                                    </select>
                                                ) : (
                                                    <select 
                                                        className="w-full p-2 border border-green-200 bg-green-50 text-green-800 rounded text-xs focus:outline-none"
                                                        value={item.excessAction}
                                                        onChange={(e) => updateBulkItem(index, 'excessAction', e.target.value)}
                                                    >
                                                        <option value="interest">Lançar Juros/Multa</option>
                                                        <option value="update">Atualizar Principal</option>
                                                    </select>
                                                )
                                            ) : (
                                                <span className="text-slate-400 italic text-xs">Valor exato</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t bg-slate-50">
                    <div className="flex justify-between items-center">
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Conta Bancária de Destino (Para todos)</label>
                            <select 
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                                value={bulkPayBank}
                                onChange={(e) => setBulkPayBank(e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.holder}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-3 items-end">
                            <button 
                                onClick={() => setShowBulkPayModal(false)}
                                className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmBulkPay}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-sm"
                            >
                                Confirmar Baixa Total: R$ {bulkPayItems.reduce((acc, i) => acc + i.payAmount, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* REPARCEL MODAL */}
      {showReparcelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <RefreshCw size={20} className="text-blue-500"/> Reparcelar Títulos
                      </h3>
                      <button onClick={() => setShowReparcelModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                          <p className="text-sm text-blue-800">
                             Você está renegociando <strong>{selectedIds.length}</strong> títulos. 
                             Os títulos antigos serão excluídos e substituídos pelos novos.
                          </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Total (Novo)</label>
                              <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                                  <input 
                                     type="number"
                                     step="0.01"
                                     className="w-full pl-9 p-2 border rounded font-bold text-slate-800"
                                     value={reparcelConfig.totalValue}
                                     onChange={(e) => setReparcelConfig({...reparcelConfig, totalValue: Number(e.target.value)})}
                                  />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">Edite para incluir juros/multa</p>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº Parcelas</label>
                              <select 
                                  className="w-full p-2 border rounded bg-white"
                                  value={reparcelConfig.count}
                                  onChange={(e) => setReparcelConfig({...reparcelConfig, count: Number(e.target.value)})}
                              >
                                  {[1,2,3,4,5,6,7,8,9,10,11,12,18,24].map(n => <option key={n} value={n}>{n}x</option>)}
                              </select>
                          </div>
                          <div className="col-span-2">
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimento da 1ª Parcela</label>
                               <input 
                                  type="date"
                                  className="w-full p-2 border rounded"
                                  value={reparcelConfig.firstDueDate}
                                  onChange={(e) => setReparcelConfig({...reparcelConfig, firstDueDate: e.target.value})}
                               />
                          </div>
                      </div>

                      <div className="mt-4 border rounded-lg overflow-hidden">
                          <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 uppercase">Simulação</div>
                          <div className="max-h-40 overflow-y-auto">
                             <table className="w-full text-sm">
                                 <tbody>
                                     {reparcelConfig.preview.map((p, i) => (
                                         <tr key={i} className="border-b last:border-0">
                                             <td className="px-4 py-2 text-slate-600">{i+1}x</td>
                                             <td className="px-4 py-2">{new Date(p.dueDate).toLocaleDateString('pt-BR')}</td>
                                             <td className="px-4 py-2 text-right font-medium">R$ {p.amount.toFixed(2)}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                      <button 
                         onClick={() => setShowReparcelModal(false)}
                         className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
                      >
                         Cancelar
                      </button>
                      <button 
                         onClick={handleConfirmReparcel}
                         className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                      >
                         Confirmar Renegociação
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};