export interface ICompany {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  logo?: string;
  colors: { primary: string; secondary: string };
  isActive: boolean;
}

export interface IUser {
  _id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'cashier';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IProduct {
  _id: string;
  companyId: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId?: string | ICategory;
  price: number;
  costPrice?: number;
  taxRate: number;
  unit: string;
  quantity: number;
  minStock: number;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  companyId: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
}

export interface IClient {
  _id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  company?: string;
  taxId?: string;
  notes?: string;
  totalPurchases: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface ISaleItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface ISale {
  _id: string;
  companyId: string;
  invoiceNumber: string;
  items: ISaleItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  status: 'completed' | 'cancelled' | 'returned';
  clientId?: string | IClient;
  userId: string | IUser;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IInvoice {
  _id: string;
  companyId: string;
  invoiceNumber: string;
  saleId?: string;
  clientId?: string | IClient;
  items: ISaleItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  pdfUrl?: string;
  userId: string;
  createdAt: string;
}

export interface IActivityLog {
  _id: string;
  companyId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ip?: string;
  createdAt: string;
}

export interface ILoginResponse {
  success: boolean;
  data: {
    user: IUser;
    company: ICompany;
    accessToken: string;
    refreshToken: string;
  };
}

export interface IDashboardStats {
  totalProducts: number;
  lowStockCount: number;
  totalSalesToday: number;
  totalSalesWeek: number;
  totalSalesMonth: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  totalClients: number;
  outstandingInvoices: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
