import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store';
import { PaymentMethod, Sale, SaleItem, Quote } from '../types';
import { Plus, Trash2, Search, FileText, ShoppingCart, User, CreditCard, ChevronRight, CheckCircle, Download, X, AlertCircle, Minus, Printer, MapPin, AlertTriangle, UserPen, Package } from 'lucide-react';

export const Sales = () => {
  const { clients, services, bankAccounts, addSale, deleteSale, updateSaleClient, sales, quotes, updateQuoteStatus, settings } = useAppStore();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New Success Modal
  const [lastSale, setLastSale] = useState<Sale | null>(null); // Track last sale for success modal
  const [importedQuoteId, setImportedQuoteId] = useState<string | null>(null);
  const [printReceiptSale, setPrintReceiptSale] = useState<Sale | null>(null); // For printing receipt
  
  // Delete Modal State
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  // Edit Client Modal State
  const [editingClientSaleId, setEditingClientSaleId] = useState<string | null>(null);
  const [newClientId, setNewClientId] = useState('');

  // Form State
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);

  const [selectedServices, setSelectedServices] = useState<SaleItem[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [installments, setInstallments] = useState(1);
  const [bankAccount, setBankAccount] = useState('');
  const [discount, setDiscount] = useState(0);
  
  // Default Location from Settings
  const defaultLocation = settings.address.city && settings.address.state 
    ? `${settings.address.city} - ${settings.address.state}` 
    : '';
  const [serviceLocation, setServiceLocation] = useState(defaultLocation);

  // Retention States
  const [calculatedRetentions, setCalculatedRetentions] = useState(0);
  const [deductRetentions, setDeductRetentions] = useState(true);

  // Computed Subtotal
  const subtotal = useMemo(() => {
    return selectedServices.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [selectedServices]);

  // Computed Total (Gross - Discount)
  const totalAfterDiscount = Math.max(0, subtotal - discount);

  // Computed Final Total (Gross - Discount - (Retentions if checked))
  const totalFinal = deductRetentions ? Math.max(0, totalAfterDiscount - calculatedRetentions) : totalAfterDiscount;

  // Filtered Lists
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.document.includes(clientSearch)
  );

  // Add service to cart
  const handleAddService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      // Check if already in cart
      const existingIndex = selectedServices.findIndex(i => i.serviceId === serviceId);
      
      if (existingIndex >= 0) {
        // Increment quantity
        handleUpdateItem(existingIndex, 'quantity', selectedServices[existingIndex].quantity + 1);
      } else {
        setSelectedServices([...selectedServices, {
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          quantity: 1
        }]);
      }
    }
  };

  const handleRemoveService = (index: number) => {
    const newServices = [...selectedServices];
    newServices.splice(index, 1);
    setSelectedServices(newServices);
  };

  const handleUpdateItem = (index: number, field: keyof SaleItem, value: number) => {
    const newServices = [...selectedServices];
    if (field === 'quantity' && value < 1) return; // Prevent 0 quantity
    newServices[index] = { ...newServices[index], [field]: value };
    setSelectedServices(newServices);
  };

  const handleCurrencyInput = (value: string, setter: (val: number) => void) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Convert to number (cents)
    const numberValue = Number(digits) / 100;
    setter(numberValue);
  };

  const handleTotalChange = (newTotal: number) => {
    const newDiscount = Math.max(0, subtotal - newTotal);
    setDiscount(newDiscount);
  };

  const handleImportQuote = (quote: Quote) => {
    setClientId(quote.clientId);
    const client = clients.find(c => c.id === quote.clientId);
    setClientSearch(client ? client.name : '');
    // Deep copy items
    setSelectedServices(quote.items.map(i => ({...i})));
    setDiscount(quote.discount);
    setImportedQuoteId(quote.id);
    setShowImportModal(false);
  };

  const calculateRetentionsValue = () => {
      let totalRet = 0;
      const ratio = subtotal > 0 ? (Math.max(0, subtotal - discount) / subtotal) : 1;

      selectedServices.forEach(item => {
          const service = services.find(s => s.id === item.serviceId);
          if (service) {
              const itemBase = (item.price * item.quantity) * ratio;
              const pis = itemBase * ((service.pis || 0) / 100);
              const cofins = itemBase * ((service.cofins || 0) / 100);
              const csll = itemBase * ((service.csll || 0) / 100);
              const ir = itemBase * ((service.ir || 0) / 100);
              const inss = itemBase * ((service.inss || 0) / 100);
              totalRet += (pis + cofins + csll + ir + inss);
          }
      });
      return totalRet;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
        alert("Adicione pelo menos um serviço.");
        return;
    }
    const retAmount = calculateRetentionsValue();
    setCalculatedRetentions(retAmount);
    setDeductRetentions(true);
    setShowConfirmation(true);
  };

  const handleFinalizeSale = () => {
    let finalClientId = clientId;
    let finalClientName = 'CLIENTE NÃO INFORMADO';

    if (clientId) {
        const client = clients.find(c => c.id === clientId);
        if (client) finalClientName = client.name;
    } else if (clientSearch && !clientId) {
         finalClientName = 'CLIENTE NÃO INFORMADO'; 
    }

    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: finalClientId,
      clientName: finalClientName,
      date: new Date().toISOString(),
      items: selectedServices,
      totalAmount: subtotal,
      discount,
      finalAmount: totalFinal,
      paymentMethod,
      installmentsCount: installments,
      bankAccountId: bankAccount,
      serviceLocation: serviceLocation,
      retentionAmount: calculatedRetentions,
      deductedRetentions: calculatedRetentions > 0 ? deductRetentions : false
    };

    addSale(newSale);
    
    if (importedQuoteId) {
      updateQuoteStatus(importedQuoteId, 'Finalizado');
    }

    setLastSale(newSale); 
    setShowConfirmation(false);
    setShowSuccessModal(true); 
    
    setSelectedServices([]);
    setClientId('');
    setClientSearch('');
    setDiscount(0);
    setInstallments(1);
    setPaymentMethod(PaymentMethod.CASH);
    setImportedQuoteId(null);
    setServiceLocation(defaultLocation);
    setCalculatedRetentions(0);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setView('list');
    setLastSale(null);
  }

  const handleConfirmDelete = () => {
    if(saleToDelete) {
        deleteSale(saleToDelete.id);
        setSaleToDelete(null);
    }
  };

  // Edit Client Logic
  const handleOpenEditClient = (sale: Sale) => {
      setEditingClientSaleId(sale.id);
      setNewClientId(sale.clientId || '');
  };

  const handleSaveClientChange = () => {
      if (editingClientSaleId && newClientId) {
          updateSaleClient(editingClientSaleId, newClientId);
          setEditingClientSaleId(null);
          setNewClientId('');
      }
  };

  // Close client dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowClientList(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
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
        <div className="flex-1 flex flex-col h-full overflow-hidden">
           {/* Top Bar for New Sale */}
           <div className="flex items-center justify-between mb-4 flex-shrink-0">
             <div className="flex items-center gap-2 text-sm text-slate-500">
                <button onClick={() => setView('list')} className="hover:text-blue-600 hover:underline">Vendas</button>
                <ChevronRight size={16} />
                <span className="font-semibold text-slate-800">Nova Venda (POS)</span>
             </div>
             
             <button 
               onClick={() => setShowImportModal(true)}
               className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-200 transition-colors"
             >
               <Download size={16} /> Importar Orçamento
             </button>
          </div>

          <div className="flex-1 flex gap-4 overflow-hidden">
            
            {/* LEFT: CATALOG (Grid of Cards) */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Search Header */}
                <div className="p-4 border-b border-slate-100 bg-white">
                  <div className="relative max-w-2xl">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar serviço..." 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                      value={serviceSearch}
                      onChange={e => setServiceSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredServices.map(s => (
                             <button 
                                key={s.id}
                                onClick={() => handleAddService(s.id)}
                                className="group relative bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-2xl p-4 text-left transition-all duration-200 flex flex-col justify-between h-32 active:scale-95"
                             >
                                <div className="absolute top-3 right-3 text-slate-300 group-hover:text-blue-500 transition-colors">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 line-clamp-2 pr-6 leading-tight">{s.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{s.description || 'Sem descrição'}</p>
                                </div>
                                <div className="font-bold text-lg text-blue-600">
                                    R$ {s.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </div>
                             </button>
                        ))}
                        {filteredServices.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center text-slate-400 h-64">
                                <Package size={48} className="mb-2 opacity-20"/>
                                <p>Nenhum serviço encontrado.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: CHECKOUT SIDEBAR */}
            <div className="w-[400px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden flex-shrink-0 z-10">
                <form onSubmit={handlePreSubmit} className="flex flex-col h-full">
                    
                    {/* Header: Client & Location */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                         {/* Client Search */}
                         <div className="relative">
                            <div className="flex items-center gap-2 mb-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                <User size={12}/> Cliente
                            </div>
                            <input 
                                type="text"
                                placeholder="Buscar cliente (Opcional)..."
                                className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                value={clientSearch}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    setClientId(''); 
                                    setShowClientList(true);
                                }}
                                onFocus={() => setShowClientList(true)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowClientList(true);
                                }}
                            />
                            {/* Dropdown Results */}
                            {showClientList && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto left-0">
                                    {filteredClients.length > 0 ? filteredClients.map(c => (
                                    <div 
                                        key={c.id} 
                                        className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setClientId(c.id);
                                            setClientSearch(c.name);
                                            setShowClientList(false);
                                        }}
                                    >
                                        <div className="font-medium text-sm text-slate-800">{c.name}</div>
                                        <div className="text-xs text-slate-500">{c.document || 'Sem Documento'}</div>
                                    </div>
                                    )) : (
                                    <div className="p-3 text-slate-400 text-xs text-center">Nenhum cliente encontrado</div>
                                    )}
                                </div>
                            )}
                         </div>

                         {/* Location */}
                         <div>
                            <div className="flex items-center gap-2 mb-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                <MapPin size={12}/> Local da Prestação
                            </div>
                            <input 
                                type="text"
                                className="w-full border border-slate-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                placeholder="Cidade - UF"
                                value={serviceLocation}
                                onChange={(e) => setServiceLocation(e.target.value)}
                            />
                         </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                        {selectedServices.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0 animate-fade-in">
                                <div className="flex-1">
                                    <div className="font-medium text-slate-800 text-sm line-clamp-2">{item.serviceName}</div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center bg-slate-100 rounded-lg">
                                            <button 
                                                type="button"
                                                onClick={() => handleUpdateItem(idx, 'quantity', item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                                className="p-1 px-2 hover:text-blue-600 disabled:opacity-30"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                            <button 
                                                type="button"
                                                onClick={() => handleUpdateItem(idx, 'quantity', item.quantity + 1)}
                                                className="p-1 px-2 hover:text-blue-600"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <div className="flex items-center text-xs text-slate-400">x</div>
                                        <div className="relative max-w-[80px]">
                                            <span className="absolute left-1.5 top-1 text-slate-400 text-xs">R$</span>
                                            <input 
                                                type="number"
                                                className="w-full pl-6 pr-1 py-0.5 border-b border-slate-200 focus:border-blue-500 focus:outline-none text-xs font-medium text-slate-600"
                                                value={item.price}
                                                onChange={(e) => handleUpdateItem(idx, 'price', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-800 text-sm">R$ {(item.price * item.quantity).toFixed(2)}</div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveService(idx)}
                                        className="text-slate-300 hover:text-red-500 mt-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {selectedServices.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 py-8 opacity-60">
                                <ShoppingCart size={32} />
                                <p className="text-sm">Carrinho vazio</p>
                            </div>
                        )}
                    </div>

                    {/* Footer: Payment & Totals */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                        {/* Payment Method Row */}
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Pagamento</label>
                                <select 
                                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                >
                                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                             </div>
                             
                             {(paymentMethod === PaymentMethod.CREDIT_CARD || paymentMethod === PaymentMethod.BOLETO) ? (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Parcelas</label>
                                    <select
                                        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                                        value={installments}
                                        onChange={(e) => setInstallments(Number(e.target.value))}
                                    >
                                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
                                    </select>
                                </div>
                             ) : (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Conta Destino</label>
                                    <select 
                                        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                                        value={bankAccount}
                                        onChange={(e) => setBankAccount(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName}</option>)}
                                    </select>
                                </div>
                             )}
                        </div>

                        <div className="border-t border-slate-200 pt-3 space-y-1">
                             <div className="flex justify-between text-xs text-slate-500">
                                <span>Subtotal</span>
                                <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between text-xs items-center">
                                <span className="text-slate-500">Desconto</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-400 text-[10px]">- R$</span>
                                    <input 
                                        type="text"
                                        className="w-20 text-right border-b border-slate-300 text-xs focus:outline-none text-red-500 bg-transparent p-0"
                                        value={discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        onChange={(e) => handleCurrencyInput(e.target.value, setDiscount)}
                                    />
                                </div>
                             </div>
                             <div className="flex justify-between items-end pt-2">
                                <span className="text-sm font-bold text-slate-800 mb-1">Total Final</span>
                                <div className="flex items-end gap-1">
                                    <span className="text-sm font-bold text-blue-600 mb-1">R$</span>
                                    <input 
                                        type="text"
                                        className="w-32 text-right text-2xl font-bold text-blue-600 bg-transparent border-none focus:outline-none p-0"
                                        value={totalAfterDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        onChange={(e) => handleCurrencyInput(e.target.value, handleTotalChange)}
                                    />
                                </div>
                             </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-green-200 flex items-center justify-center gap-2 transform transition-all active:scale-95"
                        >
                            Finalizar Venda
                        </button>
                    </div>
                </form>
            </div>
          </div>
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
                  <th className="px-6 py-4 text-center">Recibo</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-medium">
                        {sale.clientName === 'CLIENTE NÃO INFORMADO' 
                            ? <span className="text-slate-400 italic">Cliente não informado</span> 
                            : sale.clientName}
                    </td>
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
                    <td className="px-6 py-4 text-center">
                      <button 
                         onClick={() => setPrintReceiptSale(sale)}
                         className="text-slate-500 hover:text-slate-700 p-1 hover:bg-slate-100 rounded"
                         title="Imprimir Recibo"
                      >
                         <Printer size={18}/>
                      </button>
                    </td>
                     <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                      <button
                         onClick={() => handleOpenEditClient(sale)}
                         className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                         title="Trocar Cliente"
                      >
                         <UserPen size={18} />
                      </button>
                      <button 
                         onClick={() => setSaleToDelete(sale)}
                         className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                         title="Excluir Venda"
                      >
                         <Trash2 size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">Nenhuma venda registrada ainda.</td>
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
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[95vh] overflow-y-auto">
              <div className="bg-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
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
                       {clientId 
                          ? clients.find(c => c.id === clientId)?.name 
                          : <span className="text-slate-400 italic">CLIENTE NÃO INFORMADO</span>
                       }
                    </p>
                 </div>

                 {/* Items Summary */}
                 <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Resumo do Pedido</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                       {selectedServices.map((item, i) => (
                          <li key={i} className="flex justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                             <div>
                               <span className="font-semibold text-xs text-slate-500 mr-2">{item.quantity}x</span>
                               <span>{item.serviceName}</span>
                             </div>
                             <span className="font-mono">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                       ))}
                    </ul>
                 </div>

                 {/* Retentions Logic */}
                 {calculatedRetentions > 0 && (
                     <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
                           <AlertTriangle size={16}/> Retenções Federais Detectadas
                        </h4>
                        <div className="mb-3 text-sm text-amber-700">
                           <p>Total de Retenções (PIS/COFINS/CSLL/IR/INSS): <strong>R$ {calculatedRetentions.toFixed(2)}</strong></p>
                        </div>
                        
                        <div className="space-y-3 bg-white p-3 rounded border border-amber-100">
                            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Deseja descontar do financeiro?</p>
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    checked={deductRetentions} 
                                    onChange={() => setDeductRetentions(true)}
                                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-slate-800">Sim, receber o valor líquido</span>
                                    <span className="block text-xs text-slate-500">O contas a receber terá o valor de <strong>R$ {(totalAfterDiscount - calculatedRetentions).toFixed(2)}</strong></span>
                                </div>
                            </label>
                            
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    checked={!deductRetentions} 
                                    onChange={() => setDeductRetentions(false)}
                                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-slate-800">Não, receber o valor bruto</span>
                                    <span className="block text-xs text-slate-500">O contas a receber terá o valor de <strong>R$ {totalAfterDiscount.toFixed(2)}</strong></span>
                                </div>
                            </label>
                        </div>

                        {!deductRetentions && (
                            <div className="mt-2 text-xs text-amber-800 font-medium bg-amber-100 p-2 rounded">
                                Atenção: Haverá divergência entre o valor financeiro e o valor líquido da nota fiscal.
                            </div>
                        )}
                     </div>
                 )}

                 {/* Financials */}
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                       <span>Subtotal</span>
                       <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-500">
                       <span>Desconto</span>
                       <span>- R$ {discount.toFixed(2)}</span>
                    </div>
                    
                    {calculatedRetentions > 0 && deductRetentions && (
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Retenções (Deduzidas)</span>
                            <span>- R$ {calculatedRetentions.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-2xl font-bold text-slate-800 pt-2 border-t border-slate-200">
                       <span>Total a Receber</span>
                       <span>R$ {totalFinal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
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

      {/* SUCCESS MODAL with Receipt Print Option */}
      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 animate-fade-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Venda Realizada!</h3>
              <p className="text-slate-500 mb-6">A venda foi registrada com sucesso.</p>
              
              <div className="space-y-3">
                 <button 
                    onClick={() => {
                        setPrintReceiptSale(lastSale);
                        handleCloseSuccess();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2"
                 >
                    <Printer size={20} /> Imprimir Recibo
                 </button>
                 <button 
                    onClick={handleCloseSuccess}
                    className="w-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-lg font-medium"
                 >
                    Fechar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* DANGER DELETE MODAL */}
      {saleToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                 <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-red-700 mb-2">Excluir Venda?</h3>
                 <p className="text-sm text-red-600 font-medium">Esta ação é irreversível.</p>
              </div>
              
              <div className="p-6 space-y-4">
                 <div className="text-sm text-slate-600 space-y-2 bg-slate-50 p-4 rounded border border-slate-100">
                    <p>Ao confirmar, o sistema irá excluir permanentemente:</p>
                    <ul className="list-disc pl-5 space-y-1 font-medium text-slate-700">
                        <li>A venda e seus itens.</li>
                        <li>A nota fiscal (pendente ou emitida).</li>
                        <li>Todas as parcelas do Contas a Receber (pagas ou não).</li>
                        <li>Todos os lançamentos financeiros (caixa) vinculados.</li>
                    </ul>
                 </div>
                 
                 <div className="flex gap-3 pt-2">
                    <button 
                        onClick={() => setSaleToDelete(null)}
                        className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirmDelete}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm"
                    >
                        Sim, Excluir Tudo
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {editingClientSaleId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <UserPen size={20} className="text-blue-500"/> Alterar Cliente da Venda
                    </h3>
                    <button onClick={() => setEditingClientSaleId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600">
                        Selecione o novo cliente para esta venda. Esta alteração será refletida no contas a receber, notas fiscais e extrato.
                    </p>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Novo Cliente</label>
                        <select 
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                            value={newClientId}
                            onChange={(e) => setNewClientId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button 
                            onClick={() => setEditingClientSaleId(null)}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveClientChange}
                            disabled={!newClientId}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm disabled:opacity-50"
                        >
                            Salvar Alteração
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* PRINT RECEIPT OVERLAY */}
      {printReceiptSale && (
        <div className="fixed inset-0 z-50 bg-slate-800/90 overflow-auto flex items-start justify-center p-4">
          <div className="bg-white shadow-2xl w-full max-w-[80mm] min-h-[100mm] print:shadow-none print:w-auto print:max-w-none mx-auto my-8 print:m-0">
             
             {/* Print Controls (Hidden when printing) */}
             <div className="flex justify-between items-center p-4 bg-slate-100 print:hidden border-b">
                <span className="font-bold text-slate-700">Visualizar Recibo</span>
                <div className="flex gap-2">
                   <button onClick={() => window.print()} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"><Printer size={14}/> Imprimir</button>
                   <button onClick={() => setPrintReceiptSale(null)} className="bg-slate-300 text-slate-700 px-3 py-1 rounded text-sm hover:bg-slate-400">Fechar</button>
                </div>
             </div>

             {/* RECEIPT CONTENT (Thermal Printer Style / A4 Simplified) */}
             <div className="p-4 text-sm font-mono leading-tight text-slate-900">
                
                {/* Header */}
                <div className="text-center border-b border-dashed border-slate-400 pb-4 mb-4">
                   <h2 className="font-bold text-lg uppercase">{settings.name}</h2>
                   <p className="text-xs">{settings.cnpj}</p>
                   <p className="text-xs">{settings.address.street}, {settings.address.number} - {settings.address.neighborhood}, {settings.address.city}/{settings.address.state}</p>
                   <p className="mt-2 font-bold">RECIBO DE VENDA #{printReceiptSale.id.substr(0,4)}</p>
                   <p className="text-xs">{new Date(printReceiptSale.date).toLocaleString('pt-BR')}</p>
                </div>

                {/* Client */}
                <div className="mb-4">
                   <p className="font-bold">CLIENTE:</p>
                   <p>{printReceiptSale.clientName}</p>
                   {(() => {
                      const c = clients.find(cl => cl.id === printReceiptSale.clientId);
                      return c && c.document ? <p className="text-xs">CPF/CNPJ: {c.document}</p> : null;
                   })()}
                </div>

                {/* Items */}
                <div className="mb-4 border-b border-dashed border-slate-400 pb-4">
                   <table className="w-full">
                      <thead>
                        <tr className="text-left">
                           <th className="pb-1">ITEM</th>
                           <th className="pb-1 text-right">QTD</th>
                           <th className="pb-1 text-right">TOT</th>
                        </tr>
                      </thead>
                      <tbody>
                         {printReceiptSale.items.map((item, i) => (
                            <tr key={i}>
                               <td className="py-1 pr-2">
                                  {item.serviceName}
                                  <div className="text-xs text-slate-500">Un: {item.price.toFixed(2)}</div>
                               </td>
                               <td className="py-1 text-right align-top">{item.quantity}</td>
                               <td className="py-1 text-right align-top">{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                {/* Totals */}
                <div className="mb-6">
                   <div className="flex justify-between">
                      <span>SUBTOTAL:</span>
                      <span>{printReceiptSale.totalAmount.toFixed(2)}</span>
                   </div>
                   {printReceiptSale.discount > 0 && (
                     <div className="flex justify-between">
                        <span>DESCONTO:</span>
                        <span>-{printReceiptSale.discount.toFixed(2)}</span>
                     </div>
                   )}
                   {printReceiptSale.retentionAmount && printReceiptSale.deductedRetentions ? (
                        <div className="flex justify-between text-xs mt-1">
                            <span>RETENÇÕES:</span>
                            <span>-{printReceiptSale.retentionAmount.toFixed(2)}</span>
                        </div>
                   ) : null}

                   <div className="flex justify-between font-bold text-lg mt-2">
                      <span>TOTAL:</span>
                      <span>{printReceiptSale.finalAmount.toFixed(2)}</span>
                   </div>
                   <div className="mt-2 text-xs">
                      Forma Pagto: {printReceiptSale.paymentMethod}
                      {printReceiptSale.installmentsCount > 1 && ` (${printReceiptSale.installmentsCount}x)`}
                   </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs mt-8 pt-4 border-t border-dashed border-slate-400">
                   <p>Obrigado pela preferência!</p>
                   <p className="mt-4">_______________________________</p>
                   <p>Assinatura</p>
                </div>

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