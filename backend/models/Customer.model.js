import { db } from '../db/connection.js';
import { parseJSON, sanitize, getCurrentTimestamp, normalizeIndianPhone, tierForSpend } from '../utils/helpers.js';

export class CustomerModel {
  static findAll({ search } = {}) {
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      sql += ' AND (LOWER(name) LIKE LOWER(?) OR phone LIKE ? OR LOWER(email) LIKE LOWER(?))';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY total_spent DESC';

    const rows = db.prepare(sql).all(...params);
    return rows.map(this.format);
  }

  static findById(id) {
    const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    return row ? this.format(row) : null;
  }

  static findByPhone(phone) {
    const normalized = normalizeIndianPhone(phone);
    const row = db.prepare('SELECT * FROM customers WHERE phone = ? OR phone LIKE ?').get(phone.trim(), `%${normalized}%`);
    if (row) return this.format(row);
    // fallback: scan normalized
    if (normalized) {
      const all = db.prepare('SELECT * FROM customers').all();
      const hit = all.find((r) => normalizeIndianPhone(r.phone) === normalized);
      return hit ? this.format(hit) : null;
    }
    return null;
  }

  static create(data) {
    const id = data.id || `cust-${Date.now()}`;
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO customers (id, name, phone, email, tier, loyalty_points, total_spent, total_orders, last_visit, favorite_products_json, notes)
      VALUES (?, ?, ?, ?, 'Bronze', 0, 0, 0, ?, '[]', ?)
    `);
    stmt.run(id, data.name.trim(), normalizeIndianPhone(data.phone), sanitize(data.email, '')?.trim?.() || '', now, sanitize(data.notes, ''));

    return this.findById(id);
  }

  static update(id, data) {
    const existing = this.findById(id);
    if (!existing) return null;
    const name = data.name !== undefined ? String(data.name).trim() : existing.name;
    const phone = data.phone !== undefined ? normalizeIndianPhone(data.phone) : existing.phone;
    const email = data.email !== undefined ? String(data.email || '').trim() : (existing.email || '');
    const notes = data.notes !== undefined ? String(data.notes || '') : (existing.notes || '');
    db.prepare('UPDATE customers SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?')
      .run(name, phone, email, notes, id);
    return this.findById(id);
  }

  static delete(id) {
    const existing = this.findById(id);
    if (!existing) return false;
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    return true;
  }

  static updateLoyalty(id, deltaPoints, addedSpent = 0, incrementOrders = false) {
    const cust = this.findById(id);
    if (!cust) return null;

    const newPoints = Math.max(0, cust.loyaltyPoints + Number(deltaPoints));
    const newSpent = Math.max(0, cust.totalSpent + Number(addedSpent));
    const newOrders = cust.totalOrders + (incrementOrders ? 1 : 0);
    const newTier = tierForSpend(newSpent);

    db.prepare(`
      UPDATE customers SET
        loyalty_points = ?,
        total_spent = ?,
        total_orders = ?,
        tier = ?,
        last_visit = ?
      WHERE id = ?
    `).run(newPoints, newSpent, newOrders, newTier, getCurrentTimestamp(), id);

    return this.findById(id);
  }

  // Redeem: 1 pt = Rs1, enforced min threshold + sufficient balance
  static redeemPoints(id, pointsToRedeem, minThreshold = 50) {
    const cust = this.findById(id);
    if (!cust) return { error: 'Customer not found' };
    const pts = Math.floor(Number(pointsToRedeem || 0));
    if (!pts || pts <= 0) return { error: 'Redeem points must be a positive integer' };
    if (cust.loyaltyPoints < Number(minThreshold)) {
      return { error: `Minimum ${minThreshold} points required to redeem (balance: ${cust.loyaltyPoints})` };
    }
    if (pts < Number(minThreshold)) {
      return { error: `Minimum redemption is ${minThreshold} points` };
    }
    if (pts > cust.loyaltyPoints) {
      return { error: `Insufficient points (balance: ${cust.loyaltyPoints}, requested: ${pts})` };
    }
    const updated = this.updateLoyalty(id, -pts, 0, false);
    return { customer: updated, discountValue: pts };
  }

  static format(row) {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      tier: row.tier,
      loyaltyPoints: row.loyalty_points,
      totalSpent: row.total_spent,
      totalOrders: row.total_orders,
      lastVisit: row.last_visit,
      favoriteProducts: parseJSON(row.favorite_products_json, []),
      notes: row.notes
    };
  }
}

export class CouponModel {
  static findAll() {
    const rows = db.prepare('SELECT * FROM coupons ORDER BY code ASC').all();
    return rows.map(this.format);
  }

  static findById(id) {
    const row = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
    return row ? this.format(row) : null;
  }

  static findByCode(code) {
    const row = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code.trim().toUpperCase());
    return row ? this.format(row) : null;
  }

  static create(data) {
    const id = data.id || `cpn-${Date.now()}`;
    const code = data.code.trim().toUpperCase();

    const stmt = db.prepare(`
      INSERT INTO coupons (
        id, code, name, description, discount_type, discount_value, max_discount, min_order_value, max_order_value,
        start_date, expiry_date, usage_limit, used_count, per_customer_limit, status, total_discount_given,
        revenue_generated, customer_eligibility, applicable_categories_json, applicable_order_types_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, 0, ?, ?, ?)
    `);

    stmt.run(
      id,
      code,
      data.name || code,
      sanitize(data.description, ''),
      data.discountType || 'percentage',
      Number(data.discountValue),
      data.maxDiscount ? Number(data.maxDiscount) : null,
      Number(data.minOrderValue || 0),
      data.maxOrderValue ? Number(data.maxOrderValue) : null,
      data.startDate || new Date().toISOString().split('T')[0],
      data.expiryDate || '2026-12-31',
      data.usageLimit ? Number(data.usageLimit) : null,
      Number(data.perCustomerLimit || 1),
      data.status || 'active',
      data.customerEligibility || 'all',
      JSON.stringify(data.applicableCategories || []),
      JSON.stringify(data.applicableOrderTypes || ['dine-in', 'takeaway', 'delivery'])
    );

    return this.findById(id);
  }

  static recordUsage(idOrCode, discountAmount, orderTotal) {
    db.prepare(`
      UPDATE coupons SET
        used_count = used_count + 1,
        total_discount_given = total_discount_given + ?,
        revenue_generated = revenue_generated + ?
      WHERE id = ? OR code = ?
    `).run(Number(discountAmount || 0), Number(orderTotal || 0), idOrCode, idOrCode);
  }

  static update(id, data) {
    const existing = this.findById(id);
    if (!existing) return null;
    const allowed = [
      'name', 'description', 'discountType', 'discountValue', 'maxDiscount',
      'minOrderValue', 'maxOrderValue', 'startDate', 'expiryDate',
      'usageLimit', 'perCustomerLimit', 'status', 'customerEligibility',
      'applicableCategories', 'applicableOrderTypes'
    ];
    const merged = { ...existing };
    for (const k of allowed) {
      if (data[k] !== undefined) merged[k] = data[k];
    }
    // code is immutable-ish but allow rename with uniqueness
    if (data.code !== undefined && String(data.code).trim().toUpperCase() !== existing.code) {
      const newCode = String(data.code).trim().toUpperCase();
      const clash = this.findByCode(newCode);
      if (clash && clash.id !== id) throw new Error(`Coupon code "${newCode}" already exists`);
      merged.code = newCode;
    }
    db.prepare(`
      UPDATE coupons SET
        code = ?, name = ?, description = ?, discount_type = ?, discount_value = ?,
        max_discount = ?, min_order_value = ?, max_order_value = ?,
        start_date = ?, expiry_date = ?, usage_limit = ?, per_customer_limit = ?,
        status = ?, customer_eligibility = ?,
        applicable_categories_json = ?, applicable_order_types_json = ?
      WHERE id = ?
    `).run(
      merged.code,
      merged.name || merged.code,
      merged.description || '',
      merged.discountType || 'percentage',
      Number(merged.discountValue),
      merged.maxDiscount === '' || merged.maxDiscount === null || merged.maxDiscount === undefined ? null : Number(merged.maxDiscount),
      Number(merged.minOrderValue || 0),
      merged.maxOrderValue === '' || merged.maxOrderValue === null || merged.maxOrderValue === undefined ? null : Number(merged.maxOrderValue),
      merged.startDate || null,
      merged.expiryDate || null,
      merged.usageLimit === '' || merged.usageLimit === null || merged.usageLimit === undefined ? null : Number(merged.usageLimit),
      Number(merged.perCustomerLimit || 1),
      merged.status || 'active',
      merged.customerEligibility || 'all',
      JSON.stringify(merged.applicableCategories || []),
      JSON.stringify(merged.applicableOrderTypes || ['dine-in', 'takeaway', 'delivery']),
      id
    );
    return this.findById(id);
  }

  static delete(id) {
    const existing = this.findById(id);
    if (!existing) return false;
    db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
    return true;
  }

  static toggleStatus(id) {
    const current = this.findById(id);
    if (!current) return null;
    const nextStatus = current.status === 'active' ? 'disabled' : 'active';
    db.prepare('UPDATE coupons SET status = ? WHERE id = ?').run(nextStatus, id);
    return this.findById(id);
  }

  static format(row) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      discountType: row.discount_type,
      discountValue: row.discount_value,
      maxDiscount: row.max_discount,
      minOrderValue: row.min_order_value,
      maxOrderValue: row.max_order_value,
      startDate: row.start_date,
      expiryDate: row.expiry_date,
      usageLimit: row.usage_limit,
      usedCount: row.used_count,
      perCustomerLimit: row.per_customer_limit,
      status: row.status,
      totalDiscountGiven: row.total_discount_given,
      revenueGenerated: row.revenue_generated,
      customerEligibility: row.customer_eligibility,
      applicableCategories: parseJSON(row.applicable_categories_json, []),
      applicableOrderTypes: parseJSON(row.applicable_order_types_json, [])
    };
  }
}
