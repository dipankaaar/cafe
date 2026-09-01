# ☕ Dinenos Coffee House — Enterprise Fullstack Cafe Management Platform

A high-performance fullstack application combining a **Luxury Customer Storefront** with an **Enterprise Operations Suite & Kitchen Display System (KDS)**.

---

## 🏗️ System Architecture & Folder Layout

```
cafe/
├── 📁 frontend/                         # 🎨 React 19 Frontend Application
│   ├── 📁 public/                       # Favicon & brand assets
│   └── 📁 src/
│       ├── 📁 components/
│       │   ├── 📁 common/               # UI Primitives (Button, Modal, Card, Table, Badge, Tabs)
│       │   ├── 📁 layout/               # Admin Shell (Sidebar, Topbar, NotificationDropdown)
│       │   ├── 📁 modules/              # 20 Enterprise Admin Modules (POS, KDS, Inventory, etc.)
│       │   └── 📁 storefront/           # Public Customer Storefront (Hero, Menu, Cart, Booking, Tracker)
│       ├── 📁 context/                  # State Providers (AuthContext, ThemeContext, CafeContext)
│       ├── 📁 hooks/                    # Custom Hooks (useSSE, useDebounce, useLocalStorage)
│       ├── 📁 services/                 # api.js (HTTP Client), receiptPrinter.js, couponValidator.js
│       ├── 📁 utils/                    # formatters.js, constants.js
│       ├── App.jsx                      # Dual-Mode Root App Router
│       ├── main.jsx                     # React DOM Entry
│       └── index.css                    # Tailwind CSS
│
├── 📁 backend/                          # 🛡️ Express & SQLite Relational Backend
│   ├── 📁 config/                       # env.js, constants.js
│   ├── 📁 controllers/                  # 11 Modular HTTP Controllers
│   ├── 📁 db/                           # SQLite WAL Engine, schema.js, seeds/
│   ├── 📁 middlewares/                  # error.middleware.js, logger.middleware.js, auth.middleware.js
│   ├── 📁 models/                       # Data Access Layer Repositories
│   ├── 📁 routes/                       # 11 Express Routers & index.js
│   ├── 📁 services/                     # Business Logic (Order workflow, Coupon engine, P&L aggregation)
│   ├── 📁 utils/                        # ApiError.js, ApiResponse.js, asyncHandler.js
│   ├── 📁 data/                         # cafe.db (SQLite Database file)
│   ├── app.js                           # Express App Configuration
│   └── index.js                         # Server Bootstrap & Graceful Shutdown
│
├── index.html                           # Root HTML
├── package.json                         # Unified Scripts: dev, server, build, preview
└── vite.config.js                       # Vite Configuration with API proxy
```

---

## 🌟 Key Features

### 1. Customer Storefront (`/`)
- **Brand Experience**: Full-screen hero banner, history, roastery metrics, testimonials, and gallery.
- **Interactive Food & Beverage Menu**: Filter by Coffee, Cold Brews, Teas, and Bakery with dietary tags.
- **Online Cart & Customizations**: Variant sizes, milk alternatives, and custom syrups with online checkout.
- **Live Order Status Tracker**: Real-time preparation progression (*Placed ➔ Accepted ➔ Brewing ➔ Ready ➔ Completed*).
- **Table Reservations**: Online table booking with date, time, party size, and special requests.

### 2. Enterprise Admin & POS Suite (`#admin`)
- **POS / Billing Engine**: Fast search, custom modifiers, multi-tier tax calculations, split tender, and 80mm thermal receipt printing.
- **Kitchen Display System (KDS)**: Real-time ticket boards with prep overdue timers and single-tap workflow progression.
- **Recipe-Based Auto-Inventory Deduction**: Automatically calculates and deducts raw coffee beans, dairy, and syrups upon order completion.
- **Strict Coupon Engine**: Backend validation enforcing date ranges, spend limits, category restrictions, and usage limits.
- **20 Complete Modules**: Dashboard, POS, Kitchen, Orders, Menu, Tables, Reservations, Customers, Loyalty, Coupons, Inventory, Suppliers, Purchases, Expenses, Staff, Reports, Notifications, Audit Logs, Settings.

---

## 🚀 How to Run Locally

### 1. Start Both Frontend & Backend Concurrently:
```bash
npm run dev
```

### 2. Start Backend API Server Only (Port 5000):
```bash
npm run server
```

### 3. Create a Production Build:
```bash
npm run build
```

---

## 📡 Core API Endpoints

- `GET /api/health` — System health & SQLite WAL status
- `GET /api/events` — Server-Sent Events (SSE) live stream
- `GET /api/menu/products` — Product catalog
- `GET /api/orders` — Orders list with filtering
- `POST /api/orders` — POS & Online order placement
- `GET /api/orders/track/:orderNumber` — Public live order status lookup
- `POST /api/coupons/validate` — Strict coupon validation
- `GET /api/tables` — Floor plan occupancy
- `POST /api/reservations` — Table booking
- `GET /api/reports/analytics` — P&L & financial metrics
