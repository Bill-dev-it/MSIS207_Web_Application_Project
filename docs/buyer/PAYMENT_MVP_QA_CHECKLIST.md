# AeroRUL — B2B Payment MVP QA Checklist

This checklist documents manual integration and runtime verification cases for the AeroRUL B2B Payment MVP (`SIMULATION` and `BANK_TRANSFER`).

> [!IMPORTANT]
> - **Demonstration Boundary**: `SIMULATION` is a development-only immediate-success payment method. `BANK_TRANSFER` is a manual reconciliation demonstration where an authorized `ADMIN` confirms or cancels a pending payment record.
> - **No Real Financial Processing**: AeroRUL does **not** collect cardholder data, integrate live card acquiring or banking rails, transfer funds, or claim PCI DSS compliance.
> - **Migration Prerequisite**: Apply [`database/migrations/04_b2b_payment_mvp.sql`](../../database/migrations/04_b2b_payment_mvp.sql) to the target PostgreSQL database before running these test cases.

---

## 1. Checkout Payment Methods

- [ ] **1.1 `SIMULATION` Checkout (`POST /api/v1/checkout/orders`)**
  - Select **Simulated Payment** (`SIMULATION`) in Buyer Checkout (`/checkout/payment` → `/checkout/review`) and place the order.
  - Verify HTTP `201 Created`.
  - Verify `payments` row has `payment_method = 'SIMULATION'`, `status = 'SUCCEEDED'`, `paid_at IS NOT NULL`, and `amount = orders.grand_total`.
  - Verify `seller_listings.stock_quantity` is decremented by ordered quantities and the Buyer's cart is cleared.
- [ ] **1.2 `BANK_TRANSFER` Checkout (`POST /api/v1/checkout/orders`)**
  - Select **Bank Transfer (Demo)** (`BANK_TRANSFER`) in Buyer Checkout, refresh `/checkout/payment` and navigate to `/checkout/review` to confirm `BANK_TRANSFER` remains selected in `sessionStorage`.
  - Place the order and verify HTTP `201 Created`.
  - Verify `payments` row has `payment_method = 'BANK_TRANSFER'`, `status = 'PENDING'`, `paid_at IS NULL`, and `amount = orders.grand_total`.
  - Verify `seller_listings.stock_quantity` is reserved (decremented) and the Buyer's cart is cleared.
- [ ] **1.3 Unsupported Payment Method Rejection**
  - Send `POST /api/v1/checkout/orders` with `payment_method: "CARD"` or `null`.
  - Verify HTTP `400 Bad Request` with `error.code = "UNSUPPORTED_PAYMENT_METHOD"` and no order or payment rows created.

---

## 2. Checkout Retry & Idempotency

- [ ] **2.1 Same `checkout_key` Replay**
  - Replay `POST /api/v1/checkout/orders` as the same authenticated Buyer with an already-used `checkout_key`.
  - Verify HTTP `200 OK` returning the existing `order_id`, `order_number`, `payment_method`, `payment_status`, and `paid_at`.
  - Verify no second `orders` row, no second `payments` row, and no second stock decrement occur.

---

## 3. ADMIN Payment Confirmation & Cancellation

- [ ] **3.1 Confirm Pending Bank Transfer (`POST /api/v1/admin/payments/:orderId/confirm`)**
  - Authenticate as an `ADMIN` user (with `X-AeroRUL-Request: 1` and valid origin) and call `POST /api/v1/admin/payments/:orderId/confirm` for a `BANK_TRANSFER` / `PENDING` order.
  - Verify HTTP `200 OK` with `data.status = "SUCCEEDED"`, `data.paid_at != null`, `data.transfer_reference = order_number`, and `data.already_confirmed = false`.
  - Verify listing stock does not change on confirmation (stock was already reserved at checkout).
- [ ] **3.2 Idempotent Repeat Confirmation**
  - Repeat `POST /api/v1/admin/payments/:orderId/confirm` on the same `SUCCEEDED` `BANK_TRANSFER` order.
  - Verify HTTP `200 OK` with `data.status = "SUCCEEDED"`, `data.already_confirmed = true`, and unchanged `paid_at`.
- [ ] **3.3 Cancel Pending Bank Transfer (`POST /api/v1/admin/payments/:orderId/cancel`)**
  - Place a new `BANK_TRANSFER` order (`PENDING`), note `seller_listings.stock_quantity`, and call `POST /api/v1/admin/payments/:orderId/cancel` as `ADMIN`.
  - Verify HTTP `200 OK` with `data.status = "CANCELLED"`, `data.paid_at = null`, `data.already_cancelled = false`, and `data.stock_restored = true`.
  - Verify `seller_listings.stock_quantity` is restored by the exact reserved quantity for every `order_items` row in the same transaction.
- [ ] **3.4 Idempotent Repeat Cancellation (Single Stock Restoration Guarantee)**
  - Repeat `POST /api/v1/admin/payments/:orderId/cancel` on the already `CANCELLED` order.
  - Verify HTTP `200 OK` with `data.status = "CANCELLED"`, `data.already_cancelled = true`, `data.stock_restored = false`, and confirm `seller_listings.stock_quantity` is **not** incremented a second time.
- [ ] **3.5 Invalid Transition Guards**
  - Attempt to cancel a `SUCCEEDED` payment (`SIMULATION` or confirmed `BANK_TRANSFER`): verify HTTP `409 Conflict` (`INVALID_PAYMENT_METHOD` or `PAYMENT_ALREADY_SUCCEEDED`).
  - Attempt to confirm an already `CANCELLED` `BANK_TRANSFER` payment: verify HTTP `409 Conflict` (`PAYMENT_ALREADY_CANCELLED`).

---

## 4. Concurrent ADMIN Payment Actions

- [ ] **4.1 Competing Confirm and Cancel Requests**
  - Issue concurrent `confirm` and `cancel` requests for the same `PENDING` `BANK_TRANSFER` order.
  - Verify row-level serialization (`SELECT ... FOR UPDATE OF p` in [`payments.repository.js`](../../backend/src/services/admin/payments.repository.js)): exactly one transition succeeds first, and the competing transition receives `409 Conflict` (`PAYMENT_ALREADY_SUCCEEDED` or `PAYMENT_ALREADY_CANCELLED`).

---

## 5. Supplier Fulfillment Gating

- [ ] **5.1 Supplier Read Access on Pending/Cancelled Payment**
  - With `VITE_SUPPLIER_DEMO_MODE=false`, sign in as the assigned `SUPPLIER` and view `/supplier/orders` and `/supplier/orders/:sellerOrderId` for a `BANK_TRANSFER` order in `PENDING` or `CANCELLED` state.
  - Verify the Supplier can view the order and items, sees `Order: CONFIRMED` separately from the payment badge (`Awaiting payment confirmation` or `Payment cancelled`), and the **Mark as PROCESSING** button is disabled.
- [ ] **5.2 Backend Enforcement Blocking Unpaid Fulfillment (`PATCH /api/v1/supplier/orders/:sellerOrderId/status`)**
  - Send `PATCH /api/v1/supplier/orders/:sellerOrderId/status` with `{ "status": "PROCESSING" }` while payment is `PENDING` or `CANCELLED`.
  - Verify HTTP `409 Conflict` with `PAYMENT_PENDING` (when `PENDING`) or `PAYMENT_CANCELLED` (when `CANCELLED`), and confirm `seller_orders.status` remains `CONFIRMED`.
- [ ] **5.3 Fulfillment Progression After ADMIN Confirmation**
  - Confirm the `BANK_TRANSFER` payment as `ADMIN`, reload the Supplier order detail page, and verify payment status shows `Payment Confirmed (Demo)` and **Mark as PROCESSING** is enabled.
  - Advance `CONFIRMED → PROCESSING → SHIPPED → DELIVERED` and verify each step succeeds (`200 OK`).

---

## 6. Buyer & Supplier UI Status Consistency

- [ ] **6.1 Buyer Views (`/orders/:orderId/confirmation`, `/orders/:orderId`, `/orders`)**
  - Verify Order Status (`Confirmed`, `Processing`, `In Transit`, `Delivered`) and Payment Status (`Awaiting Payment Confirmation`, `Simulated Payment Successful`, `Payment Confirmed (Demo)`, `Payment Cancelled`) render as separate badges across all three Buyer screens.
  - Verify `BANK_TRANSFER` orders display `order_number` as the demonstration transfer reference, USD amount, and `"Demo only — do not transfer real money."`
- [ ] **6.2 Supplier Demo Mode Separation**
  - When `VITE_SUPPLIER_DEMO_MODE=true`, verify sample orders from `frontend/src/mocks/supplierOrders.js` display `"Payment not recorded"` rather than a fabricated paid status.

---

## 7. Authentication, Authorization & CSRF Protection

- [ ] **7.1 Unauthenticated Access (`401 AUTH_REQUIRED`)**
  - Call `POST /api/v1/admin/payments/:orderId/confirm` or `/cancel` without a session cookie; verify HTTP `401`.
- [ ] **7.2 Non-Admin Role Rejection (`403 ADMIN_REQUIRED`)**
  - Call `POST /api/v1/admin/payments/:orderId/confirm` or `/cancel` using a `BUYER` or `SUPPLIER` session cookie; verify HTTP `403` with `error.code = "ADMIN_REQUIRED"`.
- [ ] **7.3 Trusted Mutation / CSRF Header Check (`403 UNTRUSTED_REQUEST` / `UNTRUSTED_ORIGIN`)**
  - Call `POST /api/v1/checkout/orders` or `POST /api/v1/admin/payments/:orderId/confirm` without `X-AeroRUL-Request: 1`; verify HTTP `403`.

