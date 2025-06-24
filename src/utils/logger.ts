import { LogEntry } from '../types';
import { logStorage, userStorage } from './storage';

export const logger = {
  log: (action: string, details: string = ''): void => {
    const currentUser = userStorage.getCurrentUser();
    if (!currentUser) return;

    const logEntry: LogEntry = {
      id: Date.now().toString(),
      username: currentUser.username,
      action,
      timestamp: new Date(),
      details,
    };

    logStorage.add(logEntry);
  },

  logSale: (saleId: string, total: number, itemCount: number): void => {
    logger.log('SALE_COMPLETED', `Sale ID: ${saleId}, Total: ₺${total.toFixed(2)}, Items: ${itemCount}`);
  },

  logProductAction: (action: 'ADD' | 'UPDATE' | 'DELETE', barcode: string, productName: string): void => {
    logger.log(`PRODUCT_${action}`, `${productName} (${barcode})`);
  },

  logStockAction: (action: 'UPDATE' | 'ADJUSTMENT', barcode: string, oldStock: number, newStock: number): void => {
    logger.log(`STOCK_${action}`, `${barcode}: ${oldStock} → ${newStock}`);
  },

  logAuth: (action: 'LOGIN' | 'LOGOUT', username: string): void => {
    const logEntry: LogEntry = {
      id: Date.now().toString(),
      username,
      action: `AUTH_${action}`,
      timestamp: new Date(),
      details: '',
    };
    logStorage.add(logEntry);
  },
};