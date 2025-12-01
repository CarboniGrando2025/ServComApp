import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, FileText, Calendar, 
  Receipt, Wallet, Banknote, ClipboardList, Settings, Menu, X, Users
} from 'lucide-react';
import { useAppStore } from '../store';

const SidebarItem = ({ to, icon: Icon, label, onClick }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-3 px-6 py-3 transition-colors ${
        isActive 
          ? 'bg-blue-600 text-white' 
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const companyName = useAppStore(state => state.settings.name);

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">G</span>
            </div>
            <span className="font-bold text-lg truncate">{companyName.split(' ')[0]}</span>
          </div>
          <button onClick={closeMobile} className="lg:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 flex flex-col space-y-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={closeMobile} />
          <SidebarItem to="/vendas" icon={ShoppingCart} label="Vendas" onClick={closeMobile} />
          <SidebarItem to="/orcamentos" icon={FileText} label="Orçamentos" onClick={closeMobile} />
          <SidebarItem to="/agenda" icon={Calendar} label="Agendamentos" onClick={closeMobile} />
          <SidebarItem to="/notas" icon={Receipt} label="Notas Fiscais" onClick={closeMobile} />
          
          <div className="pt-4 pb-1 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Financeiro
          </div>
          <SidebarItem to="/receber" icon={Wallet} label="Contas a Receber" onClick={closeMobile} />
          <SidebarItem to="/pagar" icon={Banknote} label="Contas a Pagar" onClick={closeMobile} />
          <SidebarItem to="/extrato" icon={ClipboardList} label="Extrato" onClick={closeMobile} />

          <div className="pt-4 pb-1 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Administração
          </div>
          <SidebarItem to="/cadastros" icon={Users} label="Cadastros" onClick={closeMobile} />
          <SidebarItem to="/config" icon={Settings} label="Configurações" onClick={closeMobile} />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 lg:hidden">
          <button onClick={toggleMobile} className="text-slate-600 focus:outline-none">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-slate-800">GestorPro</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};