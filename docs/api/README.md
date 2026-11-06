# REST API Design

The Express API connects the React application to PostgreSQL-backed public,
Authentication, Supplier and Buyer workflows. For Buyer RUL prediction,
Express calls the internal FastAPI service, which runs the frozen FD002 model;
RUL-based part recommendations remain deferred.

## Related documentation

- [Buyer integration](../buyer/README.md)
- [Architecture overview](../architecture/README.md)
- [Authentication design](../auth/AUTHENTICATION_DESIGN.md)

## Base URL and responses

The API base path is `/api/v1`. Requests and responses normally use JSON; the
Buyer RUL prediction endpoint accepts a raw `text/csv` request body.

Successful responses use `{ "success": true, "data": ... }`; list endpoints may
also return `count` and/or `meta`. Errors use
`{ "success": false, "error": { "code": "...", "message": "..." } }`.

## Authentication and mutations

Protected endpoints use the JWT in the browser-managed HttpOnly session cookie.
These APIs do not use Bearer tokens. Frontend code must not read or store the
JWT. Authenticated mutations include `X-AeroRUL-Request: 1`, which is checked
alongside the request origin by the existing trusted-mutation middleware.
Buyer requests are authorized from the verified session role and identity;
role authorization and ownership are enforced by the backend, not by client
supplied user or company IDs.

## Implemented endpoint overview

Paths in this table are relative to `/api/v1`.

| Module | Method | Endpoint | Access | Purpose |
|---|---|---|---|---|
| Authentication | POST | `/auth/register` | Public | Register a Buyer or Supplier account |
| Authentication | POST | `/auth/login` | Public | Create an authenticated session |
| Authentication | POST | `/auth/logout` | Authenticated | Revoke the current session |
| Authentication | GET | `/auth/me` | Authenticated | Read the current session user |
| Products | GET | `/products` | Public | Search and paginate active products |
| Products | GET | `/products/filter-options` | Public | Read marketplace filter values |
| Products | GET | `/products/:productId` | Public | View an active product |
| Products | GET | `/products/:productId/listings` | Public | View active offers from approved Suppliers |
| Supplier | — | See Supplier route annotations in `backend/src/routes/supplier/` | Supplier | Manage owned listings, inventory and orders |
| Cart | GET | `/cart` | Buyer | Read the authenticated user's cart |
| Cart | POST | `/cart/items` | Buyer | Add an available supplier listing |
| Cart | PUT | `/cart/items/:cartItemId` | Buyer | Change an owned cart item quantity |
| Cart | DELETE | `/cart/items/:cartItemId` | Buyer | Remove an owned cart item |
| Cart | DELETE | `/cart` | Buyer | Clear the authenticated user's cart |
| Checkout | GET | `/checkout/addresses` | Buyer | List company-owned addresses |
| Checkout | POST | `/checkout/addresses` | Buyer | Save an address for the authenticated company |
| Checkout | GET | `/checkout/delivery-methods` | Buyer | Read demonstration-only delivery estimates |
| Checkout | GET | `/checkout/company` | Buyer | Read the authenticated Buyer company |
| Checkout | POST | `/checkout/orders` | Buyer | Place an order from the authenticated cart (`SIMULATION` or `BANK_TRANSFER`) |
| Admin Payments | POST | `/admin/payments/:orderId/confirm` | Admin | Confirm a `PENDING` `BANK_TRANSFER` payment (`SUCCEEDED`) |
| Admin Payments | POST | `/admin/payments/:orderId/cancel` | Admin | Cancel a `PENDING` `BANK_TRANSFER` payment (`CANCELLED`) and restore reserved stock |
| Orders | GET | `/orders` | Buyer | Search/filter company orders |
| Orders | GET | `/orders/:orderId` | Buyer | Read company-scoped order details |
| Orders | GET | `/orders/:orderId/confirmation` | Buyer | Read company-scoped order confirmation |
| Dashboard | GET | `/dashboard/summary` | Buyer | Read company and user-specific summary data |
| Dashboard | GET | `/dashboard/engine-health` | Buyer | Read company engines and stored predictions |
| Dashboard | GET | `/dashboard/recent-orders` | Buyer | Read recent company orders |
| Engines | GET | `/engines` | Buyer | Search/filter company-owned engines |
| Engines | GET | `/engines/:engineId` | Buyer | Read company-scoped engine details |
| Engines | GET | `/engines/:engineId/sensor-uploads` | Buyer | Read company-scoped upload metadata |
| RUL | POST | `/rul/engines/:engineId/predict` | Buyer | Validate a classified compatible sensor CSV, run local model inference and save the successful result |
| RUL | GET | `/rul/engines/:engineId/history` | Buyer | List saved predictions for an engine owned by the company |

Buyer routes require the authenticated `BUYER` role. Cart operations use the
authenticated user ID; address, order, dashboard and engine access use the
authenticated company ID. Clients cannot select another user or company by
sending identity fields.

The Buyer route annotations document each method, request fields, access
permission, response envelope and relevant error codes. Cart and checkout
mutations use POST/PUT/DELETE request bodies where applicable. IDs backed by
PostgreSQL `BIGINT` are sent as decimal strings.

## Marketplace contract

`GET /api/v1/products` uses query parameters documented in
`backend/src/routes/product-v1.routes.js` (`q`, `sort`, `filter`, `page`, and
`per_page`). Product IDs and listing IDs are decimal strings because PostgreSQL
uses BIGINT identifiers.

## Checkout constraints

`POST /api/v1/checkout/orders` accepts saved address IDs belonging to the
authenticated company, a supported delivery-estimate ID, a stable
`checkout_key`, and `payment_method` (`"SIMULATION"` or `"BANK_TRANSFER"`). The
server validates current offer status and stock, creates the order and seller
orders, decrements stock, records the explicit payment state (`SUCCEEDED` with
`paid_at` for development-only `SIMULATION`, or `PENDING` with `paid_at = NULL`
for the `BANK_TRANSFER` manual reconciliation demonstration), and clears the
cart in one transaction. Authorized `ADMIN` sessions can reconcile a `PENDING`
`BANK_TRANSFER` order via `POST /api/v1/admin/payments/:orderId/confirm` or
cancel it (atomically restoring reserved stock once) via
`POST /api/v1/admin/payments/:orderId/cancel`. Supplier fulfillment transitions
(`CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED`) require the order's payment
`status` to be `SUCCEEDED`. AeroRUL does not collect cardholder data, integrate
live card acquiring or banking rails, transfer real funds, or claim PCI DSS
compliance. Delivery fees are demonstration estimates, not carrier quotes or
guarantees; taxes are not calculated.

The checkout transaction creates one `orders` row and one `seller_orders` row
per supplier represented in the cart, then writes the corresponding
`order_items` snapshots. The unique `orders.order_number` constraint prevents
duplicate order numbers; the unique `(placed_by, checkout_key)` constraint and
cart-row lock make a retry by the same Buyer return its original order instead
of charging or decrementing stock twice. Each `seller_orders` row is the
Supplier-facing fulfillment record consumed by the existing Supplier Orders
API. Buyers see company-scoped parent orders and their seller-order children;
Suppliers see only seller orders for their authenticated Supplier identity.

These are AeroRUL implementation choices for the project, not additional
requirements attributed to the lecturer: Argon2id password hashing, JWT cookie
storage, the CSRF request header, and the JSON envelope conventions.

## Buyer RUL prediction

`POST /api/v1/rul/engines/:engineId/predict` accepts a raw UTF-8 `text/csv`
request body, not JSON or multipart data. The authenticated Buyer selects a
company-owned engine and must provide `X-RUL-Source` with one of
`NASA_CMAPSS_FD002`, `CUSTOM_SYNTHETIC`, or `EXTERNAL_MAPPED`. The file must have
the 19 required input columns, one unit, at least 30 observations, no
ground-truth RUL labels, UTF-8 without BOM, and raw unscaled values in
compatible physical units. The request is limited to 1 MiB and also requires
`X-AeroRUL-Request: 1`, a safe `.csv` `X-RUL-Filename`, and a UUID
`Idempotency-Key`. The browser includes the existing HttpOnly session cookie.
The source classification is user-declared provenance, not verified by the
server, and changing the source while reusing an idempotency key returns
`409 IDEMPOTENCY_CONFLICT`.

The Express Buyer route calls the internal FastAPI service over HTTP using the
configured service address and shared service token. FastAPI loads the model
and scaler once per worker; Express does not launch a Python process and no
FastAPI route is exposed to the browser. Successful uploads are stored
privately under `backend/storage/rul/<authenticated-user-id>/`; the SQL
transaction creates a `sensor_uploads` row and a `rul_predictions` row using
the existing schema. The upload classification is stored in the existing
`sensor_uploads.dataset_subset` field; `ml_model_versions.dataset_subset`
continues to identify the FD002-trained model. Prediction and history data
return `source_classification` separately from the model's `dataset_subset`.
A new prediction returns HTTP 201; a same-key, same-user, same-engine,
same-content and same-source replay returns HTTP 200; reusing the key for
different content or source returns HTTP 409. Oversized bodies and unsupported
media types return the standard JSON error envelope. Historical uploads from
before source classification was added return
`source_classification: LEGACY_UNCLASSIFIED`; their stored `FD002` value is not treated as verified
provenance. `GET /api/v1/rul/engines/:engineId/history`
returns company-scoped stored records and does not invoke inference.

The integrated model is the single Condition-Aware iTransformer trained and
evaluated on FD002, using the seed-42 checkpoint and frozen scaler. Accepted
CSV source compatibility does not guarantee prediction accuracy. Prediction values and the
20/40/80-cycle planning thresholds are educational simulation output only,
not actual aircraft telemetry, airworthiness guidance, or verified part
compatibility. The Replace & Buy MVP exposes
`POST /api/v1/rul/predictions/:predictionId/recommendations` to generate and
persist eligible engine listings and
`GET /api/v1/rul/predictions/:predictionId/recommendations` to retrieve saved
snapshots. Eligibility requires exact `engine_model_id` compatibility
evidence, an active `ENGINE` product, an ACTIVE listing, an APPROVED supplier,
and positive stock. Ranking is by lower actual listing price, shorter lead
time, then stable listing ID; at most five results are saved. Compatibility
evidence can be demo data and is not certified installation approval. Prices
are actual listing prices, not fair-market valuations. Trade-in, buyback,
old-asset collection, valuation and exchange credit are not implemented.
Model metadata must be registered by the approved deployment operator using
[`database/seed/03_ml_model_version_seed.sql`](../../database/seed/03_ml_model_version_seed.sql);
do not run it as part of static verification.

For the request/response and setup details, see
[Buyer RUL integration](../rul/README.md).

The internal FastAPI inference routes (`GET /health`, `GET /v1/model-info`,
`POST /v1/predict`) are service-to-service endpoints, require the internal
service token, and are not part of this public `/api/v1` API or the Buyer
APIDoc. React calls Express only.

## Deferred capabilities

The RUL recommendation MVP is restricted to replacement ENGINE listings and
recorded compatibility evidence. Full replacement-parts recommendations,
trade-in, buyback and exchange-credit workflows remain deferred.

Buyer route APIDoc annotations live in `backend/src/routes/buyer/`. From
`backend/`, run `npm run doc` to generate the local APIDoc site under
`backend/docs/apidoc/`. Contract audit evidence and runtime-test limitations
are recorded in [the Buyer API contract audit](../buyer/BUYER_API_CONTRACT_AUDIT.md).
