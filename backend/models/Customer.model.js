import { db } from '../db/connection.js';
import { parseJSON, sanitize, getCurrentTimestamp } from '../utils/helpers.js';

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
    const row = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone.trim());
    return row ? this.format(row) : null;
  }

  static create(data) {
    const id = data.id || `cust-${Date.now()}`;
    const now = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO customers (id, name, phone, email, tier, loyalty_points, total_spent, total_orders, last_visit, favorite_products_json, notes)
      VALUES (?, ?, ?, ?, 'Bronze', 0, 0, 0, ?, '[]', ?)
    `);
    stmt.run(id, data.name, data.phone, sanitize(data.email, ''), now, sanitize(data.notes, ''));

    return this.findById(id);
  }

  static updateLoyalty(id, deltaPoints, addedSpent = 0) {
    const cust = this.findById(id);
    if (!cust) return null;

    const newPoints = Math.max(0, cust.loyaltyPoints + Number(deltaPoints));
    const newSpent = cust.totalSpent + Number(addedSpent);

    let newTier = cust.tier;
    if (newSpent >= 10000) newTier = 'Platinum';
    else if (newSpent >= 5000) newTier = 'Gold';
    else if (newSpent >= 2500) newTier = 'Silver';

    db.prepare(`
      UPDATE customers SET
        loyalty_points = ?,
        total_spent = ?,
        tier = ?,
        last_visit = ?
      WHERE id = ?
    `).run(newPoints, newSpent, newTier, getCurrentTimestamp(), id);

    return this.findById(id);
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
