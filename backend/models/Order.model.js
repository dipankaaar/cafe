import { db } from '../db/connection.js';
import { parseJSON, sanitize, getCurrentTimestamp } from '../utils/helpers.js';

export class OrderModel {
  static findAll({ status, type, search, limit = 100, offset = 0 } = {}) {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND LOWER(status) = LOWER(?)';
      params.push(status);
    }
    if (type && type !== 'all') {
      sql += ' AND LOWER(order_type) = LOWER(?)';
      params.push(type);
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

  static create(data) {
    const id = data.id || `ord-${Date.now()}`;
    const orderNumber = data.orderNumber || `DIN-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO orders (
        id, order_number, order_type, table_id, table_number,
        customer_id, customer_name, customer_phone, status, order_time,
        items_json, subtotal, discount_amount, coupon_code, coupon_id,
        tax_amount, service_charge, grand_total, payment_method, payment_status,
        notes, server_staff
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      orderNumber,
      data.orderType || 'dine-in',
      sanitize(data.tableId, null),
      sanitize(data.tableNumber, null),
      sanitize(data.customerId, null),
      data.customerName || 'Walk-in Guest',
      sanitize(data.customerPhone, ''),
      data.status || 'New',
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
      data.paymentStatus || 'Pending',
      sanitize(data.notes, ''),
      data.serverStaff || 'Cashier'
    );

    return this.findById(id);
  }

  static updateStatus(id, { status, kitchenAcceptedAt, kitchenReadyAt, completedAt, paymentStatus }) {
    const stmt = db.prepare(`
      UPDATE orders SET
        status = ?,
        kitchen_accepted_at = COALESCE(?, kitchen_accepted_at),
        kitchen_ready_at = COALESCE(?, kitchen_ready_at),
        completed_at = COALESCE(?, completed_at),
        payment_status = COALESCE(?, payment_status)
      WHERE id = ?
    `);

    stmt.run(
      status,
      sanitize(kitchenAcceptedAt, null),
      sanitize(kitchenReadyAt, null),
      sanitize(completedAt, null),
      sanitize(paymentStatus, null),
      id
    );

    return this.findById(id);
  }

  static format(row) {
    return {
      id: row.id,
      orderNumber: row.order_number,
      orderType: row.order_type,
      tableId: row.table_id,
      tableNumber: row.table_number,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      status: row.status,
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
      notes: row.notes,
      serverStaff: row.server_staff
    };
  }
}
