/**
 * Persistent Database Service with LocalStorage Relational Integrity & Schema Fallback
 */

import {
  initialCafeSettings,
  initialCategories,
  initialAddons,
  initialProducts,
  initialTables,
  initialCustomers,
  initialCoupons,
  initialInventory,
  initialSuppliers,
  initialPurchases,
  initialExpenses,
  initialStaff,
  initialReservations,
  initialOrders,
  initialAuditLogs,
  initialNotifications
} from './seedData';

const DB_KEYS = {
  SETTINGS: 'dinenos_settings',
  CATEGORIES: 'dinenos_categories',
  ADDONS: 'dinenos_addons',
  PRODUCTS: 'dinenos_products',
  TABLES: 'dinenos_tables',
  CUSTOMERS: 'dinenos_customers',
  COUPONS: 'dinenos_coupons',
  INVENTORY: 'dinenos_inventory',
  SUPPLIERS: 'dinenos_suppliers',
  PURCHASES: 'dinenos_purchases',
  EXPENSES: 'dinenos_expenses',
  STAFF: 'dinenos_staff',
  RESERVATIONS: 'dinenos_reservations',
  ORDERS: 'dinenos_orders',
  AUDIT_LOGS: 'dinenos_audit_logs',
  NOTIFICATIONS: 'dinenos_notifications'
};

class DBService {
  constructor() {
    this.initDatabase();
  }

  initDatabase(forceReset = false) {
    if (forceReset || !localStorage.getItem(DB_KEYS.PRODUCTS)) {
      localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(initialCafeSettings));
      localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(initialCategories));
      localStorage.setItem(DB_KEYS.ADDONS, JSON.stringify(initialAddons));
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(initialProducts));
      localStorage.setItem(DB_KEYS.TABLES, JSON.stringify(initialTables));
      localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
      localStorage.setItem(DB_KEYS.COUPONS, JSON.stringify(initialCoupons));
      localStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify(initialInventory));
      localStorage.setItem(DB_KEYS.SUPPLIERS, JSON.stringify(initialSuppliers));
      localStorage.setItem(DB_KEYS.PURCHASES, JSON.stringify(initialPurchases));
      localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(initialExpenses));
      localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(initialStaff));
      localStorage.setItem(DB_KEYS.RESERVATIONS, JSON.stringify(initialReservations));
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(initialOrders));
      localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(initialAuditLogs));
      localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
    }
  }

  get(key, defaultValue = []) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`DB Read error for ${key}:`, e);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`DB Write error for ${key}:`, e);
      return false;
    }
  }

  // Helper for audit logging
  logAudit({ user, action, category, details }) {
    const logs = this.get(DB_KEYS.AUDIT_LOGS, initialAuditLogs);
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: user || 'System',
      action,
      category,
      details,
      ip: '127.0.0.1'
    };
    logs.unshift(newLog);
    this.set(DB_KEYS.AUDIT_LOGS, logs.slice(0, 500)); // Cap to 500 logs
    return newLog;
  }

  // Helper for creating notifications
  addNotification({ title, message, type = 'info', link = '/' }) {
    const notifs = this.get(DB_KEYS.NOTIFICATIONS, initialNotifications);
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      time: 'Just now',
      isRead: false,
      link
    };
    notifs.unshift(newNotif);
    this.set(DB_KEYS.NOTIFICATIONS, notifs.slice(0, 100));
    return newNotif;
  }

  resetAllData() {
    this.initDatabase(true);
  }
}

export const dbService = new DBService();
export { DB_KEYS };
