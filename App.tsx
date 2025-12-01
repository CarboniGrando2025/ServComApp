import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Quotes } from './pages/Quotes';
import { Receivables } from './pages/Receivables';
import { Payables } from './pages/Payables';
import { Statement } from './pages/Statement';
import { Invoices } from './pages/Invoices';
import { Schedule } from './pages/Schedule';
import { Registries } from './pages/Registries';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Sales & Quotes */}
        <Route path="/vendas" element={<Sales />} />
        <Route path="/orcamentos" element={<Quotes />} />
        
        {/* Financials - Independent Pages */}
        <Route path="/receber" element={<Receivables />} />
        <Route path="/pagar" element={<Payables />} />
        <Route path="/extrato" element={<Statement />} />
        
        {/* Core Ops */}
        <Route path="/agenda" element={<Schedule />} />
        <Route path="/notas" element={<Invoices />} />
        
        {/* Admin */}
        <Route path="/cadastros" element={<Registries />} />
        <Route path="/config" element={<Settings />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;