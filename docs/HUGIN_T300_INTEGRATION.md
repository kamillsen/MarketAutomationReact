# Hugin T300 POS Entegrasyon Rehberi

## 📋 Genel Bakış

Bu dokümantasyon, Market Otomasyon Sistemi ile Hugin T300 POS cihazının entegrasyonu için kapsamlı bir rehber sunmaktadır.

## 🔧 Teknik Gereksinimler

### Donanım Gereksinimleri
- **Hugin T300 POS Cihazı**
- **USB Kablosu** (Type-A to Type-B veya USB-C)
- **Windows 10/11** veya **Linux** işletim sistemi
- **Modern Web Tarayıcısı** (Chrome 89+, Edge 89+)

### Yazılım Gereksinimleri
- **Web Serial API** desteği
- **Hugin T300 Sürücüleri**
- **Market Otomasyon Sistemi v1.0+**

## 📡 Bağlantı Protokolleri

### 1. Seri Port Bağlantısı
```
Baud Rate: 9600
Data Bits: 8
Stop Bits: 1
Parity: None
Flow Control: None
```

### 2. ESC/POS Komutları
Hugin T300, standart ESC/POS komutlarını destekler:

```javascript
// Temel komutlar
ESC @ - Yazıcıyı başlat
ESC a 0/1/2 - Hizalama (Sol/Orta/Sağ)
ESC E 1/0 - Kalın yazı açık/kapalı
ESC d n - n satır besle
GS V 0 - Kağıdı kes
```

### 3. Hugin Özel Komutları
```javascript
// Türkçe karakter desteği
ESC t 18 - CP857 karakter seti

// Logo yazdırma (varsa)
FS p 1 0 - Dahili logo yazdır
```

## 🚀 Kurulum Adımları

### 1. Sürücü Kurulumu
1. Hugin'in resmi web sitesinden T300 sürücülerini indirin
2. Sürücüleri yönetici olarak çalıştırın
3. Cihazı USB ile bağlayın
4. Windows Aygıt Yöneticisi'nden COM port numarasını not edin

### 2. Web Serial API Etkinleştirme

#### Chrome/Edge için:
1. `chrome://flags/` adresine gidin
2. "Experimental Web Platform features" özelliğini etkinleştirin
3. Tarayıcıyı yeniden başlatın

#### Firefox için:
- Web Serial API henüz desteklenmiyor
- Chrome veya Edge kullanmanız önerilir

### 3. Sistem Entegrasyonu
1. Market Otomasyon Sistemi'ne yönetici olarak giriş yapın
2. **Ayarlar > POS Cihazı** sekmesine gidin
3. **"Bağlan"** butonuna tıklayın
4. Açılan pencereden doğru COM portunu seçin
5. **"Test Yazdır"** ile bağlantıyı doğrulayın

## 📄 Fiş Formatı

### Standart Fiş Yapısı
```
================================
        MARKET OTOMASYONU
   Satış ve Stok Yönetim Sistemi
================================

Fiş No: 1640995200000
Tarih: 31.12.2023 14:30
Kasiyer: admin
Ödeme: Nakit
--------------------------------
1. Coca Cola 330ml
   2 x 5,50 TL           11,00 TL
   Barkod: 8690637001031

2. Eti Crax 42g
   1 x 3,25 TL            3,25 TL
   Barkod: 8690506455025

================================
TOPLAM:                 14,25 TL

        Teşekkür ederiz!
        Tekrar bekleriz...
```

## 🔍 Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

#### 1. Cihaz Bağlanamıyor
**Belirtiler:**
- "POS cihazına bağlanılamadı" hatası
- COM port listesinde cihaz görünmüyor

**Çözümler:**
- USB kablosunu kontrol edin
- Sürücülerin doğru yüklendiğini kontrol edin
- Aygıt Yöneticisi'nden cihazı yeniden tanımlayın
- Farklı bir USB portu deneyin

#### 2. Fiş Yazdırılamıyor
**Belirtiler:**
- Bağlantı var ama yazdırma çalışmıyor
- Kağıt sıkışması
- Bozuk karakterler

**Çözümler:**
- Kağıt rulolarını kontrol edin
- Yazıcı kafasını temizleyin
- Karakter setini kontrol edin (CP857)
- Test yazdırma yapın

#### 3. Türkçe Karakter Sorunu
**Belirtiler:**
- Türkçe karakterler yanlış görünüyor
- Özel karakterler eksik

**Çözümler:**
- CP857 karakter setini etkinleştirin
- ESC t 18 komutunu gönderin
- Sistem dilini kontrol edin

### Hata Kodları

| Kod | Açıklama | Çözüm |
|-----|----------|-------|
| E001 | Seri port açılamadı | COM port numarasını kontrol edin |
| E002 | Yazıcı yanıt vermiyor | Cihazı yeniden başlatın |
| E003 | Kağıt bitti | Kağıt rulosunu değiştirin |
| E004 | Yazıcı kapağı açık | Kapağı kapatın |

## 🔧 Gelişmiş Ayarlar

### Özel Komut Gönderme
```javascript
// Özel ESC/POS komutu gönderme
await posService.sendCommand('\x1B\x45\x01Hello\x1B\x45\x00');
```

### Logo Ekleme
1. Logo dosyasını bitmap formatına çevirin
2. Hugin Logo Editor ile cihaza yükleyin
3. FS p 1 0 komutu ile yazdırın

### Çekmece Kontrolü
```javascript
// Nakit çekmecesini aç
await posService.sendCommand('\x1B\x70\x00\x19\xFA');
```

## 📞 Destek ve İletişim

### Hugin Teknik Destek
- **Telefon:** 0212 XXX XX XX
- **E-mail:** destek@hugin.com.tr
- **Web:** https://www.hugin.com.tr

### Dokümantasyon
- **Hugin T300 Kullanım Kılavuzu**
- **ESC/POS Komut Referansı**
- **Web Serial API Dokümantasyonu**

## 📝 Notlar

- Bu entegrasyon Web Serial API kullanır ve sadece HTTPS bağlantılarda çalışır
- Bazı güvenlik yazılımları seri port erişimini engelleyebilir
- Cihaz firmware'ini güncel tutun
- Düzenli bakım ve temizlik yapın

## 🔄 Güncelleme Geçmişi

| Versiyon | Tarih | Değişiklikler |
|----------|-------|---------------|
| 1.0.0 | 2024-01-01 | İlk sürüm |
| 1.1.0 | 2024-01-15 | Türkçe karakter desteği |
| 1.2.0 | 2024-02-01 | Otomatik yeniden bağlanma |