import React from 'react';
import { useAppStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    {trend && <p className="text-xs text-green-600 mt-4 font-medium">{trend}</p>}
  </div>
);

export const Dashboard = () => {
  const { sales, clients, accountsReceivable, financialRecords } = useAppStore();

  const totalSales = sales.reduce((acc, sale) => acc + sale.finalAmount, 0);
  const totalReceivable = accountsReceivable
    .filter(i => i.status !== 'Pago')
    .reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);
  
  // Calculate cash balance (mock logic from records)
  // Only consider records that have a bankAccountId (actual cash flow)
  const currentBalance = financialRecords
    .filter(rec => !!rec.bankAccountId)
    .reduce((acc, rec) => {
      return rec.type === 'RECEITA' ? acc + rec.amount : acc - rec.amount;
    }, 0);

  // Mock data for charts
  const salesData = [
    { name: 'Jan', vendas: 4000 },
    { name: 'Fev', vendas: 3000 },
    { name: 'Mar', vendas: 2000 },
    { name: 'Abr', vendas: 2780 },
    { name: 'Mai', vendas: 1890 },
    { name: 'Jun', vendas: 2390 },
    { name: 'Jul', vendas: 3490 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
        <p className="text-slate-500">Bem-vindo ao painel de controle.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento Total" 
          value={`R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={TrendingUp} 
          color="bg-blue-500"
          trend="+12% este mês"
        />
        <StatCard 
          title="Saldo em Caixa" 
          value={`R$ ${currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={DollarSign} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="A Receber" 
          value={`R$ ${totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={AlertCircle} 
          color="bg-amber-500"
        />
        <StatCard 
          title="Clientes Ativos" 
          value={clients.length} 
          icon={Users} 
          color="bg-purple-500"
          trend="+2 novos"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Evolução de Vendas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Fluxo de Caixa (Simulado)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};