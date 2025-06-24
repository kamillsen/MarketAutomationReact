import React, { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react';
import { SalesReport } from '../types';
import { reportGenerator } from '../utils/reports';
import { format } from 'date-fns';

interface ReportsTabProps {
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ showToast }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateReport();
  }, [selectedPeriod]);

  const generateReport = async () => {
    setIsLoading(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      let newReport: SalesReport;
      
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        newReport = reportGenerator.generateSalesReport(
          'today',
          new Date(customStartDate),
          new Date(customEndDate)
        );
      } else {
        newReport = reportGenerator.generateSalesReport(selectedPeriod);
      }
      
      setReport(newReport);
    } catch (error) {
      showToast('error', 'Rapor oluşturulurken hata oluştu!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStartDate || !customEndDate) {
      showToast('error', 'Lütfen başlangıç ve bitiş tarihlerini seçin!');
      return;
    }
    
    if (new Date(customStartDate) > new Date(customEndDate)) {
      showToast('error', 'Başlangıç tarihi bitiş tarihinden büyük olamaz!');
      return;
    }
    
    generateReport();
  };

  const exportToCSV = () => {
    if (!report) return;
    
    const csvContent = reportGenerator.exportToCSV(report);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `satis-raporu-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('success', 'Rapor CSV dosyası olarak indirildi!');
    }
  };

  const lowStockProducts = reportGenerator.getLowStockProducts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
        {report && (
          <button
            onClick={exportToCSV}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV İndir
          </button>
        )}
      </div>

      {/* Period Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rapor Dönemi</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { value: 'today', label: 'Bugün' },
            { value: 'week', label: 'Bu Hafta' },
            { value: 'month', label: 'Bu Ay' },
            { value: 'custom', label: 'Özel Tarih' },
          ].map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value as any)}
              className={`p-3 rounded-lg text-center transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-200'
                  : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {selectedPeriod === 'custom' && (
          <form onSubmit={handleCustomDateSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary whitespace-nowrap">
                Rapor Oluştur
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card text-center py-8">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Rapor hazırlanıyor...</p>
        </div>
      )}

      {/* Report Content */}
      {report && !isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Satış</p>
                  <p className="text-2xl font-bold text-gray-900">{report.totalSales}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-gray-900">₺{report.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-success-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ortalama Satış</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₺{report.totalSales > 0 ? (report.totalRevenue / report.totalSales).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="p-3 bg-warning-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-warning-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kritik Stok</p>
                  <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
                </div>
                <div className="p-3 bg-error-100 rounded-full">
                  <Package className="w-6 h-6 text-error-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">En Çok Satılan Ürünler</h3>
            
            {report.topProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Bu dönemde satış bulunamadı</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sıra</th>
                      <th>Ürün Adı</th>
                      <th>Barkod</th>
                      <th>Satılan Miktar</th>
                      <th>Gelir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((product, index) => (
                      <tr key={product.barcode}>
                        <td>
                          <div className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                            {index + 1}
                          </div>
                        </td>
                        <td className="font-medium">{product.name}</td>
                        <td className="font-mono text-sm text-gray-600">{product.barcode}</td>
                        <td>{product.quantitySold}</td>
                        <td className="font-semibold">₺{product.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sales by Category */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategoriye Göre Satışlar</h3>
            
            {report.salesByCategory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Bu dönemde satış bulunamadı</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.salesByCategory.map((category) => (
                  <div key={category.category} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{category.category}</h4>
                      <span className="text-sm text-gray-600">{category.quantity} adet</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">
                        ₺{category.revenue.toFixed(2)}
                      </span>
                      <div className="text-right text-sm text-gray-500">
                        %{report.totalRevenue > 0 ? ((category.revenue / report.totalRevenue) * 100).toFixed(1) : '0.0'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-error-600" />
                Kritik Stok Uyarısı
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockProducts.slice(0, 9).map((product) => (
                  <div key={product.barcode} className="p-3 bg-error-50 border border-error-200 rounded-lg">
                    <h4 className="font-medium text-error-900">{product.name}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-error-700">Kalan: {product.stock}</span>
                      <span className="text-sm text-error-600">Min: {product.minStockLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {lowStockProducts.length > 9 && (
                <p className="mt-4 text-sm text-gray-600 text-center">
                  ve {lowStockProducts.length - 9} ürün daha...
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsTab;