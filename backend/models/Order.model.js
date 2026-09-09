import { db } from '../db/connection.js';
import { parseJSON, sanitize, getCurrentTimestamp, generateOrderNumber } from '../utils/helpers.js';
import { normalizeOrderStatus, ACTIVE_ORDER_STATUSES } from '../config/constants.js';

export class OrderModel {
  static _colCache = null;

  static _cols() {
    if (this._colCache) return this._colCache;
    try {
      const cols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name);
      this._colCache = new Set(cols);
    } catch (e) {
      this._colCache = new Set();
    }
    return this._colCache;
  }

  static findAll({ status, type, source, search, date, branchId, deliveryStatus, limit = 100, offset = 0 } = {}) {
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
    const cols = this._cols();
    if (branchId && branchId !== 'all' && cols.has('branch_id')) {
      sql += ' AND branch_id = ?';
      params.push(branchId);
    }
    if (deliveryStatus && deliveryStatus !== 'all' && cols.has('delivery_status')) {
      sql += ' AND LOWER(delivery_status) = LOWER(?)';
      params.push(deliveryStatus);
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

    const cols = this._cols();
    const hasPaymentsCol = cols.has('payments_json');
    const hasBranchCol = cols.has('branch_id');
    const deliveryCols = ['delivery_address', 'delivery_landmark', 'delivery_instructions', 'rider_id', 'rider_name', 'rider_phone', 'delivery_otp', 'delivery_status', 'out_for_delivery_at', 'delivered_at'].filter((c) => cols.has(c));

    const extraCols = [...(hasBranchCol ? ['branch_id'] : []), ...deliveryCols];
    const stmt = db.prepare(`
      INSERT INTO orders (
        id, order_number, order_type, order_source, qr_token, table_id, table_number,
        customer_id, customer_name, customer_phone, status, order_time,
        items_json, subtotal, discount_amount, coupon_code, coupon_id,
        tax_amount, service_charge, grand_total, payment_method, payment_status,
        ${hasPaymentsCol ? 'payments_json, ' : ''}${extraCols.length ? extraCols.join(', ') + ', ' : ''}notes, server_staff
      ) VALUES (${Array(22 + (hasPaymentsCol ? 1 : 0) + extraCols.length).fill('?').join(', ')}, ?, ?)
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
    if (hasBranchCol) values.push(sanitize(data.branchId, 'br-main'));
    const deliveryVals = {
      delivery_address: sanitize(data.deliveryAddress, null),
      delivery_landmark: sanitize(data.deliveryLandmark, null),
      delivery_instructions: sanitize(data.deliveryInstructions, null),
      rider_id: sanitize(data.riderId, null),
      rider_name: sanitize(data.riderName, null),
      rider_phone: sanitize(data.riderPhone, null),
      delivery_otp: sanitize(data.deliveryOtp, null),
      delivery_status: sanitize(data.deliveryStatus, (data.orderType === 'delivery' ? 'preparing' : null)),
      out_for_delivery_at: sanitize(data.outForDeliveryAt, null),
      delivered_at: sanitize(data.deliveredAt, null)
    };
    deliveryCols.forEach((c) => values.push(deliveryVals[c]));
    values.push(sanitize(data.notes, ''));
    values.push(data.serverStaff || (data.orderSource === 'QR_TABLE' ? 'QR Self-Order' : 'Cashier'));

    // Idempotent insert: a client retry (same id after a network timeout) returns
    // the original order instead of creating a duplicate or throwing a 500.
    // A random order_number collision regenerates once instead of failing.
    try {
      stmt.run(...values);
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('UNIQUE constraint failed: orders.id')) {
        const existing = this.findById(id);
        if (existing) return existing;
      }
      if (msg.includes('UNIQUE constraint failed: orders.order_number')) {
        values[1] = generateOrderNumber('DN');
        try {
          stmt.run(...values);
          return this.findById(id);
        } catch (e2) {
          const retry = this.findById(id);
          if (retry) return retry;
          throw e2;
        }
      }
      throw e;
    }

    return this.findById(id);
  }

  static updateStatus(id, { status, kitchenAcceptedAt, kitchenReadyAt, completedAt, paymentStatus, payments, deliveryOtp, deliveryStatus, outForDeliveryAt, deliveredAt, riderId, riderName, riderPhone }) {
    const normStatus = normalizeOrderStatus(status) || status;
    const cols = this._cols();
    const hasPaymentsCol = cols.has('payments_json');
    const sets = [
      'status = ?',
      'kitchen_accepted_at = COALESCE(?, kitchen_accepted_at)',
      'kitchen_ready_at = COALESCE(?, kitchen_ready_at)',
      'completed_at = COALESCE(?, completed_at)',
      'payment_status = COALESCE(?, payment_status)'
    ];

    const args = [
      normStatus,
      sanitize(kitchenAcceptedAt, null),
      sanitize(kitchenReadyAt, null),
      sanitize(completedAt, null),
      sanitize(paymentStatus, null)
    ];
    if (hasPaymentsCol && payments) { sets.push('payments_json = ?'); args.push(JSON.stringify(payments)); }
    // Delivery-leg fields ride along with status transitions (out_for_delivery / delivered)
    const deliveryPatch = { delivery_otp: deliveryOtp, delivery_status: deliveryStatus, out_for_delivery_at: outForDeliveryAt, delivered_at: deliveredAt, rider_id: riderId, rider_name: riderName, rider_phone: riderPhone };
    Object.entries(deliveryPatch).forEach(([col, val]) => {
      if (val !== undefined && cols.has(col)) { sets.push(`${col} = ?`); args.push(sanitize(val, null)); }
    });
    args.push(id);

    db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...args);

    return this.findById(id);
  }

  static _hasPaymentsColumn() {
    return this._cols().has('payments_json');
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
      serverStaff: row.server_staff,
      branchId: row.branch_id || 'br-main',
      // Delivery leg (null for dine-in / takeaway)
      deliveryAddress: row.delivery_address || '',
      deliveryLandmark: row.delivery_landmark || '',
      deliveryInstructions: row.delivery_instructions || '',
      riderId: row.rider_id || null,
      riderName: row.rider_name || '',
      riderPhone: row.rider_phone || '',
      deliveryOtp: row.delivery_otp || null,
      deliveryStatus: row.delivery_status || null,
      outForDeliveryAt: row.out_for_delivery_at || null,
      deliveredAt: row.delivered_at || null
    };
  }
}
