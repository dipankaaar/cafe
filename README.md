# ☕ Petuk Adda Cafe — Enterprise Fullstack Cafe Management Platform

A high-performance fullstack application combining a **Luxury Customer Storefront** with an **Enterprise Operations Suite & Kitchen Display System (KDS)**.

---

## 🏗️ System Architecture & Folder Layout

```
cafe/
├── 📁 frontend/                         # 🎨 React 19 Customer Storefront (Port 5173)
│   ├── 📁 src/
│   │   ├── 📁 components/storefront/   # Hero, Menu, Cart, Table Booking, Tracker
│   │   ├── 📁 pages/                   # OrderOnline, ExploreMenu, ScanTable, FindTable
│   │   ├── 📁 context/                 # Auth, Theme, Cafe State
│   │   └── App.jsx                     # Customer Storefront App
│   ├── package.json
│   └── vite.config.js                   # Vite dev server on :5173
│
├── 📁 admin/                            # 💼 Dedicated Standalone Admin & POS Suite (Port 5174)
│   ├── 📁 src/
│   │   ├── 📁 components/modules/       # 17 Enterprise Admin Modules (POS, KDS, Inventory, etc.)
│   │   ├── 📁 components/layout/        # Admin Sidebar, Topbar, NotificationDropdown
│   │   ├── 📁 pages/                    # LoginPage (Credentials, PIN, Quick Roles)
│   │   ├── 📁 context/                  # AuthContext, ThemeContext, CafeContext
│   │   ├── 📁 services/                 # api.js, receiptPrinter, qrPrintService
│   │   └── App.jsx                      # Dedicated Admin App
│   ├── package.json
│   └── vite.config.js                   # Vite dev server on :5174 (strictPort, API proxy)
│
├── 📁 backend/                          # 🛡️ Express & SQLite Relational Backend (Port 5000)
│   ├── 📁 config/                       # env.js (CORS allows 5173 & 5174)
│   ├── 📁 controllers/                  # 11 Modular HTTP Controllers
│   ├── 📁 db/                           # SQLite WAL Engine, schema.js, seeds/
│   ├── 📁 middlewares/                  # error, logger, auth
│   ├── 📁 models/                       # Data Access Layer Repositories
│   ├── 📁 routes/                       # 11 Express Routers & index.js
│   ├── 📁 services/                     # Business Logic (Order workflow, Coupons, P&L)
│   ├── 📁 data/                         # cafe.db (SQLite Database file)
│   ├── app.js                           # Express App (serves frontend & /admin static)
│   └── index.js                         # Server Bootstrap
│
├── package.json                         # Monorepo Workspaces: ["frontend", "backend", "admin"]
└── README.md
```

---

## 🌟 Key Features

### 1. Customer Storefront (`http://localhost:5173`)
- **Brand Experience**: Full-screen hero banner, history, roastery metrics, testimonials, and gallery.
- **Interactive Food & Beverage Menu**: Filter by Coffee, Cold Brews, Teas, and Bakery with dietary tags.
- **Online Cart & Customizations**: Variant sizes, milk alternatives, and custom syrups with online checkout.
- **Live Order Status Tracker**: Real-time preparation progression (*Placed ➔ Accepted ➔ Brewing ➔ Ready ➔ Completed*).
- **Table Reservations**: Online table booking with date, time, party size, and special requests.

### 2. Standalone Admin & POS Suite (`http://localhost:5174`)
- **Dedicated Staff Portal**: Separate application with Email login, 4-digit PIN access, and 1-click test role switcher.
- **Live Backend Heartbeat**: Real-time health check & SSE event stream from backend port 5000.
- **POS / Billing Engine**: Fast search, custom modifiers, multi-tier tax calculations, split tender, and thermal receipt printing.
- **Kitchen Display System (KDS)**: Real-time ticket boards with prep overdue timers and single-tap workflow progression.
- **Recipe-Based Auto-Inventory**: Automatically calculates and deducts raw coffee beans, dairy, and syrups upon order completion.
- **17 Complete Modules**: Dashboard, POS, Kitchen, Orders, Menu, Tables, Reservations, Customers, Loyalty, Coupons, Inventory, Expenses, Staff, Reports, Notifications, Audit Logs, Settings.

---

## 🚀 How to Run Locally

### 1. Start All 3 Services Concurrently (Backend + Storefront + Admin):
```bash
npm run dev
```

### 2. Start Services Individually:
```bash
# Start Separate Admin Panel only (Port 5174)
npm run dev:admin

# Start Customer Storefront only (Port 5173)
npm run dev:frontend

# Start Backend API only (Port 5000)
npm run dev:backend
```

### 3. Production Build (Both Frontend & Admin):
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

---

## 🚀 One-Click Production Deployment

### Option A: Render.com (Recommended - All-in-One Monolith)
1. Push your code to GitHub (`origin main`).
2. In [Render Dashboard](https://dashboard.render.com/), click **New** ➔ **Blueprint** (or **Web Service**).
3. Connect your GitHub repository (`cafe`).
4. Render automatically reads `render.yaml`:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check**: `/health`
5. Once deployed:
   - 🌐 **Storefront**: `https://<your-app>.onrender.com/`
   - 🛡️ **Admin Portal**: `https://<your-app>.onrender.com/admin/`
   - 📡 **Backend API**: `https://<your-app>.onrender.com/api`

### Option B: Railway.app
1. In [Railway Dashboard](https://railway.app/), click **New Project** ➔ **Deploy from GitHub repo**.
2. Select your `cafe` repository.
3. Railway automatically uses `railway.json` and builds both frontend and admin, then starts the backend.

### Option C: Standalone Vercel (Frontend / Admin)
- Both `frontend/` and `admin/` include `vercel.json` for seamless SPA routing.
- Set `VITE_API_BASE_URL=https://<your-backend-url>/api` in the Vercel Environment Variables.

