# AeroRUL — Authentication Design v1

**Scope:** Academic B2B marketplace; React/Vite + Express/CommonJS + PostgreSQL. This is a project design, not a verbatim implementation mandated by the lecturer's videos. The lecturer's four recorded clips establish: create/register account, one-way password handling, optional verification examples, public/protected client workflows, POST login with credentials in body, lookup and password check, return limited user info, and middleware validation. Exact API response format, token lifetime, algorithm, and cookie storage were not prescribed by the clips.

## 1. Decisions

- Login identifier: `email` (the existing `users.email` is UNIQUE; no `username` column exists).
- Password: Argon2id with `argon2.hash` / `argon2.verify`, using `async/await`. Do not store plaintext passwords or manually re-hash/compare encoded strings.
- Session: short-lived JWT in an `HttpOnly` cookie; `SameSite=Lax`; `Secure` in HTTPS production. The `HttpOnly` flag prevents frontend JavaScript from directly reading the cookie value (it does not completely prevent other forms of XSS exploitation). Initially no refresh token. Simplified JWT payload contains only user ID (`sub`) with a 1-hour expiration; user status, role, and company mapping are re-checked from PostgreSQL on protected requests (`auth_version` column remains in the database schema for migration compatibility but is not tracked by the simplified session service; logout clears the browser cookie).
- CSRF: validate an explicit allowed `Origin` on state-changing authenticated requests; use exact allowed development/production origins, not `*`. Reassess deployment topology/cookie attributes before going cross-site. Keep Vite `/api` proxy in development.
- Public product endpoints stay accessible to anonymous visitors. Supplier and other private endpoints must validate identity and authorization server-side; React route guards are UX only.
- In this academic MVP, new registration creates an active user without email ownership verification. No SMTP provider or verification email is required for login. The `account_tokens` table and `email_verified_at` column remain in the database schema for historical migration compatibility, but are unused by active session logic. Password reset endpoints from early design sketches are not implemented.
- Frontend Login and Register screens are integrated; the academic MVP deliberately omits email verification forms.

## 2. Database mapping

| Table | Existing relationship | Authentication use |
| --- | --- | --- |
| `companies` | `company_id` PK | Company created during buyer/supplier registration |
| `users` | `user_id` PK, `company_id` FK, `email` UNIQUE, `password_hash`, `role`, `is_active` | Primary identity; add `email_verified_at` and `auth_version` |
| `suppliers` | `supplier_id` PK, unique `company_id` FK, `status` | Map authenticated supplier user to supplier company; approval separate from email verification |
| `account_tokens` | NEW: FK `user_id`; `purpose`, `token_hash`, expiry, consumption | Email verification and password reset |

Registering a **new** Supplier: within ONE database transaction, insert a `companies` row (`company_type='SUPPLIER'`), insert a `users` row (`role='SUPPLIER'` and Argon2id `password_hash`), and insert a `suppliers` row with status `PENDING`. Never let a public request claim an existing company or choose the `ADMIN` role. Buyer registration similarly creates its company/user transaction, without a Supplier row. In this MVP, active registered users can log in immediately; Supplier private operations additionally require status `APPROVED`.

Existing baseline: 47 companies, 40 suppliers, **0 users**. These 40 supplier profiles are demo business records, NOT login accounts. Never assign a registering stranger to one of them by accepting a client-provided `company_id`/`supplier_id`. To test an existing Supplier, use an explicit administrator-controlled account-creation/linking process after authorization is available.

## 3. Implemented MVP request paths and contracts

| Method | Path | Purpose | Access |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Register buyer/supplier company and first user | Public, validated/rate-limited |
| POST | `/api/v1/auth/login` | Email/password; set HttpOnly JWT cookie, return limited user | Public, rate-limited |
| GET | `/api/v1/auth/me` | Identify current session from cookie, return limited user | Authenticated |
| POST | `/api/v1/auth/logout` | Clear HttpOnly session cookie from browser | Authenticated + CSRF protection |

*Note: Historical design sketches included email verification and password reset endpoints. In this academic MVP, email ownership verification and password reset are not implemented.*

Response envelope: `{ "success": true, "data": ... }` on success, `{ "success": false, "error": {"code": "...", "message": "..."} }` on failure. Never return `password_hash`, raw token secrets, or an entire DB user row.

## 4. Supplier ownership and demo exit

1. The browser sends the cookie on `/api/v1/supplier/...` requests.
2. Express validates JWT and queries `users` by the signed user ID (`sub`); requires active status.
3. Role must be `SUPPLIER`; derive `company_id` from the server-fetched user record.
4. Query `suppliers` where `suppliers.company_id = users.company_id`. Require approved Supplier for protected management operations.
5. Set `req.supplierId` **on the server**, using the verified supplier row. Supplier service SQL already scopes by that ID.
6. After integration tests pass, use `VITE_SUPPLIER_DEMO_MODE=false`. Never disable the fail-closed middleware to bypass auth.

Frontend distinguishes `401` (not authenticated → Login) from `403` (authenticated but no permission / supplier not approved).

## 5. Implementation Status

- **Implemented (MVP):** Registration transaction (Buyer/Supplier) + Argon2id hashing; Login with HttpOnly 1-hour JWT cookie; `/me` session check; Logout cookie clear; Supplier PENDING status check; Admin approval; CSRF custom header (`X-AeroRUL-Request: 1`) + Origin verification; React Register/Login and role-protected routing.
- **Historical / Unused:** Email verification (`account_tokens` table, `email_verified_at` column), Nodemailer/SMTP, and password recovery. These are documented as historical designs and are not part of the active academic MVP runtime.
