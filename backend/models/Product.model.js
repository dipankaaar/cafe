import { db } from '../db/connection.js';
import { parseJSON, sanitize } from '../utils/helpers.js';

export class ProductModel {
  /** Normalize frontend/backend alias keys into canonical product shape */
  static normalizeInput(data = {}) {
    const pick = (...keys) => {
      for (const k of keys) {
        if (data[k] !== undefined && data[k] !== null) return data[k];
      }
      return undefined;
    };
    return {
      id: data.id,
      name: pick('name'),
      category: pick('category', 'category_id', 'categoryId'),
      description: pick('description'),
      costPrice: pick('costPrice', 'cost_price', 'cost'),
      sellingPrice: pick('sellingPrice', 'selling_price', 'price'),
      isVeg: pick('isVeg', 'is_veg', 'veg'),
      prepTimeMinutes: pick('prepTimeMinutes', 'prep_time', 'prepTime'),
      isAvailable: pick('isAvailable', 'is_available', 'available'),
      isFeatured: pick('isFeatured', 'is_featured', 'featured'),
      image: pick('image', 'image_url', 'imageUrl'),
      variants: pick('variants', 'variants_json'),
      addons: pick('addons', 'addons_json'),
      inventoryIngredients: pick(
        'inventoryIngredients', 'inventory_ingredients',
        'ingredients', 'ingredients_json', 'recipe', 'stockLink'
      ),
    };
  }
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
    const n = this.normalizeInput(data);
    const id = n.id || data.id || `prod-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO products (
        id, name, category_id, description, cost_price, selling_price,
        is_veg, prep_time, is_available, is_featured, image_url,
        variants_json, addons_json, ingredients_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      n.name ?? data.name,
      n.category ?? 'cat-1',
      sanitize(n.description ?? data.description, ''),
      Number(n.costPrice ?? 0),
      Number(n.sellingPrice ?? 0),
      (n.isVeg ?? true) !== false ? 1 : 0,
      Number(n.prepTimeMinutes ?? 5),
      (n.isAvailable ?? true) !== false ? 1 : 0,
      n.isFeatured ? 1 : 0,
      sanitize(typeof n.image === 'string' ? n.image : '', ''),
      JSON.stringify(n.variants || []),
      JSON.stringify(n.addons || []),
      JSON.stringify(n.inventoryIngredients || [])
    );

    return this.findById(id);
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;

    const n = this.normalizeInput(data);
    // Drop undefined alias keys so merge keeps current values
    const clean = {};
    for (const [k, v] of Object.entries(n)) {
      if (v !== undefined && k !== 'id') clean[k] = v;
    }
    // Include any non-alias extra keys verbatim (forward-compat)
    for (const [k, v] of Object.entries(data)) {
      if (!(k in clean) && !['id', 'category_id', 'categoryId', 'selling_price', 'price', 'cost_price', 'cost', 'is_veg', 'veg', 'prep_time', 'prepTime', 'is_available', 'available', 'is_featured', 'featured', 'image_url', 'imageUrl', 'variants_json', 'addons_json', 'ingredients', 'ingredients_json', 'recipe', 'stockLink', 'inventory_ingredients'].includes(k)) {
        clean[k] = v;
      }
    }

    const merged = { ...current, ...clean };

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
      sanitize(typeof merged.image === 'string' ? merged.image : '', ''),
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
