# AeroRUL Authentication — setup and dependencies

This folder documents the Authentication implementation. **Lecturer context:** register, one-way password hashing, email verification, POST login with credentials in the request body, client public/protected pages, and server-side validation. Exact API paths, JWT settings, CSRF headers and cookie choice below are **AeroRUL design decisions**, not statements from the lecturer.

## Package installation (backend only)

Open a terminal in `backend/` and run `npm ci` on a fresh checkout. This installs dependency versions locked by `backend/package-lock.json`. No separate frontend Authentication npm package is required for this batch.

| npm package | Why AeroRUL uses it |
| --- | --- |
| `express` | REST API routes and middleware |
| `pg` | PostgreSQL query pool and transactions |
| `argon2` | Secure Argon2id password hashing during Register and verification during Login |
| `express-rate-limit` | Limits repeated registration and login attempts |
| `jsonwebtoken` **(Batch 4)** | Signs and verifies JWT access tokens (HS256, 1 hour) |
| `cookie-parser` **(Batch 4)** | Reads JWT from an HttpOnly browser cookie |
| `dotenv` | Loads locally managed backend environment settings |
| `apidoc` (devDependency) | Generates API reference pages with `npm run doc` |
| `nodemon` (devDependency) | Restart backend when source changes during local development |

For an existing Batch 3 working tree, install only the two Batch 4 packages with `npm install jsonwebtoken cookie-parser` **inside `backend/`**. Do not edit `package-lock.json` by hand or use `npm audit fix --force`.

## Required environment variable *names* (values remain private)

Only the user edits `backend/.env`. **Never commit credentials, tokens or `.env` files.**

```dotenv
# Existing PostgreSQL settings (values already configured locally):
DB_HOST=...
DB_PORT=...
DB_NAME=...
DB_USER=...
DB_PASSWORD=...

# Required for Batch 4 signing (random, secret, at least 32 bytes):
AUTH_JWT_SECRET=...

# Web origin and environment settings (PUBLIC_WEB_URL is mandatory for CSRF & apiDoc):
PUBLIC_WEB_URL=http://localhost:5173
NODE_ENV=development
```

`AUTH_JWT_SECRET` must be a securely generated value, not a hardcoded example. Keep the same secret while deployed JWT sessions should remain valid; changing it invalidates existing JWTs. `NODE_ENV=production` makes the JWT cookie `Secure` (HTTPS required). Production traffic must use HTTPS and same-site frontend/API deployment (or a deliberate updated cookie/CORS design). Local Vite `/api` proxy to `localhost:3000` keeps API calls on the frontend origin.

The backend requires `SELECT` on `users` and `suppliers` to authenticate and resolve session roles. The legacy `auth_version` column remains in PostgreSQL schema for compatibility, but the simplified session service does not execute database updates during logout. A DBA/user checks privileges manually in **pgAdmin**; Copilot never connects to or modifies PostgreSQL. Registration and email verification require permissions described in previous batches.

## Authentication HTTP endpoints

The backend mounts `backend/src/routes/auth/index.js` under `/api/v1/auth`.

| Method | URL | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Create Buyer or Supplier (no verification email) |
| POST | `/api/v1/auth/login` | Verify email/password, set HttpOnly JWT cookie |
| GET | `/api/v1/auth/me` | Read current user using JWT cookie |
| POST | `/api/v1/auth/logout` | Clear HttpOnly session cookie |

Login request body is `{ "email": "user@example.test", "password": "..." }`. The backend looks up `users.email` (schema does **not** contain `username`) and checks `password_hash` with Argon2id. Login returns limited user data **without a JWT in JSON**; the browser stores the cookie automatically. `GET /me` checks signature, expiration and current database account state. Active users can log in immediately; in this academic MVP, email ownership is not verified, and `email_verified_at` is not required. Supplier routes additionally require `role=SUPPLIER` and an `APPROVED` supplier profile connected by `company_id`. No `supplier_id` from request input is trusted.

On login/logout and all Supplier state-changing requests, send `X-AeroRUL-Request: 1`. With an `Origin` header, it must exactly match `PUBLIC_WEB_URL`. This custom-header + origin checking is a **CSRF mitigation** for cookie-authenticated JSON APIs; do not use wildcard credentialed CORS. Example (for a later React API client):

```js
fetch("/api/v1/auth/login", {
  method: "POST", credentials: "include",
  headers: { "Content-Type": "application/json", "X-AeroRUL-Request": "1" },
  body: JSON.stringify({ email, password })
});
```

The custom header is not a secret or a bearer token. JWT is held in a host-only HttpOnly, SameSite=Lax cookie with a one-hour expiry. The `HttpOnly` flag prevents client-side JavaScript (`document.cookie`) from directly reading the cookie value. In this simplified JWT implementation, logout clears the cookie from the browser; any copied token expires naturally after its 1-hour lifetime. No refresh token exists in this phase. Supplier demo remains enabled by default and needs later frontend integration to use the live API.

## Source layout

The React Login, Register and Verify Email screens, session context and protected routes use the frontend's existing dependencies. For frontend setup and implementation details, see [the Frontend Authentication Guide](./FRONTEND_GUIDE.md). On a fresh checkout, install the existing frontend dependencies with `cd frontend && npm ci`; no additional Authentication npm package is required.

```text
backend/src/
  routes/auth/index.js                      # Register, login, me, logout
  controllers/auth/register.controller.js
  controllers/auth/session.controller.js     # Login, /me, logout responses
  services/auth/register.service.js
  services/auth/register.validation.js
  services/auth/session.service.js          # Argon2 verification, JWT, DB checks
  middleware/require-auth.js                # Validate cookie + JWT and load user
  middleware/require-trusted-mutation.js    # CSRF header and origin check
  middleware/require-supplier.js            # Resolve owned approved Supplier
```

## Verification and scope boundaries

Static tests do not touch PostgreSQL. After installing dependencies, run `node --check`, `node --test tests/auth-*.test.cjs`, `npm run doc`, and `git diff --check`. Sample requests for state-changing endpoints remain documented with `@apiHeader {String} X-AeroRUL-Request=1`.

**Implemented:** The MVP provides React Login and Register screens, Auth Context, and role-protected routes. Registration creates an active account without an email verification step. Users log in with their email and password; suppliers remain in PENDING status until approved by an administrator.

**Still pending:** Real PostgreSQL integration testing, browser end-to-end testing, and production deployment. There is no email provider, no email verification, and no automated password reset. Supplier demo mode remains enabled by default. Never call a live POST endpoint or run database SQL from Copilot without explicit user approval. Historical verification columns in PostgreSQL are retained for schema compatibility but are not used by the MVP.
