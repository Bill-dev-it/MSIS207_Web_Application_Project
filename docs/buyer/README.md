# Buyer Integration

The Buyer workspace is integrated with the existing React 18, Express and PostgreSQL architecture. Buyer APIs use the authenticated HttpOnly JWT cookie; the browser does not send user or company IDs as identity.

## Features

- **Cart:** displays active supplier offers, adds selected listings, and updates or removes quantities. The API checks listing status, supplier approval and available stock.
- **Checkout:** loads addresses owned by the authenticated Buyer company, supports adding a saved address with a two-letter ISO country code, and uses the server's delivery estimates.
- **Orders:** creates an order from the authenticated user's cart, lists company orders, and shows company-scoped order details and confirmation.
- **Dashboard:** shows company engine/order counts, user-owned wishlist count, and any stored critical prediction.
- **My Engines:** lists company-owned engines, stored successful RUL predictions and sensor-upload metadata.
- **RUL Analysis:** accepts compatible sensor CSV classified by the user as an FD002 sample, custom synthetic telemetry, or externally sourced mapped telemetry; sends inference to the internal FastAPI service using the frozen FD002-trained Condition-Aware iTransformer; and stores successful predictions and private upload metadata.

## Source organization

The Buyer implementation follows the application's existing layers:

```text
backend/src/
  routes/buyer/          # Buyer Express routers
  controllers/buyer/      # HTTP request/response handlers
  services/buyer/         # Business logic and colocated *.repository.js files
  middleware/require-buyer.js

frontend/src/
  screens/buyer/          # Routed Buyer screens
  features/buyer/         # Reusable Buyer components, hooks and API adapters
  layouts/BuyerLayout.jsx # Shared Buyer navigation and page frame
  services/buyerApi.js    # Cookie/CSRF-aware Buyer HTTP client
  auth/AuthContext.jsx    # Shared application authentication context
```

`frontend/src/app/router.jsx` mounts the Buyer screens under the single
`BuyerLayout` and the existing authenticated `BUYER` route guard. Cart state is
provided by the reusable Buyer cart feature; screen modules do not render a
second portal header, sidebar, or authentication context.

## API routes

All routes below are under `/api/v1` and require a signed-in `BUYER` role.
Route definitions are in `backend/src/routes/buyer/`, controllers in
`backend/src/controllers/buyer/`, and business logic plus SQL repositories in
`backend/src/services/buyer/`.

| Method | Route | Purpose |
|---|---|---|
| GET | `/cart` | Get the authenticated user's cart |
| POST | `/cart/items` | Add a supplier listing (`listing_id`, `quantity`) |
| PUT | `/cart/items/:cartItemId` | Change an owned cart item's quantity |
| DELETE | `/cart/items/:cartItemId` | Remove an owned cart item |
| DELETE | `/cart` | Clear the authenticated user's cart |
| GET | `/checkout/addresses` | List the authenticated company's saved addresses |
| POST | `/checkout/addresses` | Save an address to that company |
| GET | `/checkout/delivery-methods` | Get demonstration-only delivery estimates |
| GET | `/checkout/company` | Get the authenticated Buyer company |
| POST | `/checkout/orders` | Place an order from the authenticated user's cart |
| GET | `/orders` | Search/filter company orders |
| GET | `/orders/:orderId` | Get company-scoped order detail |
| GET | `/orders/:orderId/confirmation` | Get company-scoped order confirmation |
| GET | `/dashboard/summary` | Get company and user-specific summary data |
| GET | `/dashboard/engine-health` | Get company engines and stored predictions |
| GET | `/dashboard/recent-orders` | Get recent company orders |
| GET | `/engines` | Search/filter company-owned engines |
| GET | `/engines/:engineId` | Get company-scoped engine detail |
| GET | `/engines/:engineId/sensor-uploads` | Get company-scoped upload metadata |
| POST | `/rul/engines/:engineId/predict` | Run and persist a prediction from compatible raw `text/csv` with required `X-RUL-Source` classification |
| GET | `/rul/engines/:engineId/history` | List stored prediction history without running inference |

State-changing requests include `X-AeroRUL-Request: 1`; the shared frontend transport sends credentials and this trusted-request header. Server-side role checks, CSRF middleware, ownership predicates, and input validation remain authoritative.

## Checkout and payment behavior

Order placement (`POST /api/v1/checkout/orders`) uses one PostgreSQL transaction to validate saved addresses, recheck active offers and supplier approval, lock/check stock, create the order and seller orders, snapshot line items, decrement listing stock, create the order's payment record, and clear the cart. A client-generated `checkout_key` is retained across retries for idempotency.

Two demonstration B2B payment methods are supported:
- `SIMULATION` (Simulated Payment): a development-only payment method that immediately records `status = 'SUCCEEDED'` and sets `paid_at` at checkout.
- `BANK_TRANSFER` (Bank Transfer (Demo)): a manual reconciliation demonstration that records `status = 'PENDING'` with `paid_at = NULL` at checkout and uses the unique `orders.order_number` as the transfer reference. Supplier fulfillment transitions (`CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED`) remain blocked until an authenticated `ADMIN` confirms the payment via `POST /api/v1/admin/payments/:orderId/confirm` (or cancels it via `POST /api/v1/admin/payments/:orderId/cancel`, which atomically restores reserved listing stock once).

AeroRUL does **not** collect cardholder data, integrate live card acquiring or banking rails, transfer real funds, or claim PCI DSS compliance. Delivery fees are demonstration estimates, not carrier quotes or guarantees; taxes are not calculated. Inventory, supplier fulfillment, shipments and tracking are shown only when corresponding backend records exist. See [PAYMENT_MVP_CONTRACT.md](./PAYMENT_MVP_CONTRACT.md) and [PAYMENT_MVP_QA_CHECKLIST.md](./PAYMENT_MVP_QA_CHECKLIST.md) for the complete payment specification and QA checklist.

## RUL workflow and manual verification limits

The Buyer RUL screen is `/buyer/rul` and is rendered inside the existing
`BuyerLayout` and Buyer route guard. The prediction endpoint accepts a maximum
1 MiB UTF-8 CSV with 19 required columns, one unit and at least 30 observations,
with no ground-truth RUL labels and raw unscaled values in compatible physical
units. `X-RUL-Source` must be `NASA_CMAPSS_FD002`, `CUSTOM_SYNTHETIC`, or
`EXTERNAL_MAPPED`. This is a user-declared provenance classification, not a
source verification. The model training subset remains FD002 regardless of
upload classification. The backend verifies company ownership from the
authenticated session, invokes the internal FastAPI service, and transactionally stores the successful
upload and prediction in the existing `sensor_uploads` and `rul_predictions`
tables. Raw files are private under `backend/storage/rul/`, which is ignored by
Git and is not served as static content.

This is a NASA C-MAPSS educational simulation, not actual aircraft telemetry
or airworthiness advice. The Replace & Buy MVP can recommend only active,
stocked ENGINE listings with explicit compatibility evidence for the engine
model; the evidence may be demo-only and is not certified installation
approval. Trade-in and valuation are not implemented. Python dependencies
and model metadata registration still require operator setup; do not execute
the provided SQL seed as part of static checks.

The repository does not run live database checks or inference as part of the
frontend build or static checks. Manually verify the Buyer session, registered
model version, private file permissions, real CPU inference, upload/prediction
transaction, idempotency replay, history ownership, and the existing Buyer
procurement workflows in the user's controlled environment.

## API documentation

Buyer route annotations are maintained beside the Express routes. Generate the local APIDoc site from the backend using `npm run doc`; generated documentation is output under `backend/docs/apidoc/`.

The source-based endpoint contract review, ownership/SQL mapping, corrections,
and items not tested against a live runtime are recorded in
[BUYER_API_CONTRACT_AUDIT.md](./BUYER_API_CONTRACT_AUDIT.md).
