import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Quote, SaleItem } from '../types';
import { Plus, Trash2, Search, FileText, CheckCircle, XCircle, Printer, X } from 'lucide-react';

export const Quotes = () => {
  const { clients, services, addQuote, quotes, updateQuoteStatus, settings } = useAppStore();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [printQuote, setPrintQuote] = useState<Quote | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [selectedServices, setSelectedServices] = useState<SaleItem[]>([]);
  const [expirationDate, setExpirationDate] = useState('');
  const [discount, setDiscount] = useState(0);

  const handleAddService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setSelectedServices([...selectedServices, {
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        quantity: 1
      }]);
    }
  };

  const handleRemoveService = (index: number) => {
    const newServices = [...selectedServices];
    newServices.splice(index, 1);
    setSelectedServices(newServices);
  };

  const calculateTotal = () => {
    const subtotal = selectedServices.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return Math.max(0, subtotal - discount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || selectedServices.length === 0) return;

    const client = clients.find(c => c.id === clientId);
    const newQuote: Quote = {
      id: Math.random().toString(36).substr(2, 9),
      clientId,
      clientName: client?.name || 'Cliente Desconhecido',
      date: new Date().toISOString(),
      items: selectedServices,
      totalAmount: selectedServices.reduce((acc, item) => acc + item.price, 0),
      discount,
      finalAmount: calculateTotal(),
      status: 'Pendente',
      expirationDate: expirationDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    addQuote(newQuote);
    setView('list');
    // Reset form
    setSelectedServices([]);
    setClientId('');
    setDiscount(0);
    setExpirationDate('');
  };

  const statusColors: Record<string, string> = {
    'Pendente': 'bg-yellow-100 text-yellow-700',
    'Aprovado': 'bg-green-100 text-green-700',
    'Rejeitado': 'bg-red-100 text-red-700',
    'Finalizado': 'bg-blue-100 text-blue-700'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Orçamentos</h1>
        {view === 'list' && (
          <button 
            onClick={() => setView('new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Nova Orçamento
          </button>
        )}
      </div>

      {view === 'new' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between mb-6">
            <h2 className="text-lg font-bold">Criar Orçamento</h2>
            <button onClick={() => setView('list')} className="text-slate-500 hover:text-slate-700">Cancelar</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cliente</label>
                <select 
                  className="w-full border-slate-300 rounded-lg p-2.5 border bg-white"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Validade</label>
                <input 
                    type="date"
                    className="w-full border-slate-300 rounded-lg p-2.5 border bg-white"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Adicionar Serviço</label>
                <select 
                  className="w-full border-slate-300 rounded-lg p-2.5 border bg-white"
                  onChange={(e) => { handleAddService(e.target.value); e.target.value = ""; }}
                >
                  <option value="">Selecione para adicionar...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                </select>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Serviço</th>
                    <th className="px-4 py-3 w-32">Valor</th>
                    <th className="px-4 py-3 w-20">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedServices.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3">{item.serviceName}</td>
                      <td className="px-4 py-3">R$ {item.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => handleRemoveService(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {selectedServices.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Nenhum serviço selecionado</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Desconto (R$)</label>
                <input 
                  type="number"
                  className="w-full border-slate-300 rounded-lg p-2.5 border bg-white"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-6">
              <div className="text-right w-full">
                <span className="text-slate-500 mr-4">Total do Orçamento:</span>
                <span className="text-3xl font-bold text-slate-800">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium shadow-sm">Salvar Orçamento</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-4 border-b border-slate-100 flex gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                <input type="text" placeholder="Buscar orçamento..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none" />
             </div>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Serviços</th>
                <th className="px-6 py-4">Validade</th>
                <th className="px-6 py-4 text-right">Valor Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">{new Date(quote.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-medium">{quote.clientName}</td>
                  <td className="px-6 py-4 text-slate-500">{quote.items.length} item(s)</td>
                  <td className="px-6 py-4">{new Date(quote.expirationDate!).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-700">
                    R$ {quote.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[quote.status]}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                        {quote.status === 'Pendente' && (
                          <>
                            <button onClick={() => updateQuoteStatus(quote.id, 'Aprovado')} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Aprovar">
                                <CheckCircle size={18} />
                            </button>
                            <button onClick={() => updateQuoteStatus(quote.id, 'Rejeitado')} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Rejeitar">
                                <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button onClick={() => setPrintQuote(quote)} className="text-slate-600 hover:bg-slate-100 p-1 rounded" title="Imprimir">
                            <Printer size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Nenhum orçamento registrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Printable Quote Overlay */}
      {printQuote && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto animate-fade-in">
          {/* Controls - Hidden on Print */}
          <div className="fixed top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center print:hidden shadow-md">
            <h2 className="font-semibold">Visualização de Impressão</h2>
            <div className="flex gap-4">
              <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2">
                <Printer size={18} /> Imprimir
              </button>
              <button onClick={() => setPrintQuote(null)} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded flex items-center gap-2">
                <X size={18} /> Fechar
              </button>
            </div>
          </div>

          {/* Printable Area (A4 Simulation) */}
          <div className="max-w-[21cm] mx-auto mt-20 mb-20 p-[2cm] bg-white shadow-2xl print:shadow-none print:m-0 print:p-8 text-slate-800">
             
             {/* Header */}
             <div className="flex justify-between items-start border-b border-slate-800 pb-6 mb-8">
                <div>
                   <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">{settings.name}</h1>
                   <div className="text-sm text-slate-600 mt-2 space-y-1">
                      <p>{settings.cnpj}</p>
                      <p>{settings.address}</p>
                      <p>{settings.taxRegime}</p>
                   </div>
                </div>
                <div className="text-right">
                   <h2 className="text-4xl font-light text-slate-300">ORÇAMENTO</h2>
                   <p className="font-bold text-slate-700 mt-2">#{printQuote.id.substr(0, 6).toUpperCase()}</p>
                   <p className="text-sm text-slate-500">Data: {new Date(printQuote.date).toLocaleDateString('pt-BR')}</p>
                   <p className="text-sm text-slate-500">Validade: {new Date(printQuote.expirationDate!).toLocaleDateString('pt-BR')}</p>
                </div>
             </div>

             {/* Client Info */}
             <div className="mb-8">
                <h3 className="text-xs font-bold uppercase text-slate-400 border-b mb-2 pb-1">Dados do Cliente</h3>
                <div className="text-sm">
                   <p className="font-bold text-lg">{printQuote.clientName}</p>
                   {(() => {
                      const client = clients.find(c => c.id === printQuote.clientId);
                      return client ? (
                        <>
                           <p>{client.document}</p>
                           <p>{client.address}</p>
                           <p>{client.email} | {client.phone}</p>
                        </>
                      ) : null;
                   })()}
                </div>
             </div>

             {/* Items Table */}
             <div className="mb-8">
               <table className="w-full text-sm">
                  <thead>
                     <tr className="border-b-2 border-slate-800">
                        <th className="text-left py-2 font-bold text-slate-700">Descrição do Serviço</th>
                        <th className="text-right py-2 font-bold text-slate-700 w-24">Qtd.</th>
                        <th className="text-right py-2 font-bold text-slate-700 w-32">Preço Unit.</th>
                        <th className="text-right py-2 font-bold text-slate-700 w-32">Total</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                     {printQuote.items.map((item, i) => (
                        <tr key={i}>
                           <td className="py-3 text-slate-700">{item.serviceName}</td>
                           <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                           <td className="py-3 text-right text-slate-600">R$ {item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                           <td className="py-3 text-right font-medium text-slate-800">
                              R$ {(item.price * item.quantity).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>

             {/* Totals */}
             <div className="flex justify-end mb-12">
                <div className="w-64 space-y-2">
                   <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span>R$ {printQuote.totalAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                   </div>
                   {printQuote.discount > 0 && (
                     <div className="flex justify-between text-sm text-slate-600">
                        <span>Desconto</span>
                        <span>- R$ {printQuote.discount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-xl font-bold text-slate-900 border-t-2 border-slate-800 pt-2">
                      <span>Total</span>
                      <span>R$ {printQuote.finalAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                   </div>
                </div>
             </div>

             {/* Signatures */}
             <div className="mt-20 pt-8 border-t border-slate-200 grid grid-cols-2 gap-12">
                <div className="text-center">
                   <div className="border-b border-black mb-2 mx-8"></div>
                   <p className="text-sm font-medium">{settings.name}</p>
                </div>
                <div className="text-center">
                   <div className="border-b border-black mb-2 mx-8"></div>
                   <p className="text-sm font-medium">{printQuote.clientName}</p>
                   <p className="text-xs text-slate-500">De acordo</p>
                </div>
             </div>

          </div>
        </div>
      )}
    </div>
  );
};