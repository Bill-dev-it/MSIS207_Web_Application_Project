# AeroRUL Admin Orders API – Test Report

## 1. Testing Environment

- **Operating System:** macOS (Darwin)
- **Node.js Runtime:** v24.18.0
- **Backend Framework:** Express.js (`http://localhost:3000`)
- **Database Environment:** PostgreSQL (`aerorul` database, real existing records: 3 orders `ORD-1003` [`order_id = "10"`], `ORD-1002` [`order_id = "2"`], `ORD-1001` [`order_id = "1"`])
- **Collection File:** `postman/AdminOrders.postman_collection.json`
- **Environment File:** `postman/AdminOrders.postman_environment.example.json`
- **Results Artifact:** `postman/results/AdminOrders-test-results.json`
- **Execution Runner:** Node.js HTTP Collection Runner against live Express + PostgreSQL (`newman` CLI is not installed in the local environment; all requests were executed directly against the running backend).

---

## 2. Actual API Base URL

```text
http://localhost:3000
```

---

## 3. Authentication Method

- **Mechanism:** HTTP-Only JWT Session Cookie (`aerorul_session`) issued by `POST /api/v1/auth/login` with CSRF header `X-AeroRUL-Request: 1`.
- **Middleware Chain:**
  1. `requireAuth` (`backend/src/middleware/require-auth.js`) — resolves `req.cookies.aerorul_session`, returns `401 AUTH_REQUIRED` if missing or invalid.
  2. `requireAdmin` (`backend/src/middleware/require-admin.js`) — verifies `user.role === "ADMIN"`, returns `403 FORBIDDEN` (`Admin role is required.`) for non-admin roles.
- **Secret Protection:** No session cookies, JWT tokens, or passwords are stored in the committed collection, environment example, or results files.

---

## 4. Tested API Endpoints

| HTTP Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/admin/orders` | List all marketplace orders across buyers with status filter, search, status counts, and pagination |
| `GET` | `/api/v1/admin/orders/:orderId` | Retrieve full observe-only details of a specific order (`orderId` as `BIGINT` string) |

---

## 5. Test Cases, Actual HTTP Status Codes & Results

| Test ID | Description | HTTP Method & Endpoint | Actual HTTP Status | Result | Notes |
|---|---|---|---|---|---|
| **TC01** | Retrieve Admin Orders List | `GET /api/v1/admin/orders` | `200 OK` | **PASS** | Returned `items` (3 orders), `counts` (`ALL: 3, CONFIRMED: 3, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0`), `pagination` (`page: 1, limit: 10, total: 3, totalPages: 1`). |
| **TC02** | Retrieve Orders with Pagination | `GET /api/v1/admin/orders?page=1&limit=2` | `200 OK` | **PASS** | Returned 2 orders (`ORD-1003`, `ORD-1002`), `pagination: { page: 1, limit: 2, total: 3, totalPages: 2 }`. |
| **TC03** | Search Orders | `GET /api/v1/admin/orders?search=ORD-1003` | `200 OK` | **PASS** | Returned 1 matching order (`ORD-1003`, `order_id: "10"`), `counts.ALL: 1`, `pagination.total: 1`. |
| **TC04** | Filter Orders by `CONFIRMED` | `GET /api/v1/admin/orders?status=CONFIRMED` | `200 OK` | **PASS** | Returned 3 orders, all with `primary_status: "CONFIRMED"`. |
| **TC05** | Filter Orders by `PROCESSING` | `GET /api/v1/admin/orders?status=PROCESSING` | `200 OK` | **PASS** | Returned `items: []`, `pagination.total: 0`. |
| **TC06** | Filter Orders by `SHIPPED` | `GET /api/v1/admin/orders?status=SHIPPED` | `200 OK` | **PASS** | Returned `items: []`, `pagination.total: 0`. |
| **TC07** | Filter Orders by `DELIVERED` | `GET /api/v1/admin/orders?status=DELIVERED` | `200 OK` | **PASS** | Returned `items: []`, `pagination.total: 0`. |
| **TC08** | Retrieve Order Detail | `GET /api/v1/admin/orders/10` | `200 OK` | **PASS** | Returned `order_id: "10"` (string), `order_number: "ORD-1003"`, buyer info, addresses, 3 `seller_orders` with `items`, and `payment`. |
| **TC09** | Retrieve Nonexistent Order Detail | `GET /api/v1/admin/orders/999999999999` | `404 Not Found` | **PASS** | Returned `success: false`, `error.code: "ORDER_NOT_FOUND"`. |
| **TC10** | Validate Invalid Order ID | `GET /api/v1/admin/orders/abc` | `400 Bad Request` | **PASS** | Returned `success: false`, `error.code: "INVALID_ORDER_ID"`. |
| **TC11** | Verify Unauthenticated Access | `GET /api/v1/admin/orders` (no cookie) | `401 Unauthorized` | **PASS** | Returned `success: false`, `error.code: "AUTH_REQUIRED"`. |
| **TC12** | Verify Non-Admin Access | `GET /api/v1/admin/orders` (Buyer role) | `N/A` | **BLOCKED** | Blocked under strict data & auth policy: plaintext password for existing Buyer (`john.doe@horizon-air.example`) is not stored in repository files, and creating/modifying user records or forging JWT tokens is prohibited. Code inspection of `requireAdmin` confirms `user.role !== "ADMIN"` returns `403 FORBIDDEN`. |
| **TC13** | Handle Empty Search Results | `GET /api/v1/admin/orders?search=NONEXISTENT-ORDER-99999` | `200 OK` | **PASS** | Returned `items: []`, `counts.ALL: 0`, `pagination.total: 0`. |
| **TC14** | Validate Invalid Pagination Parameters | `GET /api/v1/admin/orders?page=0&limit=10` | `400 Bad Request` | **PASS** | Returned `success: false`, `error.code: "INVALID_PAGE"`. |
| **TC15** | Validate Invalid Status | `GET /api/v1/admin/orders?status=INVALID` | `400 Bad Request` | **PASS** | Returned `success: false`, `error.code: "INVALID_STATUS"`. |

---

## 6. Failed Assertion Details

- **Failed Tests:** `0`
- All 14 executed test cases passed every HTTP status, envelope, schema, and `BIGINT` string precision assertion.

---

## 7. Known Limitations

1. **Newman CLI Availability:** `newman` is not installed globally or in `node_modules`; the collection requests were executed directly against the live Express server and PostgreSQL database via Node's native `fetch` runner and recorded in `postman/results/AdminOrders-test-results.json`.
2. **TC12 (Non-Admin Live Login):** The existing Buyer account in PostgreSQL (`john.doe@horizon-air.example`) stores an Argon2 password hash whose plaintext password is not present in the repository. Because modifying database records, inserting test users, or forging tokens is strictly prohibited, `TC12` is marked **BLOCKED** and verified via code inspection of `backend/src/middleware/require-admin.js` (lines 17–25).

---

## 8. Final Testing Conclusion

- **Summary:** **14 PASS / 0 FAIL / 1 BLOCKED** out of 15 test cases.
- All read-only Admin Orders endpoints (`GET /api/v1/admin/orders` and `GET /api/v1/admin/orders/:orderId`) operate accurately against real PostgreSQL data without any data mutation.
