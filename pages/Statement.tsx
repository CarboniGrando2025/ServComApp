import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { Download, ChevronDown, ChevronUp, Wallet, Search } from 'lucide-react';

export const Statement = () => {
  const { financialRecords, bankAccounts, sales, accountsReceivable } = useAppStore();
  
  // Date Filters (Default to current month)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter records
  const filteredRecords = useMemo(() => {
    return financialRecords
      .filter(rec => {
        // 1. Must be a real transaction (linked to bank account)
        if (!rec.bankAccountId) return false;
        
        // 2. Date Range
        if (rec.date < startDate || rec.date > endDate) return false;
        
        // 3. Search Term (Description, Category, Document, or Payment Method)
        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          
          // Determine Payment Method for search
          let paymentMethod = '';
          if (rec.relatedSaleId) {
             const sale = sales.find(s => s.id === rec.relatedSaleId);
             if (sale) paymentMethod = sale.paymentMethod;
          } else if (rec.relatedInstallmentId) {
             const installment = accountsReceivable.find(i => i.id === rec.relatedInstallmentId);
             if (installment) {
                 const sale = sales.find(s => s.id === installment.saleId);
                 if (sale) paymentMethod = sale.paymentMethod;
             }
          }

          return (
            rec.description.toLowerCase().includes(lowerTerm) ||
            rec.category.toLowerCase().includes(lowerTerm) ||
            (rec.documentNumber && rec.documentNumber.toLowerCase().includes(lowerTerm)) ||
            paymentMethod.toLowerCase().includes(lowerTerm)
          );
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [financialRecords, startDate, endDate, searchTerm, sales, accountsReceivable]);

  // Calculate Balance based on filtered records
  const totalBalance = useMemo(() => {
    return filteredRecords.reduce((acc, rec) => {
      return rec.type === 'RECEITA' ? acc + rec.amount : acc - rec.amount;
    }, 0);
  }, [filteredRecords]);

  const getPaymentMethodLabel = (rec: any) => {
     if (rec.relatedSaleId) {
        const sale = sales.find(s => s.id === rec.relatedSaleId);
        return sale ? sale.paymentMethod : '-';
     } 
     if (rec.relatedInstallmentId) {
        const installment = accountsReceivable.find(i => i.id === rec.relatedInstallmentId);
        if (installment) {
            const sale = sales.find(s => s.id === installment.saleId);
            return sale ? sale.paymentMethod : '-';
        }
     }
     return '-';
  };

  const setMonth = (offset: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() + offset);
      const f = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const l = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(f);
      setEndDate(l);
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Extrato Financeiro</h1>
            <p className="text-slate-500">Fluxo de caixa realizado.</p>
          </div>
       </div>
       
       {/* Filters Bar */}
       <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                   <label className="text-xs font-semibold text-slate-500 mb-1 block">Início</label>
                   <input 
                     type="date" 
                     className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                     value={startDate}
                     onChange={(e) => setStartDate(e.target.value)}
                   />
                </div>
                <div>
                   <label className="text-xs font-semibold text-slate-500 mb-1 block">Fim</label>
                   <input 
                     type="date" 
                     className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                     value={endDate}
                     onChange={(e) => setEndDate(e.target.value)}
                   />
                </div>
                <div className="flex items-end gap-2">
                    <button onClick={() => setMonth(0)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors">Este Mês</button>
                    <button onClick={() => setMonth(-1)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors">Mês Passado</button>
                </div>
            </div>

            <div className="w-full md:w-64">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Buscar</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Descrição, Categoria, Forma Pgto..." 
                        className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
       </div>

       {/* Results Summary */}
       <div className="flex justify-between items-center px-2">
           <div className="text-sm text-slate-500">
               Exibindo <strong>{filteredRecords.length}</strong> registros de <strong>{new Date(startDate).toLocaleDateString('pt-BR')}</strong> até <strong>{new Date(endDate).toLocaleDateString('pt-BR')}</strong>
           </div>
           <div className="text-sm">
               Resultado do Período: <strong className={totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}>R$ {totalBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
           </div>
       </div>
       
       <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Documento</th>
              <th className="px-6 py-4">Forma Pagto</th>
              <th className="px-6 py-4">Conta / Categoria</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((rec) => {
              const bankName = bankAccounts.find(b => b.id === rec.bankAccountId)?.bankName || 'Conta Desconhecida';
              return (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">{new Date(rec.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-medium">{rec.description}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{rec.documentNumber || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 text-xs">{getPaymentMethodLabel(rec)}</td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="font-medium text-slate-700">{bankName}</div>
                    <div className="text-xs">{rec.category}</div>
                  </td>
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
              );
            })}
            {filteredRecords.length === 0 && (
               <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Nenhuma movimentação encontrada para este filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};