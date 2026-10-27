# AeroRUL – Aviation B2B E-Commerce & Predictive RUL Marketplace

AeroRUL is an aviation commercial parts marketplace with integrated Remaining Useful Life (RUL) predictive analytics for aircraft turbofan engines (powered by NASA C-MAPSS dataset benchmarks).

---

## Architecture Overview

- **Frontend**: React 18 (Vite, TailwindCSS, Recharts, Vitest)
  - Dark mission-control aesthetic (`#070D18` base, cyan/amber/emerald HUD glow accents).
  - Unified nested layouts (`BuyerLayout`, `AdminLayout`) with `<Outlet />`.
  - Global `Ctrl/Cmd+K` command palette for instant engine, order, and part lookups.
  - Role-based route protection (`ProtectedRoute`) blocking cross-role access both at client and API layers.
  - Zero mock data in services; 100% connected to PostgreSQL via parameterized Express API endpoints.
- **Backend**: Node.js & Express 5
  - Robust session authentication using `httpOnly` signed cookies and PostgreSQL-backed sessions (`auth_sessions`).
  - Strict tenant isolation: buyer endpoints filter strictly by authenticated `company_id`.
  - Auditing: every moderation decision, inquiry, and diagnostic check writes to `audit_logs`.
- **Database**: PostgreSQL
  - **Gold Dataset**: 10 core FAA & catalog tables (`companies`, `addresses`, `categories`, `engine_models`, `suppliers`, `aircraft`, `engines`, `products`, `seller_listings`, `product_engine_compatibility`).
  - **Runtime Extensions**: runtime operational tables (`users`, `orders`, `seller_orders`, `order_items`, `payments`, `shipments`, `sensor_uploads`, `rul_predictions`, `audit_logs`, `moderation_decisions`, `supplier_inquiries`, `service_health_checks`, `auth_sessions`).

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20+ or v24+
- **PostgreSQL**: v14+ (or embedded postgres test suite)

### 2. Database Initialization
Ensure PostgreSQL is running and your database is created:
```bash
createdb aerorul_db
```

Apply schemas:
```bash
# 1. Base Gold schema
psql -d aerorul_db -f database/schema/01_gold_schema.sql

# 2. Runtime extensions schema
psql -d aerorul_db -f database/schema/02_runtime_extensions.sql
```

Load Gold seed data (from project root):
```bash
python3 data/etl/scripts/silver_to_gold/build_gold.py
```

Seed Demo Runtime users, orders, sensor uploads, and RUL predictions:
```bash
cd backend
npm run seed:demo
```

### 3. Backend Setup & Run
```bash
cd backend
npm install
npm test            # Runs 25/25 automated tests against real embedded PostgreSQL
npm run dev         # Starts backend API on http://localhost:5000
```

Environment variables can be configured in `backend/.env`:
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://localhost:5432/aerorul_db
COOKIE_SECRET=aerorul_secure_session_secret_key_prod_gold
SESSION_TTL_HOURS=24
```

### 4. Frontend Setup & Run
```bash
cd frontend
npm install
npm test            # Runs Vitest unit, component, and route integrity tests
npm run dev         # Launches Vite dev server at http://localhost:5173
npm run build       # Production bundle build
```

---

## Demo Credentials & Access

The login screen (`/login`) provides **1-Click Quick Demo Access** buttons:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Buyer** | `buyer1@horizon.com` | `Buyer123!` | Access to `/buyer/*` (Fleet engines, purchase orders, telemetry sparklines, spare parts recommendations, cart checkout). Tenant-isolated to Demo Horizon Airlines (`company_id: 1`). |
| **Admin** | `admin@aerorul.com` | `Admin123!` | Access to `/admin/*` (Operations dashboard, part moderation approval/rejection queue, C-MAPSS RUL diagnostics and latency probe, users/companies/suppliers directories). |

---

## API Endpoints Summary

### Auth
- `POST /api/auth/login` – Authenticates user, writes `auth_sessions` record, sets httpOnly cookie.
- `POST /api/auth/logout` – Revokes session in DB and clears cookie.
- `GET /api/auth/me` – Returns authenticated user profile and company info from DB.

### Buyer (`/api/buyer/*`, requires `BUYER` role)
- `GET /api/buyer/engines` – Fleet engines owned by buyer's company with C-MAPSS sensor history & RUL.
- `GET /api/buyer/orders` – Paginated order history with search and status aggregation counts.
- `GET /api/buyer/orders/:id` – Full order dossier with seller orders, shipments, and tracking events.
- `POST /api/buyer/orders` – Commits cart to an order, decrements stock atomically, clears cart.
- `GET /api/buyer/cart` – Retrieves active cart items, pricing, and stock status.
- `POST /api/buyer/cart/items` – Adds listing to cart with stock validation.
- `DELETE /api/buyer/cart/items/:id` – Removes item from cart.
- `GET /api/buyer/recommendations` – Replacement parts matched by engine model compatibility and RUL urgency.
- `POST /api/buyer/inquiries` – Persists communication inquiry to supplier.
- `GET /api/buyer/search?q=...` – Universal search across company fleet, orders, and part numbers.

### Admin (`/api/admin/*`, requires `ADMIN` role)
- `GET /api/admin/dashboard` – Real-time counts (engines, listings, orders, volume, suppliers) and audit logs.
- `GET /api/admin/moderation` – Paginated catalog listing queue (`DRAFT`, `APPROVED`, `REJECTED`).
- `PATCH /api/admin/moderation/:id` – Approves/rejects listing, updates status in DB, logs audit record.
- `GET /api/admin/rul-status` – C-MAPSS inference server health, model versions, and degradation distribution.
- `POST /api/admin/rul-status/check` – Probes database and prediction latency, returns measured response time.
- `GET /api/admin/recommendations` – Ranked replacement recommendations.
- `GET /api/admin/users` – Paginated user accounts list.
- `GET /api/admin/companies` – Registered airline companies list.
- `GET /api/admin/suppliers` – Approved supplier network list.
