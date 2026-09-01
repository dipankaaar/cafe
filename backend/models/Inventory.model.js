import { db } from '../db/connection.js';
import { parseJSON, sanitize, getCurrentTimestamp } from '../utils/helpers.js';

export class InventoryModel {
  static findAll() {
    const rows = db.prepare('SELECT * FROM inventory ORDER BY name ASC').all();
    return rows.map(this.format);
  }

  static findById(id) {
    const row = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    return row ? this.format(row) : null;
  }

  static create(data) {
    const id = data.id || `inv-${Date.now()}`;
    const stock = Number(data.currentStock || 0);
    const min = Number(data.minStock || 5);
    const status = stock <= min ? 'Low Stock' : 'In Stock';

    const stmt = db.prepare(`
      INSERT INTO inventory (id, name, category, current_stock, min_stock, max_stock, unit, cost_per_unit, supplier_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, data.name, data.category || 'General', stock, min, Number(data.maxStock || 50), data.unit || 'kg', Number(data.costPerUnit || 100), sanitize(data.supplierId, null), status);

    return this.findById(id);
  }

  static adjustStock(id, delta) {
    const item = this.findById(id);
    if (!item) return null;

    const newStock = Math.max(0, Number((item.currentStock + Number(delta)).toFixed(3)));
    const isLow = newStock <= item.minStock;
    const newStatus = isLow ? 'Low Stock' : 'In Stock';

    db.prepare('UPDATE inventory SET current_stock = ?, status = ? WHERE id = ?').run(newStock, newStatus, id);
    return this.findById(id);
  }

  static deductIngredients(productId, itemQuantity = 1) {
    const prod = db.prepare('SELECT ingredients_json FROM products WHERE id = ?').get(productId);
    if (!prod || !prod.ingredients_json) return [];

    const ingredients = parseJSON(prod.ingredients_json, []);
    const deducted = [];

    ingredients.forEach((ing) => {
      const qtyToDeduct = (ing.quantity || 0) * itemQuantity;
      const updated = this.adjustStock(ing.ingredientId, -qtyToDeduct);
      if (updated) deducted.push(updated);
    });

    return deducted;
  }

  static format(row) {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      currentStock: row.current_stock,
      minStock: row.min_stock,
      maxStock: row.max_stock,
      unit: row.unit,
      costPerUnit: row.cost_per_unit,
      supplierId: row.supplier_id,
      status: row.status
    };
  }
}

export class SupplierModel {
  static findAll() {
    const rows = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      contactPerson: r.contact_person,
      phone: r.phone,
      email: r.email,
      category: r.category,
      leadTimeDays: r.lead_time_days,
      totalPurchases: r.total_purchases,
      status: r.status
    }));
  }

  static create(data) {
    const id = data.id || `sup-${Date.now()}`;
    db.prepare(`
      INSERT INTO suppliers (id, name, contact_person, phone, email, category, lead_time_days, total_purchases, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'Active')
    `).run(id, data.name, sanitize(data.contactPerson, ''), sanitize(data.phone, ''), sanitize(data.email, ''), data.category || 'General', Number(data.leadTimeDays || 2));

    return { id, ...data, totalPurchases: 0, status: 'Active' };
  }
}

export class PurchaseModel {
  static findAll() {
    const rows = db.prepare('SELECT * FROM purchases ORDER BY order_date DESC').all();
    return rows.map(r => ({
      id: r.id,
      poNumber: r.po_number,
      supplierId: r.supplier_id,
      supplierName: r.supplier_name,
      orderDate: r.order_date,
      items: parseJSON(r.items_json, []),
      totalAmount: r.total_amount,
      status: r.status,
      receivedDate: r.received_date
    }));
  }

  static create(data) {
    const id = data.id || `po-${Date.now()}`;
    const poNumber = data.poNumber || `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO purchases (id, po_number, supplier_id, supplier_name, order_date, items_json, total_amount, status, received_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Completed', ?)
    `).run(id, poNumber, data.supplierId, data.supplierName, today, JSON.stringify(data.items || []), Number(data.totalAmount || 0), today);

    // Automatically increase inventory stock for items in PO
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((poItem) => {
        if (poItem.ingredientId) {
          InventoryModel.adjustStock(poItem.ingredientId, Number(poItem.quantity || 0));
        }
      });
    }

    return { id, poNumber, ...data, orderDate: today, status: 'Completed', receivedDate: today };
  }
}
