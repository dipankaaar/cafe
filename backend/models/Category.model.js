import { db } from '../db/connection.js';
import { sanitize } from '../utils/helpers.js';

export class CategoryModel {
  static findAll() {
    const rows = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    return rows.map(this.format);
  }

  static findById(id) {
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return row ? this.format(row) : null;
  }

  static create(data) {
    const id = data.id || `cat-${Date.now()}`;
    const stmt = db.prepare('INSERT INTO categories (id, name, slug, icon, color, item_count, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(
      id,
      data.name,
      data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      sanitize(data.icon, 'Coffee'),
      sanitize(data.color, '#DD5903'),
      0,
      1
    );
    return this.findById(id);
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;
    const merged = { ...current, ...data };
    db.prepare('UPDATE categories SET name = ?, slug = ?, icon = ?, color = ?, is_active = ? WHERE id = ?')
      .run(merged.name, merged.slug, merged.icon, merged.color, merged.isActive ? 1 : 0, id);
    return this.findById(id);
  }

  static delete(id) {
    const res = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return res.changes > 0;
  }

  static format(row) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      color: row.color,
      itemCount: row.item_count,
      isActive: row.is_active === 1
    };
  }
}

export class AddonModel {
  static findAll() {
    const rows = db.prepare('SELECT * FROM addons ORDER BY category, name ASC').all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      price: r.price,
      isAvailable: r.is_available === 1
    }));
  }

  static create(data) {
    const id = data.id || `add-${Date.now()}`;
    db.prepare('INSERT INTO addons (id, name, category, price, is_available) VALUES (?, ?, ?, ?, 1)')
      .run(id, data.name, data.category || 'General', Number(data.price || 0));
    return {
      id,
      name: data.name,
      category: data.category || 'General',
      price: Number(data.price || 0),
      isAvailable: true
    };
  }
}
