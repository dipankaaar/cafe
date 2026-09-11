/**
 * Fullstack API Client for Dinenos Cafe Management System
 */

const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    if (window.location.port !== '5000') {
      return 'http://localhost:5000/api';
    }
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

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
      const payload = await response.json();
      // Unwrap backend envelope { success, statusCode, message, data } —
      // all ApiResponse.success/created payloads carry the real body in `data`.
      if (payload && payload.success === true && 'data' in payload) {
        return payload.data;
      }
      return payload;
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

  deleteStaff(id) {
    return this.request(`/auth/staff/${id}`, {
      method: 'DELETE'
    });
  }

  updateAdminCredentials(credentials) {
    return this.request('/auth/admin-credentials', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }


  // --- Menu ---
  getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/menu/products${query ? `?${query}` : ''}`);
  }

  getProductById(id) {
    return this.request(`/menu/products/${id}`);
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

  patchProduct(id, productData) {
    return this.request(`/menu/products/${id}`, {
      method: 'PATCH',
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

  getCategoryById(id) {
    return this.request(`/menu/categories/${id}`);
  }

  createCategory(catData) {
    return this.request('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(catData)
    });
  }

  updateCategory(id, catData) {
    return this.request(`/menu/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(catData)
    });
  }

  patchCategory(id, catData) {
    return this.request(`/menu/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(catData)
    });
  }

  deleteCategory(id) {
    return this.request(`/menu/categories/${id}`, {
      method: 'DELETE'
    });
  }

  getAddons() {
    return this.request('/menu/addons');
  }

  getAddonById(id) {
    return this.request(`/menu/addons/${id}`);
  }

  createAddon(addonData) {
    return this.request('/menu/addons', {
      method: 'POST',
      body: JSON.stringify(addonData)
    });
  }

  updateAddon(id, addonData) {
    return this.request(`/menu/addons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(addonData)
    });
  }

  patchAddon(id, addonData) {
    return this.request(`/menu/addons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(addonData)
    });
  }

  deleteAddon(id) {
    return this.request(`/menu/addons/${id}`, {
      method: 'DELETE'
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

  // Active KDS queue: placed + accepted + brewing + ready (backend resolves `active`)
  getActiveOrders(params = {}) {
    return this.getOrders({ status: 'active', ...params });
  }

  refundOrder(id, reason = '') {
    return this.request(`/orders/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // Delivery leg: rider assignment + OTP handover verification
  assignRider(id, { riderName, riderPhone, riderId } = {}) {
    return this.request(`/orders/${id}/assign-rider`, {
      method: 'PATCH',
      body: JSON.stringify({ riderName, riderPhone, riderId })
    });
  }

  verifyDelivery(id, otp) {
    return this.request(`/orders/${id}/verify-delivery`, {
      method: 'POST',
      body: JSON.stringify({ otp })
    });
  }

  trackOrder(orderNumber) {
    return this.request(`/orders/track/${encodeURIComponent(orderNumber)}`);
  }

  deleteOrder(id) {
    return this.request(`/orders/${id}`, {
      method: 'DELETE'
    });
  }

  purgeDemoData() {
    return this.request('/system/purge-demo-data', {
      method: 'POST'
    });
  }


  // --- Tables & Reservations ---
  getTables(branchId = 'all') {
    const q = branchId && branchId !== 'all' ? `?branchId=${encodeURIComponent(branchId)}` : '';
    return this.request(`/tables${q}`);
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

  updateTable(id, tableData) {
    return this.request(`/tables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(tableData)
    });
  }

  deleteTable(id) {
    return this.request(`/tables/${id}`, {
      method: 'DELETE'
    });
  }

  // --- QR Table Ordering API ---
  validateQrToken(token) {
    return this.request(`/tables/qr/validate/${encodeURIComponent(token)}`);
  }

  // Spec alias: GET /api/tables/qr/:token -> flat table info
  getTableByQrToken(token) {
    return this.request(`/tables/qr/${encodeURIComponent(token)}`);
  }

  occupyTable(id, { customerName = null, currentOrderId = null } = {}) {
    return this.request(`/tables/${id}/occupy`, {
      method: 'POST',
      body: JSON.stringify({ customerName, currentOrderId })
    });
  }

  releaseTable(id) {
    return this.request(`/tables/${id}/release`, {
      method: 'POST'
    });
  }

  getTableQr(id) {
    return this.request(`/tables/${id}/qr`);
  }

  regenerateTableQr(id) {
    return this.request(`/tables/${id}/qr/regenerate`, {
      method: 'POST'
    });
  }

  setTableQrStatus(id, status) {
    return this.request(`/tables/${id}/qr/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  getTableActiveOrders(id) {
    return this.request(`/tables/${id}/active-orders`);
  }

  getTableOrderHistory(id) {
    return this.request(`/tables/${id}/order-history`);
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

  deleteReservation(id) {
    return this.request(`/reservations/${id}`, {
      method: 'DELETE'
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

  deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE'
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

  updateCoupon(id, couponData) {
    return this.request(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(couponData)
    });
  }

  deleteCoupon(id) {
    return this.request(`/coupons/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Inventory & Purchases (full CRUD + PO receive) ---
  getInventory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/inventory${query ? `?${query}` : ''}`);
  }

  getInventoryItem(id) {
    return this.request(`/inventory/${id}`);
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

  updateInventoryItem(id, itemData) {
    return this.request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
  }

  patchInventoryItem(id, itemData) {
    return this.request(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(itemData)
    });
  }

  deleteInventoryItem(id) {
    return this.request(`/inventory/${id}`, {
      method: 'DELETE'
    });
  }

  getSuppliers() {
    return this.request('/inventory/suppliers');
  }

  getSupplierById(id) {
    return this.request(`/inventory/suppliers/${id}`);
  }

  createSupplier(supplierData) {
    return this.request('/inventory/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData)
    });
  }

  updateSupplier(id, supplierData) {
    return this.request(`/inventory/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData)
    });
  }

  patchSupplier(id, supplierData) {
    return this.request(`/inventory/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(supplierData)
    });
  }

  deleteSupplier(id) {
    return this.request(`/inventory/suppliers/${id}`, {
      method: 'DELETE'
    });
  }

  getPurchases(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/inventory/purchases${query ? `?${query}` : ''}`);
  }

  getPurchaseById(id) {
    return this.request(`/inventory/purchases/${id}`);
  }

  createPurchaseOrder(poData) {
    return this.request('/inventory/purchases', {
      method: 'POST',
      body: JSON.stringify(poData)
    });
  }

  updatePurchaseOrder(id, poData) {
    return this.request(`/inventory/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(poData)
    });
  }

  patchPurchaseOrder(id, poData) {
    return this.request(`/inventory/purchases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(poData)
    });
  }

  deletePurchaseOrder(id) {
    return this.request(`/inventory/purchases/${id}`, {
      method: 'DELETE'
    });
  }

  receivePurchaseOrder(id, payload = {}) {
    return this.request(`/inventory/purchases/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(payload)
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

  getAnalytics(range = 'today', branchId = 'all') {
    const safe = ['today', 'week', 'month'].includes(range) ? range : 'today';
    const branch = branchId && branchId !== 'all' ? `&branchId=${encodeURIComponent(branchId)}` : '';
    return this.request(`/reports/analytics?range=${safe}${branch}`);
  }

  getRecentOrders(limit = 5) {
    return this.request(`/orders?limit=${Number(limit) || 5}`);
  }

  // --- System, Notifications & Settings ---
  getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs${query ? `?${query}` : ''}`);
  }

  getNotifications() {
    return this.request('/notifications');
  }

  // Customer "Call Waiter" button: POST /api/notifications
  callWaiter({ tableId = null, tableNumber = null, customerName = '', message = '' } = {}) {
    const label = tableNumber ? `Table ${tableNumber}` : 'your table';
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        title: `Waiter requested at ${label}`,
        message: message || `${customerName ? `${customerName} at ${label}` : `A guest at ${label}`} needs assistance.`,
        type: 'service',
        tableId,
        tableNumber,
        link: '/tables'
      })
    });
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

  checkHealth() {
    return this.request('/health');
  }

  // --- Branches (multi-outlet) ---
  getBranches() {
    return this.request('/branches');
  }

  createBranch(branchData) {
    return this.request('/branches', {
      method: 'POST',
      body: JSON.stringify(branchData)
    });
  }

  updateBranch(id, branchData) {
    return this.request(`/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(branchData)
    });
  }

  deleteBranch(id) {
    return this.request(`/branches/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Mobile OTP Verification (WhatsApp Baileys) ---
  sendOtp(phone, context = 'Staff Login') {
    return this.request('/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, context })
    });
  }

  verifyOtp({ phone, otp, name, email, address, landmark }) {
    return this.request('/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, email, address, landmark })
    });
  }

  getWhatsAppStatus() {
    return this.request('/whatsapp/status');
  }

  getWhatsAppQr() {
    return this.request('/whatsapp/qr');
  }

  requestWhatsAppPairing(phone) {
    return this.request('/whatsapp/pair', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  }

  logoutWhatsApp() {
    return this.request('/whatsapp/logout', {
      method: 'POST'
    });
  }

  reconnectWhatsApp() {
    return this.request('/whatsapp/reconnect', {
      method: 'POST'
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
