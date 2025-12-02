import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store';
import { PaymentMethod, Sale, SaleItem, Quote } from '../types';
import { Plus, Trash2, Search, FileText, ShoppingCart, User, CreditCard, ChevronRight, CheckCircle, Download, X, AlertCircle, Minus, Printer, MapPin, AlertTriangle } from 'lucide-react';

export const Sales = () => {
  const { clients, services, bankAccounts, addSale, sales, quotes, updateQuoteStatus, settings } = useAppStore();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New Success Modal
  const [lastSale, setLastSale] = useState<Sale | null>(null); // Track last sale for success modal
  const [importedQuoteId, setImportedQuoteId] = useState<string | null>(null);
  const [printReceiptSale, setPrintReceiptSale] = useState<Sale | null>(null); // For printing receipt

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
  const [serviceLocation, setServiceLocation] = useState('');

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

  // Logic to handle "Editing Total" -> Reverse calculate discount
  const handleTotalChange = (newTotal: number) => {
    // Note: When manually changing total, we assume this is the Desired Final Amount.
    // Logic: Subtotal - Discount - Retentions(if deducted) = NewTotal
    // Discount = Subtotal - Retentions(if deducted) - NewTotal
    
    // We need to know current retentions.
    // Retentions are percentage based. If discount changes, does retention change?
    // Usually Retentions are on GROSS or (GROSS-UNCONDITIONAL DISCOUNT).
    // Let's assume Retentions are based on (Subtotal - Discount). This makes it circular.
    // SIMPLIFICATION: We will calculate Retentions based on the effective price of items.
    // To handle manual total override properly with retentions is complex.
    // Let's simplified: Discount = Subtotal - NewTotal (ignoring retention toggle for the manual input calc for now, 
    // or assume user is entering the "Pre-Retention" value if retentions exist).
    
    // Actually, to avoid circular logic confusion for the user:
    // Manual Total Editing sets the "Total After Discount".
    const newDiscount = subtotal - newTotal;
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
      // Tax Base: We will use the proportional discount logic or simply (ItemPrice * Qty).
      // Standard practice: Retentions apply to the service value.
      // If there is a global discount, it usually reduces the tax base.
      // Ratio of Final/Subtotal
      const ratio = subtotal > 0 ? (Math.max(0, subtotal - discount) / subtotal) : 1;

      selectedServices.forEach(item => {
          const service = services.find(s => s.id === item.serviceId);
          if (service) {
              // Base for this item (considering global discount distribution)
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
    
    // Calculate Retentions before showing modal
    const retAmount = calculateRetentionsValue();
    setCalculatedRetentions(retAmount);
    setDeductRetentions(true); // Default to YES

    setShowConfirmation(true);
  };

  const handleFinalizeSale = () => {
    // If no client selected, use "Unknown"
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
      finalAmount: totalFinal, // Uses deductRetentions logic
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

    setLastSale(newSale); // Store for success modal
    setShowConfirmation(false);
    setShowSuccessModal(true); // Show success instead of going back immediately
    
    // Reset Form
    setSelectedServices([]);
    setClientId('');
    setClientSearch('');
    setDiscount(0);
    setInstallments(1);
    setPaymentMethod(PaymentMethod.CASH);
    setImportedQuoteId(null);
    setServiceLocation('');
    setCalculatedRetentions(0);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setView('list');
    setLastSale(null);
  }

  // Close client dropdown when clicking outside (simple effect)
  useEffect(() => {
    const handleClickOutside = () => setShowClientList(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
                <span className="font-semibold text-slate-800">Nova Venda (POS)</span>
             </div>
             
             <button 
               onClick={() => setShowImportModal(true)}
               className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-200 transition-colors"
             >
               <Download size={16} /> Importar Orçamento
             </button>
          </div>

          <form onSubmit={handlePreSubmit} className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
            
            {/* LEFT COLUMN: Services Catalog & Cart */}
            <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
               
               {/* Search Bar */}
               <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar serviço para adicionar..." 
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={serviceSearch}
                      onChange={e => setServiceSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
               </div>

               <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                  
                  {/* Service List (Catalog) */}
                  <div className="lg:w-1/3 border-r border-slate-100 overflow-y-auto bg-slate-50">
                    <div className="p-2 space-y-2">
                       {filteredServices.map(s => (
                         <button 
                           key={s.id} 
                           type="button"
                           onClick={() => handleAddService(s.id)}
                           className="w-full text-left p-3 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg shadow-sm transition-all active:scale-95 group"
                         >
                            <div className="font-medium text-slate-700 group-hover:text-blue-700">{s.name}</div>
                            <div className="text-sm font-bold text-slate-500 group-hover:text-blue-600">R$ {s.price.toFixed(2)}</div>
                         </button>
                       ))}
                       {filteredServices.length === 0 && (
                         <div className="p-4 text-center text-slate-400 text-sm">Nenhum serviço encontrado</div>
                       )}
                    </div>
                  </div>

                  {/* Cart Table */}
                  <div className="lg:w-2/3 flex flex-col overflow-hidden bg-white">
                      <div className="flex-1 overflow-y-auto p-0">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-white text-slate-500 font-semibold border-b sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-4 py-3">Item</th>
                              <th className="px-2 py-3 w-32 text-center">Qtd</th>
                              <th className="px-2 py-3 w-28 text-center">Preço Un.</th>
                              <th className="px-4 py-3 w-24 text-right">Total</th>
                              <th className="px-2 py-3 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedServices.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 group">
                                <td className="px-4 py-3 font-medium text-slate-700">
                                  {item.serviceName}
                                </td>
                                
                                {/* Quantity Controls */}
                                <td className="px-2 py-3">
                                  <div className="flex items-center justify-center bg-slate-100 rounded-lg p-1 w-fit mx-auto">
                                    <button 
                                      type="button"
                                      onClick={() => handleUpdateItem(idx, 'quantity', item.quantity - 1)}
                                      className="p-1 hover:bg-white rounded shadow-sm text-slate-600 disabled:opacity-50"
                                      disabled={item.quantity <= 1}
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center font-semibold text-slate-700">{item.quantity}</span>
                                    <button 
                                      type="button"
                                      onClick={() => handleUpdateItem(idx, 'quantity', item.quantity + 1)}
                                      className="p-1 hover:bg-white rounded shadow-sm text-blue-600"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                </td>

                                {/* Editable Price */}
                                <td className="px-2 py-3">
                                  <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-xs text-slate-400">R$</span>
                                    <input 
                                      type="number"
                                      step="0.01"
                                      className="w-full pl-6 pr-1 py-1 text-sm border border-slate-200 rounded text-center focus:ring-1 focus:ring-blue-500 outline-none"
                                      value={item.price}
                                      onChange={(e) => handleUpdateItem(idx, 'price', Number(e.target.value))}
                                    />
                                  </div>
                                </td>

                                <td className="px-4 py-3 text-right font-bold text-slate-700">
                                  R$ {(item.price * item.quantity).toFixed(2)}
                                </td>
                                
                                <td className="px-2 py-3 text-center">
                                  <button type="button" onClick={() => handleRemoveService(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {selectedServices.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-4 py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                                  <div className="bg-slate-50 p-4 rounded-full">
                                    <ShoppingCart size={40} className="opacity-20"/>
                                  </div>
                                  <p>Selecione serviços na lista ao lado</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                  </div>
               </div>
            </div>

            {/* RIGHT COLUMN: Checkout */}
            <div className="flex flex-col gap-4 bg-white rounded-xl shadow-sm border border-slate-100 overflow-y-auto">
               
               {/* Client Section */}
               <div className="p-6 border-b border-slate-100 space-y-4">
                  <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    <User size={20} className="text-blue-600"/> 
                    Cliente <span className="text-xs font-normal text-slate-400 ml-auto">(Opcional)</span>
                  </h2>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                       type="text"
                       placeholder="Buscar ou selecionar cliente..."
                       className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                       value={clientSearch}
                       onChange={(e) => {
                          setClientSearch(e.target.value);
                          setClientId(''); // Reset ID if typing manual name
                          setShowClientList(true);
                       }}
                       onFocus={() => setShowClientList(true)}
                       onClick={(e) => e.stopPropagation()} // Prevent closing immediately
                    />
                    
                    {/* Dropdown Results */}
                    {showClientList && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {filteredClients.length > 0 ? filteredClients.map(c => (
                           <div 
                             key={c.id} 
                             className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                             onClick={(e) => {
                               e.stopPropagation();
                               setClientId(c.id);
                               setClientSearch(c.name);
                               setShowClientList(false);
                             }}
                           >
                             <div className="font-medium text-slate-800">{c.name}</div>
                             <div className="text-xs text-slate-500">{c.document || 'Sem Documento'}</div>
                           </div>
                        )) : (
                           <div className="p-3 text-slate-400 text-sm text-center">Nenhum cliente encontrado</div>
                        )}
                      </div>
                    )}
                  </div>
               </div>

               {/* Service Location */}
               <div className="p-6 border-b border-slate-100 space-y-4">
                   <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    <MapPin size={20} className="text-blue-600"/> 
                    Local da Prestação
                  </h2>
                  <div>
                      <input 
                         type="text"
                         className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                         placeholder="Cidade - UF (Ex: Foz do Iguaçu - PR)"
                         value={serviceLocation}
                         onChange={(e) => setServiceLocation(e.target.value)}
                      />
                      <p className="text-xs text-slate-500 mt-1">Importante para emissão correta da NFSe.</p>
                  </div>
               </div>

               {/* Payment Details */}
               <div className="p-6 space-y-4 flex-1">
                  <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    <CreditCard size={20} className="text-blue-600"/> 
                    Pagamento
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Forma</label>
                        <select 
                        className="w-full border-slate-300 rounded-lg p-2 border bg-white text-sm"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        >
                        {Object.values(PaymentMethod).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                        </select>
                    </div>

                    {(paymentMethod === PaymentMethod.CREDIT_CARD || paymentMethod === PaymentMethod.BOLETO) ? (
                        <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Parcelas</label>
                        <select
                           className="w-full border-slate-300 rounded-lg p-2 border bg-white text-sm"
                           value={installments}
                           onChange={(e) => setInstallments(Number(e.target.value))}
                        >
                           {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                              <option key={n} value={n}>{n}x</option>
                           ))}
                        </select>
                        </div>
                    ) : (
                        <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Conta Destino</label>
                        <select 
                            className="w-full border-slate-300 rounded-lg p-2 border bg-white text-sm"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            required
                        >
                            <option value="">Selecione...</option>
                            {bankAccounts.map(b => (
                            <option key={b.id} value={b.id}>{b.bankName} - {b.holder}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">Selecione onde o dinheiro entrará (Ex: Caixa Físico)</p>
                        </div>
                    )}
                  </div>
               </div>

               {/* Totals Section */}
               <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-600">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500">Desconto</span>
                    <div className="flex items-center gap-2">
                       <span className="text-slate-400 text-xs">(Auto)</span>
                       <span className="font-medium text-red-500">- R$ {discount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-200">
                    <span className="text-lg font-bold text-slate-800">Total Final</span>
                    <div className="relative w-40">
                       <span className="absolute left-3 top-2 text-blue-600 font-bold">R$</span>
                       <input 
                         type="number"
                         step="0.01"
                         className="w-full pl-10 pr-2 py-1.5 text-right font-bold text-xl text-blue-600 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                         value={totalAfterDiscount}
                         onChange={(e) => handleTotalChange(Number(e.target.value))}
                       />
                    </div>
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
                  <th className="px-6 py-4 text-center">Recibo</th>
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
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">Nenhuma venda registrada ainda.</td>
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
                   <p className="text-xs">{settings.address}</p>
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