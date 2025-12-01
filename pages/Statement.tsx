import React from 'react';
import { useAppStore } from '../store';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

export const Statement = () => {
  const { financialRecords } = useAppStore();

  return (
    <div className="space-y-6">
       <h1 className="text-2xl font-bold text-slate-800">Extrato Financeiro</h1>
       
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
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
              <th className="px-6 py-4">Documento</th>
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
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{rec.documentNumber || '-'}</td>
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
               <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhuma movimentação registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};