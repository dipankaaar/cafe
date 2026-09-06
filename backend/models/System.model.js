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
      proof: r.proof || null,
      loggedBy: r.logged_by
    }));
  }

  static monthlyTotal(yearMonth) {
    // yearMonth: "YYYY-MM"
    const rows = db.prepare(
      `SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count FROM expenses WHERE substr(date,1,7) = ?`
    ).get(yearMonth);
    return { month: yearMonth, total: rows.total || 0, count: rows.count || 0 };
  }

  static create(data) {
    const id = data.id || `exp-${Date.now()}`;
    const d = data.date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO expenses (id, title, category, amount, payment_method, date, proof, logged_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.title, data.category || 'General', Number(data.amount), data.paymentMethod || 'Cash', d, data.proof || null, data.loggedBy || 'Admin');

    return { id, ...data, amount: Number(data.amount), date: d };
  }

  static update(id, data) {
    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!row) return null;
    const merged = {
      title: data.title ?? row.title,
      category: data.category ?? row.category,
      amount: data.amount !== undefined ? Number(data.amount) : row.amount,
      payment_method: data.paymentMethod ?? row.payment_method,
      date: data.date ?? row.date,
      proof: data.proof !== undefined ? data.proof : row.proof,
      logged_by: data.loggedBy ?? row.logged_by
    };
    db.prepare('UPDATE expenses SET title=?, category=?, amount=?, payment_method=?, date=?, proof=?, logged_by=? WHERE id=?')
      .run(merged.title, merged.category, merged.amount, merged.payment_method, merged.date, merged.proof, merged.logged_by, id);
    return { id, title: merged.title, category: merged.category, amount: merged.amount, paymentMethod: merged.payment_method, date: merged.date, proof: merged.proof, loggedBy: merged.logged_by };
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
      salary: r.salary ?? 0,
      shift: r.shift,
      status: r.status,
      joiningDate: r.joining_date,
      avatar: r.avatar_url,
      hasPin: !!r.pin
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
      salary: r.salary ?? 0,
      shift: r.shift,
      status: r.status,
      joiningDate: r.joining_date,
      avatar: r.avatar_url,
      hasPin: !!r.pin
    } : null;
  }

  /** Internal: includes pin hash/plain for verification only */
  static findByIdWithPin(id) {
    return db.prepare('SELECT * FROM staff WHERE id = ?').get(id) || null;
  }

  static findByEmail(email) {
    const r = db.prepare("SELECT * FROM staff WHERE LOWER(email) = LOWER(?) AND status = 'Active'").get(email.trim());
    return r ? {
      id: r.id,
      name: r.name,
      role: r.role,
      email: r.email,
      phone: r.phone,
      salary: r.salary ?? 0,
      shift: r.shift,
      status: r.status,
      joiningDate: r.joining_date,
      avatar: r.avatar_url,
      hasPin: !!r.pin
    } : null;
  }

  static verifyPin(id, pin) {
    const r = db.prepare("SELECT * FROM staff WHERE id = ? AND status = 'Active'").get(id);
    if (!r) return null;
    if (!r.pin) return { ...this.findById(id), pinBypass: true };
    if (String(r.pin) !== String(pin)) return null;
    return this.findById(id);
  }

  static create(data) {
    const id = data.id || `staff-${Date.now()}`;
    const joiningDate = new Date().toISOString().split('T')[0];
    const avatarUrl = data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    db.prepare('INSERT INTO staff (id, name, role, email, phone, salary, shift, pin, status, joining_date, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, data.name, data.role || 'Cashier', data.email, sanitize(data.phone, ''), Number(data.salary || 0), data.shift || 'General', data.pin ? String(data.pin) : null, 'Active', joiningDate, avatarUrl);

    return this.findById(id);
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;
    const merged = { ...current, ...data };

    db.prepare('UPDATE staff SET name = ?, role = ?, email = ?, phone = ?, salary = ?, shift = ?, pin = COALESCE(?, pin), status = ?, avatar_url = ? WHERE id = ?')
      .run(merged.name, merged.role, merged.email, merged.phone, Number(merged.salary || 0), merged.shift, data.pin !== undefined ? (data.pin ? String(data.pin) : null) : undefined, merged.status, merged.avatar, id);

    // Handle explicit PIN clear
    if (data.pin === '' || data.pin === null) {
      try { db.prepare('UPDATE staff SET pin = NULL WHERE id = ?').run(id); } catch (e) {}
    }

    return this.findById(id);
  }

  static delete(id) {
    const res = db.prepare('DELETE FROM staff WHERE id = ?').run(id);
    try { db.prepare('DELETE FROM staff_attendance WHERE staff_id = ?').run(id); } catch (e) {}
    return res.changes > 0;
  }

  // --- Attendance ---
  static markAttendance({ staffId, date, status = 'Present', checkIn = null, checkOut = null, notes = '' }) {
    const id = `att-${staffId}-${date}`;
    const now = getCurrentTimestamp();
    db.prepare(`INSERT INTO staff_attendance (id, staff_id, date, status, check_in, check_out, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(staff_id, date) DO UPDATE SET status=excluded.status, check_in=COALESCE(excluded.check_in, staff_attendance.check_in), check_out=COALESCE(excluded.check_out, staff_attendance.check_out), notes=excluded.notes`)
      .run(id, staffId, date || now.split('T')[0], status, checkIn || now, checkOut, notes);
    return db.prepare('SELECT * FROM staff_attendance WHERE staff_id = ? AND date = ?').get(staffId, date || now.split('T')[0]);
  }

  static getAttendance({ staffId, date } = {}) {
    let sql = 'SELECT a.*, s.name AS staff_name, s.role AS staff_role FROM staff_attendance a JOIN staff s ON s.id = a.staff_id WHERE 1=1';
    const params = [];
    if (staffId) { sql += ' AND a.staff_id = ?'; params.push(staffId); }
    if (date) { sql += ' AND a.date = ?'; params.push(date); }
    sql += ' ORDER BY a.date DESC LIMIT 200';
    return db.prepare(sql).all(...params);
  }
}

export class NotificationModel {
  static findAll(limit = 50, { unreadOnly = false } = {}) {
    let sql = 'SELECT * FROM notifications WHERE 1=1';
    if (unreadOnly) sql += ' AND is_read = 0';
    sql += ' ORDER BY time DESC LIMIT ?';
    const rows = db.prepare(sql).all(limit);
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

  static unreadCount() {
    const r = db.prepare('SELECT COUNT(*) AS c FROM notifications WHERE is_read = 0').get();
    return r ? r.c : 0;
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
  static findAll({ category, action, search, limit = 200 } = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (action && action !== 'all') {
      sql += ' AND action = ?';
      params.push(action);
    }
    if (search && search.trim() !== '') {
      sql += ' AND (action LIKE ? OR details LIKE ? OR user_name LIKE ?)';
      const like = `%${search.trim()}%`;
      params.push(like, like, like);
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
