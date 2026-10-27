# AeroRUL – Buyer & Admin Frontend/Backend Integration Changelog

This document provides a complete audit trail of all architectural defects identified and resolved in the Buyer and Admin portals of the AeroRUL platform on branch `feat/buyer-admin-integration`.

---

## 1. Summary of Defects & Applied Fixes

### Lỗi 1+2: Hardcode dữ liệu, chưa có Express API/PostgreSQL
- **Issue**: Services (`buyerService.js`, `adminService.js`) contained hundreds of lines of static mock arrays (`BUYER_ENGINES`, `BUYER_ORDERS`, `ADMIN_DASHBOARD_METRICS`, `MODERATION_QUEUE`). No real queries executed against the PostgreSQL database.
- **Fix**:
  - Implemented parameterized Express API endpoints for Buyer (`/api/buyer/engines`, `/api/buyer/orders`, `/api/buyer/cart`, `/api/buyer/recommendations`, `/api/buyer/inquiries`, `/api/buyer/search`).
  - Implemented parameterized Express API endpoints for Admin (`/api/admin/dashboard`, `/api/admin/moderation`, `/api/admin/rul-status`, `/api/admin/rul-status/check`, `/api/admin/recommendations`, `/api/admin/users`, `/api/admin/companies`, `/api/admin/suppliers`).
  - Rewrote `buyerService.js` and `adminService.js` to invoke the real backend via `apiClient.js` with `credentials: "include"` and `VITE_API_URL`.
  - Removed 100% of static mock constants.
- **Commit Hashes**:
  - `9550925`: `feat(api): buyer endpoints (engines, orders, cart, recommendations)`
  - `07931ae`: `feat(api): admin endpoints (dashboard, moderation, rul-status)`
  - `78a6e2c`: `refactor(services): replace hardcoded services with real API calls`

---

### Lỗi 3: Chưa có Role-Based Route Protection & Session Auth
- **Issue**: Any user could visit any URL without authentication or authorization. Logout was an `alert()`.
- **Fix**:
  - Built PostgreSQL-backed session store (`auth_sessions`) and password hashing via `bcryptjs`.
  - Implemented backend auth middleware (`authenticate`, `authorizeRole`) that rejects unauthenticated users (401) and incorrect roles (403).
  - Enforced strict tenant isolation: buyer queries always filter by authenticated `company_id` from the session.
  - Implemented frontend `AuthContext`, `ProtectedRoute(allowedRoles)`, 403 Forbidden screen (`Forbidden.jsx`), and 404 Not Found screen (`NotFound.jsx`).
  - Real session termination via `POST /api/auth/logout`.
- **Commit Hashes**:
  - `b9690bd`: `feat(auth): session auth middleware, role guard, login/logout/me endpoints`
  - `68afae2`: `feat(auth): auth context, ProtectedRoute, role middleware`

---

### Lỗi 4: Layout không thống nhất & Duplicated Sidebars
- **Issue**: Multiple screens (`MyEngines.jsx`, `AdminDashboard.jsx`, `AdminModeration.jsx`, `AdminRULStatus.jsx`) each independently rendered 100+ lines of duplicate sidebars, top headers, and logos. Screens were monoliths of 600+ lines.
- **Fix**:
  - Created single unified `BuyerLayout.jsx` and `AdminLayout.jsx` using nested routing with `<Outlet />`.
  - Removed all duplicated sidebars and headers from individual screen components.
  - Split large monoliths into focused modular components (< 200 lines each):
    - `EngineSparkline.jsx`, `EngineFilterBar.jsx`, `EngineDetailModal.jsx` for Buyer Engines.
    - `ModerationFilterBar.jsx`, `ModerationDetailModal.jsx` for Admin Moderation.
- **Commit Hashes**:
  - `7891093`: `refactor(layout): single BuyerLayout/AdminLayout with nested routes, central nav, and directory routes`
  - `46cb130`: `feat(ui): Buyer screens redesign with charts and real data`
  - `b293c27`: `feat(ui): Admin screens redesign with live status and command palette`

---

### Lỗi 5+6: Điều hướng sai role / Link chết / Route không tồn tại
- **Issue**: Buyer menu contained links to Admin routes (`/admin/rul-status`). Admin menu contained dead links (`/admin/users`, `/admin/companies`, `/admin/settings`). Fallback route silently redirected to `/`.
- **Fix**:
  - Centralized navigation configuration in `frontend/src/config/navigation.js`.
  - Removed all Admin links from Buyer navigation.
  - Implemented real endpoints and UI directory screens for `/admin/users`, `/admin/companies`, and `/admin/suppliers` querying Gold tables directly.
  - Added dedicated, accessible 404 page (`NotFound.jsx`) with quick return links.
  - Automated test `navigation.test.jsx` asserting zero broken internal links.
- **Commit Hashes**:
  - `7891093`: `refactor(layout): single BuyerLayout/AdminLayout with nested routes, central nav, and directory routes`
  - `13ab58e`: `test: add frontend unit, component, and route integrity tests`

---

### Lỗi 7: Thao tác giả lập & Thiếu Persistence
- **Issue**: "Approve & Publish", "Add to Cart", "Logout", and "Health Check" only modified local React state or triggered browser `alert()` and `confirm()` dialogs. Reloading the page wiped all changes.
- **Fix**:
  - Moderation approval/rejection calls `PATCH /api/admin/moderation/:id`, updates PostgreSQL listing status (`APPROVED`/`REJECTED`), logs an audit event, and applies optimistic UI update with error rollback.
  - RUL Health Check calls `POST /api/admin/rul-status/check`, measures real DB roundtrip latency, updates `service_health_checks`, and returns timestamped results.
  - Add to Cart creates real `cart_items` in DB, updates the live cart badge in `BuyerLayout`, and decrements listing inventory on checkout.
  - Replaced all `alert()`, `confirm()`, and `prompt()` calls with `ToastProvider` (`useToast()`) and modal dialogs.
- **Commit Hashes**:
  - `f9454cf`: `feat(ui): design system tokens, base components`
  - `46cb130`: `feat(ui): Buyer screens redesign with charts and real data`
  - `b293c27`: `feat(ui): Admin screens redesign with live status and command palette`

---

### Lỗi 8+9+10: Giao diện sơ sài, thiếu Test, thiếu Design System
- **Issue**: Generic colors, no dark theme, no telemetry visualization, no test suite.
- **Fix**:
  - Designed mission-control dark theme (`#070D18` background, `#091024` surface elevated, cyan `#00E5FF`, emerald `#10B981`, amber `#F59E0B`, red `#EF4444`).
  - Added Recharts visualization: sensor telemetry sparklines, fleet RUL urgency distribution, and mission control KPI charts.
  - Added `Ctrl/Cmd+K` Command Palette for quick search across engines, orders, and part catalog.
  - Configured Vitest and wrote unit, component, and route integrity test suites (14/14 tests passing).
  - Wrote backend integration tests against embedded PostgreSQL (25/25 tests passing).
- **Commit Hashes**:
  - `f9454cf`: `feat(ui): design system tokens, base components`
  - `46cb130`: `feat(ui): Buyer screens redesign with charts and real data`
  - `b293c27`: `feat(ui): Admin screens redesign with live status and command palette`
  - `13ab58e`: `test: add frontend unit, component, and route integrity tests`

---

## 2. Assumptions & Design Decisions
1. **RUL Urgency Mapping (Open Question #1)**:
   - The Gold schema stores `rul_predictions.urgency` as an enum/string (`NORMAL`, `MONITOR`, `PREPARE`, `PRIORITIZE`). The backend returns this directly without inventing synthetic cycle formulas.
2. **Session Architecture**:
   - Implemented `httpOnly` secure cookies tied to PostgreSQL `auth_sessions` table. No authentication tokens are stored in `localStorage` or `sessionStorage` (preventing XSS leakage).
3. **Gold Dataset Integrity**:
   - Runtime seed script `backend/db/seed_demo_runtime.js` is fully idempotent and references existing Gold IDs for aircraft, engines, listings, suppliers, and companies.

---

## 3. Commands to Run Tests and Seed

### Run Backend Tests (25 tests)
```bash
npm --prefix backend test
```

### Run Frontend Tests (14 tests)
```bash
npm --prefix frontend test
```

### Build Frontend
```bash
npm --prefix frontend run build
```

### Re-run Runtime Demo Seed
```bash
npm --prefix backend run seed:demo
```

---

## 4. Git Commit History on `feat/buyer-admin-integration`
```
13ab58e test: add frontend unit, component, and route integrity tests
b293c27 feat(ui): Admin screens redesign with live status and command palette
46cb130 feat(ui): Buyer screens redesign with charts and real data
f9454cf feat(ui): design system tokens, base components
78a6e2c refactor(services): replace hardcoded services with real API calls
7891093 refactor(layout): single BuyerLayout/AdminLayout with nested routes, central nav, and directory routes
68afae2 feat(auth): auth context, ProtectedRoute, role middleware
07931ae feat(api): admin endpoints (dashboard, moderation, rul-status)
9550925 feat(api): buyer endpoints (engines, orders, cart, recommendations)
b9690bd feat(auth): session auth middleware, role guard, login/logout/me endpoints
e230d40 feat(db): add runtime tables migration and demo seed aligned with gold data
258117c chore: add api client, env config, error handling
b9a7fa5 docs: add audit of buyer/admin frontend and open questions
```
