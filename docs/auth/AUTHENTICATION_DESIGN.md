# AeroRUL — Authentication Design v1

**Scope:** Academic B2B marketplace; React/Vite + Express/CommonJS + PostgreSQL. This is a project design, not a verbatim implementation mandated by the lecturer's videos. The lecturer's four recorded clips establish: create/register account, one-way password handling, optional verification examples, public/protected client workflows, POST login with credentials in body, lookup and password check, return limited user info, and middleware validation. Exact API response format, token lifetime, algorithm, and cookie storage were not prescribed by the clips.

## 1. Decisions

- Login identifier: `email` (the existing `users.email` is UNIQUE; no `username` column exists).
- Password: Argon2id with `argon2.hash` / `argon2.verify`, using `async/await`. Do not store plaintext passwords or manually re-hash/compare encoded strings.
- Session: short-lived JWT in an `HttpOnly` cookie; `SameSite=Lax`; `Secure` in HTTPS production. Initially no refresh token. JWT includes user id and `auth_version`; user status, role, and company mapping are re-checked from PostgreSQL on protected requests.
- CSRF: validate an explicit allowed `Origin` on state-changing authenticated requests; use exact allowed development/production origins, not `*`. Reassess deployment topology/cookie attributes before going cross-site. Keep Vite `/api` proxy in development.
- Public product endpoints stay accessible to anonymous visitors. Supplier and other private endpoints must validate identity and authorization server-side; React route guards are UX only.
- New registration includes email verification. Password recovery uses a separate short-lived, one-time token, not the JWT. Tokens in `account_tokens` are hashes of cryptographically random secrets. Never write real tokens into logs.
- Frontend Login/Register/Verify screens are created in later batches. Batch 1 changes database only.

## 2. Database mapping

| Table | Existing relationship | Authentication use |
| --- | --- | --- |
| `companies` | `company_id` PK | Company created during buyer/supplier registration |
| `users` | `user_id` PK, `company_id` FK, `email` UNIQUE, `password_hash`, `role`, `is_active` | Primary identity; add `email_verified_at` and `auth_version` |
| `suppliers` | `supplier_id` PK, unique `company_id` FK, `status` | Map authenticated supplier user to supplier company; approval separate from email verification |
| `account_tokens` | NEW: FK `user_id`; `purpose`, `token_hash`, expiry, consumption | Email verification and password reset |

Registering a **new** Supplier: within ONE database transaction, insert a `companies` row (`company_type='SUPPLIER'`), insert a `users` row (`role='SUPPLIER'` and Argon2id `password_hash`), and insert a `suppliers` row with status `PENDING`. Never let a public request claim an existing company or choose the `ADMIN` role. Buyer registration similarly creates its company/user transaction, without a Supplier row. Later: verified email permits login; Supplier private operations additionally require status `APPROVED`.

Existing baseline: 47 companies, 40 suppliers, **0 users**. These 40 supplier profiles are demo business records, NOT login accounts. Never assign a registering stranger to one of them by accepting a client-provided `company_id`/`supplier_id`. To test an existing Supplier, use an explicit administrator-controlled account-creation/linking process after authorization is available.

## 3. Request paths and planned contracts

These paths are **AeroRUL design decisions**, not exact lecturer URLs:

| Method | Path | Purpose | Access |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Register buyer/supplier company and first user | Public, validated/rate-limited |
| POST | `/api/v1/auth/verify-email` | Consume verification token from React verification page | Public, token required |
| POST | `/api/v1/auth/resend-verification` | Resend time-limited verification message | Public, rate-limited, no account enumeration |
| POST | `/api/v1/auth/login` | Email/password; set HttpOnly JWT cookie, return limited user | Public, rate-limited |
| GET | `/api/v1/auth/me` | Identify current session from cookie, return limited user | Authenticated |
| POST | `/api/v1/auth/logout` | Clear cookie; invalidate sessions per agreed auth-version policy | Authenticated + CSRF protection |
| POST | `/api/v1/auth/forgot-password` | Issue recovery email without revealing whether email exists | Public, rate-limited |
| POST | `/api/v1/auth/reset-password` | Consume recovery token; store new hash; bump auth_version | Public, token required |

The lecturer illustrated GET links for email verification. For this project, the **email link opens a React GET page**, while a **POST API** consumes the token after confirmation; this avoids unintended consumption by mail-link scanners. Both variants can be explained in the report.

Response envelope for newly designed APIs: `{ "success": true, "data": ... }` on success, `{ "success": false, "error": {"code": "...", "message": "..."} }` on failure. Never return `password_hash`, raw token secrets, or an entire DB user row. Detailed status codes and field validation are fixed in their implementation batches, not invented as the lecturer's words.

## 4. Supplier ownership and demo exit

1. The browser sends the cookie on `/api/v1/supplier/...` requests.
2. Express validates JWT and queries `users` by the signed user ID; requires active + email verified + correct `auth_version`.
3. Role must be `SUPPLIER`; derive `company_id` from the server-fetched user record.
4. Query `suppliers` where `suppliers.company_id = users.company_id`. Require approved Supplier for protected management operations.
5. Set `req.supplierId` **on the server**, using the verified supplier row. Supplier service SQL already scopes by that ID.
6. After integration tests pass, use `VITE_SUPPLIER_DEMO_MODE=false`. Never disable the fail-closed middleware to bypass auth.

Frontend will distinguish `401` (not authenticated → Login) from `403` (authenticated but no permission / supplier not approved). Supplier demo UI can be retained for development only; hide it from protected production flows.

## 5. Delivery batches and tests

1. **Batch 1**: Additive migration and verify (this package). No account rows inserted.
2. **Batch 2**: Registration transaction + Argon2id hashing + validation + controlled tests.
3. **Batch 3**: Email verification and mail delivery, token lifecycle, resend.
4. **Batch 4**: Login / JWT cookie / `/me` / logout / server middleware.
5. **Batch 5**: React login/register pages, auth context, protected routes.
6. **Batch 6**: Supplier identity mapping and live CRUD regression; stop using mocks in the actual Supplier workspace.
7. **Batch 7**: Forgot/reset password; revocation with `auth_version`.
8. **Batch 8**: APIDoc, negative-role/ownership tests, CSRF checks, final regression.

Prefer straightforward `async/await` + `try/catch`, avoid nested callbacks and `.then()` chains in business code. All SQL parameterized. No Git commit/push/merge or branch changes unless the user explicitly requests them.
