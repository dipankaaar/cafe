import { db } from './connection.js';

/**
 * Execute Schema DDL definitions
 */
export function initDatabaseSchema() {
  // 1. Create Base Tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT,
      color TEXT,
      item_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS addons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      is_available INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      description TEXT,
      cost_price REAL DEFAULT 0,
      selling_price REAL NOT NULL,
      is_veg INTEGER DEFAULT 1,
      prep_time INTEGER DEFAULT 5,
      is_available INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      image_url TEXT,
      variants_json TEXT,
      addons_json TEXT,
      ingredients_json TEXT,
      table_enabled INTEGER DEFAULT 1,
      online_enabled INTEGER DEFAULT 1,
      table_price REAL,
      online_price REAL,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tables_floor (
      id TEXT PRIMARY KEY,
      table_number TEXT NOT NULL UNIQUE,
      zone TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      status TEXT DEFAULT 'Available',
      current_order_id TEXT,
      customer_name TEXT,
      qr_token TEXT,
      qr_status TEXT DEFAULT 'active',
      qr_created_at TEXT,
      qr_regenerated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      guests INTEGER NOT NULL,
      table_id TEXT,
      table_number TEXT,
      special_request TEXT,
      status TEXT DEFAULT 'Confirmed',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      tier TEXT DEFAULT 'Bronze',
      loyalty_points INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      last_visit TEXT,
      favorite_products_json TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      max_discount REAL,
      min_order_value REAL DEFAULT 0,
      max_order_value REAL,
      start_date TEXT,
      expiry_date TEXT,
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      per_customer_limit INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      total_discount_given REAL DEFAULT 0,
      revenue_generated REAL DEFAULT 0,
      customer_eligibility TEXT DEFAULT 'all',
      applicable_categories_json TEXT,
      applicable_order_types_json TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      current_stock REAL NOT NULL,
      min_stock REAL NOT NULL,
      max_stock REAL NOT NULL,
      unit TEXT NOT NULL,
      cost_per_unit REAL NOT NULL,
      supplier_id TEXT,
      status TEXT DEFAULT 'In Stock'
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      category TEXT,
      lead_time_days INTEGER DEFAULT 2,
      total_purchases REAL DEFAULT 0,
      status TEXT DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      po_number TEXT NOT NULL UNIQUE,
      supplier_id TEXT NOT NULL,
      supplier_name TEXT NOT NULL,
      order_date TEXT NOT NULL,
      items_json TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Completed',
      received_date TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      date TEXT NOT NULL,
      proof TEXT,
      logged_by TEXT
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      salary REAL DEFAULT 0,
      shift TEXT,
      pin TEXT,
      password TEXT DEFAULT 'admin123',
      status TEXT DEFAULT 'Active',
      joining_date TEXT,
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS staff_attendance (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'Present',
      check_in TEXT,
      check_out TEXT,
      notes TEXT,
      FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      UNIQUE(staff_id, date)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      order_type TEXT NOT NULL,
      order_source TEXT DEFAULT 'POS',
      qr_token TEXT,
      table_id TEXT,
      table_number TEXT,
      customer_id TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      status TEXT DEFAULT 'placed',
      order_time TEXT NOT NULL,
      kitchen_accepted_at TEXT,
      kitchen_ready_at TEXT,
      completed_at TEXT,
      items_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      coupon_code TEXT,
      coupon_id TEXT,
      tax_amount REAL DEFAULT 0,
      service_charge REAL DEFAULT 0,
      grand_total REAL NOT NULL,
      payment_method TEXT DEFAULT 'Cash',
      payment_status TEXT DEFAULT 'Pending',
      payments_json TEXT,
      notes TEXT,
      server_staff TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      time TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link_url TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      category TEXT NOT NULL,
      details TEXT,
      ip_address TEXT
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      address TEXT,
      phone TEXT,
      email TEXT,
      manager_name TEXT,
      opening_hours TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // 2. Safe Column Additions for Existing Tables
  try { db.exec(`ALTER TABLE tables_floor ADD COLUMN seats INTEGER;`); } catch (e) {}
  // Backfill seats from capacity (spec alias: seats == capacity)
  try { db.exec(`UPDATE tables_floor SET seats = capacity WHERE seats IS NULL;`); } catch (e) {}
  try { db.exec(`ALTER TABLE tables_floor ADD COLUMN qr_status TEXT DEFAULT 'active';`); } catch (e) {}
  try { db.exec(`ALTER TABLE tables_floor ADD COLUMN qr_created_at TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE tables_floor ADD COLUMN qr_regenerated_at TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN order_source TEXT DEFAULT 'POS';`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN qr_token TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN payments_json TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE staff ADD COLUMN salary REAL DEFAULT 0;`); } catch (e) {}
  try { db.exec(`ALTER TABLE staff ADD COLUMN pin TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE expenses ADD COLUMN proof TEXT;`); } catch (e) {}
  // Legacy-DB safety net: orders columns required by Order.model / seeds
  try { db.exec(`ALTER TABLE orders ADD COLUMN table_id TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN table_number TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'dine-in';`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN customer_id TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN customer_name TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN customer_phone TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'Pending';`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'Cash';`); } catch (e) {}
  try { db.exec(`ALTER TABLE tables_floor ADD COLUMN qr_token TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE products ADD COLUMN table_enabled INTEGER DEFAULT 1;`); } catch (e) {}
  try { db.exec(`ALTER TABLE products ADD COLUMN online_enabled INTEGER DEFAULT 1;`); } catch (e) {}
  try { db.exec(`ALTER TABLE products ADD COLUMN table_price REAL;`); } catch (e) {}
  try { db.exec(`ALTER TABLE products ADD COLUMN online_price REAL;`); } catch (e) {}
  try { db.exec(`UPDATE products SET table_enabled = 1 WHERE table_enabled IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE products SET online_enabled = 1 WHERE online_enabled IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE products SET table_price = selling_price WHERE table_price IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE products SET online_price = selling_price WHERE online_price IS NULL;`); } catch (e) {}
  // Backfill NULLs on legacy rows so service-layer expectations hold
  try { db.exec(`UPDATE orders SET order_type = 'dine-in' WHERE order_type IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE orders SET payment_status = 'Pending' WHERE payment_status IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE orders SET order_source = 'POS' WHERE order_source IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE orders SET status = 'New' WHERE status IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE tables_floor SET qr_status = 'active' WHERE qr_status IS NULL;`); } catch (e) {}

  // ---- Phase-2: multi-branch scoping (branch_id on operational entities) ----
  try { db.exec(`ALTER TABLE orders ADD COLUMN branch_id TEXT DEFAULT 'br-main';`); } catch (e) {}
  try { db.exec(`ALTER TABLE tables_floor ADD COLUMN branch_id TEXT DEFAULT 'br-main';`); } catch (e) {}
  try { db.exec(`ALTER TABLE reservations ADD COLUMN branch_id TEXT DEFAULT 'br-main';`); } catch (e) {}
  try { db.exec(`ALTER TABLE expenses ADD COLUMN branch_id TEXT DEFAULT 'br-main';`); } catch (e) {}
  try { db.exec(`ALTER TABLE inventory ADD COLUMN branch_id TEXT DEFAULT 'br-main';`); } catch (e) {}
  try { db.exec(`ALTER TABLE staff ADD COLUMN branch_id TEXT DEFAULT 'br-main';`); } catch (e) {}
  try { db.exec(`ALTER TABLE purchases ADD COLUMN branch_id TEXT DEFAULT 'br-main';`); } catch (e) {}
  try { db.exec(`UPDATE orders SET branch_id = 'br-main' WHERE branch_id IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE tables_floor SET branch_id = 'br-main' WHERE branch_id IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE reservations SET branch_id = 'br-main' WHERE branch_id IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE expenses SET branch_id = 'br-main' WHERE branch_id IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE inventory SET branch_id = 'br-main' WHERE branch_id IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE staff SET branch_id = 'br-main' WHERE branch_id IS NULL;`); } catch (e) {}
  try { db.exec(`UPDATE purchases SET branch_id = 'br-main' WHERE branch_id IS NULL;`); } catch (e) {}

  // ---- Customer profile address & landmark columns ----
  try { db.exec(`ALTER TABLE customers ADD COLUMN address TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE customers ADD COLUMN landmark TEXT;`); } catch (e) {}

  // ---- Phase-2: delivery tracking columns on orders ----
  try { db.exec(`ALTER TABLE orders ADD COLUMN delivery_address TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN delivery_landmark TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN delivery_instructions TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN rider_id TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN rider_name TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN rider_phone TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN delivery_otp TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN delivery_status TEXT DEFAULT 'preparing';`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN out_for_delivery_at TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN delivered_at TEXT;`); } catch (e) {}
  try { db.exec(`UPDATE orders SET delivery_status = 'preparing' WHERE delivery_status IS NULL;`); } catch (e) {}
  try { db.exec(`ALTER TABLE staff ADD COLUMN password TEXT DEFAULT 'admin123';`); } catch (e) {}


  // 3. Ensure All Existing Tables Have a Permanent QR Token
  try {
    const existingTables = db.prepare('SELECT id, table_number, qr_token FROM tables_floor').all();
    const updateStmt = db.prepare('UPDATE tables_floor SET qr_token = ?, qr_status = COALESCE(qr_status, "active"), qr_created_at = COALESCE(qr_created_at, datetime("now")) WHERE id = ?');
    existingTables.forEach((t, idx) => {
      if (!t.qr_token) {
        const fallbackToken = `qrt_${t.table_number.toLowerCase().replace(/[^a-z0-9]/g, '')}_${(idx + 1) * 1000 + 420}`;
        updateStmt.run(fallbackToken, t.id);
      }
    });
  } catch (e) {}

  // 4. Database Performance Indexes
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_time ON orders(order_time);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(order_source);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);`); } catch (e) {}
  try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_qr_token_unique ON tables_floor(qr_token);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_tables_qr_token ON tables_floor(qr_token);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_delivery ON orders(order_type, delivery_status);`); } catch (e) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_tables_branch ON tables_floor(branch_id);`); } catch (e) {}
}
