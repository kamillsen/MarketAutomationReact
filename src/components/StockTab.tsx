import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, AlertTriangle, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { Product, StockMovement } from '../types';
import { productStorage, stockMovementStorage } from '../utils/storage';
import { logger } from '../utils/logger';
import { reportGenerator } from '../utils/reports';

interface StockTabProps {
  currentUser: any;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const StockTab: React.FC<StockTabProps> = ({ currentUser, showToast }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockUpdate, setStockUpdate] = useState({
    quantity: '',
    type: 'in' as 'in' | 'out' | 'adjustment',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(productStorage.getAll());
    setMovements(stockMovementStorage.getAll().sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  const lowStockProducts = reportGenerator.getLowStockProducts();
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm);
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || product.stock <= product.minStockLevel;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const categories = [...new Set(products.map(p => p.category))].sort();

  const handleStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !stockUpdate.quantity || !stockUpdate.reason) {
      showToast('error', 'Lütfen tüm alanları doldurun!');
      return;
    }

    const quantity = parseInt(stockUpdate.quantity);
    if (quantity <= 0) {
      showToast('error', 'Miktar 0\'dan büyük olmalıdır!');
      return;
    }

    const oldStock = selectedProduct.stock;
    let newStock = oldStock;

    switch (stockUpdate.type) {
      case 'in':
        newStock = oldStock + quantity;
        break;
      case 'out':
        if (quantity > oldStock) {
          showToast('error', 'Çıkış miktarı mevcut stoktan fazla olamaz!');
          return;
        }
        newStock = oldStock - quantity;
        break;
      case 'adjustment':
        newStock = quantity;
        break;
    }

    // Update product
    const updatedProduct = { ...selectedProduct, stock: newStock, updatedAt: new Date() };
    productStorage.update(selectedProduct.barcode, updatedProduct);

    // Log stock movement
    const movement: StockMovement = {
      id: Date.now().toString(),
      barcode: selectedProduct.barcode,
      productName: selectedProduct.name,
      type: stockUpdate.type,
      quantity: stockUpdate.type === 'adjustment' ? quantity : quantity,
      reason: stockUpdate.reason,
      username: currentUser.username,
      timestamp: new Date(),
    };
    stockMovementStorage.add(movement);

    // Log action
    logger.logStockAction('UPDATE', selectedProduct.barcode, oldStock, newStock);

    loadData();
    setShowUpdateForm(false);
    setSelectedProduct(null);
    setStockUpdate({ quantity: '', type: 'in', reason: '' });
    
    showToast('success', `${selectedProduct.name} stoku güncellendi!`);
  };

  const openUpdateForm = (product: Product) => {
    setSelectedProduct(product);
    setStockUpdate({ quantity: '', type: 'in', reason: '' });
    setShowUpdateForm(true);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return { color: 'text-error-600 bg-error-50', text: 'Tükendi', icon: AlertTriangle };
    } else if (product.stock <= product.minStockLevel) {
      return { color: 'text-warning-600 bg-warning-50', text: 'Kritik', icon: AlertTriangle };
    } else {
      return { color: 'text-success-600 bg-success-50', text: 'Normal', icon: Package };
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="w-4 h-4 text-success-600" />;
      case 'out': return <TrendingDown className="w-4 h-4 text-error-600" />;
      case 'adjustment': return <Package className="w-4 h-4 text-primary-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case 'in': return 'Giriş';
      case 'out': return 'Çıkış';
      case 'adjustment': return 'Düzeltme';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stok Yönetimi</h1>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            <h3 className="font-semibold text-warning-800">Kritik Stok Uyarısı</h3>
          </div>
          <p className="text-warning-700 mb-3">
            {lowStockProducts.length} ürün kritik stok seviyesinde veya tükenmiş durumda.
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.slice(0, 5).map(product => (
              <span
                key={product.barcode}
                className="px-2 py-1 bg-warning-100 text-warning-800 text-sm rounded-full"
              >
                {product.name} ({product.stock})
              </span>
            ))}
            {lowStockProducts.length > 5 && (
              <span className="px-2 py-1 bg-warning-100 text-warning-800 text-sm rounded-full">
                +{lowStockProducts.length - 5} daha
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stock Update Form */}
      {showUpdateForm && selectedProduct && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Stok Güncelle: {selectedProduct.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Mevcut Stok:</span>
                  <span className="font-semibold text-lg">{selectedProduct.stock}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Minimum Seviye:</span>
                  <span className="font-medium">{selectedProduct.minStockLevel}</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleStockUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İşlem Türü
                </label>
                <select
                  value={stockUpdate.type}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, type: e.target.value as 'in' | 'out' | 'adjustment' })}
                  className="input w-full"
                >
                  <option value="in">Stok Girişi</option>
                  <option value="out">Stok Çıkışı</option>
                  <option value="adjustment">Stok Düzeltme</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {stockUpdate.type === 'adjustment' ? 'Yeni Stok Miktarı' : 'Miktar'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockUpdate.quantity}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, quantity: e.target.value })}
                  className="input w-full"
                  placeholder="Miktar girin"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={stockUpdate.reason}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, reason: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="İşlem açıklaması"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpdateForm(false)}
                  className="btn-secondary"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün adı veya barkod ile ara..."
              className="input pl-10 w-full"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input w-full sm:w-auto"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <label className="flex items-center gap-2 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Sadece kritik stok</span>
          </label>
        </div>
      </div>

      {/* Stock Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Kategori</th>
                <th>Mevcut Stok</th>
                <th>Min. Seviye</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Ürün bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const StatusIcon = stockStatus.icon;
                  
                  return (
                    <tr key={product.barcode}>
                      <td>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500 font-mono">{product.barcode}</p>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{product.stock}</span>
                          {product.stock <= product.minStockLevel && (
                            <StatusIcon className="w-4 h-4 text-warning-500" />
                          )}
                        </div>
                      </td>
                      <td>{product.minStockLevel}</td>
                      <td>
                        <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {stockStatus.text}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => openUpdateForm(product)}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          Güncelle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Stock Movements */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Stok Hareketleri</h3>
        
        <div className="space-y-3">
          {movements.slice(0, 10).map((movement) => (
            <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getMovementIcon(movement.type)}
                <div>
                  <p className="font-medium">{movement.productName}</p>
                  <p className="text-sm text-gray-600">{movement.reason}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {movement.type === 'adjustment' ? '' : movement.type === 'in' ? '+' : '-'}
                    {movement.quantity}
                  </span>
                  <span className="text-sm text-gray-500">
                    {getMovementTypeText(movement.type)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(movement.timestamp).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          ))}
          
          {movements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Henüz stok hareketi bulunmuyor</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockTab;