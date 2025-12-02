import React, { useState } from 'react';
import { useAppStore } from '../store';
import { InvoiceStatus, Invoice, Sale, Client, Service } from '../types';
import { FileCheck, FileWarning, Search, ExternalLink, Copy, X, AlertTriangle, Layers } from 'lucide-react';

export const Invoices = () => {
  const { invoices, emitInvoice, emitBatchInvoices, sales, clients, services, settings } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nfNumber, setNfNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'emitted'>('pending');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mirror Modal State
  const [showMirrorModal, setShowMirrorModal] = useState(false);
  const [mirrorData, setMirrorData] = useState<{
      ids: string[],
      client: Client | undefined,
      description: string,
      serviceCode: string,
      cnae: string,
      iss: number,
      competence: string,
      grossAmount: number,
      liquidAmount: number,
      deductedRetentions: boolean,
      retentions: {
          pis: number,
          cofins: number,
          csll: number,
          ir: number,
          inss: number,
          total: number
      }
  } | null>(null);

  const handleEmit = () => {
    if (!nfNumber || !mirrorData) return;
    
    if (mirrorData.ids.length === 1) {
        emitInvoice(mirrorData.ids[0], nfNumber);
    } else {
        emitBatchInvoices(mirrorData.ids, nfNumber);
    }

    setEditingId(null);
    setNfNumber('');
    setShowMirrorModal(false);
    setMirrorData(null);
    setSelectedIds([]);
  };

  const handleOpenMirror = (invoiceIds: string[]) => {
      // Fetch all invoices
      const selectedInvoices = invoices.filter(inv => invoiceIds.includes(inv.id));
      if (selectedInvoices.length === 0) return;

      // Validate Client Consistency
      const firstSaleId = selectedInvoices[0].saleId;
      const firstSale = sales.find(s => s.id === firstSaleId);
      const clientId = firstSale?.clientId;
      const client = clients.find(c => c.id === clientId);

      // Check if all belong to same client
      const allSameClient = selectedInvoices.every(inv => {
          const sale = sales.find(s => s.id === inv.saleId);
          return sale?.clientId === clientId;
      });

      if (!allSameClient) {
          alert("Para agrupar notas, todas devem pertencer ao mesmo cliente.");
          return;
      }

      // Aggregate Data
      let description = '';
      let serviceCode = '';
      let cnae = '';
      let iss = 0;
      let grossAmount = 0;
      
      const retentions = { pis: 0, cofins: 0, csll: 0, ir: 0, inss: 0, total: 0 };
      let anyDeducted = false;

      selectedInvoices.forEach((inv, index) => {
          const sale = sales.find(s => s.id === inv.saleId);
          if (!sale) return;

          if (sale.deductedRetentions) anyDeducted = true;

          // Description Header for this sale
          description += `--- Venda #${sale.id.substr(0,4)} ---\n`;

          const subtotal = sale.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
          const ratio = subtotal > 0 ? (Math.max(0, subtotal - sale.discount) / subtotal) : 1;
          
          grossAmount += Math.max(0, subtotal - sale.discount);

          sale.items.forEach(item => {
              const service = services.find(s => s.id === item.serviceId);
              const itemTotal = (item.price * item.quantity) * ratio;

              description += `${item.quantity}x ${item.serviceName}\n`;
              
              if (!serviceCode && service) {
                  serviceCode = service.itemLCServico || '';
                  cnae = service.cnae || '';
                  iss = service.issAliquot || 0;
              }

              if (service) {
                  retentions.pis += itemTotal * ((service.pis || 0) / 100);
                  retentions.cofins += itemTotal * ((service.cofins || 0) / 100);
                  retentions.csll += itemTotal * ((service.csll || 0) / 100);
                  retentions.ir += itemTotal * ((service.ir || 0) / 100);
                  retentions.inss += itemTotal * ((service.inss || 0) / 100);
              }
          });
          description += '\n';
      });

      retentions.total = retentions.pis + retentions.cofins + retentions.csll + retentions.ir + retentions.inss;
      const liquidAmount = Math.max(0, grossAmount - retentions.total);
      const competence = new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });

      setMirrorData({
          ids: invoiceIds,
          client,
          description,
          serviceCode,
          cnae,
          iss,
          competence,
          grossAmount,
          liquidAmount,
          deductedRetentions: anyDeducted,
          retentions
      });
      setShowMirrorModal(true);
  };

  const handleToggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (filtered: Invoice[]) => {
      if (selectedIds.length === filtered.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filtered.map(i => i.id));
      }
  };

  const filteredInvoices = invoices.filter(inv => 
    activeTab === 'pending' 
      ? inv.status === InvoiceStatus.PENDING 
      : inv.status === InvoiceStatus.EMITTED
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Controle de Notas Fiscais (NFS-e)</h1>
          <p className="text-slate-500">Gerencie a emissão fiscal.</p>
        </div>
        <div className="flex bg-white rounded-lg border p-1">
             <button 
                onClick={() => { setActiveTab('pending'); setSelectedIds([]); }}
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'pending' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
             >
                Pendentes (Não Emitidas)
             </button>
             <button 
                onClick={() => { setActiveTab('emitted'); setSelectedIds([]); }}
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'emitted' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}
             >
                Emitidas
             </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 items-center justify-between">
           <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
              <input type="text" placeholder="Filtrar por cliente..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none" />
           </div>
           
           {/* Batch Action */}
           {activeTab === 'pending' && selectedIds.length > 1 && (
               <button 
                 onClick={() => handleOpenMirror(selectedIds)}
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm animate-fade-in"
               >
                  <Layers size={18}/> Agrupar e Emitir ({selectedIds.length})
               </button>
           )}
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium">
            <tr>
              {activeTab === 'pending' && (
                  <th className="px-4 py-4 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                        onChange={() => handleSelectAll(filteredInvoices)}
                      />
                  </th>
              )}
              <th className="px-6 py-4">ID Venda</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Valor (Receber)</th>
              <th className="px-6 py-4">Número NF</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className={`hover:bg-slate-50 ${selectedIds.includes(inv.id) ? 'bg-blue-50' : ''}`}>
                {activeTab === 'pending' && (
                    <td className="px-4 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded" 
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => handleToggleSelect(inv.id)}
                      />
                    </td>
                )}
                <td className="px-6 py-4 text-slate-500">#{inv.saleId.substr(0, 6)}</td>
                <td className="px-6 py-4 font-medium">{inv.clientName}</td>
                <td className="px-6 py-4">R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4">
                  {inv.status === InvoiceStatus.EMITTED ? (
                    <span className="font-mono text-slate-700">{inv.number}</span>
                  ) : (
                    <span className="text-slate-400 italic">--</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {inv.status === InvoiceStatus.EMITTED ? (
                    <span className="flex items-center text-green-600 gap-1 bg-green-50 px-2 py-1 rounded w-fit"><FileCheck size={14}/> Emitida</span>
                  ) : (
                    <span className="flex items-center text-amber-600 gap-1 bg-amber-50 px-2 py-1 rounded w-fit"><FileWarning size={14}/> Pendente</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {inv.status === InvoiceStatus.PENDING && (
                    <button 
                        onClick={() => handleOpenMirror([inv.id])}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1 shadow-sm"
                    >
                        <ExternalLink size={12}/> Emitir NFS-e
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
                <tr><td colSpan={activeTab === 'pending' ? 7 : 6} className="px-6 py-8 text-center text-slate-400">Nenhuma nota nesta categoria.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MIRROR MODAL (ESPELHO) */}
      {showMirrorModal && mirrorData && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Header */}
                  <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                          <ExternalLink size={20}/> Emitir NFS-e {mirrorData.ids.length > 1 ? '(Agrupada)' : '(Espelho)'}
                      </h3>
                      <button onClick={() => setShowMirrorModal(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                      
                      {/* Batch Warning */}
                      {mirrorData.ids.length > 1 && (
                          <div className="bg-purple-100 border border-purple-200 text-purple-800 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
                              <Layers size={18}/>
                              <strong>Nota Agrupada:</strong> Você está emitindo uma única nota fiscal referente a {mirrorData.ids.length} vendas distintas.
                          </div>
                      )}

                      {/* Financial Status Banner */}
                      {mirrorData.retentions.total > 0 && (
                        <div className={`mb-4 border p-3 rounded-lg flex justify-between items-center ${mirrorData.deductedRetentions ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                           <div className="flex items-center gap-2">
                              {mirrorData.deductedRetentions 
                                ? <FileCheck size={20}/> 
                                : <AlertTriangle size={20}/>
                              }
                              <div>
                                 <p className="font-bold text-sm">Status Financeiro (Retenções):</p>
                                 <p className="text-xs">
                                    {mirrorData.deductedRetentions 
                                        ? "Valor líquido já considerado no financeiro."
                                        : "Valor bruto lançado no financeiro (Divergência com líquido)."
                                    }
                                 </p>
                              </div>
                           </div>
                           <div className="text-right text-xs font-mono font-bold">
                              {mirrorData.deductedRetentions ? "LÍQUIDO" : "BRUTO"}
                           </div>
                        </div>
                      )}

                      <div className="mb-4 bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                          <FileCheck size={18} className="mt-0.5 shrink-0"/>
                          <div>
                            <p className="font-bold">Instruções:</p>
                            <p>1. Utilize os dados abaixo para preencher o formulário no site da prefeitura.</p>
                            <p>2. Após emitir, digite o número da nota gerada no campo abaixo para finalizar.</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* COL 1: TOMADOR (CLIENTE) */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                              <h4 className="font-bold text-slate-700 border-b pb-2 mb-3 uppercase text-xs tracking-wider">Dados do Tomador</h4>
                              {mirrorData.client ? (
                                  <div className="space-y-3 text-sm">
                                      <div>
                                          <p className="text-xs text-slate-500">Nome / Razão Social</p>
                                          <p className="font-medium text-slate-800 select-all">{mirrorData.client.name}</p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                          <div>
                                              <p className="text-xs text-slate-500">CPF / CNPJ</p>
                                              <p className="font-medium text-slate-800 select-all">{mirrorData.client.document || 'Não informado'}</p>
                                          </div>
                                          <div>
                                              <p className="text-xs text-slate-500">Inscrição Municipal</p>
                                              <p className="font-medium text-slate-800 select-all">{mirrorData.client.municipalInscription || 'Isento'}</p>
                                          </div>
                                      </div>
                                      <div>
                                          <p className="text-xs text-slate-500">Endereço</p>
                                          <p className="font-medium text-slate-800 select-all">
                                              {mirrorData.client.street}, {mirrorData.client.number} - {mirrorData.client.neighborhood}
                                          </p>
                                          <p className="font-medium text-slate-800 select-all">
                                              CEP: {mirrorData.client.zipCode} | {mirrorData.client.city}-{mirrorData.client.state}
                                          </p>
                                      </div>
                                      <div>
                                          <p className="text-xs text-slate-500">E-mail</p>
                                          <p className="font-medium text-slate-800 select-all">{mirrorData.client.email}</p>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-red-500 bg-red-50 p-2 rounded text-sm">
                                      <FileWarning size={16} className="inline mr-1"/> Cliente não informado na venda.
                                  </div>
                              )}
                          </div>

                          {/* COL 2: SERVIÇO & RETENÇÕES */}
                          <div className="space-y-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <h4 className="font-bold text-slate-700 border-b pb-2 mb-3 uppercase text-xs tracking-wider">Dados do Serviço</h4>
                                  <div className="space-y-3 text-sm">
                                      <div className="grid grid-cols-2 gap-2">
                                          <div>
                                                <p className="text-xs text-slate-500">Competência</p>
                                                <p className="font-medium text-slate-800 select-all">{mirrorData.competence}</p>
                                          </div>
                                          <div>
                                                <p className="text-xs text-slate-500">Exigibilidade ISS</p>
                                                <p className="font-medium text-slate-800 select-all">Exigível (1)</p>
                                          </div>
                                      </div>
                                      
                                      {/* Updated Values Display */}
                                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs text-slate-500">Valor Bruto</span>
                                                <span className="font-medium text-slate-800">R$ {mirrorData.grossAmount.toFixed(2)}</span>
                                            </div>
                                            {mirrorData.retentions.total > 0 && (
                                                <div className="text-xs text-slate-500 mb-1 border-l-2 border-slate-300 pl-2 ml-1">
                                                    <div className="flex justify-between"><span>PIS</span> <span>R$ {mirrorData.retentions.pis.toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span>COFINS</span> <span>R$ {mirrorData.retentions.cofins.toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span>CSLL</span> <span>R$ {mirrorData.retentions.csll.toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span>IR</span> <span>R$ {mirrorData.retentions.ir.toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span>INSS</span> <span>R$ {mirrorData.retentions.inss.toFixed(2)}</span></div>
                                                </div>
                                            )}
                                            <div className="flex justify-between mb-1 text-red-600">
                                                <span className="text-xs font-medium">(-) Total Retenções</span>
                                                <span className="font-medium">- R$ {mirrorData.retentions.total.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                                                <span className="text-xs font-bold text-slate-700">(=) Valor Líquido NF</span>
                                                <span className="font-bold text-slate-800">R$ {mirrorData.liquidAmount.toFixed(2)}</span>
                                            </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                          <div>
                                                <p className="text-xs text-slate-500">Item LC 116/03</p>
                                                <p className="font-medium text-slate-800 select-all">{mirrorData.serviceCode || 'Não config.'}</p>
                                          </div>
                                          <div>
                                                <p className="text-xs text-slate-500">CNAE</p>
                                                <p className="font-medium text-slate-800 select-all">{mirrorData.cnae || 'Não config.'}</p>
                                          </div>
                                      </div>
                                      <div>
                                          <div className="flex justify-between">
                                              <p className="text-xs text-slate-500">Discriminação</p>
                                              <button className="text-blue-600 text-xs hover:underline flex items-center gap-1" onClick={() => navigator.clipboard.writeText(mirrorData.description)}>
                                                  <Copy size={10}/> Copiar
                                              </button>
                                          </div>
                                          <textarea 
                                              readOnly 
                                              className="w-full mt-1 border border-slate-200 rounded p-2 text-xs h-24 bg-white focus:outline-none"
                                              value={mirrorData.description}
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
                      <a 
                        href={settings.nfseWebsite || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:underline"
                      >
                         <ExternalLink size={18}/> Abrir Site da Prefeitura
                      </a>

                      <div className="flex items-center gap-2">
                          <input 
                              type="text" 
                              placeholder="Número da NF gerada" 
                              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              value={nfNumber}
                              onChange={(e) => setNfNumber(e.target.value)}
                          />
                          <button 
                             onClick={handleEmit}
                             disabled={!nfNumber}
                             className="bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                          >
                             Confirmar Emissão
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};