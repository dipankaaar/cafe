import { db } from '../db/connection.js';
import { parseJSON, sanitize, getCurrentTimestamp } from '../utils/helpers.js';

export class InventoryModel {
  static normalizeInput(data = {}) {
    const pick = (...keys) => {
      for (const k of keys) {
        if (data[k] !== undefined && data[k] !== null) return data[k];
      }
      return undefined;
    };
    return {
      name: pick('name'),
      category: pick('category'),
      currentStock: pick('currentStock', 'current_stock', 'stock', 'quantity'),
      minStock: pick('minStock', 'min_stock', 'min_level', 'minLevel'),
      maxStock: pick('maxStock', 'max_stock', 'max_level', 'maxLevel'),
      unit: pick('unit'),
      costPerUnit: pick('costPerUnit', 'cost_per_unit', 'unitCost', 'price'),
      supplierId: pick('supplierId', 'supplier_id'),
      status: pick('status'),
    };
  }

  static findAll() {
    const rows = db.prepare('SELECT * FROM inventory ORDER BY name ASC').all();
    return rows.map(this.format);
  }

  static findById(id) {
    const row = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    return row ? this.format(row) : null;
  }

  static create(data) {
    const n = this.normalizeInput(data);
    const id = data.id || `inv-${Date.now()}`;
    const stock = Number(n.currentStock ?? 0);
    const min = Number(n.minStock ?? 5);
    const status = stock <= min ? 'Low Stock' : 'In Stock';

    const stmt = db.prepare(`
      INSERT INTO inventory (id, name, category, current_stock, min_stock, max_stock, unit, cost_per_unit, supplier_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, n.name ?? data.name, n.category || data.category || 'General', stock, min, Number(n.maxStock ?? data.maxStock ?? 50), n.unit || data.unit || 'kg', Number(n.costPerUnit ?? 100), sanitize(n.supplierId ?? null, null), n.status || status);

    return this.findById(id);
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;
    const n = this.normalizeInput(data);
    const clean = {};
    for (const [k, v] of Object.entries(n)) {
      if (v !== undefined) clean[k] = v;
    }
    // verbatim extras (e.g. notes) ignored by DB but kept for forward-compat merge
    const merged = { ...current, ...clean };
    // Recompute status unless explicitly forced
    const status = data.status || (Number(merged.currentStock) <= Number(merged.minStock) ? 'Low Stock' : 'In Stock');

    db.prepare(`
      UPDATE inventory SET name = ?, category = ?, current_stock = ?, min_stock = ?,
        max_stock = ?, unit = ?, cost_per_unit = ?, supplier_id = ?, status = ?
      WHERE id = ?
    `).run(
      merged.name, merged.category || 'General',
      Number(merged.currentStock || 0), Number(merged.minStock ?? 5),
      Number(merged.maxStock ?? 50), merged.unit || 'kg',
      Number(merged.costPerUnit || 0), sanitize(merged.supplierId, null),
      status, id
    );
    return this.findById(id);
  }

  static delete(id) {
    const res = db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    return res.changes > 0;
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
  static normalizeInput(data = {}) {
    const pick = (...keys) => {
      for (const k of keys) {
        if (data[k] !== undefined && data[k] !== null) return data[k];
      }
      return undefined;
    };
    return {
      name: pick('name'),
      contactPerson: pick('contactPerson', 'contact_person'),
      phone: pick('phone'),
      email: pick('email'),
      category: pick('category'),
      leadTimeDays: pick('leadTimeDays', 'lead_time_days'),
      status: pick('status'),
    };
  }

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
    const n = this.normalizeInput(data);
    const id = data.id || `sup-${Date.now()}`;
    db.prepare(`
      INSERT INTO suppliers (id, name, contact_person, phone, email, category, lead_time_days, total_purchases, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'Active')
    `).run(id, n.name ?? data.name, sanitize(n.contactPerson, ''), sanitize(n.phone ?? data.phone, ''), sanitize(n.email ?? data.email, ''), n.category || data.category || 'General', Number(n.leadTimeDays ?? 2));

    return this.findById(id) || { id, ...data, totalPurchases: 0, status: 'Active' };
  }

  static findById(id) {
    const r = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    return r ? {
      id: r.id,
      name: r.name,
      contactPerson: r.contact_person,
      phone: r.phone,
      email: r.email,
      category: r.category,
      leadTimeDays: r.lead_time_days,
      totalPurchases: r.total_purchases,
      status: r.status
    } : null;
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;
    const n = this.normalizeInput(data);
    const clean = {};
    for (const [k, v] of Object.entries(n)) {
      if (v !== undefined) clean[k] = v;
    }
    const merged = { ...current, ...clean };
    db.prepare(`
      UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?,
        category = ?, lead_time_days = ?, status = ? WHERE id = ?
    `).run(
      merged.name, sanitize(merged.contactPerson, ''), sanitize(merged.phone, ''),
      sanitize(merged.email, ''), merged.category || 'General',
      Number(merged.leadTimeDays ?? 2), merged.status || 'Active', id
    );
    return this.findById(id);
  }

  static delete(id) {
    const res = db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    return res.changes > 0;
  }
}

export class PurchaseModel {
  static normalizeItems(items = []) {
    return (Array.isArray(items) ? items : []).map((it) => {
      const ingredientId = it.ingredientId || it.inventoryId || it.itemId || it.id;
      const quantity = Number(it.quantity ?? it.qty ?? 0);
      const unitPrice = Number(it.unitPrice ?? it.unit_price ?? it.price ?? it.costPerUnit ?? 0);
      return {
        ingredientId,
        name: it.name || 'Raw Ingredient',
        quantity,
        unitPrice,
        totalPrice: Number(it.totalPrice ?? it.total_price ?? (quantity * unitPrice)),
      };
    });
  }

  static computeTotal(items, fallback = 0) {
    if (!items || items.length === 0) return Number(fallback || 0);
    const sum = items.reduce((s, i) => s + Number(i.totalPrice || (Number(i.quantity || 0) * Number(i.unitPrice || 0))), 0);
    return Number(sum || fallback || 0);
  }
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
    const poNumber = data.poNumber || data.po_number || `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];
    const items = this.normalizeItems(data.items || data.items_json || []);
    const totalAmount = this.computeTotal(items, data.totalAmount ?? data.total_amount ?? data.total ?? 0);
    // New POs start as Pending; stock is added on receive().
    // Backward-compat: callers that already restocked locally can pass status:'Completed' or received:true.
    const explicitStatus = data.status;
    const wantsImmediateReceive = explicitStatus === 'Completed' || explicitStatus === 'Received' || data.received === true;
    const status = explicitStatus || 'Pending';
    const receivedDate = wantsImmediateReceive ? (data.receivedDate || data.received_date || today) : (data.receivedDate || data.received_date || null);

    db.prepare(`
      INSERT INTO purchases (id, po_number, supplier_id, supplier_name, order_date, items_json, total_amount, status, received_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, poNumber, data.supplierId || data.supplier_id || null, data.supplierName || data.supplier_name || 'Supplier', data.orderDate || data.order_date || today, JSON.stringify(items), totalAmount, status, receivedDate);

    if (wantsImmediateReceive) {
      this.applyStockIn(items);
      if (data.supplierId || data.supplier_id) {
        try {
          db.prepare('UPDATE suppliers SET total_purchases = COALESCE(total_purchases, 0) + ? WHERE id = ?')
            .run(totalAmount, data.supplierId || data.supplier_id);
        } catch (e) {}
      }
    }

    return { id, poNumber, supplierId: data.supplierId || data.supplier_id || null, supplierName: data.supplierName || data.supplier_name || 'Supplier', orderDate: data.orderDate || today, items, totalAmount, status, receivedDate };
  }

  /** Increase inventory stock for PO line items (shared by create-immediate + receive). */
  static applyStockIn(items = []) {
    items.forEach((poItem) => {
      if (poItem.ingredientId) {
        try { InventoryModel.adjustStock(poItem.ingredientId, Number(poItem.quantity || 0)); } catch (e) {}
      }
    });
  }

  static findById(id) {
    const r = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id);
    return r ? {
      id: r.id,
      poNumber: r.po_number,
      supplierId: r.supplier_id,
      supplierName: r.supplier_name,
      orderDate: r.order_date,
      items: parseJSON(r.items_json, []),
      totalAmount: r.total_amount,
      status: r.status,
      receivedDate: r.received_date
    } : null;
  }

  static update(id, data) {
    const current = this.findById(id);
    if (!current) return null;
    const items = data.items !== undefined ? this.normalizeItems(data.items) : current.items;
    const totalAmount = data.totalAmount !== undefined || data.total_amount !== undefined || data.items !== undefined
      ? this.computeTotal(items, data.totalAmount ?? data.total_amount ?? current.totalAmount)
      : current.totalAmount;
    const merged = {
      supplierId: data.supplierId ?? data.supplier_id ?? current.supplierId,
      supplierName: data.supplierName ?? data.supplier_name ?? current.supplierName,
      orderDate: data.orderDate ?? data.order_date ?? current.orderDate,
      items,
      totalAmount,
      status: data.status ?? current.status,
      receivedDate: data.receivedDate ?? data.received_date ?? current.receivedDate,
    };
    db.prepare(`
      UPDATE purchases SET supplier_id = ?, supplier_name = ?, order_date = ?,
        items_json = ?, total_amount = ?, status = ?, received_date = ? WHERE id = ?
    `).run(merged.supplierId, merged.supplierName, merged.orderDate, JSON.stringify(merged.items), merged.totalAmount, merged.status, merged.receivedDate, id);
    return this.findById(id);
  }

  /** Receive a Pending PO: marks Received, bumps inventory stock, updates supplier totals. Idempotent. */
  static receive(id) {
    const current = this.findById(id);
    if (!current) return null;
    if (current.status === 'Completed' || current.status === 'Received') {
      return { order: current, alreadyReceived: true };
    }
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`UPDATE purchases SET status = 'Received', received_date = ? WHERE id = ?`).run(today, id);
    this.applyStockIn(current.items || []);
    try {
      if (current.supplierId) {
        db.prepare('UPDATE suppliers SET total_purchases = COALESCE(total_purchases, 0) + ? WHERE id = ?')
          .run(Number(current.totalAmount || 0), current.supplierId);
      }
    } catch (e) {}
    return { order: this.findById(id), alreadyReceived: false };
  }

  static delete(id) {
    const res = db.prepare('DELETE FROM purchases WHERE id = ?').run(id);
    return res.changes > 0;
  }
}
