import crypto from 'node:crypto';
import { db } from '../db/connection.js';
import { sanitize, getCurrentTimestamp, timeToMinutes } from '../utils/helpers.js';

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
      seats: r.seats ?? r.capacity,
      status: r.status,
      currentOrderId: r.current_order_id,
      customerName: r.customer_name,
      qrToken: qrToken,
      qrStatus: r.qr_status || 'active',
      qrCreatedAt: r.qr_created_at || getCurrentTimestamp(),
      qrRegeneratedAt: r.qr_regenerated_at || null,
      branchId: r.branch_id || 'br-main'
    };
  }

  static findAll({ branchId } = {}) {
    let sql = 'SELECT * FROM tables_floor';
    const params = [];
    try {
      const cols = db.prepare('PRAGMA table_info(tables_floor)').all().map((c) => c.name);
      if (branchId && branchId !== 'all' && cols.includes('branch_id')) {
        sql += ' WHERE branch_id = ?';
        params.push(branchId);
      }
    } catch (e) {}
    sql += ' ORDER BY table_number ASC';
    const rows = db.prepare(sql).all(...params);
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
      // Fallback: allow manual table-code entry (e.g. "T-02", "t02", "2")
      // so seated guests can type the printed table number instead of scanning.
      const normalized = String(token).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (normalized) {
        const all = db.prepare('SELECT * FROM tables_floor').all();
        const hit = all.find(t =>
          String(t.table_number || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized
        );
        if (hit) r = hit;
      }
    }
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
    const capacity = Number(data.capacity ?? data.seats ?? 4);
    try { db.prepare('UPDATE tables_floor SET seats = capacity WHERE seats IS NULL').run(); } catch (e) {}
    let hasBranch = false;
    try {
      hasBranch = db.prepare('PRAGMA table_info(tables_floor)').all().some((c) => c.name === 'branch_id');
    } catch (e) {}

    db.prepare(`
      INSERT INTO tables_floor (
        id, table_number, zone, capacity, seats, status, qr_token, qr_status, qr_created_at${hasBranch ? ', branch_id' : ''}
      ) VALUES (?, ?, ?, ?, ?, 'Available', ?, 'active', ?${hasBranch ? ', ?' : ''})
    `).run(
      id,
      data.tableNumber.toUpperCase(),
      data.zone || 'Indoor Cafe',
      capacity,
      capacity,
      token,
      now,
      ...(hasBranch ? [data.branchId || 'br-main'] : [])
    );

    return this.findById(id);
  }

  static updateStatus(id, status, customerName = null, currentOrderId = null) {
    db.prepare('UPDATE tables_floor SET status = ?, customer_name = ?, current_order_id = ? WHERE id = ?')
      .run(status, sanitize(customerName, null), sanitize(currentOrderId, null), id);
    return this.findById(id);
  }

  static update(id, data) {
    const existing = this.findById(id);
    if (!existing) return null;
    const tableNumber = data.tableNumber !== undefined ? String(data.tableNumber).trim().toUpperCase() : existing.tableNumber;
    const zone = data.zone !== undefined ? String(data.zone).trim() : existing.zone;
    const rawCap = data.capacity !== undefined ? data.capacity : (data.seats !== undefined ? data.seats : existing.capacity);
    const capacity = Math.max(1, Math.min(30, Number(rawCap) || existing.capacity));
    // unique table_number guard
    if (tableNumber !== existing.tableNumber) {
      const clash = db.prepare('SELECT id FROM tables_floor WHERE table_number = ? AND id != ?').get(tableNumber, id);
      if (clash) throw new Error(`Table number "${tableNumber}" already exists`);
    }
    try {
      db.prepare('UPDATE tables_floor SET table_number = ?, zone = ?, capacity = ?, seats = ? WHERE id = ?')
        .run(tableNumber, zone, capacity, capacity, id);
    } catch (e) {
      // fallback for DBs without seats column
      db.prepare('UPDATE tables_floor SET table_number = ?, zone = ?, capacity = ? WHERE id = ?')
        .run(tableNumber, zone, capacity, id);
    }
    return this.findById(id);
  }

  static delete(id) {
    const existing = this.findById(id);
    if (!existing) return false;
    if (existing.status === 'Occupied') throw new Error('Cannot delete an Occupied table. Complete its orders first.');
    const active = this.getActiveOrders(id);
    if (active.length > 0) throw new Error('Cannot delete table with active orders.');
    db.prepare('DELETE FROM tables_floor WHERE id = ?').run(id);
    return true;
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
      WHERE table_id = ? AND LOWER(status) NOT IN ('completed', 'delivered', 'cancelled', 'refunded')
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
  // Conflict window in minutes: same table + same date + overlapping time blocks
  static CONFLICT_WINDOW_MIN = 90;

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

  // True if another active reservation occupies same table+date within window
  static hasConflict({ tableId, date, time, excludeId = null }) {
    if (!tableId || !date || !time) return null;
    const mins = timeToMinutes(time);
    if (isNaN(mins)) return null;
    const rows = db.prepare(`
      SELECT * FROM reservations
      WHERE table_id = ? AND date = ?
      AND LOWER(status) NOT IN ('cancelled', 'no-show', 'completed')
    `).all(tableId, date);
    for (const r of rows) {
      if (excludeId && r.id === excludeId) continue;
      const rm = timeToMinutes(r.time);
      if (isNaN(rm)) continue;
      if (Math.abs(rm - mins) < this.CONFLICT_WINDOW_MIN) {
        return this.format(r);
      }
    }
    return null;
  }

  static findConflicts({ tableId, date, time, excludeId = null }) {
    const hit = this.hasConflict({ tableId, date, time, excludeId });
    return hit ? [hit] : [];
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

  static update(id, data) {
    const existing = this.findById(id);
    if (!existing) return null;
    const merged = {
      customerName: data.customerName !== undefined ? String(data.customerName).trim() : existing.customerName,
      phone: data.phone !== undefined ? String(data.phone).trim() : existing.phone,
      email: data.email !== undefined ? String(data.email || '').trim() : (existing.email || ''),
      date: data.date !== undefined ? data.date : existing.date,
      time: data.time !== undefined ? data.time : existing.time,
      guests: data.guests !== undefined ? Math.max(1, Math.min(30, Number(data.guests) || existing.guests)) : existing.guests,
      tableId: data.tableId !== undefined ? (data.tableId || null) : existing.tableId,
      tableNumber: data.tableNumber !== undefined ? (data.tableNumber || null) : existing.tableNumber,
      specialRequest: data.specialRequest !== undefined ? String(data.specialRequest || '') : (existing.specialRequest || '')
    };
    db.prepare(`
      UPDATE reservations SET
        customer_name = ?, phone = ?, email = ?, date = ?, time = ?,
        guests = ?, table_id = ?, table_number = ?, special_request = ?
      WHERE id = ?
    `).run(
      merged.customerName, merged.phone, merged.email, merged.date, merged.time,
      merged.guests, merged.tableId, merged.tableNumber, merged.specialRequest, id
    );
    return this.findById(id);
  }

  static delete(id) {
    const existing = this.findById(id);
    if (!existing) return false;
    db.prepare('DELETE FROM reservations WHERE id = ?').run(id);
    return true;
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
