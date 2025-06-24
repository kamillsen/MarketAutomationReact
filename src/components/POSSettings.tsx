import React, { useState, useEffect } from 'react';
import { Printer, Wifi, WifiOff, Settings, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { posService } from '../services/posService';

interface POSSettingsProps {
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const POSSettings: React.FC<POSSettingsProps> = ({ showToast }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    // Bağlantı durumunu kontrol et
    setIsConnected(posService.isConnected());
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      const success = await posService.connect();
      
      if (success) {
        setIsConnected(true);
        setConnectionStatus('connected');
        showToast('success', 'POS cihazı başarıyla bağlandı!');
      } else {
        setConnectionStatus('error');
        showToast('error', 'POS cihazına bağlanılamadı!');
      }
    } catch (error) {
      setConnectionStatus('error');
      showToast('error', 'Bağlantı hatası: ' + (error as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    posService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    showToast('info', 'POS cihazı bağlantısı kesildi');
  };

  const handleTestPrint = async () => {
    if (!isConnected) {
      showToast('warning', 'Önce POS cihazını bağlayın!');
      return;
    }

    setIsTesting(true);
    
    try {
      const success = await posService.printTestReceipt();
      
      if (success) {
        showToast('success', 'Test fişi başarıyla yazdırıldı!');
      } else {
        showToast('error', 'Test fişi yazdırılamadı!');
      }
    } catch (error) {
      showToast('error', 'Yazdırma hatası: ' + (error as Error).message);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'connecting':
        return <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error-600" />;
      default:
        return <WifiOff className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Bağlı';
      case 'connecting':
        return 'Bağlanıyor...';
      case 'error':
        return 'Bağlantı Hatası';
      default:
        return 'Bağlı Değil';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'connecting':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'error':
        return 'text-error-600 bg-error-50 border-error-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* POS Cihazı Durumu */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Printer className="w-6 h-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">POS Cihazı (Hugin T300)</h2>
        </div>

        <div className="space-y-4">
          {/* Durum Göstergesi */}
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${getStatusColor()}`}>
            {getStatusIcon()}
            <div>
              <p className="font-medium">Durum: {getStatusText()}</p>
              <p className="text-sm opacity-75">
                {isConnected 
                  ? 'Cihaz hazır, fiş yazdırabilirsiniz'
                  : 'Cihazı bağlamak için "Bağlan" butonuna tıklayın'
                }
              </p>
            </div>
          </div>

          {/* Kontrol Butonları */}
          <div className="flex gap-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="btn-primary flex items-center gap-2"
              >
                {isConnecting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                {isConnecting ? 'Bağlanıyor...' : 'Bağlan'}
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="btn-error flex items-center gap-2"
              >
                <WifiOff className="w-4 h-4" />
                Bağlantıyı Kes
              </button>
            )}

            <button
              onClick={handleTestPrint}
              disabled={!isConnected || isTesting}
              className="btn-secondary flex items-center gap-2"
            >
              {isTesting ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              {isTesting ? 'Yazdırılıyor...' : 'Test Yazdır'}
            </button>
          </div>
        </div>
      </div>

      {/* Teknik Bilgiler */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Teknik Bilgiler
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cihaz Modeli</label>
              <p className="text-sm text-gray-600">Hugin T300</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Bağlantı Türü</label>
              <p className="text-sm text-gray-600">USB/Seri Port</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Protokol</label>
              <p className="text-sm text-gray-600">ESC/POS + Hugin Özel Komutları</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Baud Rate</label>
              <p className="text-sm text-gray-600">9600</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Data Bits</label>
              <p className="text-sm text-gray-600">8</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Karakter Desteği</label>
              <p className="text-sm text-gray-600">Türkçe (CP857)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kurulum Talimatları */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kurulum Talimatları</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <h4 className="font-medium text-primary-800 mb-2">1. Cihaz Bağlantısı</h4>
            <ul className="text-sm text-primary-700 list-disc list-inside space-y-1">
              <li>Hugin T300 cihazını USB kablosu ile bilgisayara bağlayın</li>
              <li>Cihazın sürücülerinin yüklendiğinden emin olun</li>
              <li>Windows Aygıt Yöneticisi'nden COM port numarasını kontrol edin</li>
            </ul>
          </div>

          <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <h4 className="font-medium text-warning-800 mb-2">2. Tarayıcı İzinleri</h4>
            <ul className="text-sm text-warning-700 list-disc list-inside space-y-1">
              <li>Chrome/Edge tarayıcısında Web Serial API'yi etkinleştirin</li>
              <li>Bağlan butonuna tıkladığınızda port seçim ekranı açılacak</li>
              <li>Doğru COM portunu seçin ve "Bağlan" deyin</li>
            </ul>
          </div>

          <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
            <h4 className="font-medium text-success-800 mb-2">3. Test ve Kullanım</h4>
            <ul className="text-sm text-success-700 list-disc list-inside space-y-1">
              <li>Bağlantı kurulduktan sonra "Test Yazdır" ile deneme yapın</li>
              <li>Satış işlemlerinde otomatik fiş yazdırma aktif olacak</li>
              <li>Sorun yaşarsanız cihazı yeniden bağlamayı deneyin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSSettings;