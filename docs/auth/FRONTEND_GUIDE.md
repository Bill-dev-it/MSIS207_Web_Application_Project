# AeroRUL Authentication — React frontend (Batch 5)

## What this adds

Uses the existing React 18 + React Router v6 + Vite + Tailwind stack. **No additional frontend Authentication npm package is required.** On a fresh checkout: `cd frontend && npm ci`; run `npm run dev` for local UI and `npm run build` to verify production compilation. The backend is a separate package in `backend/`; install its dependencies there with `npm ci` and see `docs/auth/README.md` for Argon2, Nodemailer, JWT and cookie-parser explanations.

## Pages and roles

- `/login` — email + password. Success uses `data.user.role` and navigates to the appropriate existing workspace, respecting a safe same-role route originally requested.
- `/register` — Buyer/Supplier company form; creates no ADMIN account and never sends a user/company/supplier ID. Requires SMTP configured on backend; registration alone does not log in.
- `/verify-email?token=...` — captures and removes the token from the URL, then POSTs it **only after explicit confirmation** to avoid duplicate StrictMode/prefetch requests. A successful verification directs users to log in.
- `ResendVerificationForm` — receives a generic result; it must never show whether an arbitrary email belongs to an account.
- All `/buyer/*`, `/supplier/*`, `/admin/*` routes must be protected at the React Router level; the backend remains the actual security enforcement point.
- Supplier workspace routes additionally GET `/api/v1/supplier/overview` (read-only) to confirm supplier approval, **even when Supplier demo mode is on**. The guard must not render demo Supplier pages for PENDING or rejected suppliers.

## Session and API client

`AuthProvider` calls `GET /api/v1/auth/me` on load. On 401 it marks the visitor signed out; 503/network errors show a retry state instead of falsely declaring a logout. The JWT remains in a server-set HttpOnly cookie, never in localStorage/sessionStorage or the JSON login body/response. Auth HTTP calls use the existing `VITE_API_BASE_URL` (default `/api`), `credentials: 'include'`, and write requests send `X-AeroRUL-Request: 1` for backend CSRF mitigation. Keep `frontend/vite.config.js` `/api` proxy and `PUBLIC_WEB_URL` aligned with the actual frontend browser origin.

## Integration points (copy new files; merge modifications carefully)

1. `frontend/src/app/App.jsx`: place `<AuthProvider>` **inside the existing** `<BrowserRouter>` around `<AppRouter />`; do not mount a second router.
2. `frontend/src/app/router.jsx`: add three auth routes within the existing `<PublicLayout />` group; wrap **all** Buyer routes, **all** Supplier routes and **all** Admin routes with `<ProtectedRoute roles={[...]} />`, using `requireSupplierApproval` for Supplier. Buyer/Admin child pages outside their layouts must not be forgotten. Keep all existing page paths, components and ordering.
3. `PublicLayout.jsx`, `BuyerLayout.jsx`, `SupplierLayout.jsx`, `AdminLayout.jsx`: mount a small `<AccountActions />` in each existing header without replacing the other navigation. Do not remove team-owned Buyer/Admin code.
4. `frontend/src/components/common/RoleNavigation.jsx`: retain the Public link, but only show workspace links that match the authenticated user role; do not display links to unrelated Buyer/Supplier/Admin areas. This is navigation UX, not security.
5. `frontend/src/features/supplier/api.js`: add `X-AeroRUL-Request: 1` only for writes; preserve `SUPPLIER_DEMO_MODE` and `credentials: 'include'`. In current demo mode, Supplier data services must remain unchanged.
6. Do **not** edit `frontend/vite.config.js` unless the existing proxy is demonstrably wrong. Do not edit backend source, `.env`, database files, or other routes.
7. Add a short link from `docs/auth/README.md` to this frontend guide, and optionally from root README to `docs/auth/README.md`; never overwrite existing setup documentation.

## Verification

Run `node --test tests/auth-pure.test.mjs` and `npm run build` from `frontend/`. Inspect route matches for Buyer, Supplier and Admin deep links; check 375px, keyboard focus and screen reader labels. Verify no token storage use (`localStorage`, `sessionStorage`). Confirm the `getSupplierApproval` check is not skipped when demo mode is true. These are not substitutes for live PostgreSQL/SMTP/end-to-end browser tests, which require user authorization and credentials configured manually.

### Security and deployment notes

The email verification link has a one-time token. Its origin should have HTTPS in production, and the hosting page should avoid exposing query-string secrets to third-party resources (set appropriate Referrer-Policy). JWT `AUTH_JWT_SECRET` and SMTP credentials belong only in backend secret configuration. Do not commit `.env`. The backend currently lacks Forgot/Reset Password, and approved Supplier live-data integration remains a later batch.
