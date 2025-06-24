export interface Product {
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  minStockLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  cashier: string;
  timestamp: Date;
  paymentMethod: 'cash' | 'card';
}

export interface SaleItem {
  barcode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface User {
  username: string;
  role: 'cashier' | 'manager' | 'admin';
  fullName: string;
  isActive: boolean;
}

export interface LogEntry {
  id: string;
  username: string;
  action: string;
  timestamp: Date;
  details: string;
}

export interface StockMovement {
  id: string;
  barcode: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  username: string;
  timestamp: Date;
}

export interface SalesReport {
  period: string;
  totalSales: number;
  totalRevenue: number;
  topProducts: Array<{
    barcode: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    quantity: number;
    revenue: number;
  }>;
}

export type TabType = 'sales' | 'products' | 'stock' | 'reports' | 'settings';