import { db } from '../db/connection.js';
import { sanitize, getCurrentTimestamp } from '../utils/helpers.js';

export class TableModel {
  static findAll() {
    const rows = db.prepare('SELECT * FROM tables_floor ORDER BY table_number ASC').all();
    return rows.map(r => ({
      id: r.id,
      tableNumber: r.table_number,
      zone: r.zone,
      capacity: r.capacity,
      status: r.status,
      currentOrderId: r.current_order_id,
      customerName: r.customer_name
    }));
  }

  static findById(id) {
    const r = db.prepare('SELECT * FROM tables_floor WHERE id = ?').get(id);
    return r ? {
      id: r.id,
      tableNumber: r.table_number,
      zone: r.zone,
      capacity: r.capacity,
      status: r.status,
      currentOrderId: r.current_order_id,
      customerName: r.customer_name
    } : null;
  }

  static create(data) {
    const id = data.id || `tbl-${Date.now()}`;
    db.prepare("INSERT INTO tables_floor (id, table_number, zone, capacity, status) VALUES (?, ?, ?, ?, 'Available')")
      .run(id, data.tableNumber.toUpperCase(), data.zone || 'Indoor Cafe', Number(data.capacity || 4));
    return this.findById(id);
  }

  static updateStatus(id, status, customerName = null, currentOrderId = null) {
    db.prepare('UPDATE tables_floor SET status = ?, customer_name = ?, current_order_id = ? WHERE id = ?')
      .run(status, sanitize(customerName, null), sanitize(currentOrderId, null), id);
    return this.findById(id);
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
