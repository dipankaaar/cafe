import { db } from '../db/connection.js';
import { parseJSON, sanitize } from '../utils/helpers.js';

export class ProductModel {
  static findAll({ category, isAvailable, isFeatured, search } = {}) {
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category_id = ?';
      params.push(category);
    }
    if (isAvailable !== undefined) {
      sql += ' AND is_available = ?';
      params.push(isAvailable ? 1 : 0);
    }
    if (isFeatured !== undefined) {
      sql += ' AND is_featured = ?';
      params.push(isFeatured ? 1 : 0);
    }
    if (search && search.trim()) {
      sql += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY is_featured DESC, name ASC';

    const rows = db.prepare(sql).all(...params);
    return rows.map(this.format);
  }

  static findById(id) {
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return row ? this.format(row) : null;
  }

  static create(data) {
    const id = data.id || `prod-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO products (
        id, name, category_id, description, cost_price, selling_price,
        is_veg, prep_time, is_available, is_featured, image_url,
        variants_json, addons_json, ingredients_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.category || 'cat-1',
      sanitize(data.description, ''),
      Number(data.costPrice || 0),
      Number(data.sellingPrice || 0),
      data.isVeg !== false ? 1 : 0,
      Number(data.prepTimeMinutes || 5),
      data.isAvailable !== false ? 1 : 0,
      data.isFeatured ? 1 : 0,
      sanitize(data.image, ''),
      JSON.stringify(data.variants || []),
      JSON.stringify(data.addons || []),
      JSON.stringify(data.inventoryIngredients || [])
    );

    return this.findById(id);
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;

    const merged = { ...current, ...data };

    const stmt = db.prepare(`
      UPDATE products SET
        name = ?, category_id = ?, description = ?, cost_price = ?, selling_price = ?,
        is_veg = ?, prep_time = ?, is_available = ?, is_featured = ?, image_url = ?,
        variants_json = ?, addons_json = ?, ingredients_json = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.name,
      merged.category,
      sanitize(merged.description, ''),
      Number(merged.costPrice || 0),
      Number(merged.sellingPrice || 0),
      merged.isVeg ? 1 : 0,
      Number(merged.prepTimeMinutes || 5),
      merged.isAvailable ? 1 : 0,
      merged.isFeatured ? 1 : 0,
      sanitize(merged.image, ''),
      JSON.stringify(merged.variants || []),
      JSON.stringify(merged.addons || []),
      JSON.stringify(merged.inventoryIngredients || []),
      id
    );

    return this.findById(id);
  }

  static delete(id) {
    const res = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.changes > 0;
  }

  static format(row) {
    return {
      id: row.id,
      name: row.name,
      category: row.category_id,
      description: row.description,
      costPrice: row.cost_price,
      sellingPrice: row.selling_price,
      isVeg: row.is_veg === 1,
      prepTimeMinutes: row.prep_time,
      isAvailable: row.is_available === 1,
      isFeatured: row.is_featured === 1,
      image: row.image_url,
      variants: parseJSON(row.variants_json, []),
      addons: parseJSON(row.addons_json, []),
      inventoryIngredients: parseJSON(row.ingredients_json, [])
    };
  }
}
