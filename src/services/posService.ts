// POS Service - Hugin T300 entegrasyonu için temel servis
export interface POSDevice {
  connect(): Promise<boolean>;
  disconnect(): void;
  printReceipt(receiptData: ReceiptData): Promise<boolean>;
  isConnected(): boolean;
}

export interface ReceiptData {
  saleId: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod: 'cash' | 'card';
  cashier: string;
  timestamp: Date;
  customerInfo?: {
    name?: string;
    phone?: string;
  };
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  barcode?: string;
}

// ESC/POS komutları
export const ESC_POS_COMMANDS = {
  // Temel komutlar
  ESC: '\x1B',
  INIT: '\x1B@',
  
  // Metin formatı
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  UNDERLINE_ON: '\x1B\x2D\x01',
  UNDERLINE_OFF: '\x1B\x2D\x00',
  
  // Hizalama
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  
  // Kesme ve besleme
  CUT_PAPER: '\x1D\x56\x00',
  FEED_LINE: '\x0A',
  FEED_LINES: (n: number) => '\x1B\x64' + String.fromCharCode(n),
  
  // Karakter boyutu
  DOUBLE_HEIGHT: '\x1B\x21\x10',
  DOUBLE_WIDTH: '\x1B\x21\x20',
  NORMAL_SIZE: '\x1B\x21\x00',
  
  // Çekmece açma (varsa)
  OPEN_DRAWER: '\x1B\x70\x00\x19\xFA',
};

// Hugin T300 özel komutları (örnek)
export const HUGIN_COMMANDS = {
  // Hugin'e özel başlatma komutu
  HUGIN_INIT: '\x1B\x40\x1B\x74\x12',
  
  // Türkçe karakter desteği
  TURKISH_CHARSET: '\x1B\x74\x12',
  
  // Logo yazdırma (varsa)
  PRINT_LOGO: '\x1C\x70\x01\x00',
};

export class HuginT300Service implements POSDevice {
  private port: SerialPort | null = null;
  private isPortConnected = false;
  private readonly BAUD_RATE = 9600;
  private readonly DATA_BITS = 8;
  private readonly STOP_BITS = 1;
  private readonly PARITY = 'none';

  constructor(private portName: string = 'COM1') {}

  async connect(): Promise<boolean> {
    try {
      // Web Serial API kullanımı (modern tarayıcılar için)
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ 
          baudRate: this.BAUD_RATE,
          dataBits: this.DATA_BITS,
          stopBits: this.STOP_BITS,
          parity: this.PARITY
        });
        
        this.port = port;
        this.isPortConnected = true;
        
        // Cihazı başlat
        await this.sendCommand(ESC_POS_COMMANDS.INIT);
        await this.sendCommand(HUGIN_COMMANDS.TURKISH_CHARSET);
        
        return true;
      }
      
      throw new Error('Web Serial API desteklenmiyor');
    } catch (error) {
      console.error('POS bağlantı hatası:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.port && this.isPortConnected) {
      this.port.close();
      this.port = null;
      this.isPortConnected = false;
    }
  }

  isConnected(): boolean {
    return this.isPortConnected;
  }

  private async sendCommand(command: string): Promise<void> {
    if (!this.port || !this.isPortConnected) {
      throw new Error('POS cihazı bağlı değil');
    }

    const writer = this.port.writable?.getWriter();
    if (writer) {
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(command));
      writer.releaseLock();
    }
  }

  private formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + ' TL';
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private generateReceiptContent(data: ReceiptData): string {
    let content = '';
    
    // Başlık
    content += ESC_POS_COMMANDS.INIT;
    content += ESC_POS_COMMANDS.ALIGN_CENTER;
    content += ESC_POS_COMMANDS.DOUBLE_HEIGHT;
    content += ESC_POS_COMMANDS.BOLD_ON;
    content += 'MARKET OTOMASYONU\n';
    content += ESC_POS_COMMANDS.NORMAL_SIZE;
    content += ESC_POS_COMMANDS.BOLD_OFF;
    content += 'Satış ve Stok Yönetim Sistemi\n';
    content += '================================\n';
    content += ESC_POS_COMMANDS.FEED_LINE;
    
    // Fiş bilgileri
    content += ESC_POS_COMMANDS.ALIGN_LEFT;
    content += `Fiş No: ${data.saleId}\n`;
    content += `Tarih: ${this.formatDateTime(data.timestamp)}\n`;
    content += `Kasiyer: ${data.cashier}\n`;
    content += `Ödeme: ${data.paymentMethod === 'cash' ? 'Nakit' : 'Kart'}\n`;
    content += '--------------------------------\n';
    
    // Ürün listesi
    data.items.forEach((item, index) => {
      content += `${index + 1}. ${item.name}\n`;
      content += `   ${item.quantity} x ${this.formatPrice(item.unitPrice)}`;
      content += ESC_POS_COMMANDS.ALIGN_RIGHT;
      content += `${this.formatPrice(item.total)}\n`;
      content += ESC_POS_COMMANDS.ALIGN_LEFT;
      
      if (item.barcode) {
        content += `   Barkod: ${item.barcode}\n`;
      }
      content += '\n';
    });
    
    // Toplam
    content += '================================\n';
    content += ESC_POS_COMMANDS.DOUBLE_HEIGHT;
    content += ESC_POS_COMMANDS.BOLD_ON;
    content += 'TOPLAM: ';
    content += ESC_POS_COMMANDS.ALIGN_RIGHT;
    content += `${this.formatPrice(data.total)}\n`;
    content += ESC_POS_COMMANDS.NORMAL_SIZE;
    content += ESC_POS_COMMANDS.BOLD_OFF;
    content += ESC_POS_COMMANDS.ALIGN_LEFT;
    
    // Alt bilgi
    content += ESC_POS_COMMANDS.FEED_LINE;
    content += ESC_POS_COMMANDS.ALIGN_CENTER;
    content += 'Teşekkür ederiz!\n';
    content += 'Tekrar bekleriz...\n';
    content += ESC_POS_COMMANDS.FEED_LINES(3);
    
    // Kağıdı kes
    content += ESC_POS_COMMANDS.CUT_PAPER;
    
    return content;
  }

  async printReceipt(data: ReceiptData): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        throw new Error('POS cihazı bağlı değil');
      }

      const receiptContent = this.generateReceiptContent(data);
      await this.sendCommand(receiptContent);
      
      return true;
    } catch (error) {
      console.error('Fiş yazdırma hatası:', error);
      return false;
    }
  }

  // Test yazdırma
  async printTestReceipt(): Promise<boolean> {
    const testData: ReceiptData = {
      saleId: 'TEST-' + Date.now(),
      items: [
        {
          name: 'Test Ürünü',
          quantity: 1,
          unitPrice: 10.50,
          total: 10.50,
          barcode: '1234567890123'
        }
      ],
      total: 10.50,
      paymentMethod: 'cash',
      cashier: 'Test Kullanıcı',
      timestamp: new Date()
    };

    return this.printReceipt(testData);
  }
}

// Singleton instance
export const posService = new HuginT300Service();