import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { productStorage } from '../utils/storage';
import { logger } from '../utils/logger';

interface ProductsTabProps {
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ showToast }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    minStockLevel: '5',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const allProducts = productStorage.getAll();
    setProducts(allProducts);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm);
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category))].sort();

  const resetForm = () => {
    setFormData({
      barcode: '',
      name: '',
      price: '',
      stock: '',
      category: '',
      description: '',
      minStockLevel: '5',
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.barcode || !formData.name || !formData.price || !formData.category) {
      showToast('error', 'Lütfen zorunlu alanları doldurun!');
      return;
    }

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock) || 0;
    const minStockLevel = parseInt(formData.minStockLevel) || 5;

    if (price <= 0) {
      showToast('error', 'Fiyat 0\'dan büyük olmalıdır!');
      return;
    }

    // Check if barcode already exists (except when editing)
    const existingProduct = productStorage.findByBarcode(formData.barcode);
    if (existingProduct && (!editingProduct || existingProduct.barcode !== editingProduct.barcode)) {
      showToast('error', 'Bu barkod zaten kayıtlı!');
      return;
    }

    const productData: Product = {
      barcode: formData.barcode,
      name: formData.name,
      price,
      stock,
      category: formData.category,
      description: formData.description,
      minStockLevel,
      createdAt: editingProduct?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingProduct) {
      productStorage.update(editingProduct.barcode, productData);
      logger.logProductAction('UPDATE', productData.barcode, productData.name);
      showToast('success', 'Ürün güncellendi!');
    } else {
      productStorage.add(productData);
      logger.logProductAction('ADD', productData.barcode, productData.name);
      showToast('success', 'Ürün eklendi!');
    }

    loadProducts();
    resetForm();
  };

  const handleEdit = (product: Product) => {
    setFormData({
      barcode: product.barcode,
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      description: product.description || '',
      minStockLevel: product.minStockLevel.toString(),
    });
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`"${product.name}" ürününü silmek istediğinizden emin misiniz?`)) {
      productStorage.delete(product.barcode);
      logger.logProductAction('DELETE', product.barcode, product.name);
      loadProducts();
      showToast('success', 'Ürün silindi!');
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return { color: 'text-error-600 bg-error-50', text: 'Tükendi' };
    } else if (product.stock <= product.minStockLevel) {
      return { color: 'text-warning-600 bg-warning-50', text: 'Kritik' };
    } else {
      return { color: 'text-success-600 bg-success-50', text: 'Normal' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Ürün
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barkod *
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="input w-full"
                placeholder="Barkod numarası"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Adı *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="Ürün adı"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiyat (₺) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input w-full"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stok Miktarı
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="input w-full"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input w-full"
                placeholder="Kategori"
                list="categories"
                required
              />
              <datalist id="categories">
                {categories.map(category => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stok Seviyesi
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                className="input w-full"
                placeholder="5"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Ürün açıklaması"
              />
            </div>
            
            <div className="md:col-span-2 flex gap-3 pt-4">
              <button type="submit" className="btn-primary">
                {editingProduct ? 'Güncelle' : 'Ekle'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                İptal
              </button>
            </div>
          </form>
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
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Barkod</th>
                <th>Ürün Adı</th>
                <th>Kategori</th>
                <th>Fiyat</th>
                <th>Stok</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Ürün bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.barcode}>
                      <td className="font-mono text-sm">{product.barcode}</td>
                      <td>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-gray-500">{product.description}</p>
                          )}
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td className="font-semibold">₺{product.price.toFixed(2)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.stock}</span>
                          {product.stock <= product.minStockLevel && (
                            <AlertTriangle className="w-4 h-4 text-warning-500" />
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-1 text-error-600 hover:bg-error-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsTab;