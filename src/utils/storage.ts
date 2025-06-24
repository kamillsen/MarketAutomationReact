import { Product, Sale, User, LogEntry, StockMovement } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'market_products',
  SALES: 'market_sales',
  USERS: 'market_users',
  LOGS: 'market_logs',
  STOCK_MOVEMENTS: 'market_stock_movements',
  CURRENT_USER: 'market_current_user',
} as const;

// Generic storage utilities
export const storage = {
  get: <T>(key: string): T[] => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  set: <T>(key: string, data: T[]): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Storage error:', error);
    }
  },

  getOne: <T>(key: string): T | null => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setOne: <T>(key: string, data: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Storage error:', error);
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};

// Product storage
export const productStorage = {
  getAll: (): Product[] => storage.get<Product>(STORAGE_KEYS.PRODUCTS),
  save: (products: Product[]): void => storage.set(STORAGE_KEYS.PRODUCTS, products),
  add: (product: Product): void => {
    const products = productStorage.getAll();
    products.push(product);
    productStorage.save(products);
  },
  update: (barcode: string, updatedProduct: Product): void => {
    const products = productStorage.getAll();
    const index = products.findIndex(p => p.barcode === barcode);
    if (index !== -1) {
      products[index] = updatedProduct;
      productStorage.save(products);
    }
  },
  delete: (barcode: string): void => {
    const products = productStorage.getAll();
    const filtered = products.filter(p => p.barcode !== barcode);
    productStorage.save(filtered);
  },
  findByBarcode: (barcode: string): Product | undefined => {
    const products = productStorage.getAll();
    return products.find(p => p.barcode === barcode);
  },
};

// Sales storage
export const salesStorage = {
  getAll: (): Sale[] => storage.get<Sale>(STORAGE_KEYS.SALES),
  save: (sales: Sale[]): void => storage.set(STORAGE_KEYS.SALES, sales),
  add: (sale: Sale): void => {
    const sales = salesStorage.getAll();
    sales.push(sale);
    salesStorage.save(sales);
  },
};

// User storage
export const userStorage = {
  getAll: (): User[] => storage.get<User>(STORAGE_KEYS.USERS),
  save: (users: User[]): void => storage.set(STORAGE_KEYS.USERS, users),
  getCurrentUser: (): User | null => storage.getOne<User>(STORAGE_KEYS.CURRENT_USER),
  setCurrentUser: (user: User): void => storage.setOne(STORAGE_KEYS.CURRENT_USER, user),
  logout: (): void => storage.remove(STORAGE_KEYS.CURRENT_USER),
};

// Log storage
export const logStorage = {
  getAll: (): LogEntry[] => storage.get<LogEntry>(STORAGE_KEYS.LOGS),
  save: (logs: LogEntry[]): void => storage.set(STORAGE_KEYS.LOGS, logs),
  add: (log: LogEntry): void => {
    const logs = logStorage.getAll();
    logs.push(log);
    logStorage.save(logs);
  },
};

// Stock movement storage
export const stockMovementStorage = {
  getAll: (): StockMovement[] => storage.get<StockMovement>(STORAGE_KEYS.STOCK_MOVEMENTS),
  save: (movements: StockMovement[]): void => storage.set(STORAGE_KEYS.STOCK_MOVEMENTS, movements),
  add: (movement: StockMovement): void => {
    const movements = stockMovementStorage.getAll();
    movements.push(movement);
    stockMovementStorage.save(movements);
  },
};

// Initialize default data
export const initializeDefaultData = (): void => {
  // Initialize users if empty
  const users = userStorage.getAll();
  if (users.length === 0) {
    const defaultUsers: User[] = [
      {
        username: 'admin',
        role: 'admin',
        fullName: 'Sistem Yöneticisi',
        isActive: true,
      },
      {
        username: 'manager',
        role: 'manager',
        fullName: 'Mağaza Müdürü',
        isActive: true,
      },
      {
        username: 'cashier',
        role: 'cashier',
        fullName: 'Kasiyer',
        isActive: true,
      },
    ];
    userStorage.save(defaultUsers);
  }

  // Initialize sample products if empty
  const products = productStorage.getAll();
  if (products.length === 0) {
    const sampleProducts: Product[] = [
      {
        barcode: '8690637001031',
        name: 'Coca Cola 330ml',
        price: 5.50,
        stock: 100,
        category: 'İçecekler',
        description: 'Gazlı içecek',
        minStockLevel: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        barcode: '8690506455025',
        name: 'Eti Crax 42g',
        price: 3.25,
        stock: 50,
        category: 'Atıştırmalık',
        description: 'Çikolatalı bisküvi',
        minStockLevel: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        barcode: '8690546171394',
        name: 'Fairy Sıvı Deterjan 650ml',
        price: 12.90,
        stock: 25,
        category: 'Temizlik',
        description: 'Bulaşık deterjanı',
        minStockLevel: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        barcode: '8690504043355',
        name: 'Süt 1L',
        price: 8.75,
        stock: 30,
        category: 'Süt Ürünleri',
        description: 'Tam yağlı süt',
        minStockLevel: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        barcode: '8690526016044',
        name: 'Ekmek 350g',
        price: 4.00,
        stock: 20,
        category: 'Unlu Mamüller',
        description: 'Günlük ekmek',
        minStockLevel: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    productStorage.save(sampleProducts);
  }
};