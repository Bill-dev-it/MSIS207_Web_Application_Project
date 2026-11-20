# Backend

This directory contains AeroRUL's Node.js / Express 5 modular-monolith REST API and business logic.

Authentication MVP is implemented: registration, Argon2id password hashing, JWT `HttpOnly` cookie sessions, login, logout, authentication middleware, and Supplier authorization integration. Automated unit tests cover Auth, Admin, Buyer, Public Product, and Supplier REST modules. In this academic MVP, registration creates an active account without requiring email ownership verification.

PostgreSQL database integration is active via [`src/config/db.js`](./src/config/db.js) with connection pooling, migrations, and schema constraints (connecting to **Neon PostgreSQL** over TLS in production and local PostgreSQL in development). In production on **Render Web Service**, Express calls the containerized FastAPI RUL service on **Google Cloud Run** over HTTPS (`X-RUL-Service-Token`) and serves generated apiDoc at `/docs/`. Production deployment and end-to-end acceptance testing at `https://www.aerotradehub.top` passed owner verification on November 16, 2026; automated browser end-to-end (E2E) CI suites remain out of scope.

See the [Authentication setup guide](../docs/auth/README.md) for backend authentication packages, environment details, and endpoints.

---

## 1. Architecture and MVC Mapping

AeroRUL follows an **MVC-inspired Layered Architecture with Repository Pattern** rather than a traditional server-rendered MVC monolith:

- **VIEW (`../frontend/src/`):** React 18 SPA renders the UI, manages client state, and calls `/api/v1/*`.
- **ROUTES (`./src/routes/`):** Express routers map HTTP verbs and URL paths to controllers.
- **MIDDLEWARE (`./src/middleware/`):** Enforces JWT cookie session resolution (`require-auth.js`), role gates (`require-buyer.js`, `require-admin.js`, `require-supplier.js`), and CSRF mutation protection (`require-trusted-mutation.js`).
- **CONTROLLER (`./src/controllers/`):** Parses parameters, queries, and JSON bodies, validates input shapes/bounds, delegates to services, and returns standardized envelopes (`{ success: true, data, meta }` or `{ success: false, error }`).
- **SERVICE (`./src/services/`):** Owns business rules, domain validations, transaction boundaries, and external RUL inference coordination independently of `req`/`res`.
- **MODEL RESPONSIBILITIES (`./src/services/**/*.repository.js` & PostgreSQL Schema):** PostgreSQL tables/constraints plus colocated `*.repository.js` files executing parameterized SQL queries via `pool`.

### Concrete Walkthrough: Buyer Orders Retrieval

1. **React View (`frontend/src/screens/buyer/OrdersPage.jsx`):** Calls `ordersApi.getOrders()` (`GET /api/v1/orders?page=1&limit=10`).
2. **Router ([`./src/routes/buyer/orders.routes.js`](./src/routes/buyer/orders.routes.js)):** Mounted at `/api/v1/orders` in [`./src/server.js`](./src/server.js), maps `GET /` to `ordersController.getOrders`.
3. **Middleware ([`./src/middleware/require-buyer.js`](./src/middleware/require-buyer.js)):** Calls `requireAuth` ([`./src/middleware/require-auth.js`](./src/middleware/require-auth.js)) to verify the `aerorul_session` cookie, verifies `req.authUser.role === "BUYER"`, and attaches `company_id`.
4. **Controller ([`./src/controllers/buyer/orders/orders.controller.js`](./src/controllers/buyer/orders/orders.controller.js)):** Ensures `status`, `search`, `page`, and `limit` are single strings and forwards them to the service.
5. **Service ([`./src/services/buyer/orders/orders.service.js`](./src/services/buyer/orders/orders.service.js)):** Validates allowed status filters (`ALL`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`), pagination bounds (`limit` 1–100), and search length.
6. **Repository ([`./src/services/buyer/orders/orders.repository.js`](./src/services/buyer/orders/orders.repository.js)):** Executes parameterized queries via `pool.query` across `orders`, `seller_orders`, `order_items`, and `payments`.

### Why This Structure Fits AeroRUL

- **Role-Based Separation:** Decouples Buyer, Supplier, and Admin modules into persona-specific subdirectories.
- **Separation of Concerns:** Keeps HTTP parsing, business rules, and SQL queries isolated across layers.
- **Testability:** Allows services and repositories to be unit-tested offline without booting an HTTP server.
- **Security & Integrity:** Centralizes authentication/CSRF in middleware and transactional safety in PostgreSQL locks and constraints.

---

## 2. Request Execution & Middleware Pipeline (`src/server.js`)

Every HTTP request enters Express 5 through a fixed top-to-bottom pipeline in [`./src/server.js`](./src/server.js):

```text
Incoming HTTP Request
  ├─► express.json()                     (parses JSON bodies; RUL CSV routes override per-route)
  ├─► cookieParser()                     (populates req.cookies for HttpOnly JWT session lookup)
  ├─► GET /                              (informational health text; no DB query)
  ├─► GET /api/db-test                   (404 in NODE_ENV=production; DB sanity query in dev)
  ├─► Public Routes                      (/api/v1/products, /api/products, /api/v1/auth)
  ├─► Role-Gated Route Prefixes:
  │     ├─ /api/v1/supplier/*            ──► requireSupplier (mounted inside supplier routes)
  │     ├─ /api/v1/admin/*               ──► requireAdmin
  │     └─ /api/v1/cart, checkout,
  │        orders, dashboard,
  │        engines, rul                  ──► requireBuyer
  ├─► RUL Body-Parser Error Middleware   (handles /api/v1/rul/* 413/415/400 CSV parser errors)
  └─► GET /docs                          (serves static generated apiDoc from backend/docs/apidoc)
```

### Security Middleware Chain

- **[`require-auth.js`](./src/middleware/require-auth.js) (`resolveAuthenticatedUser`, `requireAuth`):** Extracts `req.cookies["aerorul_session"]`, verifies the `HS256` JWT signature via [`session.service.js`](./src/services/auth/session.service.js), and reloads current `user_id`, `company_id`, `role`, and `is_active` from PostgreSQL. Because the JWT stores only `sub` (`user_id`), disabled accounts or role changes take effect immediately.
- **[`require-trusted-mutation.js`](./src/middleware/require-trusted-mutation.js):** Skips safe read methods (`GET`, `HEAD`, `OPTIONS`); on mutations (`POST`, `PUT`, `PATCH`, `DELETE`), enforces:
  1. custom header `x-aerorul-request === "1"`,
  2. matching `origin` header against `PUBLIC_WEB_URL` when sent,
  3. `sec-fetch-site !== "cross-site"`.
- **[`require-buyer.js`](./src/middleware/require-buyer.js), [`require-admin.js`](./src/middleware/require-admin.js), [`require-supplier.js`](./src/middleware/require-supplier.js):** Chain session verification → role validation → (for Supplier) PostgreSQL lookup `public.suppliers WHERE company_id = $1 AND status = 'APPROVED'` binding `req.supplierId` solely from the database → `requireTrustedMutation`. Client-supplied `user_id`, `company_id`, or `supplier_id` values are never trusted.

---

## 3. Core Business Flows & Invariants

### Flow 1 — Authentication & Company Registration

- **Files:** [`routes/auth/index.js`](./src/routes/auth/index.js) → [`session.controller.js`](./src/controllers/auth/session.controller.js) / [`register.controller.js`](./src/controllers/auth/register.controller.js) → [`session.service.js`](./src/services/auth/session.service.js) / [`register.service.js`](./src/services/auth/register.service.js)
- **Registration (`registerAccount`):** Hashes passwords with **Argon2id** (`memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`) *before* opening a DB transaction so slow hashing never holds database locks. Inserts `companies` → `users` → (if `SUPPLIER`) `'PENDING'` `suppliers` in one `BEGIN`/`COMMIT`/`ROLLBACK` transaction.
- **Login / Session / Logout (`login`, `me`, `logout`):** Verifies Argon2id and `is_active`, signs a 1-hour `HS256` JWT containing `{ sub }`, sets `COOKIE_NAME = "aerorul_session"` (`httpOnly: true`, `secure: NODE_ENV === "production"`, `sameSite: "lax"`, `maxAge: 3600000`, `Cache-Control: no-store`), and never exposes the JWT in JSON responses. `logout` clears the cookie.

### Flow 2 — Public Catalog, Supplier Listings & Inventory

- **Files:** [`product.controller.js`](./src/controllers/product.controller.js) → [`product.service.js`](./src/services/product.service.js); [`listings.controller.js`](./src/controllers/supplier/listings.controller.js) → [`listings.service.js`](./src/services/supplier/listings.service.js); [`inventory.controller.js`](./src/controllers/supplier/inventory.controller.js) → [`inventory.service.js`](./src/services/supplier/inventory.service.js)
- **Catalog Query Safety:** Controller validates `q`, `sort`, `filter`, `page`, and `per_page`; service maps dynamic columns exclusively through static allowlist dictionaries (`filterColumns` and `sortColumns`) with parameterized `$1..$N` values.
- **Supplier Listings Validation:** Validates `BIGINT` IDs (`<= 9223372036854775807n`), `condition` (`NEW`/`USED`/`REFURBISHED`), `status` (`DRAFT`/`ACTIVE`/`HIDDEN`), integer stock/lead-time bounds (`0..2147483647`), and decimal price regex `/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/`.

### Flow 3 — Shared Buyer Cart, Atomic Checkout (`TX-01`) & Bank Transfer Reconciliation

- **Files:** [`cart.routes.js`](./src/routes/buyer/cart.routes.js) → [`cart.controller.js`](./src/controllers/buyer/cart.controller.js) → [`cart.service.js`](./src/services/buyer/cart.service.js) / [`cart.repository.js`](./src/services/buyer/cart.repository.js); [`checkout.repository.js`](./src/services/buyer/checkout.repository.js); [`payments.repository.js`](./src/services/admin/payments.repository.js)
- **Buyer Checkout Transaction (`placeOrderTransaction`):** Executes on a single `pool.connect()` client (`BEGIN` … `COMMIT`/`ROLLBACK` … `release()`):
  1. Locks the buyer cart row (`SELECT cart_id FROM carts WHERE user_id = $1 FOR UPDATE`).
  2. Checks idempotency on `(placed_by, buyer_company_id, checkout_key)` so retries return the original order without double-charging or double-deducting stock.
  3. Validates company + company-owned `shipping_address_id` / `billing_address_id` and locks cart listing rows in deterministic order (`ORDER BY sl.listing_id FOR UPDATE OF sl`).
  4. Computes totals with `BigInt` cent arithmetic (`moneyToCents`/`centsToMoney`), freezes order/address snapshots, inserts per-supplier `seller_orders`, decrements stock atomically (`WHERE sl.stock_quantity >= $1 AND EXISTS (... APPROVED ... is_active = TRUE)`), inserts `order_items`, inserts `payments` with explicit `$4::varchar` cast (`SIMULATION` → `'SUCCEEDED'`, `BANK_TRANSFER` → `'PENDING'`), and clears `cart_items`.
- **Admin Bank Transfer Confirm / Cancel (`confirmBankTransferPayment`, `cancelBankTransferPayment`):**
  - Locks `public.payments` (`FOR UPDATE OF p`). `confirm` is idempotent on `SUCCEEDED`, rejects `CANCELLED`, and transitions `PENDING → SUCCEEDED` with `paid_at = CURRENT_TIMESTAMP`.
  - `cancel` locks `seller_orders`, blocks cancellation (`409 ORDER_ALREADY_IN_FULFILLMENT`) if any sub-order left `'CONFIRMED'`, marks payment `'CANCELLED'`, and restores `seller_listings.stock_quantity` per `listing_id` with an `INT` overflow guard (`<= 2147483647 - $1::INT`).

### Flow 4 — Admin Supplier Approval & Payment-Gated Order Fulfillment

- **Files:** [`suppliers.repository.js`](./src/services/admin/suppliers.repository.js); [`supplier/index.js`](./src/routes/supplier/index.js); [`supplier/orders.controller.js`](./src/controllers/supplier/orders.controller.js)
- **Supplier Approval Gate:** New suppliers register as `'PENDING'` and receive `403 SUPPLIER_NOT_APPROVED` until Admin promotes them (`PENDING → APPROVED`). `listSuppliers` escapes `%`, `_`, `\` for parameterized `ILIKE ... ESCAPE '\\'`.
- **Fulfillment Guard (`supplier/orders.controller.js`):** Requires `payment_status === "SUCCEEDED"` (`409 PAYMENT_PENDING` or `409 PAYMENT_CANCELLED` otherwise) and enforces single-step forward transitions: `CONFIRMED → PROCESSING → SHIPPED → DELIVERED`.

### Flow 5 — RUL Prediction & Deterministic Replacement Recommendation

- **Files:** [`rul.routes.js`](./src/routes/buyer/rul.routes.js) → [`rul.controller.js`](./src/controllers/buyer/rul.controller.js) → [`rul.service.js`](./src/services/buyer/rul/rul.service.js) → [`rul-inference.service.js`](./src/services/rul-inference.service.js); [`replacement-recommendations.service.js`](./src/services/buyer/rul/replacement-recommendations.service.js)
- **RUL Prediction:** `parseCsvBody` enforces UTF-8 `text/csv` <= `1mb`. `predict(...)` validates company engine ownership, UUID `Idempotency-Key`, safe `.csv` filename, declared provenance, and `validateCsv(csv)` (19 required columns, `>= 30` rows, positive `unit`/unique `cycle`, rejects ground-truth RUL columns), verifies active FD002 model registration (`503 MODEL_NOT_REGISTERED` if missing), writes the raw CSV (`0o700`/`0o600`), calls `predictCsv` over HTTPS or private/local HTTP (`X-RUL-Service-Token`, `redirect: "error"`, `90s` timeout, `64 KiB` max response) **with no DB transaction held open**, derives academic urgency (`<=20 PRIORITIZE`, `<=40 PREPARE`, `<=80 MONITOR`, `>80 NORMAL`), and persists `sensor_uploads` + `rul_predictions`.
- **Deterministic Replace & Buy (`generateRecommendations`):** Locks an owned `SUCCEEDED` prediction, replays existing `READY`/`NO_MATCH` results, queries compatible in-stock `ENGINE` listings from `APPROVED` suppliers sorted by `price ASC, lead_time_days ASC, listing_id ASC` (`LIMIT 5`, `ranking_score = 6 - rank_position`), and stores item snapshots without auto-adding to cart.

---

## 4. Development Commands & Verification

Run from `backend/`:

```bash
npm start                          # Start Express server (src/server.js)
npm run dev                        # Start Express with nodemon
node --test tests/*.test.cjs       # Run retained backend unit tests (54 tests across 13 files)
npm run doc                        # Regenerate static apiDoc into backend/docs/apidoc/
```

Note on database checks: [`buyer-checkout-payment-sql.test.cjs`](./tests/buyer-checkout-payment-sql.test.cjs) includes a real PostgreSQL SQLSTATE `42P08` `PREPARE` regression test that verifies `pool.options.host` is strictly `localhost` / `127.0.0.1` / `::1` (with no `DATABASE_URL`) before connecting, and skips cleanly (`t.skip`) in remote or offline CI environments.
