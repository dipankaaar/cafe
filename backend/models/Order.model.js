import { db } from '../db/connection.js';
import { parseJSON, sanitize, getCurrentTimestamp, generateOrderNumber } from '../utils/helpers.js';
import { normalizeOrderStatus, ACTIVE_ORDER_STATUSES } from '../config/constants.js';

export class OrderModel {
  static findAll({ status, type, source, search, date, limit = 100, offset = 0 } = {}) {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      const norm = normalizeOrderStatus(status);
      if (status === 'active') {
        sql += ` AND LOWER(status) IN (${ACTIVE_ORDER_STATUSES.map(() => 'LOWER(?)').join(', ')})`;
        params.push(...ACTIVE_ORDER_STATUSES);
      } else if (norm) {
        // Match canonical value plus its legacy capitalized alias (e.g. brewing <-> Preparing)
        sql += ' AND LOWER(status) = LOWER(?)';
        params.push(norm);
      } else {
        sql += ' AND LOWER(status) = LOWER(?)';
        params.push(status);
      }
    }
    if (type && type !== 'all') {
      sql += ' AND LOWER(order_type) = LOWER(?)';
      params.push(type);
    }
    if (source && source !== 'all') {
      sql += ' AND LOWER(order_source) = LOWER(?)';
      params.push(source);
    }
    if (date && String(date).trim()) {
      sql += ' AND substr(order_time, 1, 10) = ?';
      params.push(String(date).trim().slice(0, 10));
    }
    if (search && search.trim()) {
      sql += ' AND (LOWER(order_number) LIKE LOWER(?) OR LOWER(customer_name) LIKE LOWER(?) OR customer_phone LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY order_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);
    return rows.map(this.format);
  }

  static findById(id) {
    const row = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(id, id);
    return row ? this.format(row) : null;
  }

  static findByOrderNumber(orderNumber) {
    const row = db.prepare('SELECT * FROM orders WHERE LOWER(order_number) = LOWER(?)').get(orderNumber.trim());
    return row ? this.format(row) : null;
  }

  static findByCustomer(customerIdOrPhone) {
    if (!customerIdOrPhone) return [];
    const id = String(customerIdOrPhone).trim();
    const rows = db.prepare(`
      SELECT * FROM orders
      WHERE customer_id = ? OR customer_phone = ? OR customer_phone LIKE ?
      ORDER BY order_time DESC LIMIT 100
    `).all(id, id, `%${id}%`);
    return rows.map(this.format);
  }

  static countCouponUsageByCustomer(couponCode, customerId, customerPhone) {
    const code = String(couponCode || '').trim().toUpperCase();
    if (!code) return 0;
    let sql = 'SELECT COUNT(*) as cnt FROM orders WHERE UPPER(coupon_code) = UPPER(?)';
    const params = [code];
    const clauses = [];
    if (customerId) { clauses.push('customer_id = ?'); params.push(customerId); }
    if (customerPhone) { clauses.push('customer_phone = ?'); params.push(customerPhone); }
    if (clauses.length === 0) return 0;
    sql += ` AND (${clauses.join(' OR ')})`;
    try {
      const row = db.prepare(sql).get(...params);
      return Number(row?.cnt || 0);
    } catch (e) {
      return 0;
    }
  }

  static create(data) {
    const id = data.id || `ord-${Date.now()}`;
    const orderNumber = data.orderNumber || generateOrderNumber('DN');
    const now = getCurrentTimestamp();
    const status = normalizeOrderStatus(data.status) || 'placed';

    const hasPaymentsCol = this._hasPaymentsColumn();
    const stmt = db.prepare(`
      INSERT INTO orders (
        id, order_number, order_type, order_source, qr_token, table_id, table_number,
        customer_id, customer_name, customer_phone, status, order_time,
        items_json, subtotal, discount_amount, coupon_code, coupon_id,
        tax_amount, service_charge, grand_total, payment_method, payment_status,
        ${hasPaymentsCol ? 'payments_json, ' : ''}notes, server_staff
      ) VALUES (${hasPaymentsCol ? '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?' : '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?'})
    `);

    const values = [
      id,
      orderNumber,
      data.orderType || 'dine-in',
      data.orderSource || (data.qrToken ? 'QR_TABLE' : (data.orderType === 'dine-in' ? 'POS' : 'ONLINE')),
      sanitize(data.qrToken, null),
      sanitize(data.tableId, null),
      sanitize(data.tableNumber, null),
      sanitize(data.customerId, null),
      data.customerName || 'Walk-in Guest',
      sanitize(data.customerPhone, ''),
      status,
      now,
      JSON.stringify(data.items || []),
      Number(data.subtotal || 0),
      Number(data.discountAmount || 0),
      sanitize(data.couponCode, null),
      sanitize(data.couponId, null),
      Number(data.taxAmount || 0),
      Number(data.serviceCharge || 0),
      Number(data.grandTotal || 0),
      data.paymentMethod || 'Cash',
      data.paymentStatus || 'Pending'
    ];
    if (hasPaymentsCol) {
      values.push(data.payments ? JSON.stringify(data.payments) : sanitize(data.paymentsJson, null));
    }
    values.push(sanitize(data.notes, ''));
    values.push(data.serverStaff || (data.orderSource === 'QR_TABLE' ? 'QR Self-Order' : 'Cashier'));

    stmt.run(...values);

    return this.findById(id);
  }

  static updateStatus(id, { status, kitchenAcceptedAt, kitchenReadyAt, completedAt, paymentStatus, payments }) {
    const normStatus = normalizeOrderStatus(status) || status;
    const hasPaymentsCol = this._hasPaymentsColumn();
    const stmt = db.prepare(`
      UPDATE orders SET
        status = ?,
        kitchen_accepted_at = COALESCE(?, kitchen_accepted_at),
        kitchen_ready_at = COALESCE(?, kitchen_ready_at),
        completed_at = COALESCE(?, completed_at),
        payment_status = COALESCE(?, payment_status)
        ${hasPaymentsCol && payments ? ', payments_json = ?' : ''}
      WHERE id = ?
    `);

    const args = [
      normStatus,
      sanitize(kitchenAcceptedAt, null),
      sanitize(kitchenReadyAt, null),
      sanitize(completedAt, null),
      sanitize(paymentStatus, null)
    ];
    if (hasPaymentsCol && payments) args.push(JSON.stringify(payments));
    args.push(id);

    stmt.run(...args);

    return this.findById(id);
  }

  static _hasPaymentsColumn() {
    try {
      const cols = db.prepare('PRAGMA table_info(orders)').all();
      return cols.some((c) => c.name === 'payments_json');
    } catch (e) {
      return false;
    }
  }

  static format(row) {
    const rawStatus = row.status;
    const normStatus = normalizeOrderStatus(rawStatus) || rawStatus;
    return {
      id: row.id,
      orderNumber: row.order_number,
      orderType: row.order_type,
      orderSource: row.order_source || 'POS',
      qrToken: row.qr_token,
      tableId: row.table_id,
      tableNumber: row.table_number,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      status: normStatus,
      orderTime: row.order_time,
      kitchenAcceptedAt: row.kitchen_accepted_at,
      kitchenReadyAt: row.kitchen_ready_at,
      completedAt: row.completed_at,
      items: parseJSON(row.items_json, []),
      subtotal: row.subtotal,
      discountAmount: row.discount_amount,
      couponCode: row.coupon_code,
      couponId: row.coupon_id,
      taxAmount: row.tax_amount,
      serviceCharge: row.service_charge,
      grandTotal: row.grand_total,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      payments: parseJSON(row.payments_json, null),
      notes: row.notes,
      serverStaff: row.server_staff
    };
  }
}
