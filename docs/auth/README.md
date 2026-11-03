# AeroRUL Authentication — setup and dependencies

This folder documents the Authentication implementation. **Lecturer context:** register, one-way password hashing, email verification, POST login with credentials in the request body, client public/protected pages, and server-side validation. Exact API paths, JWT settings, CSRF headers and cookie choice below are **AeroRUL design decisions**, not statements from the lecturer.

## Package installation (backend only)

Open a terminal in `backend/` and run `npm ci` on a fresh checkout. This installs dependency versions locked by `backend/package-lock.json`. No separate frontend Authentication npm package is required for this batch.

| npm package | Why AeroRUL uses it |
| --- | --- |
| `express` | REST API routes and middleware |
| `pg` | PostgreSQL query pool and transactions |
| `argon2` | Secure Argon2id password hashing during Register and verification during Login |
| `express-rate-limit` | Limits repeated registration, email verification/resend and login attempts |
| `nodemailer` | Sends email verification links via configured SMTP |
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

# Existing Batch 3 SMTP and web origin settings:
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
PUBLIC_WEB_URL=http://localhost:5173
NODE_ENV=development
```

`AUTH_JWT_SECRET` must be a securely generated value, not a hardcoded example. Keep the same secret while deployed JWT sessions should remain valid; changing it invalidates existing JWTs. `NODE_ENV=production` makes the JWT cookie `Secure` (HTTPS required). Production traffic must use HTTPS and same-site frontend/API deployment (or a deliberate updated cookie/CORS design). Local Vite `/api` proxy to `localhost:3000` keeps API calls on the frontend origin.

The backend also requires `SELECT` on `users` and `suppliers`, and `UPDATE` on `users.auth_version` for logout. A DBA/user checks privileges manually in **pgAdmin**; Copilot never connects to or modifies PostgreSQL. Registration and email verification require permissions described in previous batches.

## Authentication HTTP endpoints

The backend mounts `backend/src/routes/auth/index.js` under `/api/v1/auth`.

| Method | URL | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Create Buyer or Supplier, send verification link |
| POST | `/api/v1/auth/verify-email` | Consume an email verification token |
| POST | `/api/v1/auth/resend-verification` | Request another verification email |
| POST | `/api/v1/auth/login` | Verify email/password, set HttpOnly JWT cookie |
| GET | `/api/v1/auth/me` | Read current user using JWT cookie |
| POST | `/api/v1/auth/logout` | Invalidate existing JWTs, clear cookie |

Login request body is `{ "email": "user@example.test", "password": "..." }`. The backend looks up `users.email` (schema does **not** contain `username`) and checks `password_hash` with Argon2id. Login returns limited user data **without a JWT in JSON**; the browser stores the cookie automatically. `GET /me` checks signature, expiration and current database account state. Only email-verified active users can log in. Supplier routes additionally require `role=SUPPLIER` and an `APPROVED` supplier profile connected by `company_id`. No `supplier_id` from request input is trusted.

On login/logout and all Supplier state-changing requests, send `X-AeroRUL-Request: 1`. With an `Origin` header, it must exactly match `PUBLIC_WEB_URL`. This custom-header + origin checking is a **CSRF mitigation** for cookie-authenticated JSON APIs; do not use wildcard credentialed CORS. Example (for a later React API client):

```js
fetch("/api/v1/auth/login", {
  method: "POST", credentials: "include",
  headers: { "Content-Type": "application/json", "X-AeroRUL-Request": "1" },
  body: JSON.stringify({ email, password })
});
```

The custom header is not a secret or a bearer token. JWT is held in a host-only HttpOnly, SameSite=Lax cookie with a one-hour expiry. Logout increments `users.auth_version` to invalidate outstanding tokens and then clears the cookie. This intentionally invalidates sessions on other devices too; no refresh token exists in this phase. Supplier demo remains enabled by default and needs later frontend integration to use the live API.

## Source layout

The React Login, Register and Verify Email screens, session context and protected routes use the frontend's existing dependencies. For frontend setup and implementation details, see [the Frontend Authentication Guide](./FRONTEND_GUIDE.md). On a fresh checkout, install the existing frontend dependencies with `cd frontend && npm ci`; no additional Authentication npm package is required.

```text
backend/src/
  routes/auth/index.js                      # Register, verify, resend, login, me, logout
  controllers/auth/register.controller.js
  controllers/auth/verify-email.controller.js
  controllers/auth/session.controller.js     # Login, /me, logout responses
  services/auth/register.service.js
  services/auth/register.validation.js
  services/auth/verification-token.service.js
  services/auth/verification-mail.service.js
  services/auth/session.service.js          # Argon2 verification, JWT, DB checks
  middleware/require-auth.js                # Validate cookie + JWT and load user
  middleware/require-trusted-mutation.js    # CSRF header and origin check
  middleware/require-supplier.js            # Resolve owned approved Supplier
```

## Verification and scope boundaries

Static tests do not touch PostgreSQL or send email. After installing dependencies, run `node --check`, `node --test tests/auth-*.test.cjs`, `npm run doc`, `npm audit --omit=dev`, and `git diff --check`. After Batch 4, APIDoc should contain **25 endpoints across 8 groups** (22 prior + 3). POST/PATCH/DELETE sample requests stay disabled. Existing tests from previous batches must still pass.

**Implemented:** Authentication Batch 5 added the React Login, Register and Verify Email screens, Auth Context, and role-protected routes. Its frontend unit tests passed (3/3), and the Vite production build passed.

**Still pending:** Real PostgreSQL and SMTP integration testing, browser end-to-end testing, and Forgot/Reset Password. Supplier demo mode remains enabled by default. Never call a live POST endpoint or run database SQL from Copilot without explicit user approval. The SQL setup lives under `database/authentication/`; it is already applied to the user's local `aircraft_marketplace`, and must not be rerun there.
