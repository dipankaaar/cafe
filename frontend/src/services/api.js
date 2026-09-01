/**
 * Fullstack API Client for Dinenos Cafe Management System
 */

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port !== '5000'
  ? 'http://localhost:5000/api'
  : '/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`[API] Request to ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  // --- Auth & Staff ---
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  getStaff() {
    return this.request('/auth/staff');
  }

  createStaff(staffData) {
    return this.request('/auth/staff', {
      method: 'POST',
      body: JSON.stringify(staffData)
    });
  }

  updateStaff(id, staffData) {
    return this.request(`/auth/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData)
    });
  }

  // --- Menu ---
  getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/menu/products${query ? `?${query}` : ''}`);
  }

  createProduct(productData) {
    return this.request('/menu/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  updateProduct(id, productData) {
    return this.request(`/menu/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  deleteProduct(id) {
    return this.request(`/menu/products/${id}`, {
      method: 'DELETE'
    });
  }

  getCategories() {
    return this.request('/menu/categories');
  }

  createCategory(catData) {
    return this.request('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(catData)
    });
  }

  getAddons() {
    return this.request('/menu/addons');
  }

  createAddon(addonData) {
    return this.request('/menu/addons', {
      method: 'POST',
      body: JSON.stringify(addonData)
    });
  }

  // --- Orders ---
  getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/orders${query ? `?${query}` : ''}`);
  }

  createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  updateOrderStatus(id, status, reason = '') {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    });
  }

  trackOrder(orderNumber) {
    return this.request(`/orders/track/${encodeURIComponent(orderNumber)}`);
  }

  // --- Tables & Reservations ---
  getTables() {
    return this.request('/tables');
  }

  updateTableStatus(id, status, customerName = null, currentOrderId = null) {
    return this.request(`/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, customerName, currentOrderId })
    });
  }

  addTable(tableData) {
    return this.request('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData)
    });
  }

  getReservations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reservations${query ? `?${query}` : ''}`);
  }

  createReservation(reservationData) {
    return this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });
  }

  updateReservationStatus(id, status) {
    return this.request(`/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // --- Customers & Loyalty ---
  getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/customers${query ? `?${query}` : ''}`);
  }

  createCustomer(custData) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(custData)
    });
  }

  adjustLoyalty(customerId, delta, reason) {
    return this.request('/customers/adjust-loyalty', {
      method: 'POST',
      body: JSON.stringify({ customerId, delta, reason })
    });
  }

  // --- Coupons ---
  getCoupons() {
    return this.request('/coupons');
  }

  validateCoupon(payload) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  createCoupon(couponData) {
    return this.request('/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData)
    });
  }

  toggleCoupon(id) {
    return this.request(`/coupons/${id}/toggle`, {
      method: 'PATCH'
    });
  }

  // --- Inventory & Purchases ---
  getInventory() {
    return this.request('/inventory');
  }

  adjustInventory(itemId, delta, reason) {
    return this.request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ itemId, delta, reason })
    });
  }

  createInventoryItem(itemData) {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  getSuppliers() {
    return this.request('/inventory/suppliers');
  }

  createSupplier(supplierData) {
    return this.request('/inventory/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData)
    });
  }

  getPurchases() {
    return this.request('/inventory/purchases');
  }

  createPurchaseOrder(poData) {
    return this.request('/inventory/purchases', {
      method: 'POST',
      body: JSON.stringify(poData)
    });
  }

  // --- Expenses & Reports ---
  getExpenses(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/expenses${query ? `?${query}` : ''}`);
  }

  createExpense(expenseData) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });
  }

  deleteExpense(id) {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE'
    });
  }

  getAnalytics() {
    return this.request('/reports/analytics');
  }

  // --- System, Notifications & Settings ---
  getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs${query ? `?${query}` : ''}`);
  }

  getNotifications() {
    return this.request('/notifications');
  }

  markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  }

  markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'POST'
    });
  }

  getSettings() {
    return this.request('/settings');
  }

  updateSettings(settingsData) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
  }

  // --- Real-time SSE Connection ---
  subscribeToEvents(onEvent) {
    if (typeof window === 'undefined' || !window.EventSource) return null;
    const eventSource = new EventSource(`${API_BASE_URL}/events`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type !== 'CONNECTED') {
          onEvent(payload);
        }
      } catch (e) {
        console.error('SSE Parse Error:', e);
      }
    };

    return eventSource;
  }
}

export const api = new ApiService();
