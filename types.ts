export enum PaymentMethod {
  CASH = 'Dinheiro',
  PIX = 'PIX',
  CREDIT_CARD = 'Cartão de Crédito',
  DEBIT_CARD = 'Cartão de Débito',
  BOLETO = 'Boleto',
  TRANSFER = 'Transferência'
}

export enum InvoiceStatus {
  PENDING = 'Pendente',
  EMITTED = 'Emitida',
  CANCELLED = 'Cancelada'
}

export enum InstallmentStatus {
  PENDING = 'Pendente',
  PAID = 'Pago',
  PARTIAL = 'Parcial',
  OVERDUE = 'Atrasado'
}

export type QuoteStatus = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Finalizado';

export interface Client {
  id: string;
  name: string;
  document: string; // CPF/CNPJ
  email: string;
  phone: string;
  address: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  taxCode: string; // Código de tributação (ABRASF)
}

export interface BankAccount {
  id: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  holder: string;
  initialBalance: number;
}

export interface SaleItem {
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  installmentsCount: number;
  invoiceId?: string;
  bankAccountId?: string; // If PIX/Transfer
}

export interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  status: QuoteStatus;
  expirationDate: string;
}

export interface Invoice {
  id: string;
  saleId: string;
  clientName: string;
  amount: number;
  status: InvoiceStatus;
  number?: string;
  emissionDate?: string;
}

export interface Installment {
  id: string;
  saleId?: string; // Link to origin sale (optional for manual payables)
  description: string;
  amount: number;
  dueDate: string;
  status: InstallmentStatus;
  paidAmount: number;
  paymentDate?: string;
  category?: string; // Useful for payables categorization
}

export interface FinancialRecord {
  id: string;
  date: string;
  description: string;
  amount: number; // Positive for income, Negative for expense
  type: 'RECEITA' | 'DESPESA';
  category: string;
  bankAccountId?: string;
  relatedSaleId?: string;
  relatedInstallmentId?: string;
  documentNumber?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  date: string; // ISO String
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface CompanySettings {
  name: string;
  cnpj: string;
  address: string;
  taxRegime: string;
}