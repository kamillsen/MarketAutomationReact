import { Sale, SalesReport, Product } from '../types';
import { salesStorage, productStorage } from './storage';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const reportGenerator = {
  generateSalesReport: (period: 'today' | 'week' | 'month', customStart?: Date, customEnd?: Date): SalesReport => {
    const sales = salesStorage.getAll();
    const products = productStorage.getAll();
    
    let startDate: Date;
    let endDate: Date;
    let periodName: string;

    if (customStart && customEnd) {
      startDate = startOfDay(customStart);
      endDate = endOfDay(customEnd);
      periodName = `${format(customStart, 'dd.MM.yyyy')} - ${format(customEnd, 'dd.MM.yyyy')}`;
    } else {
      const now = new Date();
      switch (period) {
        case 'today':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          periodName = 'Bugün';
          break;
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          periodName = 'Bu Hafta';
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          periodName = 'Bu Ay';
          break;
        default:
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          periodName = 'Bugün';
      }
    }

    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return isWithinInterval(saleDate, { start: startDate, end: endDate });
    });

    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

    // Product sales analysis
    const productSales = new Map<string, { quantity: number; revenue: number; name: string; category: string }>();
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productSales.get(item.barcode);
        const product = products.find(p => p.barcode === item.barcode);
        
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.total;
        } else {
          productSales.set(item.barcode, {
            quantity: item.quantity,
            revenue: item.total,
            name: item.name,
            category: product?.category || 'Diğer',
          });
        }
      });
    });

    // Top products
    const topProducts = Array.from(productSales.entries())
      .map(([barcode, data]) => ({
        barcode,
        name: data.name,
        quantitySold: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    // Sales by category
    const categorySales = new Map<string, { quantity: number; revenue: number }>();
    
    Array.from(productSales.values()).forEach(data => {
      const existing = categorySales.get(data.category);
      if (existing) {
        existing.quantity += data.quantity;
        existing.revenue += data.revenue;
      } else {
        categorySales.set(data.category, {
          quantity: data.quantity,
          revenue: data.revenue,
        });
      }
    });

    const salesByCategory = Array.from(categorySales.entries())
      .map(([category, data]) => ({
        category,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      period: periodName,
      totalSales,
      totalRevenue,
      topProducts,
      salesByCategory,
    };
  },

  exportToCSV: (report: SalesReport): string => {
    const lines = [
      `Dönem,${report.period}`,
      `Toplam Satış,${report.totalSales}`,
      `Toplam Gelir,₺${report.totalRevenue.toFixed(2)}`,
      '',
      'En Çok Satılan Ürünler',
      'Barkod,Ürün Adı,Satılan Miktar,Gelir',
      ...report.topProducts.map(p => `${p.barcode},${p.name},${p.quantitySold},₺${p.revenue.toFixed(2)}`),
      '',
      'Kategoriye Göre Satışlar',
      'Kategori,Miktar,Gelir',
      ...report.salesByCategory.map(c => `${c.category},${c.quantity},₺${c.revenue.toFixed(2)}`),
    ];
    
    return lines.join('\n');
  },

  getLowStockProducts: (threshold?: number): Product[] => {
    const products = productStorage.getAll();
    return products.filter(product => 
      product.stock <= (threshold || product.minStockLevel)
    ).sort((a, b) => a.stock - b.stock);
  },
};