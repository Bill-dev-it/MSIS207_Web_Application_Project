# Audit – Buyer / Admin (baseline @ `03c2831`)

Branch: `feat/buyer-admin-integration` (from `Bao_Chinh_main`). Nothing pushed.

## 1. Baseline

| Item | Result |
|---|---|
| `npm run build` (frontend) | OK, 12 s. Single JS chunk **739 kB** (no code-splitting) |
| Lint | No ESLint config / script exists |
| Tests | None (no Vitest, Supertest, Playwright) |
| Backend | Express 5 + `pg`. Only `GET /api/products` and `GET /api/db-test` |
| Port mismatch | `backend/src/server.js` defaults to `3000`; `frontend/vite.config.js` proxies `/api` → `5000` |
| Auth | **None** in repo (no users route, no middleware, no `src/auth` code) |

## 2. Routes declared in `frontend/src/app/router.jsx`

| Path | Element | Layout |
|---|---|---|
| `/`, `/marketplace`, `/marketplace/products/:productId` | Public screens | PublicLayout (**not touched**) |
| `/buyer` | BuyerHome | BuyerLayout |
| `/buyer/engines`, `/buyer/orders`, `/buyer/orders/:orderId`, `/buyer/order-confirmation`, `/buyer/recommendations` | MyEngines, Orders, OrderDetail, OrderConfirmation, Recommendations | **none** (flat routes, each screen draws its own sidebar) |
| `/supplier` | SupplierHome | SupplierLayout (**not touched**) |
| `/admin` | AdminHome | AdminLayout |
| `/admin/dashboard`, `/admin/moderation`, `/admin/rul-status`, `/admin/recommendations` | Admin screens | **none** |
| `*` | `<Navigate to="/">` | silent redirect |

## 3. Screens and size

| File | Lines | Data source |
|---|---|---|
| buyer/Frontend_code/MyEngines.jsx | 657 | `buyerService` hardcoded `BUYER_ENGINES` |
| buyer/Frontend_code/Orders.jsx | 530 | hardcoded `BUYER_ORDERS` |
| buyer/Frontend_code/OrderDetail.jsx | 520 | hardcoded |
| buyer/Frontend_code/OrderConfirmation.jsx | 329 | hardcoded |
| admin/…/AdminDashboard.jsx | 504 | `ADMIN_DASHBOARD_METRICS` |
| admin/…/AdminModeration.jsx | 634 | hardcoded moderation items, local state only |
| admin/…/AdminRULStatus.jsx | 446 | hardcoded status / fake health check |
| admin/…/Recommendations.jsx | 603 | `RECOMMENDATIONS_DATA` (shared by admin **and** buyer route) |

Services (`buyerService.js` ~970 lines, `adminService.js` ~315 lines) are pure
in-memory with `setTimeout` delay. No HTTP, no env base URL.
Service ↔ UI separation is clean (screens only call `fetch*` functions) – **keep**.

## 4. Backend endpoints existing

`GET /`, `GET /api/db-test`, `GET /api/products`. Nothing for buyer/admin.

## 5. Database

`database/schema/01_schema.sql` (26 tables) **already contains** the runtime
tables: `users`(role BUYER/SUPPLIER/ADMIN), `carts`, `cart_items`, `orders`,
`seller_orders`, `order_items`, `payments`, `shipments`, `sensor_uploads`,
`ml_model_versions`, `rul_predictions`, `replacement_recommendations`, …
`database/seed/load_gold.py` loads the 10 Gold tables and **refuses a non-empty
schema** → the demo-runtime seed must run *after* it, as a separate script.

Missing in schema (needed by the requested features): audit log, moderation
decision storage, supplier inquiries. See migration `database/schema/02_*.sql`.

## 6. Defect matrix

| # | Defect | Status at baseline | Evidence |
|---|---|---|---|
| 1+2 | Hardcoded data, no API | **Confirmed** | services are constants + `delay()` |
| 3 | No role protection | **Confirmed** | no AuthContext/ProtectedRoute; `/admin/*` open |
| 4 | Inconsistent layout | **Confirmed** | each screen has its own sidebar/header (`<aside>` in 7 screens); `BuyerLayout` only wraps `/buyer` |
| 5 | Buyer links to admin route | **Confirmed** | `MyEngines/Orders/OrderConfirmation/OrderDetail` → `/admin/rul-status` |
| 6 | Dead routes / silent `*` | **Confirmed** | links to `/admin/users, companies, suppliers, categories, orders, reports, settings`, `/buyer/rul-analysis, wishlist, notifications, company, settings` – none declared; `*` → Home |
| 7 | Simulated actions | **Confirmed** | `alert()` in logout (×3 admin+Recommendations), supplier contact, review supplier request; approve/reject only local state |
| 8 | Auth unverified | **Confirmed** | no auth at all |
| 9 | No tests | **Confirmed** | no test tooling |
| 10 | UI inconsistent | **Confirmed** | hex literals (`#0B1F3A`) inline in screens; light theme only |

## 7. Facts that constrain the design

* Gold IDs are explicit (engines 1‥24, companies 1‥47, suppliers 40, products 312, seller_listings 936).
* `engines` has no company column → ownership = `engines → aircraft.company_id`.
* `orders.buyer_company_id` is the tenant key for buyers.
* `rul_predictions.urgency` enum = `NORMAL | MONITOR | PREPARE | PRIORITIZE`.
  **The cycle thresholds are not defined anywhere in the repo** → see
  `docs/OPEN_QUESTIONS.md` (Q1). The API will return the stored urgency and
  never compute it.
* No Postgres/psql installed locally; Docker CLI exists but daemon is not running.
