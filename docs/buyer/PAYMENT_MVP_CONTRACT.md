# AeroRUL — Simple B2B Payment MVP (implementation contract)

Status: **Implemented in source on `week-3` (Stage 1 DB migration + Express backend, Stage 2 React UI, Stage 3 static audit); live PostgreSQL migration and runtime QA remain pending**.

## Scope

Two methods only:
- `SIMULATION`: development-only test payment method that records `SUCCEEDED` and a `paid_at` timestamp immediately at checkout. No funds transfer.
- `BANK_TRANSFER`: manual reconciliation demonstration that records `PENDING` with `paid_at = NULL` at checkout. Manual reconciliation is demonstrated by an authorized `ADMIN`, not a live banking confirmation.

The payment reference is the existing unique `orders.order_number`; do not add a separate payment reference column for this MVP. The current order currency is `USD`; do not introduce conversion or multi-currency.

AeroRUL does **not** collect cardholder data, integrate live card acquiring or banking gateways, process webhooks, transfer real funds, issue refunds, split payouts, run automated expiry, provide credit terms, or claim PCI DSS compliance.

## Payment lifecycle and ownership

- Buyer places an order using existing `POST /api/v1/checkout/orders`, specifying `payment_method` as `SIMULATION` or `BANK_TRANSFER`.
- A single checkout transaction creates `orders`, `seller_orders`, `order_items`, and `payments`, reserves stock by decrementing `seller_listings.stock_quantity`, and clears the cart. Preserve `checkout_key` idempotency.
- Existing `payments.order_id UNIQUE` ensures one payment record per order. Method and payment status are explicit; `amount` equals order `grand_total`.
- `BANK_TRANSFER/PENDING` is not proof of payment. A Buyer must never confirm their own payment or directly set status.
- ADMIN-only `POST /api/v1/admin/payments/:orderId/confirm`: `PENDING` to `SUCCEEDED`, sets `paid_at`. Repeated confirmation of a succeeded payment is idempotent; cancelled transfers cannot be confirmed. Only a demo/manual reconciliation action.
- ADMIN-only `POST /api/v1/admin/payments/:orderId/cancel`: `PENDING` to `CANCELLED`, returns reserved stock exactly once, leaves an audit-visible cancelled record. Repeated cancellation returns the already-cancelled state and does not alter inventory. Never cancel `SUCCEEDED` payments via this MVP endpoint.
- Supplier `CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED` is permitted only when linked payment `status = 'SUCCEEDED'`. Suppliers can still read pending orders but cannot fulfill them.
- Keep `seller_orders.status = 'CONFIRMED'` for an order with pending/cancelled payment, but display payment status prominently; cancellation is represented through the payment status, not by inventing an order state.
- The ADMIN confirmation and cancellation transactions must serialize via `SELECT ... FOR UPDATE` on the payment row. Inventory restoration must occur in the *same transaction* as a valid cancellation; check affected rows and avoid integer overflow. All payment write endpoints enforce trusted-mutation/CSRF rules and JWT ADMIN role.
- Existing successful simulation orders remain valid (backwards compatibility).

## REST contracts

All responses follow `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code": "...", "message": "..." } }`.

- `POST /api/v1/checkout/orders`: preserve existing route, checkout idempotency and existing response shape; allow either method; return order plus payment summary if additive changes are made.
- `GET /api/v1/orders/:orderId`: Buyer company-scoped existing order detail; expose payment method, status, amount, `paid_at`, and transfer reference via order number.
- `POST /api/v1/admin/payments/:orderId/confirm`: authenticated ADMIN, CSRF-protected, idempotent after succeeded.
- `POST /api/v1/admin/payments/:orderId/cancel`: authenticated ADMIN, CSRF-protected, idempotent after cancelled.

Do not add a separate public webhook endpoint or pretend the backend communicates with a bank. Do not create a full Admin Dashboard: authorized Postman calls are sufficient for the two demo actions.

## Frontend

- Payment screen: two clear radio options; no card fields; describe each method as demo-only.
- Review screen: preserve selected method instead of hardcoding `SIMULATION`.
- Order confirmation and detail: `PENDING` != paid, show the unique order number as bank-transfer reference, amount in USD, and a prominent **Do not transfer real money in this demo** note.
- Supplier order list/details: show payment status; disable/block processing when payment is not `SUCCEEDED`, with server-side enforcement authoritative.
- Never expose ADMIN actions to Buyer or Supplier accounts.

## Data and deployment

- SQL migration lives at `database/migrations/04_b2b_payment_mvp.sql`.
- Keep SQL out of `docs/`.
- Since the existing runtime checkout inserts payments without `paid_at`, apply this migration **only after code changes are prepared and deployment is coordinated**; the new backend must insert explicit `payment_method`, `status` and `paid_at` values.
- Never run this migration in the static integration stage; inspect the live DB schema and run under an approved, backed-up test environment during QA.
- Do not claim PCI DSS certification, bank settlement or verified transfers. No cardholder data may be collected.

## Acceptance (during final combined QA, not during implementation)

1. Legacy `SIMULATION` order succeeds with `paid_at` and one payment row.
2. `BANK_TRANSFER` order produces `PENDING` with `paid_at = NULL` and reserves stock.
3. Supplier cannot move PENDING or CANCELLED orders to PROCESSING.
4. Authorized ADMIN confirms PENDING once; then Supplier transition is allowed.
5. Authorized ADMIN cancels PENDING once; stock returns exactly once.
6. Buyer/Supplier cannot call ADMIN operations. Errors are consistent JSON.
7. Checkout retry does not create duplicate order/payment or reserve stock again.
8. Existing Buyer Cart, Orders, RUL, Recommendations, Auth and Supplier features still work.

For the detailed test scenarios covering checkout, idempotency, ADMIN confirmation/cancellation, concurrency, stock restoration, Supplier fulfillment gating, and authorization checks, see [PAYMENT_MVP_QA_CHECKLIST.md](./PAYMENT_MVP_QA_CHECKLIST.md).

