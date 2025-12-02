import { create } from 'zustand';
import { 
  Client, Service, BankAccount, Sale, Invoice, 
  Installment, FinancialRecord, Appointment, CompanySettings,
  PaymentMethod, InvoiceStatus, InstallmentStatus, Quote
} from './types';

interface AppState {
  clients: Client[];
  services: Service[];
  bankAccounts: BankAccount[];
  sales: Sale[];
  quotes: Quote[];
  invoices: Invoice[];
  accountsReceivable: Installment[];
  accountsPayable: Installment[];
  financialRecords: FinancialRecord[];
  appointments: Appointment[];
  settings: CompanySettings;

  // Actions
  addClient: (client: Client) => void;
  addService: (service: Service) => void;
  addBankAccount: (account: BankAccount) => void;
  
  addSale: (sale: Sale) => void;
  addQuote: (quote: Quote) => void;
  updateQuoteStatus: (id: string, status: Quote['status']) => void;
  
  emitInvoice: (invoiceId: string, number: string) => void;
  
  payInstallment: (installmentId: string, paidAmount: number, bankAccountId: string, date: string, treatAsDiscount?: boolean, treatExcessAsPrincipal?: boolean) => void;
  
  addPayable: (payable: Installment) => void;
  payPayable: (payableId: string, paidAmount: number, bankAccountId: string, date: string, treatAsDiscount?: boolean, treatExcessAsPrincipal?: boolean) => void;
  
  addFinancialRecord: (record: FinancialRecord) => void;
  addAppointment: (appointment: Appointment) => void;
  updateSettings: (settings: CompanySettings) => void;
}

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock Data
const initialClients: Client[] = [
  { 
    id: 'c1', 
    name: 'Empresa ABC Ltda', 
    document: '12.345.678/0001-90',
    municipalInscription: '123456', 
    email: 'contato@abc.com', 
    phone: '(11) 99999-9999',
    zipCode: '01310-100',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    cityCode: '3550308'
  },
  { 
    id: 'c2', 
    name: 'João da Silva', 
    document: '123.456.789-00', 
    email: 'joao@gmail.com', 
    phone: '(11) 98888-8888',
    zipCode: '85851-000',
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Centro',
    city: 'Foz do Iguaçu',
    state: 'PR',
    cityCode: '4108304'
  },
];

const initialServices: Service[] = [
  { 
    id: 's1', 
    name: 'Consultoria Financeira', 
    price: 1500.00, 
    description: 'Análise de balanço e planejamento', 
    itemLCServico: '17.01',
    municipalCode: '01234',
    cnae: '7020-4/00',
    issAliquot: 2.0,
    pis: 0.65,
    cofins: 3.0,
    csll: 1.0,
    ir: 1.5,
    inss: 0
  },
  { 
    id: 's2', 
    name: 'Desenvolvimento Web', 
    price: 3000.00, 
    description: 'Criação de site institucional', 
    itemLCServico: '01.07',
    municipalCode: '05678',
    cnae: '6201-5/00',
    issAliquot: 3.0,
    pis: 0,
    cofins: 0,
    csll: 0,
    ir: 0,
    inss: 0
  },
];

const initialBankAccounts: BankAccount[] = [
  { id: 'b1', bankName: 'Banco Inter', agency: '0001', accountNumber: '12345-6', holder: 'Minha Empresa', initialBalance: 5000 },
  { id: 'b2', bankName: 'Caixa (Dinheiro)', agency: '-', accountNumber: '-', holder: 'Caixa Físico', initialBalance: 200 },
];

const initialPayables: Installment[] = [
  {
    id: 'p1',
    description: 'Aluguel Escritório',
    amount: 2500.00,
    dueDate: new Date().toISOString().split('T')[0], // Today
    status: InstallmentStatus.PENDING,
    paidAmount: 0,
    category: 'Aluguel'
  },
  {
    id: 'p2',
    description: 'Licença de Software',
    amount: 150.00,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // +5 days
    status: InstallmentStatus.PENDING,
    paidAmount: 0,
    category: 'Software'
  },
  {
    id: 'p3',
    description: 'Material de Limpeza',
    amount: 89.90,
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // -2 days (Overdue)
    status: InstallmentStatus.OVERDUE,
    paidAmount: 0,
    category: 'Insumos'
  }
];

export const useAppStore = create<AppState>((set, get) => ({
  clients: initialClients,
  services: initialServices,
  bankAccounts: initialBankAccounts,
  sales: [],
  quotes: [],
  invoices: [],
  accountsReceivable: [],
  accountsPayable: initialPayables,
  financialRecords: [],
  appointments: [],
  settings: {
    name: 'Minha Empresa de Serviços Ltda',
    cnpj: '00.000.000/0001-00',
    municipalInscription: '123456',
    stateInscription: '',
    cnae: '6201-5/00',
    address: {
      zipCode: '85851-010',
      street: 'Av. Brasil',
      number: '100',
      neighborhood: 'Centro',
      city: 'Foz do Iguaçu',
      state: 'PR',
      cityCode: '4108304'
    },
    taxRegime: 'Simples Nacional',
    specialTaxRegime: '0', // 0 - Sem regime especial
    optanteSimplesNacional: true,
    incentivadorCultural: false,
    nfseWebsite: 'https://nfse.fozdoiguacu.pr.gov.br'
  },

  addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
  addService: (service) => set((state) => ({ services: [...state.services, service] })),
  addBankAccount: (account) => set((state) => ({ bankAccounts: [...state.bankAccounts, account] })),

  addSale: (sale) => set((state) => {
    const newState = { ...state };
    
    // 1. Add Sale
    newState.sales = [sale, ...state.sales];

    // 2. Generate Pending Invoice
    const invoiceId = generateId();
    const newInvoice: Invoice = {
      id: invoiceId,
      saleId: sale.id,
      clientName: sale.clientName,
      amount: sale.finalAmount,
      status: InvoiceStatus.PENDING
    };
    newState.invoices = [newInvoice, ...state.invoices];
    
    // Update sale with invoice link
    newState.sales[0].invoiceId = invoiceId;

    // 3. Financial Logic based on Payment Method
    const today = new Date().toISOString().split('T')[0];

    if (sale.paymentMethod === PaymentMethod.CASH || sale.paymentMethod === PaymentMethod.PIX || sale.paymentMethod === PaymentMethod.DEBIT_CARD) {
      // Immediate Cash Flow
      const record: FinancialRecord = {
        id: generateId(),
        date: today,
        description: `Venda #${sale.id.substr(0,4)} - ${sale.clientName}`,
        amount: sale.finalAmount,
        type: 'RECEITA',
        category: 'Vendas',
        relatedSaleId: sale.id,
        bankAccountId: sale.bankAccountId // Should be provided for PIX/Debit
      };
      newState.financialRecords = [record, ...state.financialRecords];
      
      // Auto-create a "Paid" installment for record keeping in AR
       const installment: Installment = {
        id: generateId(),
        saleId: sale.id,
        description: `Parcela Única (Vista) - ${sale.clientName}`,
        amount: sale.finalAmount,
        dueDate: today,
        status: InstallmentStatus.PAID,
        paidAmount: sale.finalAmount,
        paymentDate: today
      };
      newState.accountsReceivable = [...state.accountsReceivable, installment];

    } else {
      // Credit Card or Boleto -> Generate Installments
      const installmentValue = sale.finalAmount / sale.installmentsCount;
      const newInstallments: Installment[] = [];

      for (let i = 0; i < sale.installmentsCount; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i + 1); // +1 month for first installment usually

        newInstallments.push({
          id: generateId(),
          saleId: sale.id,
          description: `Parcela ${i + 1}/${sale.installmentsCount} - ${sale.clientName}`,
          amount: parseFloat(installmentValue.toFixed(2)),
          dueDate: dueDate.toISOString().split('T')[0],
          status: InstallmentStatus.PENDING,
          paidAmount: 0
        });
      }
      newState.accountsReceivable = [...state.accountsReceivable, ...newInstallments];
    }

    return newState;
  }),

  addQuote: (quote) => set(state => ({ quotes: [quote, ...state.quotes] })),
  
  updateQuoteStatus: (id, status) => set(state => ({
    quotes: state.quotes.map(q => q.id === id ? { ...q, status } : q)
  })),

  emitInvoice: (invoiceId, number) => set((state) => {
    // 1. Identify Sale ID and Installments associated with this invoice
    const invoice = state.invoices.find(inv => inv.id === invoiceId);
    const saleId = invoice?.saleId;
    
    // Find all installment IDs belonging to this sale
    const relatedInstallmentIds = state.accountsReceivable
        .filter(i => i.saleId === saleId)
        .map(i => i.id);

    return {
      // 2. Update Invoice Status
      invoices: state.invoices.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: InvoiceStatus.EMITTED, number, emissionDate: new Date().toISOString().split('T')[0] } 
          : inv
      ),
      // 3. Update related Financial Records with the new Document Number
      financialRecords: state.financialRecords.map(rec => {
        // Check if record is linked to sale directly OR via an installment of that sale
        const isRelatedSale = rec.relatedSaleId === saleId;
        const isRelatedInstallment = rec.relatedInstallmentId && relatedInstallmentIds.includes(rec.relatedInstallmentId);
        
        if ((isRelatedSale || isRelatedInstallment) && saleId) {
            return { ...rec, documentNumber: number };
        }
        return rec;
      })
    };
  }),

  payInstallment: (installmentId, paidAmount, bankAccountId, date, treatAsDiscount = false, treatExcessAsPrincipal = false) => set((state) => {
    const installment = state.accountsReceivable.find(i => i.id === installmentId);
    if (!installment) return state;

    // Check for existing invoice document number
    let documentNumber: string | undefined = undefined;
    if (installment.saleId) {
        const invoice = state.invoices.find(inv => inv.saleId === installment.saleId && inv.status === InvoiceStatus.EMITTED);
        if (invoice) documentNumber = invoice.number;
    }

    const remainingBeforePay = installment.amount - installment.paidAmount;
    const diff = paidAmount - remainingBeforePay;

    let finalPaidAmount = installment.paidAmount + paidAmount;
    let finalInstallmentAmount = installment.amount;
    let status = InstallmentStatus.PAID;

    const newRecords: FinancialRecord[] = [];

    // Determine how to record the principal payment
    let principalPaymentAmount = paidAmount;

    if (diff > 0.01) {
      // Overpayment
      if (treatExcessAsPrincipal) {
        // Update the installment amount to reflect the higher value
        finalInstallmentAmount = installment.amount + diff;
        // Principal payment is the full paid amount
        principalPaymentAmount = paidAmount;
      } else {
        // Treat as Interest: Principal payment is limited to remaining balance
        principalPaymentAmount = remainingBeforePay;
        // Don't increase paidAmount beyond the original amount (conceptually)
        // But for tracking "paidAmount" usually sums everything. 
        // Let's cap paidAmount at original amount if treating as interest to keep "amount == paidAmount" for clean history
        finalPaidAmount = installment.amount; 
      }
    } else if (diff < -0.01) {
       // Underpayment
       if (treatAsDiscount) {
         status = InstallmentStatus.PAID;
       } else {
         status = InstallmentStatus.PARTIAL;
       }
       principalPaymentAmount = paidAmount;
    }

    // 1. Base Receipt Record
    newRecords.push({
      id: generateId(),
      date,
      description: `Recebimento: ${installment.description}`,
      amount: principalPaymentAmount, 
      type: 'RECEITA',
      category: 'Recebimento de Cliente',
      bankAccountId,
      relatedInstallmentId: installmentId,
      documentNumber // Include found document number
    });

    // 2. Handle Diff Records
    if (diff > 0.01 && !treatExcessAsPrincipal) {
       // Interest Record
       newRecords.push({
        id: generateId(),
        date,
        description: `Juros/Multa: ${installment.description}`,
        amount: diff,
        type: 'RECEITA',
        category: 'Juros Recebidos',
        bankAccountId,
        relatedInstallmentId: installmentId,
        documentNumber
      });
    } else if (diff < -0.01 && treatAsDiscount) {
       // Discount Record
       newRecords.push({
        id: generateId(),
        date,
        description: `Desconto Concedido: ${installment.description}`,
        amount: Math.abs(diff),
        type: 'DESPESA',
        category: 'Descontos Concedidos',
        relatedInstallmentId: installmentId,
        documentNumber
      });
    }

    return {
      accountsReceivable: state.accountsReceivable.map(i => 
        i.id === installmentId 
        ? { 
            ...i, 
            status: status, 
            amount: finalInstallmentAmount,
            paidAmount: finalPaidAmount, 
            paymentDate: date 
          } 
        : i
      ),
      financialRecords: [...state.financialRecords, ...newRecords]
    };
  }),

  addPayable: (payable) => set(state => ({
    accountsPayable: [payable, ...state.accountsPayable]
  })),

  payPayable: (payableId, paidAmount, bankAccountId, date, treatAsDiscount = false, treatExcessAsPrincipal = false) => set(state => {
    const payable = state.accountsPayable.find(p => p.id === payableId);
    if (!payable) return state;

    const remainingBeforePay = payable.amount - payable.paidAmount;
    const diff = paidAmount - remainingBeforePay;

    let finalPaidAmount = payable.paidAmount + paidAmount;
    let finalPayableAmount = payable.amount;
    let status = InstallmentStatus.PAID;

    const newRecords: FinancialRecord[] = [];

    // Determine how to record the principal payment
    let principalPaymentAmount = paidAmount;

    if (diff > 0.01) {
      // Overpayment
      if (treatExcessAsPrincipal) {
        finalPayableAmount = payable.amount + diff;
        principalPaymentAmount = paidAmount;
      } else {
        // Interest: Cap principal payment
        principalPaymentAmount = remainingBeforePay;
        finalPaidAmount = payable.amount;
      }
    } else if (diff < -0.01) {
       // Underpayment
       if (treatAsDiscount) {
         status = InstallmentStatus.PAID;
       } else {
         status = InstallmentStatus.PARTIAL;
       }
       principalPaymentAmount = paidAmount;
    }

    // 1. Base Payment Record
    newRecords.push({
      id: generateId(),
      date,
      description: `Pagamento: ${payable.description}`,
      amount: principalPaymentAmount, 
      type: 'DESPESA',
      category: payable.category || 'Despesa Operacional',
      bankAccountId,
      relatedInstallmentId: payableId
    });

    // 2. Handle Diff Records
    if (diff > 0.01 && !treatExcessAsPrincipal) {
       // Interest Paid Record
       newRecords.push({
        id: generateId(),
        date,
        description: `Juros Pagos: ${payable.description}`,
        amount: diff, 
        type: 'DESPESA',
        category: 'Juros Pagos',
        bankAccountId,
        relatedInstallmentId: payableId
      }); 
    } else if (diff < -0.01 && treatAsDiscount) {
        // Discount Received Record
        newRecords.push({
         id: generateId(),
         date,
         description: `Desconto Obtido: ${payable.description}`,
         amount: Math.abs(diff),
         type: 'RECEITA',
         category: 'Descontos Obtidos',
         relatedInstallmentId: payableId
       });
     }

    return {
      accountsPayable: state.accountsPayable.map(p => 
        p.id === payableId 
        ? { 
            ...p, 
            status, 
            amount: finalPayableAmount,
            paidAmount: finalPaidAmount, 
            paymentDate: date 
          } 
        : p
      ),
      financialRecords: [...newRecords, ...state.financialRecords]
    };
  }),

  addFinancialRecord: (record) => set(state => ({
    financialRecords: [record, ...state.financialRecords]
  })),

  addAppointment: (apt) => set(state => ({
    appointments: [...state.appointments, apt]
  })),

  updateSettings: (newSettings) => set(() => ({ settings: newSettings }))
}));