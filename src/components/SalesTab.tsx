import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Receipt, Printer } from 'lucide-react';
import { Product, CartItem, Sale, SaleItem } from '../types';
import { productStorage, salesStorage, stockMovementStorage } from '../utils/storage';
import { logger } from '../utils/logger';
import { posService, ReceiptData } from '../services/posService';

interface SalesTabProps {
  currentUser: any;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const SalesTab: React.FC<SalesTabProps> = ({ currentUser, showToast }) => {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const product = productStorage.findByBarcode(barcode.trim());
    if (!product) {
      showToast('error', 'Ürün bulunamadı!');
      setBarcode('');
      return;
    }

    if (product.stock === 0) {
      showToast('warning', 'Ürün stokta bulunmuyor!');
      setBarcode('');
      return;
    }

    addToCart(product);
    setBarcode('');
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.barcode === product.barcode);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          showToast('warning', 'Yetersiz stok!');
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.product.barcode === product.barcode
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    
    showToast('success', `${product.name} sepete eklendi`);
  };

  const updateQuantity = (barcode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(barcode);
      return;
    }

    const product = productStorage.findByBarcode(barcode);
    if (!product) return;

    if (newQuantity > product.stock) {
      showToast('warning', 'Yetersiz stok!');
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.barcode === barcode
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (barcode: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.barcode !== barcode));
    showToast('info', 'Ürün sepetten çıkarıldı');
  };

  const clearCart = () => {
    setCart([]);
    showToast('info', 'Sepet temizlendi');
  };

  const printReceipt = async (sale: Sale): Promise<boolean> => {
    if (!autoPrintEnabled || !posService.isConnected()) {
      return true; // Yazdırma kapalı veya cihaz bağlı değil
    }

    try {
      const receiptData: ReceiptData = {
        saleId: sale.id,
        items: sale.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          barcode: item.barcode,
        })),
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        cashier: sale.cashier,
        timestamp: sale.timestamp,
      };

      return await posService.printReceipt(receiptData);
    } catch (error) {
      console.error('Fiş yazdırma hatası:', error);
      return false;
    }
  };

  const completeSale = async (paymentMethod: 'cash' | 'card') => {
    if (cart.length === 0) {
      showToast('warning', 'Sepet boş!');
      return;
    }

    setIsProcessing(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const saleItems: SaleItem[] = cart.map(item => ({
      barcode: item.product.barcode,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: item.product.price * item.quantity,
    }));

    const total = saleItems.reduce((sum, item) => sum + item.total, 0);
    
    const sale: Sale = {
      id: Date.now().toString(),
      items: saleItems,
      total,
      cashier: currentUser.username,
      timestamp: new Date(),
      paymentMethod,
    };

    // Save sale
    salesStorage.add(sale);

    // Update stock
    const products = productStorage.getAll();
    cart.forEach(item => {
      const product = products.find(p => p.barcode === item.product.barcode);
      if (product) {
        const oldStock = product.stock;
        product.stock -= item.quantity;
        product.updatedAt = new Date();
        productStorage.update(product.barcode, product);

        // Log stock movement
        stockMovementStorage.add({
          id: Date.now().toString() + Math.random(),
          barcode: product.barcode,
          productName: product.name,
          type: 'out',
          quantity: item.quantity,
          reason: `Satış - ${sale.id}`,
          username: currentUser.username,
          timestamp: new Date(),
        });

        logger.logStockAction('UPDATE', product.barcode, oldStock, product.stock);
      }
    });

    // Log sale
    logger.logSale(sale.id, total, cart.length);

    // Print receipt if enabled
    if (autoPrintEnabled) {
      const printSuccess = await printReceipt(sale);
      if (!printSuccess) {
        showToast('warning', 'Satış tamamlandı ancak fiş yazdırılamadı!');
      }
    }

    // Clear cart
    setCart([]);
    setIsProcessing(false);

    showToast('success', `Satış tamamlandı! Toplam: ₺${total.toFixed(2)}`);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Barcode Scanner */}
      <div className="lg:col-span-2">
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Barkod Okuyucu</h2>
          <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Barkod okutun veya girin..."
                className="input pl-10 w-full text-lg"
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary">
              Ekle
            </button>
          </form>
        </div>

        {/* Cart Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sepet</h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-2 text-sm text-error-600 hover:text-error-700"
              >
                <Trash2 className="w-4 h-4" />
                Temizle
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Sepet boş</p>
              <p className="text-sm">Ürün eklemek için barkod okutun</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.barcode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-600">₺{item.product.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.barcode, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                        disabled={isProcessing}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.barcode, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                        disabled={isProcessing}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right min-w-[80px]">
                      <p className="font-semibold">₺{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.product.barcode)}
                      className="p-1 text-error-600 hover:bg-error-50 rounded"
                      disabled={isProcessing}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Panel */}
      <div className="space-y-4">
        {/* POS Status */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Fiş Yazdırma
          </h3>
          
          <div className="space-y-3">
            <div className={`flex items-center gap-2 p-2 rounded-lg ${
              posService.isConnected() 
                ? 'bg-success-50 text-success-700' 
                : 'bg-gray-50 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                posService.isConnected() ? 'bg-success-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm">
                {posService.isConnected() ? 'POS Bağlı' : 'POS Bağlı Değil'}
              </span>
            </div>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoPrintEnabled}
                onChange={(e) => setAutoPrintEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Otomatik fiş yazdır</span>
            </label>
          </div>
        </div>

        {/* Payment */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ödeme</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Ürün Sayısı:</span>
                <span className="font-medium">{cart.length}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Toplam Adet:</span>
                <span className="font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Toplam:</span>
                <span className="text-primary-600">₺{getTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => completeSale('cash')}
                disabled={cart.length === 0 || isProcessing}
                className="btn-success flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Banknote className="w-4 h-4" />
                )}
                Nakit
              </button>
              
              <button
                onClick={() => completeSale('card')}
                disabled={cart.length === 0 || isProcessing}
                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Kart
              </button>
            </div>

            {isProcessing && (
              <div className="text-center text-gray-600">
                <Receipt className="w-6 h-6 mx-auto mb-2 animate-bounce" />
                <p className="text-sm">
                  {autoPrintEnabled && posService.isConnected() 
                    ? 'Satış işleniyor ve fiş yazdırılıyor...' 
                    : 'Satış işleniyor...'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTab;