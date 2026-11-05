# Buyer API Contract Audit

**Branch:** `week-3`  
**Audit scope:** Current local routes, controllers, services/repositories, frontend API consumers, authentication middleware, and `database/schema/01_schema.sql`.  
**Runtime status:** Source and static checks only. No database connection, SQL execution, or live API request was made.

## Findings and corrections

| Status | Finding | Correction |
|---|---|---|
| FIXED | Checkout address IDs were converted with `String(value)` before validation. A JSON numeric ID could therefore be accepted after JavaScript had already rounded an unsafe PostgreSQL `BIGINT`. | Checkout now requires decimal-string IDs, validates the positive `BIGINT` range, and passes those strings as SQL parameters. The frontend already sends address IDs as strings. |
| FIXED | Idempotent checkout retries returned HTTP 201 even though the order already existed. | Checkout now returns HTTP 201 for a newly created order and HTTP 200 for a retry that returns the original order; response `data` is unchanged. |
| FIXED | Buyer APIDoc annotations were missing `@apiPermission Buyer` on routes and several documented errors, validation rules, and response examples were incomplete. | Added Buyer permission, request/error details, and representative response examples to all Buyer route annotations. |
| VERIFIED FROM SOURCE | Buyer route mounts use the existing `requireBuyer` middleware. It delegates session validation to `requireAuth`, checks `req.authUser.role`, and applies the established trusted-mutation middleware to writes. | No parallel auth, JWT, or CSRF implementation was added. |
| VERIFIED FROM SOURCE | Buyer ownership predicates use the authenticated user/company IDs; request identity fields and identity headers are not used by Buyer controllers or repositories. | No identity fallback or ownership change was needed. |
| VERIFIED FROM SOURCE | Checkout transaction, stock revalidation/decrement, parent/seller order creation, order-item snapshots, simulated payment and cart clearing are consistent with the declared schema constraints. | No transaction behavior was rewritten. |

No other source-level route/controller/service/frontend/schema mismatch was confirmed in this review. “Verified from source” does not mean an endpoint was exercised at runtime.

## Endpoint contract matrix

All paths below are complete paths under `/api/v1`. Buyer routes are mounted in
`backend/src/server.js` with `requireBuyer`, which requires the verified JWT
HttpOnly-cookie session and `BUYER` role. Writes additionally require
`X-AeroRUL-Request: 1` and the trusted-origin checks. Failures use
`{ "success": false, "error": { "code": "...", "message": "..." } }`.
PostgreSQL `BIGINT` IDs are returned and sent as decimal strings.

The original audit covered 19 Buyer routes. The two RUL routes below were
added afterward and are **verified from source only**; neither has been tested
against a live database or Python inference runtime.

| Method | Full path | Controller | Authentication | Request contract | Response contract | PostgreSQL operations | Frontend consumer | APIDoc status |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/v1/cart` | `cart.controller.getCart` | Buyer cookie session + BUYER role | No parameters | `200 {success:true,data:{items,subtotal,total_items}}`; empty cart is successful | Reads `carts`, `cart_items`, `seller_listings`, `suppliers`, `products`, `categories` by authenticated `user_id` | `features/buyer/cart/services/cartApi.js:getCart` | VERIFIED FROM SOURCE; documented |
| POST | `/api/v1/cart/items` | `cart.controller.addItem` | Buyer cookie session + BUYER role + trusted mutation | Body `{listing_id: string BIGINT, quantity?: positive integer}`; default quantity 1 | `200` with updated cart | Transactionally creates/locks the user cart, checks active listing/product, approved Supplier and stock, upserts `cart_items` | `cartApi.js:addItemToCart` | VERIFIED FROM SOURCE; documented |
| PUT | `/api/v1/cart/items/:cartItemId` | `cart.controller.updateQuantity` | Buyer cookie session + BUYER role + trusted mutation | Path `cartItemId` positive BIGINT string; body `{quantity: positive integer}` | `200` with updated cart | Locks authenticated user's cart/item/listing; checks offer and stock; updates owned `cart_items` row | `cartApi.js:updateCartItemQuantity` | VERIFIED FROM SOURCE; documented |
| DELETE | `/api/v1/cart/items/:cartItemId` | `cart.controller.removeItem` | Buyer cookie session + BUYER role + trusted mutation | Path `cartItemId` positive BIGINT string | `200` with updated cart | Deletes only the item joined to the authenticated user's `carts` row | `cartApi.js:removeCartItem` | VERIFIED FROM SOURCE; documented |
| DELETE | `/api/v1/cart` | `cart.controller.clearCart` | Buyer cookie session + BUYER role + trusted mutation | No parameters | `200` with empty cart data | Locks/creates authenticated user's cart and deletes its `cart_items` in a transaction | `cartApi.js:clearCart` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/checkout/addresses` | `checkout.controller.getAddresses` | Buyer cookie session + BUYER role | No parameters | `200` with address array | Selects `addresses` by `req.authUser.company_id` | `checkoutApi.getAddresses` | VERIFIED FROM SOURCE; documented |
| POST | `/api/v1/checkout/addresses` | `checkout.controller.addAddress` | Buyer cookie session + BUYER role + trusted mutation | Body fields: `recipient_name`, `phone`, `address_line`, `city`, optional `region`, `postal_code`, two-letter uppercase `country_code`; unknown fields rejected | `201` with created address | Inserts `addresses` using authenticated company ID; returns saved address | `checkoutApi.addAddress` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/checkout/delivery-methods` | `checkout.controller.getDeliveryMethods` | Buyer cookie session + BUYER role | No parameters | `200` with static demonstration estimates | No database operation | `checkoutApi.getDeliveryMethods` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/checkout/company` | `checkout.controller.getCompany` | Buyer cookie session + BUYER role | No parameters | `200` with authenticated company; `404 COMPANY_NOT_FOUND` if absent | Selects `companies` by authenticated company ID | `checkoutApi.getCompany` | VERIFIED FROM SOURCE; documented |
| POST | `/api/v1/checkout/orders` | `checkout.controller.placeOrder` | Buyer cookie session + BUYER role + trusted mutation | Body `{shipping_address_id: string, billing_address_id?: string|null, delivery_method_id, purchase_reference?: string|null, payment_method:"SIMULATION", checkout_key}` | `201` with new order row `{order_id,order_number,checkout_key,grand_total,currency,created_at}`; `200` with the same original data on idempotent retry | One transaction locks cart, checks company-owned addresses and active product/listing/approved supplier/stock, inserts `orders`, one `seller_orders` per supplier, `order_items`, one `payments` simulation, decrements stock and clears cart; rollback on failure | `checkout/review/services/reviewApi.js:placeOrder` | FIXED ID validation and replay status; VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/orders` | `orders.controller.getOrders` | Buyer cookie session + BUYER role | Query `status` (`ALL`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`), `search` (max 200), `page` (positive integer), `limit` (1–100) | `200 {success:true,data:orders,meta:{counts,pagination}}` | Reads company-owned `orders`, joins/aggregates `seller_orders` and `order_items`; filters by company ID | `orders/services/ordersApi.js:getOrders` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/orders/:orderId` | `orderDetail.controller.getOrderDetail` | Buyer cookie session + BUYER role | Path `orderId` positive BIGINT string | `200` with company-owned order, seller orders/items, shipment records and payment; `404 ORDER_NOT_FOUND` | Reads `orders` by order ID + authenticated company; then `seller_orders`, `shipments`, `order_items`, `seller_listings`, `products`, `categories`, `payments` | `orders/order-detail/services/orderDetailApi.js` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/orders/:orderId/confirmation` | `orderConfirmation.controller.getOrderConfirmation` | Buyer cookie session + BUYER role | Path `orderId` positive BIGINT string | `200` with company-owned confirmation; `404 ORDER_NOT_FOUND` | Reads company-owned `orders` with `payments`, `seller_orders`, `order_items` | `orders/order-confirmation/services/orderConfirmationApi.js` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/dashboard/summary` | `dashboard.controller.getSummary` | Buyer cookie session + BUYER role | No parameters | `200` with company, engine/order/wishlist counts and stored critical alert | Company-scoped reads of `engines`/`aircraft`, `orders`/`seller_orders`, `rul_predictions`/`sensor_uploads`/`engine_models`, `companies`; user-scoped `wishlist_items` | `dashboard/services/dashboardApi.js:getDashboardSummary` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/dashboard/engine-health` | `dashboard.controller.getEngineHealth` | Buyer cookie session + BUYER role | Query `limit` integer 1–100, default 5 | `200` with engine overview array; predictions are previously stored successes only | Reads `engines`, `engine_models`, `aircraft`, latest successful `rul_predictions`/`sensor_uploads`, scoped by company | `dashboardApi.js:getDashboardEngineHealth` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/dashboard/recent-orders` | `dashboard.controller.getRecentOrders` | Buyer cookie session + BUYER role | Query `limit` integer 1–100, default 5 | `200` with recent company order array | Reads `orders`, `seller_orders`, `order_items`, scoped by company, ordered newest first | `dashboardApi.js:getDashboardRecentOrders` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/engines` | `engines.controller.listEngines` | Buyer cookie session + BUYER role | Query `search` (max 200), `urgency` (`ALL`, `PRIORITIZE`, `PREPARE`, `MONITOR`, `NORMAL`, `NOT_ANALYZED`), positive `page`, `limit` 1–100 | `200 {success:true,data:engines,meta:{counts,pagination}}` | Reads company-owned `engines`, `engine_models`, `aircraft` and latest successful prediction data | `engines/services/engineApi.js:getEngines` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/engines/:engineId` | `engines.controller.getEngineDetail` | Buyer cookie session + BUYER role | Path `engineId` positive BIGINT string | `200` engine, aircraft and optional stored prediction; `404 ENGINE_NOT_FOUND` | Selects engine through company-owned aircraft; joins latest successful `rul_predictions`, `sensor_uploads`, `ml_model_versions` | `engineApi.js:getEngineById` | VERIFIED FROM SOURCE; documented |
| GET | `/api/v1/engines/:engineId/sensor-uploads` | `engines.controller.getSensorUploads` | Buyer cookie session + BUYER role | Path `engineId` positive BIGINT string; query `limit` 1–100, default 10 | `200` upload metadata array; `404 ENGINE_NOT_FOUND` for an engine outside the company or absent | Verifies company ownership through `engines`/`aircraft`, then reads `sensor_uploads` and uploader `users` | `engineApi.js:getEngineSensorUploads` | VERIFIED FROM SOURCE; documented |
| POST | `/api/v1/rul/engines/:engineId/predict` | `rul.controller.predict` | Buyer cookie session + BUYER role + trusted mutation | Path `engineId` positive BIGINT string; raw UTF-8 `text/csv` body up to 1 MiB; 19 required columns, one unit, >=30 observations, no true RUL labels, raw physical-unit values; `X-RUL-Source` enum (`NASA_CMAPSS_FD002`, `CUSTOM_SYNTHETIC`, `EXTERNAL_MAPPED`); `X-RUL-Filename`; UUID `Idempotency-Key` | `201` new prediction; `200` same-user/engine/content/source replay; source returned as `source_classification`, model separately reports FD002; standard success/error envelopes; `409 IDEMPOTENCY_CONFLICT` for key reuse with different content or source | Verifies engine ownership via `engines`/`aircraft`; reads active FD002 `ml_model_versions`; transactionally inserts `sensor_uploads` with declared source in its existing `dataset_subset`, and `rul_predictions` after successful inference through internal FastAPI HTTP | `rul-analysis/services/rulApi.js:predictRul`, shared `buyerApi.js` | VERIFIED FROM SOURCE; APIDoc documented; NOT TESTED AT RUNTIME |
| GET | `/api/v1/rul/engines/:engineId/history` | `rul.controller.history` | Buyer cookie session + BUYER role | Path `engineId` positive BIGINT string; optional `limit` 1–50, default 10 | `200` company-owned stored prediction array including `source_classification` and model FD002 subset; pre-classification rows return `LEGACY_UNCLASSIFIED`; standard success/error envelopes | Verifies company ownership via `engines`/`aircraft`; reads `rul_predictions`, `sensor_uploads`, and `ml_model_versions` with company-scoped filtering | `rul-analysis/services/rulApi.js:getRulHistory`, shared `buyerApi.js` | VERIFIED FROM SOURCE; APIDoc documented; NOT TESTED AT RUNTIME |
| POST | `/api/v1/rul/predictions/:predictionId/recommendations` | `rul.controller.generateRecommendations` | Buyer cookie session + BUYER role + trusted mutation | Path `predictionId` positive BIGINT string; no request body | `200 {success:true,data:{prediction_id,recommendation_status,already_saved,recommendations}}`; idempotently returns saved snapshots; `NO_MATCH` when no eligible listings | Locks successful company-owned prediction; joins its engine's exact `engine_model_id` through `sensor_uploads`, `engines`, `aircraft`; selects exact compatibility rows and active ENGINE products/listings, approved suppliers and positive stock; transactional `replacement_recommendations` inserts and prediction status/config update | `rul-analysis/services/rulApi.js:generateReplacementRecommendations`; called after successful prediction | VERIFIED FROM SOURCE; APIDoc documented; NOT TESTED AT RUNTIME |
| GET | `/api/v1/rul/predictions/:predictionId/recommendations` | `rul.controller.getRecommendations` | Buyer cookie session + BUYER role | Path `predictionId` positive BIGINT string; no query/body | `200 {success:true,data:{prediction_id,recommendation_status,already_saved,recommendations}}`; reads persisted listing snapshots only | Verifies prediction company ownership and success; reads `rul_predictions` and saved `replacement_recommendations`; no writes and no inference | `rul-analysis/services/rulApi.js:getReplacementRecommendations`; history action | VERIFIED FROM SOURCE; APIDoc documented; NOT TESTED AT RUNTIME |

## Checkout and Supplier fulfillment relationship

The database schema declares unique `orders.order_number`, unique
`(orders.placed_by, orders.checkout_key)`, unique `(seller_orders.order_id,
seller_orders.supplier_id)`, and unique `payments.order_id`. The checkout
repository serializes a user's checkout against the cart row and wraps order,
seller-order, item, stock, payment, and cart changes in one transaction. Retry
of the same key returns the existing order before stock is changed again.

An `orders` row is the Buyer-visible parent. Checkout groups cart items by
Supplier and creates a `seller_orders` child for each. `order_items` point to
the seller order and store product/listing snapshots. The existing Supplier
Orders routes query `seller_orders` using the authenticated `req.supplierId`,
so the Buyer checkout creates records for the existing Supplier workflow
rather than a parallel order model.

## Authentication and response conventions

- Session identity is reloaded and verified by the existing Authentication
  middleware from the HttpOnly cookie. No Buyer endpoint accepts Bearer tokens
  or trusts client identity headers/body/query fields.
- GETs are read-only. Mutations are guarded by
  `requireTrustedMutation`; the shared frontend `buyerApi.js` sends
  `credentials: "include"` and `X-AeroRUL-Request: 1` for writes.
- Successful endpoints use `{success:true,data:...}`. Orders and engine list
  endpoints retain their consumer-required `meta` counts/pagination alongside
  `data`.
- Errors use `{success:false,error:{code,message}}`; auth failures use 401,
  wrong role/CSRF failures use 403, validation failures use 400, missing
  company-owned records use 404, and stale stock/state conflicts use 409.
- Payment is limited by both application validation and the schema constraint
  to `SIMULATION`; the workflow does not transfer funds. The RUL routes send
  compatible telemetry through the internal FastAPI service to the FD002-trained
  model. The Replace & Buy recommendation MVP selects only listings backed by
  exact engine-model compatibility records; it does not certify aircraft
  installation suitability. Trade-in and valuation workflows remain deferred.

## Verification classification

- **VERIFIED FROM SOURCE:** route/mount/controller/service/client/schema flow
  and ownership predicates were inspected.
- **FIXED:** checkout IDs now reject JSON numeric values rather than coercing
  them to strings; idempotent retries use HTTP 200 while new orders use 201;
  Buyer APIDoc permission/error/request/response annotations were synchronized
  with runtime behavior.
- **VERIFIED FROM SOURCE:** the two additional RUL endpoints use the existing
  Buyer session, ownership checks, private upload storage, and existing
  `sensor_uploads`/`rul_predictions` schema. Their model metadata seed remains
  an operator action and has not been executed.
- **NOT TESTED AT RUNTIME:** PostgreSQL behavior, actual cookie/CSRF requests,
  concurrent checkout, idempotent retry, stock races, and Buyer-to-Supplier
  browser workflow, RUL model registration, Python dependencies, upload
  persistence, inference, and RUL idempotent retries. Syntax/build/APIDoc
  generation are static tooling checks, not endpoint integration tests.
