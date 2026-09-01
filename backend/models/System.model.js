import { db } from '../db/connection.js';
import { parseJSON, sanitize, getCurrentTimestamp } from '../utils/helpers.js';

export class ExpenseModel {
  static findAll({ category } = {}) {
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY date DESC';

    const rows = db.prepare(sql).all(...params);
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      amount: r.amount,
      paymentMethod: r.payment_method,
      date: r.date,
      loggedBy: r.logged_by
    }));
  }

  static create(data) {
    const id = data.id || `exp-${Date.now()}`;
    const d = data.date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO expenses (id, title, category, amount, payment_method, date, logged_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.title, data.category || 'General', Number(data.amount), data.paymentMethod || 'Cash', d, data.loggedBy || 'Admin');

    return { id, ...data, amount: Number(data.amount), date: d };
  }

  static delete(id) {
    const res = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    return res.changes > 0;
  }
}

export class StaffModel {
  static findAll() {
    const rows = db.prepare('SELECT * FROM staff ORDER BY joining_date DESC').all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      role: r.role,
      email: r.email,
      phone: r.phone,
      shift: r.shift,
      status: r.status,
      joiningDate: r.joining_date,
      avatar: r.avatar_url
    }));
  }

  static findById(id) {
    const r = db.prepare('SELECT * FROM staff WHERE id = ?').get(id);
    return r ? {
      id: r.id,
      name: r.name,
      role: r.role,
      email: r.email,
      phone: r.phone,
      shift: r.shift,
      status: r.status,
      joiningDate: r.joining_date,
      avatar: r.avatar_url
    } : null;
  }

  static findByEmail(email) {
    const r = db.prepare("SELECT * FROM staff WHERE LOWER(email) = LOWER(?) AND status = 'Active'").get(email.trim());
    return r ? {
      id: r.id,
      name: r.name,
      role: r.role,
      email: r.email,
      phone: r.phone,
      shift: r.shift,
      status: r.status,
      joiningDate: r.joining_date,
      avatar: r.avatar_url
    } : null;
  }

  static create(data) {
    const id = data.id || `staff-${Date.now()}`;
    const joiningDate = new Date().toISOString().split('T')[0];
    const avatarUrl = data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    db.prepare('INSERT INTO staff (id, name, role, email, phone, shift, status, joining_date, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, data.name, data.role || 'Cashier', data.email, sanitize(data.phone, ''), data.shift || 'General', 'Active', joiningDate, avatarUrl);

    return this.findById(id);
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;
    const merged = { ...current, ...data };

    db.prepare('UPDATE staff SET name = ?, role = ?, email = ?, phone = ?, shift = ?, status = ?, avatar_url = ? WHERE id = ?')
      .run(merged.name, merged.role, merged.email, merged.phone, merged.shift, merged.status, merged.avatar, id);

    return this.findById(id);
  }
}

export class NotificationModel {
  static findAll(limit = 50) {
    const rows = db.prepare('SELECT * FROM notifications ORDER BY time DESC LIMIT ?').all(limit);
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      message: r.message,
      type: r.type,
      time: r.time,
      isRead: r.is_read === 1,
      link: r.link_url
    }));
  }

  static create(data) {
    const id = data.id || `notif-${Date.now()}`;
    db.prepare('INSERT INTO notifications (id, title, message, type, time, is_read, link_url) VALUES (?, ?, ?, ?, ?, 0, ?)')
      .run(id, data.title, data.message, data.type || 'info', data.time || 'Just now', data.link || '/');
    return { id, ...data, isRead: false };
  }

  static markRead(id) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    return true;
  }

  static markAllRead() {
    db.prepare('UPDATE notifications SET is_read = 1').run();
    return true;
  }
}

export class AuditLogModel {
  static findAll({ category, limit = 200 } = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(sql).all(...params);
    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      user: r.user_name,
      action: r.action,
      category: r.category,
      details: r.details,
      ip: r.ip_address
    }));
  }

  static log({ user = 'System', action, category = 'General', details = '', ip = '127.0.0.1' }) {
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = getCurrentTimestamp();
    db.prepare('INSERT INTO audit_logs (id, timestamp, user_name, action, category, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, timestamp, user, action, category, details, ip);
    return { id, timestamp, user, action, category, details, ip };
  }
}

export class SettingModel {
  static getAll() {
    const rows = db.prepare('SELECT * FROM settings').all();
    const result = {};
    rows.forEach(r => {
      result[r.key] = parseJSON(r.value, r.value);
    });
    return result;
  }

  static updateAll(settingsObj) {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.entries(settingsObj).forEach(([k, v]) => {
      stmt.run(k, JSON.stringify(v));
    });
    return this.getAll();
  }
}
