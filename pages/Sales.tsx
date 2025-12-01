import React, { useState } from 'react';
import { useAppStore } from '../store';
import { PaymentMethod, Sale, SaleItem, Quote } from '../types';
import { Plus, Trash2, Search, FileText, ShoppingCart, User, CreditCard, ChevronRight, CheckCircle, FileInput, Download, X, AlertCircle } from 'lucide-react';

export const Sales = () => {
  const { clients, services, bankAccounts, addSale, sales, quotes, updateQuoteStatus } = useAppStore();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [importedQuoteId, setImportedQuoteId] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [selectedServices, setSelectedServices] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [installments, setInstallments] = useState(1);
  const [bankAccount, setBankAccount] = useState('');
  const [discount, setDiscount] = useState(0);

  // Add service to cart
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

  const handleImportQuote = (quote: Quote) => {
    setClientId(quote.clientId);
    // Deep copy items to avoid reference issues
    setSelectedServices(quote.items.map(i => ({...i})));
    setDiscount(quote.discount);
    setImportedQuoteId(quote.id);
    setShowImportModal(false);
  };

  // Triggered by the form submit
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || selectedServices.length === 0) {
        alert("Selecione um cliente e adicione pelo menos um serviço.");
        return;
    }
    // Open Confirmation Modal
    setShowConfirmation(true);
  };

  // Triggered by the confirmation modal
  const handleFinalizeSale = () => {
    const client = clients.find(c => c.id === clientId);
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      clientId,
      clientName: client?.name || 'Cliente Desconhecido',
      date: new Date().toISOString(),
      items: selectedServices,
      totalAmount: selectedServices.reduce((acc, item) => acc + item.price, 0),
      discount,
      finalAmount: calculateTotal(),
      paymentMethod,
      installmentsCount: installments,
      bankAccountId: bankAccount
    };

    addSale(newSale);
    
    // Mark quote as finalized if imported
    if (importedQuoteId) {
      updateQuoteStatus(importedQuoteId, 'Finalizado');
    }

    // Reset UI
    setShowConfirmation(false);
    setView('list');
    
    // Reset Form
    setSelectedServices([]);
    setClientId('');
    setDiscount(0);
    setInstallments(1);
    setPaymentMethod(PaymentMethod.CASH);
    setImportedQuoteId(null);
  };

  return (
    <div className="space-y-6">
      {view === 'list' && (
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Vendas</h1>
          <button 
            onClick={() => setView('new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} /> Nova Venda
          </button>
        </div>
      )}

      {view === 'new' ? (
        <div className="h-[calc(100vh-140px)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-sm text-slate-500">
                <button onClick={() => setView('list')} className="hover:text-blue-600 hover:underline">Vendas</button>
                <ChevronRight size={16} />
                <span className="font-semibold text-slate-800">Nova Venda</span>
             </div>
             
             {/* Import Quote Button */}
             <button 
               onClick={() => setShowImportModal(true)}
               className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-200 transition-colors"
             >
               <Download size={16} /> Importar Orçamento
             </button>
          </div>

          <form onSubmit={handlePreSubmit} className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
            
            {/* LEFT COLUMN: Services & Cart */}
            <div className="lg:col-span-2 flex flex-col gap-4 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    <ShoppingCart size={20} className="text-blue-600"/> 
                    Itens da Venda
                  </h2>
               </div>
               
               <div className="p-4 space-y-4">
                  {/* Service Selector */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <select 
                        className="w-full border-slate-300 rounded-lg p-3 border bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={(e) => {
                          handleAddService(e.target.value);
                          e.target.value = "";
                        }}
                      >
                        <option value="">+ Adicionar Serviço...</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
               </div>

               {/* Cart Table */}
               <div className="flex-1 overflow-y-auto px-4 pb-4">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                        <tr>
                          <th className="px-4 py-3">Serviço</th>
                          <th className="px-4 py-3 w-32">Preço Unit.</th>
                          <th className="px-4 py-3 w-20 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedServices.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-700">{item.serviceName}</td>
                            <td className="px-4 py-3">R$ {item.price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <button type="button" onClick={() => handleRemoveService(idx)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {selectedServices.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                              <ShoppingCart size={32} className="opacity-20"/>
                              Nenhum serviço selecionado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
               
               {/* Totals Section inside Left Column (Mobile only) or Bottom */}
               <div className="p-4 bg-slate-50 border-t border-slate-100 lg:hidden">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
               </div>
            </div>

            {/* RIGHT COLUMN: Client & Payment (Checkout) */}
            <div className="flex flex-col gap-4 bg-white rounded-xl shadow-sm border border-slate-100 overflow-y-auto">
               
               {/* Client Section */}
               <div className="p-6 border-b border-slate-100 space-y-4">
                  <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    <User size={20} className="text-blue-600"/> 
                    Cliente
                  </h2>
                  <select 
                    className="w-full border-slate-300 rounded-lg p-3 border bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    <option value="">Selecione o cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
               </div>

               {/* Payment Section */}
               <div className="p-6 space-y-4 flex-1">
                  <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    <CreditCard size={20} className="text-blue-600"/> 
                    Pagamento
                  </h2>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Forma de Pagamento</label>
                    <select 
                      className="w-full border-slate-300 rounded-lg p-2.5 border bg-white"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      {Object.values(PaymentMethod).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Logic: Installments vs Bank Account */}
                  {(paymentMethod === PaymentMethod.CREDIT_CARD || paymentMethod === PaymentMethod.BOLETO) ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Parcelas</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="12"
                        className="w-full border-slate-300 rounded-lg p-2.5 border bg-white"
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Conta de Destino</label>
                      <select 
                        className="w-full border-slate-300 rounded-lg p-2.5 border bg-white"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        required={paymentMethod === PaymentMethod.PIX || paymentMethod === PaymentMethod.DEBIT_CARD}
                      >
                        <option value="">Selecione...</option>
                        {bankAccounts.map(b => (
                          <option key={b.id} value={b.id}>{b.bankName} - {b.holder}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Desconto (R$)</label>
                    <input 
                      type="number"
                      className="w-full border-slate-300 rounded-lg p-2.5 border bg-white"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      placeholder="0,00"
                    />
                  </div>
               </div>

               {/* Finalize Section */}
               <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-600">R$ {selectedServices.reduce((acc, item) => acc + item.price, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-slate-500">Desconto</span>
                    <span className="font-medium text-red-500">- R$ {discount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-200">
                    <span className="text-lg font-bold text-slate-800">Total</span>
                    <span className="text-3xl font-bold text-blue-600">
                      R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon size={24} />
                    Finalizar Venda
                  </button>
               </div>
            </div>
          </form>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar venda por cliente..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Serviços</th>
                  <th className="px-6 py-4">Pagamento</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-medium">{sale.clientName}</td>
                    <td className="px-6 py-4 text-slate-500">{sale.items.length} item(s)</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs border border-slate-200">
                        {sale.paymentMethod} {sale.installmentsCount > 1 ? `(${sale.installmentsCount}x)` : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      R$ {sale.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sale.invoiceId ? (
                        <span className="text-blue-600 cursor-pointer hover:underline flex justify-center items-center gap-1">
                          <FileText size={16}/> Ver
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhuma venda registrada ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* IMPORT QUOTE MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Importar Orçamento</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Cliente</th>
                      <th className="px-6 py-3">Data</th>
                      <th className="px-6 py-3">Valor</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotes.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50">
                         <td className="px-6 py-4 font-medium text-slate-700">{q.clientName}</td>
                         <td className="px-6 py-4">{new Date(q.date).toLocaleDateString('pt-BR')}</td>
                         <td className="px-6 py-4 font-bold text-slate-600">R$ {q.finalAmount.toFixed(2)}</td>
                         <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-full text-xs ${
                             q.status === 'Aprovado' ? 'bg-green-100 text-green-700' : 
                             q.status === 'Rejeitado' ? 'bg-red-100 text-red-700' : 
                             q.status === 'Finalizado' ? 'bg-blue-100 text-blue-700' : 
                             'bg-yellow-100 text-yellow-700'
                           }`}>
                             {q.status}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => handleImportQuote(q)}
                              className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                              Selecionar
                            </button>
                         </td>
                      </tr>
                    ))}
                    {quotes.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum orçamento disponível.</td></tr>
                    )}
                  </tbody>
               </table>
            </div>
            
            <div className="p-4 border-t bg-slate-50 text-right">
               <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUMMARY MODAL */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
              <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                 <h3 className="text-lg font-bold flex items-center gap-2">
                    <AlertCircle size={20} className="text-blue-400"/>
                    Confirmar Venda
                 </h3>
                 <button onClick={() => setShowConfirmation(false)} className="text-slate-400 hover:text-white">
                    <X size={20}/>
                 </button>
              </div>

              <div className="p-6 space-y-6">
                 {/* Client Summary */}
                 <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Cliente</h4>
                    <p className="text-slate-800 font-medium text-lg">
                       {clients.find(c => c.id === clientId)?.name || 'Cliente não identificado'}
                    </p>
                 </div>

                 {/* Items Summary */}
                 <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Resumo do Pedido</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                       {selectedServices.map((item, i) => (
                          <li key={i} className="flex justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                             <span>{item.serviceName}</span>
                             <span className="font-mono">R$ {item.price.toFixed(2)}</span>
                          </li>
                       ))}
                    </ul>
                 </div>

                 {/* Financials */}
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                       <span>Subtotal</span>
                       <span>R$ {selectedServices.reduce((acc, i) => acc + i.price, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-500">
                       <span>Desconto</span>
                       <span>- R$ {discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold text-slate-800 pt-2 border-t border-slate-200">
                       <span>Total Final</span>
                       <span>R$ {calculateTotal().toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                 </div>

                 {/* Payment Details */}
                 <div className="flex gap-4 text-sm bg-blue-50 p-3 rounded text-blue-800 border border-blue-100">
                    <div className="flex-1">
                       <span className="block text-xs font-bold uppercase opacity-70">Método</span>
                       <span className="font-semibold">{paymentMethod}</span>
                    </div>
                    {(paymentMethod === PaymentMethod.CREDIT_CARD || paymentMethod === PaymentMethod.BOLETO) ? (
                        <div className="flex-1 text-right">
                           <span className="block text-xs font-bold uppercase opacity-70">Parcelas</span>
                           <span className="font-semibold">{installments}x</span>
                        </div>
                    ) : (
                        <div className="flex-1 text-right">
                           <span className="block text-xs font-bold uppercase opacity-70">Conta Destino</span>
                           <span className="font-semibold truncate max-w-[120px] inline-block align-bottom">
                              {bankAccounts.find(b => b.id === bankAccount)?.bankName || 'Caixa'}
                           </span>
                        </div>
                    )}
                 </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                 <button 
                    onClick={() => setShowConfirmation(false)} 
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                 >
                    Voltar / Editar
                 </button>
                 <button 
                    onClick={handleFinalizeSale}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg shadow-green-200 flex items-center gap-2 transform transition-all active:scale-95"
                 >
                    <CheckCircle size={18} /> Confirmar Venda
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Simple Icon component for the button above
const CheckCircleIcon = ({ size }: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);