import { db } from '../db/connection.js';
import { sanitize, getCurrentTimestamp } from '../utils/helpers.js';

function hasColumn(table, column) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    return cols.some((c) => c.name === column);
  } catch (e) {
    return false;
  }
}

export class BranchModel {
  static format(r) {
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      code: r.code,
      address: r.address || '',
      phone: r.phone || '',
      email: r.email || '',
      managerName: r.manager_name || '',
      openingHours: r.opening_hours || '',
      isActive: Number(r.is_active ?? 1) === 1,
      createdAt: r.created_at
    };
  }

  static findAll({ activeOnly = false } = {}) {
    let sql = 'SELECT * FROM branches';
    if (activeOnly) sql += ' WHERE is_active = 1';
    sql += ' ORDER BY created_at ASC';
    return db.prepare(sql).all().map((r) => this.format(r));
  }

  static findById(id) {
    const r = db.prepare('SELECT * FROM branches WHERE id = ?').get(id);
    return this.format(r);
  }

  static findByCode(code) {
    const r = db.prepare('SELECT * FROM branches WHERE LOWER(code) = LOWER(?)').get(String(code || '').trim());
    return this.format(r);
  }

  static create(data) {
    const name = String(data.name || '').trim();
    if (!name) throw new Error('Branch name is required');
    const code = String(data.code || name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || `BR-${Date.now()}`).trim();
    if (this.findByCode(code)) throw new Error(`Branch code "${code}" already exists`);
    const id = data.id || `br-${Date.now()}`;
    db.prepare(`
      INSERT INTO branches (id, name, code, address, phone, email, manager_name, opening_hours, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, code,
      sanitize(data.address, ''),
      sanitize(data.phone, ''),
      sanitize(data.email, ''),
      sanitize(data.managerName ?? data.manager_name, ''),
      sanitize(data.openingHours ?? data.opening_hours, ''),
      data.isActive === false ? 0 : 1,
      getCurrentTimestamp()
    );
    return this.findById(id);
  }

  static update(id, data) {
    const existing = this.findById(id);
    if (!existing) return null;
    if (data.code !== undefined) {
      const clash = db.prepare('SELECT id FROM branches WHERE LOWER(code) = LOWER(?) AND id != ?')
        .get(String(data.code).trim(), id);
      if (clash) throw new Error(`Branch code "${data.code}" already exists`);
    }
    db.prepare(`
      UPDATE branches SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        manager_name = COALESCE(?, manager_name),
        opening_hours = COALESCE(?, opening_hours),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      data.name !== undefined ? String(data.name).trim() : null,
      data.code !== undefined ? String(data.code).trim() : null,
      data.address !== undefined ? sanitize(data.address, '') : null,
      data.phone !== undefined ? sanitize(data.phone, '') : null,
      data.email !== undefined ? sanitize(data.email, '') : null,
      (data.managerName ?? data.manager_name) !== undefined ? sanitize(data.managerName ?? data.manager_name, '') : null,
      (data.openingHours ?? data.opening_hours) !== undefined ? sanitize(data.openingHours ?? data.opening_hours, '') : null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
      id
    );
    return this.findById(id);
  }

  static delete(id) {
    const existing = this.findById(id);
    if (!existing) return false;
    if (id === 'br-main') throw new Error('The flagship branch cannot be deleted.');
    // Guard: cannot delete a branch that still owns operational rows
    const tables = ['orders', 'tables_floor', 'reservations', 'expenses', 'staff'];
    for (const t of tables) {
      if (!hasColumn(t, 'branch_id')) continue;
      const row = db.prepare(`SELECT COUNT(*) AS cnt FROM ${t} WHERE branch_id = ?`).get(id);
      if (Number(row?.cnt || 0) > 0) {
        throw new Error(`Cannot delete branch: ${row.cnt} row(s) still assigned in ${t}. Reassign them first.`);
      }
    }
    db.prepare('DELETE FROM branches WHERE id = ?').run(id);
    return true;
  }

  /** Per-branch operational snapshot for the branch cards. */
  static getStats(id) {
    const stats = { ordersCount: 0, revenue: 0, activeOrders: 0, tablesCount: 0, occupiedTables: 0 };
    try {
      if (hasColumn('orders', 'branch_id')) {
        const o = db.prepare(`SELECT COUNT(*) AS cnt, COALESCE(SUM(CASE WHEN LOWER(status) IN ('completed','delivered') THEN grand_total ELSE 0 END),0) AS rev,
          SUM(CASE WHEN LOWER(status) IN ('placed','accepted','brewing','ready','out_for_delivery') THEN 1 ELSE 0 END) AS active
          FROM orders WHERE branch_id = ?`).get(id);
        stats.ordersCount = Number(o?.cnt || 0);
        stats.revenue = Number(o?.rev || 0);
        stats.activeOrders = Number(o?.active || 0);
      }
      if (hasColumn('tables_floor', 'branch_id')) {
        const t = db.prepare(`SELECT COUNT(*) AS cnt, SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) AS occ
          FROM tables_floor WHERE branch_id = ?`).get(id);
        stats.tablesCount = Number(t?.cnt || 0);
        stats.occupiedTables = Number(t?.occ || 0);
      }
    } catch (e) { /* stats are best-effort */ }
    return stats;
  }
}
