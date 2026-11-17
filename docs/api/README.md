# REST API Design

The Express 5 REST API connects the React 18 frontend to **Neon PostgreSQL** (production) across Public, Authentication, Supplier, Buyer, and Admin workflows. For Buyer RUL prediction, Express validates the raw `text/csv` payload and sends it over HTTPS to the containerized FastAPI service on **Google Cloud Run** (`rul-service`), which runs the frozen FD002 Condition-Aware iTransformer model. Express persists successful predictions and powers the **Replace & Buy** replacement-engine recommendation workflow.

**Production API Reference (apiDoc):** `https://www.aerotradehub.top/docs/`

*(Served by Express from `backend/docs/apidoc/` via Vercel's same-origin `/docs/` rewrite. Generated during build with `npm run doc` using `backend/apidoc.config.js`. A standalone `docs.aerotradehub.top` subdomain is not deployed.)*

## Related Documentation

- [Buyer integration](../roles/buyer/README.md)
- [Supplier integration](../roles/supplier/README.md)
- [Admin integration](../roles/admin/README.md)
- [Architecture overview](../architecture/README.md)
- [Authentication design](../auth/AUTHENTICATION_DESIGN.md)
- [Buyer RUL documentation](../rul/README.md)
- [Cloud deployment runbook](../devops/deployment/README.md)

## Base URL and Response Envelope

- **Production Base Path:** `https://www.aerotradehub.top/api/v1` (Vercel rewrites `/api/*` to the Render Express backend).
- **Local Development:** `/api/v1` via Vite proxy to `http://localhost:3000`.
- **Formats:** JSON (`application/json`) for standard endpoints; raw UTF-8 `text/csv` for `POST /api/v1/rul/engines/:engineId/predict`.
- **Success Envelope:** `{ "success": true, "data": ... }` (list endpoints may also include `count` and/or `meta`).
- **Error Envelope:** `{ "success": false, "error": { "code": "...", "message": "..." } }`.
- **Identifiers:** PostgreSQL `BIGINT` IDs are serialized and accepted as decimal strings.

## Authentication and Mutations

- Protected endpoints read the 1-hour HS256 JWT stored in the browser-managed `HttpOnly; SameSite=Lax` (`Secure` in production) session cookie (`aerorul_session`). **Bearer tokens are not used.** Frontend code must not read or store the JWT.
- Registration (`POST /api/v1/auth/register`) creates an active Buyer or Supplier account immediately without email verification or SMTP delivery. Supplier accounts start in `PENDING` status and require `ADMIN` approval before accessing Supplier routes.
- `POST /api/v1/auth/logout` clears the browser session cookie; there is no server-side token revocation list (any previously extracted token expires naturally at its 1-hour TTL).
- State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) on protected/session routes require `X-AeroRUL-Request: 1` and matching `Origin` against `PUBLIC_WEB_URL` (`https://www.aerotradehub.top` in production), enforced by `requireTrustedMutation`.
- Role authorization (`BUYER`, `SUPPLIER`, `ADMIN`) and company/supplier ownership are derived server-side from PostgreSQL via `requireAuth`, `requireBuyer`, `requireSupplier`, and `requireAdmin`.

## Implemented Endpoint Overview

All application paths below are relative to `/api/v1` unless noted otherwise (root `/` health and dev-only `/api/db-test` live outside `/api/v1`).

| Module | Method | Endpoint | Access | Purpose |
|---|---|---|---|---|
| **Authentication** | `POST` | `/auth/register` | Public | Register a Buyer or Supplier company and user (no email verification) |
| **Authentication** | `POST` | `/auth/login` | Public + CSRF | Verify Argon2id password, set `HttpOnly` 1-hour JWT cookie |
| **Authentication** | `GET` | `/auth/me` | Authenticated | Verify JWT cookie and reload active user/role/company from PostgreSQL |
| **Authentication** | `POST` | `/auth/logout` | Authenticated + CSRF | Clear `aerorul_session` browser cookie |
| **Products (Public)** | `GET` | `/products` | Public | Search and paginate active catalog products |
| **Products (Public)** | `GET` | `/products/filter-options` | Public | Read marketplace category/manufacturer filter options |
| **Products (Public)** | `GET` | `/products/:productId` | Public | View an active product detail |
| **Products (Public)** | `GET` | `/products/:productId/listings` | Public | View active listings from `APPROVED` suppliers |
| **Supplier** | `GET` | `/supplier/overview` | Approved Supplier | Read supplier store summary and approval probe |
| **Supplier** | `GET` | `/supplier/listings` | Approved Supplier | List owned listings |
| **Supplier** | `GET` | `/supplier/listings/:listingId` | Approved Supplier | Get owned listing detail |
| **Supplier** | `POST` | `/supplier/listings` | Approved Supplier + CSRF | Create a new product listing |
| **Supplier** | `PATCH` | `/supplier/listings/:listingId` | Approved Supplier + CSRF | Update an owned listing |
| **Supplier** | `DELETE` | `/supplier/listings/:listingId` | Approved Supplier + CSRF | Soft-delete/hide an owned listing |
| **Supplier** | `GET` | `/supplier/inventory` | Approved Supplier | Read owned inventory levels |
| **Supplier** | `PATCH` | `/supplier/inventory/:listingId` | Approved Supplier + CSRF | Update stock quantity |
| **Supplier** | `GET` | `/supplier/orders` | Approved Supplier | List supplier-scoped `seller_orders` |
| **Supplier** | `GET` | `/supplier/orders/:sellerOrderId` | Approved Supplier | Read supplier order detail and payment status |
| **Supplier** | `PATCH` | `/supplier/orders/:sellerOrderId/status` | Approved Supplier + CSRF | Advance fulfillment status (requires linked payment `SUCCEEDED`) |
| **Buyer Cart** | `GET` | `/cart` | Buyer | Read the authenticated user's cart |
| **Buyer Cart** | `POST` | `/cart/items` | Buyer + CSRF | Add an available active listing (`listing_id`, `quantity`) |
| **Buyer Cart** | `PUT` | `/cart/items/:cartItemId` | Buyer + CSRF | Update an owned cart item quantity |
| **Buyer Cart** | `DELETE` | `/cart/items/:cartItemId` | Buyer + CSRF | Remove an owned cart item |
| **Buyer Cart** | `DELETE` | `/cart` | Buyer + CSRF | Clear the authenticated user's cart |
| **Buyer Checkout** | `GET` | `/checkout/addresses` | Buyer | List company-owned addresses |
| **Buyer Checkout** | `POST` | `/checkout/addresses` | Buyer + CSRF | Save an address for the authenticated company |
| **Buyer Checkout** | `GET` | `/checkout/delivery-methods` | Buyer | Read demonstration delivery fee estimates |
| **Buyer Checkout** | `GET` | `/checkout/company` | Buyer | Read the authenticated Buyer company profile |
| **Buyer Checkout** | `POST` | `/checkout/orders` | Buyer + CSRF | Place an idempotent order (`SIMULATION` or `BANK_TRANSFER`) |
| **Buyer Orders** | `GET` | `/orders` | Buyer | Search and filter company orders |
| **Buyer Orders** | `GET` | `/orders/:orderId` | Buyer | Read company-scoped order details and payment state |
| **Buyer Orders** | `GET` | `/orders/:orderId/confirmation` | Buyer | Read company-scoped order confirmation |
| **Buyer Dashboard** | `GET` | `/dashboard/summary` | Buyer | Read company engine, order, wishlist, and critical alert summary |
| **Buyer Dashboard** | `GET` | `/dashboard/engine-health` | Buyer | Read company engines and latest stored predictions |
| **Buyer Dashboard** | `GET` | `/dashboard/recent-orders` | Buyer | Read recent company orders |
| **Buyer Engines** | `GET` | `/engines` | Buyer | Search and filter company-owned engines |
| **Buyer Engines** | `GET` | `/engines/models` | Buyer | Search available catalog engine models |
| **Buyer Engines** | `GET` | `/engines/aircraft` | Buyer | List company-owned aircraft |
| **Buyer Engines** | `POST` | `/engines` | Buyer + CSRF | Register a new engine (linking existing or new aircraft) |
| **Buyer Engines** | `GET` | `/engines/:engineId` | Buyer | Read company-scoped engine details |
| **Buyer Engines** | `PUT` | `/engines/:engineId` | Buyer + CSRF | Update company-owned engine details |
| **Buyer Engines** | `GET` | `/engines/:engineId/sensor-uploads` | Buyer | Read company-scoped upload metadata |
| **Buyer RUL** | `POST` | `/rul/engines/:engineId/predict` | Buyer + CSRF | Validate `text/csv`, invoke FastAPI RUL service, persist upload & prediction |
| **Buyer RUL** | `GET` | `/rul/engines/:engineId/history` | Buyer | List stored company-scoped RUL predictions |
| **Buyer RUL** | `POST` | `/rul/predictions/:predictionId/recommendations` | Buyer + CSRF | Generate and save up to 5 compatible replacement ENGINE listings |
| **Buyer RUL** | `GET` | `/rul/predictions/:predictionId/recommendations` | Buyer | Retrieve saved replacement ENGINE recommendation snapshots |
| **Admin** | `GET` | `/admin/dashboard/summary` | Admin | Read marketplace aggregates and 6-month succeeded payment trend |
| **Admin** | `GET` | `/admin/suppliers` | Admin | List supplier accounts (`PENDING`, `APPROVED`, `SUSPENDED`) |
| **Admin** | `POST` | `/admin/suppliers/:supplierId/approve` | Admin + CSRF | Approve a `PENDING` supplier (idempotent) |
| **Admin** | `GET` | `/admin/payments` | Admin | List `BANK_TRANSFER` payment records |
| **Admin** | `POST` | `/admin/payments/:orderId/confirm` | Admin + CSRF | Confirm a `PENDING` `BANK_TRANSFER` payment (`SUCCEEDED`) |
| **Admin** | `POST` | `/admin/payments/:orderId/cancel` | Admin + CSRF | Cancel a `PENDING` `BANK_TRANSFER` payment (`CANCELLED`) and restore stock once |
| **Admin** | `GET` | `/admin/rul/health` | Admin | Probe internal Cloud Run FastAPI `/health` readiness via Express |

*(Legacy `/api/products` and `/api/products/:productId` remain mounted for backwards compatibility alongside `/api/v1/products`.)*

## Checkout & Payment Constraints

`POST /api/v1/checkout/orders` accepts company-owned address IDs, a delivery estimate ID, a client `checkout_key`, and `payment_method` (`"SIMULATION"` or `"BANK_TRANSFER"`). In a single PostgreSQL transaction, Express rechecks active listings and approved suppliers, locks and decrements `seller_listings.stock_quantity`, inserts `orders`, per-supplier `seller_orders`, `order_items`, and `payments`, and clears the Buyer's cart:
- **`SIMULATION`:** Records `status = 'SUCCEEDED'` with `paid_at` immediately (development/demo only).
- **`BANK_TRANSFER`:** Records `status = 'PENDING'` with `paid_at = NULL`, using `orders.order_number` as the transfer reference. Authorized `ADMIN` users reconcile payments via `POST /api/v1/admin/payments/:orderId/confirm` or cancel them (restoring reserved stock once) via `POST /api/v1/admin/payments/:orderId/cancel`.
- **Fulfillment Gating:** Supplier transitions (`CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED`) require linked payment `status = 'SUCCEEDED'`.

AeroRUL does not collect cardholder data, integrate real banking or payment gateways, transfer real funds, calculate taxes, or claim PCI DSS compliance.

## Buyer RUL Prediction & Recommendations

1. **Prediction (`POST /api/v1/rul/engines/:engineId/predict`):** Accepts a raw UTF-8 `text/csv` request body (not JSON or multipart form-data), max 1 MiB, with 19 required columns, one `unit`, $\ge 30$ observations, no ground-truth RUL labels, and raw unscaled physical-unit values. Requires `X-AeroRUL-Request: 1`, safe `.csv` `X-RUL-Filename`, `Idempotency-Key` (UUID), and `X-RUL-Source` (`NASA_CMAPSS_FD002`, `CUSTOM_SYNTHETIC`, or `EXTERNAL_MAPPED`).
2. **Cloud Run Execution:** Express posts the validated CSV over HTTPS to Google Cloud Run (`POST /v1/predict`) with `X-RUL-Service-Token`. FastAPI runs the frozen FD002 Condition-Aware iTransformer checkpoint and returns predicted RUL cycles. Express saves raw CSV bytes privately under `backend/storage/rul/<user_id>/` (ephemeral on Render Free) and persists `sensor_uploads` and `rul_predictions` rows in Neon PostgreSQL.
3. **Replace & Buy Recommendations:** `POST /api/v1/rul/predictions/:predictionId/recommendations` locks the successful prediction and saves up to five `ENGINE` listings satisfying exact `product_engine_compatibility` evidence, active product, `ACTIVE` listing, `APPROVED` supplier, and positive stock—ranked by lower listing price, shorter lead time, then listing ID.

## Out-of-Scope Capabilities

The RUL recommendation MVP covers replacement `ENGINE` listings with recorded compatibility evidence. General spare-parts recommendation expansion, automated hardware telemetry ingestion, trade-in, buyback, old-asset collection, fair-market valuation, and exchange-credit workflows remain **out of scope**.

For detailed request/response schemas and live interactive examples, inspect [`https://www.aerotradehub.top/docs/`](https://www.aerotradehub.top/docs/) or generate local apiDoc output via `npm run doc` inside `backend/`.
