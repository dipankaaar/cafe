import crypto from 'node:crypto';
import { db } from '../db/connection.js';
import { sanitize, getCurrentTimestamp } from '../utils/helpers.js';

export class TableModel {
  static format(r) {
    if (!r) return null;
    let qrToken = r.qr_token;
    if (!qrToken) {
      qrToken = `qrt_${r.id.replace(/[^a-zA-Z0-9]/g, '')}_${crypto.randomBytes(6).toString('hex')}`;
      try {
        db.prepare("UPDATE tables_floor SET qr_token = ?, qr_status = 'active', qr_created_at = datetime('now') WHERE id = ?").run(qrToken, r.id);
      } catch (e) {}
    }
    return {
      id: r.id,
      tableNumber: r.table_number,
      zone: r.zone,
      capacity: r.capacity,
      status: r.status,
      currentOrderId: r.current_order_id,
      customerName: r.customer_name,
      qrToken: qrToken,
      qrStatus: r.qr_status || 'active',
      qrCreatedAt: r.qr_created_at || getCurrentTimestamp(),
      qrRegeneratedAt: r.qr_regenerated_at || null
    };
  }

  static findAll() {
    const rows = db.prepare('SELECT * FROM tables_floor ORDER BY table_number ASC').all();
    return rows.map(r => this.format(r));
  }

  static findById(id) {
    const r = db.prepare('SELECT * FROM tables_floor WHERE id = ?').get(id);
    return this.format(r);
  }

  static findByQrToken(token) {
    if (!token) return null;
    // First query with exact token match
    let r = db.prepare('SELECT * FROM tables_floor WHERE qr_token = ?').get(token);
    if (!r) {
      // Ensure all tables are formatted / initialized in case tokens were generated on the fly
      const all = this.findAll();
      const matched = all.find(t => t.qrToken === token);
      if (matched) {
        r = db.prepare('SELECT * FROM tables_floor WHERE id = ?').get(matched.id);
      }
    }
    return this.format(r);
  }

  static create(data) {
    const id = data.id || `tbl-${Date.now()}`;
    const now = getCurrentTimestamp();
    const token = data.qrToken || `qrt_${id.replace(/[^a-zA-Z0-9]/g, '')}_${crypto.randomBytes(8).toString('hex')}`;
    
    db.prepare(`
      INSERT INTO tables_floor (
        id, table_number, zone, capacity, status, qr_token, qr_status, qr_created_at
      ) VALUES (?, ?, ?, ?, 'Available', ?, 'active', ?)
    `).run(
      id,
      data.tableNumber.toUpperCase(),
      data.zone || 'Indoor Cafe',
      Number(data.capacity || 4),
      token,
      now
    );

    return this.findById(id);
  }

  static updateStatus(id, status, customerName = null, currentOrderId = null) {
    db.prepare('UPDATE tables_floor SET status = ?, customer_name = ?, current_order_id = ? WHERE id = ?')
      .run(status, sanitize(customerName, null), sanitize(currentOrderId, null), id);
    return this.findById(id);
  }

  static regenerateQrToken(id) {
    const table = this.findById(id);
    if (!table) return null;

    const newToken = `qrt_${id.replace(/[^a-zA-Z0-9]/g, '')}_${crypto.randomBytes(8).toString('hex')}`;
    const now = getCurrentTimestamp();

    db.prepare('UPDATE tables_floor SET qr_token = ?, qr_regenerated_at = ? WHERE id = ?')
      .run(newToken, now, id);

    return this.findById(id);
  }

  static setQrStatus(id, status) {
    const validStatus = ['active', 'disabled'].includes(status) ? status : 'active';
    db.prepare('UPDATE tables_floor SET qr_status = ? WHERE id = ?').run(validStatus, id);
    return this.findById(id);
  }

  static getActiveOrders(tableId) {
    const rows = db.prepare(`
      SELECT * FROM orders 
      WHERE table_id = ? AND status NOT IN ('Completed', 'Cancelled')
      ORDER BY order_time ASC
    `).all(tableId);

    return rows.map(r => ({
      id: r.id,
      orderNumber: r.order_number,
      orderType: r.order_type,
      orderSource: r.order_source || 'POS',
      qrToken: r.qr_token,
      tableId: r.table_id,
      tableNumber: r.table_number,
      customerName: r.customer_name,
      status: r.status,
      orderTime: r.order_time,
      items: JSON.parse(r.items_json || '[]'),
      subtotal: r.subtotal,
      discountAmount: r.discount_amount,
      taxAmount: r.tax_amount,
      serviceCharge: r.service_charge,
      grandTotal: r.grand_total,
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      notes: r.notes
    }));
  }

  static getOrderHistory(tableId) {
    const rows = db.prepare(`
      SELECT * FROM orders 
      WHERE table_id = ?
      ORDER BY order_time DESC
      LIMIT 50
    `).all(tableId);

    return rows.map(r => ({
      id: r.id,
      orderNumber: r.order_number,
      orderType: r.order_type,
      orderSource: r.order_source || 'POS',
      tableId: r.table_id,
      tableNumber: r.table_number,
      customerName: r.customer_name,
      status: r.status,
      orderTime: r.order_time,
      grandTotal: r.grand_total,
      paymentStatus: r.payment_status,
      items: JSON.parse(r.items_json || '[]')
    }));
  }
}

export class ReservationModel {
  static findAll({ date, status } = {}) {
    let sql = 'SELECT * FROM reservations WHERE 1=1';
    const params = [];

    if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }
    if (status && status !== 'all') {
      sql += ' AND LOWER(status) = LOWER(?)';
      params.push(status);
    }

    sql += ' ORDER BY date DESC, time ASC';

    const rows = db.prepare(sql).all(...params);
    return rows.map(this.format);
  }

  static findById(id) {
    const row = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
    return row ? this.format(row) : null;
  }

  static create(data) {
    const id = data.id || `res-${Date.now()}`;
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO reservations (
        id, customer_name, phone, email, date, time, guests, table_id, table_number, special_request, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)
    `);

    stmt.run(
      id,
      data.customerName,
      data.phone,
      sanitize(data.email, ''),
      data.date,
      data.time,
      Number(data.guests || 2),
      sanitize(data.tableId, null),
      sanitize(data.tableNumber, null),
      sanitize(data.specialRequest, ''),
      now
    );

    return this.findById(id);
  }

  static updateStatus(id, status) {
    db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, id);
    return this.findById(id);
  }

  static format(row) {
    return {
      id: row.id,
      customerName: row.customer_name,
      phone: row.phone,
      email: row.email,
      date: row.date,
      time: row.time,
      guests: row.guests,
      tableId: row.table_id,
      tableNumber: row.table_number,
      specialRequest: row.special_request,
      status: row.status,
      createdAt: row.created_at
    };
  }
}
