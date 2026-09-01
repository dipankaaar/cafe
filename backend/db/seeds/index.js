import { db } from '../connection.js';
import { sanitize } from '../../utils/helpers.js';
import {
  initialCafeSettings,
  initialCategories,
  initialAddons,
  initialProducts,
  initialTables,
  initialCustomers,
  initialCoupons,
  initialInventory,
  initialSuppliers,
  initialPurchases,
  initialExpenses,
  initialStaff,
  initialReservations,
  initialOrders,
  initialAuditLogs,
  initialNotifications
} from './seedData.js';

export function runDatabaseSeeds(force = false) {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM products');
  const result = countStmt.get();

  if (result.count === 0 || force) {
    console.log('🌱 [DB] Seeding database with initial master records...');

    // 1. Settings
    const setStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.entries(initialCafeSettings).forEach(([k, v]) => {
      setStmt.run(k, JSON.stringify(v));
    });

    // 2. Categories
    const catStmt = db.prepare('INSERT OR REPLACE INTO categories (id, name, slug, icon, color, item_count, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)');
    initialCategories.forEach((c) => {
      catStmt.run(c.id, c.name, c.slug, sanitize(c.icon, 'Coffee'), sanitize(c.color, '#DD5903'), sanitize(c.itemCount, 0), c.isActive ? 1 : 0);
    });

    // 3. Addons
    const addStmt = db.prepare('INSERT OR REPLACE INTO addons (id, name, category, price, is_available) VALUES (?, ?, ?, ?, ?)');
    initialAddons.forEach((a) => {
      addStmt.run(a.id, a.name, a.category, sanitize(a.price, 0), a.isAvailable ? 1 : 0);
    });

    // 4. Products
    const prodStmt = db.prepare(`
      INSERT OR REPLACE INTO products (id, name, category_id, description, cost_price, selling_price, is_veg, prep_time, is_available, is_featured, image_url, variants_json, addons_json, ingredients_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    initialProducts.forEach((p) => {
      prodStmt.run(
        p.id,
        p.name,
        p.category,
        sanitize(p.description, ''),
        sanitize(p.costPrice, 0),
        sanitize(p.sellingPrice, 0),
        p.isVeg ? 1 : 0,
        sanitize(p.prepTimeMinutes, 5),
        p.isAvailable ? 1 : 0,
        p.isFeatured ? 1 : 0,
        sanitize(p.image, ''),
        JSON.stringify(p.variants || []),
        JSON.stringify(p.addons || []),
        JSON.stringify(p.inventoryIngredients || [])
      );
    });

    // 5. Tables
    const tblStmt = db.prepare(`
      INSERT OR REPLACE INTO tables_floor (
        id, table_number, zone, capacity, status, current_order_id, customer_name, qr_token, qr_status, qr_created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    initialTables.forEach((t, idx) => {
      const qrToken = `qrt_${t.tableNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}_${(idx + 1) * 1000 + 420}`;
      tblStmt.run(
        t.id,
        t.tableNumber,
        t.zone,
        sanitize(t.capacity, 4),
        sanitize(t.status, 'Available'),
        sanitize(t.currentOrderId, null),
        sanitize(t.customerName, null),
        qrToken,
        'active',
        new Date().toISOString()
      );
    });

    // 6. Customers
    const custStmt = db.prepare('INSERT OR REPLACE INTO customers (id, name, phone, email, tier, loyalty_points, total_spent, total_orders, last_visit, favorite_products_json, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    initialCustomers.forEach((c) => {
      custStmt.run(c.id, c.name, c.phone, sanitize(c.email, ''), sanitize(c.tier, 'Bronze'), sanitize(c.loyaltyPoints, 0), sanitize(c.totalSpent, 0), sanitize(c.totalOrders, 0), sanitize(c.lastVisit, null), JSON.stringify(c.favoriteProducts || []), sanitize(c.notes, ''));
    });

    // 7. Coupons
    const cpnStmt = db.prepare(`
      INSERT OR REPLACE INTO coupons (id, code, name, description, discount_type, discount_value, max_discount, min_order_value, max_order_value, start_date, expiry_date, usage_limit, used_count, per_customer_limit, status, total_discount_given, revenue_generated, customer_eligibility, applicable_categories_json, applicable_order_types_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    initialCoupons.forEach((cpn) => {
      cpnStmt.run(
        cpn.id,
        cpn.code,
        cpn.name,
        sanitize(cpn.description, ''),
        cpn.discountType,
        sanitize(cpn.discountValue, 0),
        sanitize(cpn.maxDiscount, null),
        sanitize(cpn.minOrderValue, 0),
        sanitize(cpn.maxOrderValue, null),
        sanitize(cpn.startDate, null),
        sanitize(cpn.expiryDate, null),
        sanitize(cpn.usageLimit, null),
        sanitize(cpn.usedCount, 0),
        sanitize(cpn.perCustomerLimit, 1),
        sanitize(cpn.status, 'active'),
        sanitize(cpn.totalDiscountGiven, 0),
        sanitize(cpn.revenueGenerated, 0),
        sanitize(cpn.customerEligibility, 'all'),
        JSON.stringify(cpn.applicableCategories || []),
        JSON.stringify(cpn.applicableOrderTypes || ['dine-in', 'takeaway', 'delivery'])
      );
    });

    // 8. Inventory
    const invStmt = db.prepare('INSERT OR REPLACE INTO inventory (id, name, category, current_stock, min_stock, max_stock, unit, cost_per_unit, supplier_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    initialInventory.forEach((i) => {
      invStmt.run(i.id, i.name, i.category, sanitize(i.currentStock, 0), sanitize(i.minStock, 5), sanitize(i.maxStock, 50), sanitize(i.unit, 'kg'), sanitize(i.costPerUnit, 100), sanitize(i.supplierId, null), sanitize(i.status, 'In Stock'));
    });

    // 9. Suppliers
    const supStmt = db.prepare('INSERT OR REPLACE INTO suppliers (id, name, contact_person, phone, email, category, lead_time_days, total_purchases, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    initialSuppliers.forEach((sObj) => {
      supStmt.run(
        sObj.id,
        sObj.name,
        sanitize(sObj.contactPerson, ''),
        sanitize(sObj.phone, ''),
        sanitize(sObj.email, ''),
        sanitize(sObj.category, 'General'),
        sanitize(sObj.leadTimeDays, 2),
        sanitize(sObj.totalPurchases, 0),
        sanitize(sObj.status, 'Active')
      );
    });

    // 10. Purchases
    const poStmt = db.prepare('INSERT OR REPLACE INTO purchases (id, po_number, supplier_id, supplier_name, order_date, items_json, total_amount, status, received_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    initialPurchases.forEach((po) => {
      poStmt.run(po.id, po.poNumber, po.supplierId, po.supplierName, po.orderDate, JSON.stringify(po.items || []), sanitize(po.totalAmount, 0), sanitize(po.status, 'Completed'), sanitize(po.receivedDate, null));
    });

    // 11. Expenses
    const expStmt = db.prepare('INSERT OR REPLACE INTO expenses (id, title, category, amount, payment_method, date, logged_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
    initialExpenses.forEach((e) => {
      expStmt.run(e.id, e.title, e.category, sanitize(e.amount, 0), sanitize(e.paymentMethod, 'Cash'), e.date, sanitize(e.loggedBy, 'Admin'));
    });

    // 12. Staff
    const stfStmt = db.prepare('INSERT OR REPLACE INTO staff (id, name, role, email, phone, shift, status, joining_date, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    initialStaff.forEach((st) => {
      stfStmt.run(st.id, st.name, st.role, st.email, sanitize(st.phone, ''), sanitize(st.shift, 'Morning'), sanitize(st.status, 'Active'), sanitize(st.joiningDate, null), sanitize(st.avatar, ''));
    });

    // 13. Reservations
    const resStmt = db.prepare('INSERT OR REPLACE INTO reservations (id, customer_name, phone, email, date, time, guests, table_id, table_number, special_request, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    initialReservations.forEach((r) => {
      resStmt.run(r.id, r.customerName, r.phone, sanitize(r.email, ''), r.date, r.time, sanitize(r.guests, 2), sanitize(r.tableId, null), sanitize(r.tableNumber, null), sanitize(r.specialRequest, ''), sanitize(r.status, 'Confirmed'), r.createdAt);
    });

    // 14. Orders
    const ordStmt = db.prepare(`
      INSERT OR REPLACE INTO orders (id, order_number, order_type, table_id, table_number, customer_id, customer_name, customer_phone, status, order_time, kitchen_accepted_at, kitchen_ready_at, completed_at, items_json, subtotal, discount_amount, coupon_code, coupon_id, tax_amount, service_charge, grand_total, payment_method, payment_status, notes, server_staff)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    initialOrders.forEach((o) => {
      ordStmt.run(
        o.id,
        o.orderNumber,
        o.orderType,
        sanitize(o.tableId, null),
        sanitize(o.tableNumber, null),
        sanitize(o.customerId, null),
        o.customerName,
        sanitize(o.customerPhone, ''),
        sanitize(o.status, 'New'),
        o.orderTime,
        sanitize(o.kitchenAcceptedAt, null),
        sanitize(o.kitchenReadyAt, null),
        sanitize(o.completedAt, null),
        JSON.stringify(o.items || []),
        sanitize(o.subtotal, 0),
        sanitize(o.discountAmount, 0),
        sanitize(o.couponCode, null),
        sanitize(o.couponId, null),
        sanitize(o.taxAmount, 0),
        sanitize(o.serviceCharge, 0),
        sanitize(o.grandTotal, 0),
        sanitize(o.paymentMethod, 'Cash'),
        sanitize(o.paymentStatus, 'Pending'),
        sanitize(o.notes, ''),
        sanitize(o.serverStaff, 'Cashier')
      );
    });

    // 15. Audit Logs
    const logStmt = db.prepare('INSERT OR REPLACE INTO audit_logs (id, timestamp, user_name, action, category, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)');
    initialAuditLogs.forEach((l) => {
      logStmt.run(l.id, l.timestamp, l.user, l.action, l.category, sanitize(l.details, ''), sanitize(l.ip, '127.0.0.1'));
    });

    // 16. Notifications
    const notifStmt = db.prepare('INSERT OR REPLACE INTO notifications (id, title, message, type, time, is_read, link_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
    initialNotifications.forEach((n) => {
      notifStmt.run(n.id, n.title, n.message, sanitize(n.type, 'info'), n.time, n.isRead ? 1 : 0, sanitize(n.link, '/'));
    });

    console.log('✅ [DB] Database seeding completed successfully.');
  }
}
