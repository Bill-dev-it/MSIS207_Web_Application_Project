# AeroRUL Frontend

The frontend is a single-page React 18 application built with Vite, React Router 6, and Tailwind CSS. It provides role-based workspaces for Public Marketplace visitors, Buyers, Suppliers, and Administrators.

## Setup & Local Development

```bash
cd frontend
npm ci
npm run dev
```

Vite serves the development app at `http://localhost:5173`. In development, Vite's proxy (`vite.config.js`) forwards all `/api` requests to the local Express backend at `http://localhost:3000`.

To create and preview a production build:
```bash
npm run build
npm run preview
```

## Architecture & Directory Structure

```text
src/
├── app/          # App root, router configuration (router.jsx), layout routing
├── auth/         # Authentication context (AuthContext.jsx), role guards (ProtectedRoute.jsx)
├── components/   # Shared UI components, role navigation, headers, public marketplace components
├── features/     # Feature-specific modules (buyer cart/checkout/engines, supplier listings/inventory, admin)
├── layouts/      # Role-specific chrome (PublicLayout, BuyerLayout, SupplierLayout, AdminLayout)
├── mocks/        # Local demonstration fixtures and offline fallback adapters
├── screens/      # Page-level components grouped by role (public, buyer, supplier, admin)
├── services/     # Centralized API service clients (authApi, buyerApi, supplierService, adminService)
├── styles/       # Global styles and Tailwind CSS entry point
└── main.jsx      # React DOM entry point
```

## Implemented Authentication & Security

- **Session Management:** The frontend authenticates using an HttpOnly, SameSite=Lax session cookie issued by the backend upon login (`/api/v1/auth/login`). React state tracks only non-sensitive account metadata (`user_id`, `company_id`, `full_name`, `email`, `role`).
- **Auth Lifecycle (`AuthContext.jsx`):**
  - On mount, calls `/api/v1/auth/me` with `credentials: "include"` to restore the session.
  - `login()` signs in and transitions status to `authenticated`.
  - `logout()` calls `/api/v1/auth/logout` which clears the browser cookie, immediately setting the client status to `anonymous`.
  - Any previously copied JWT expires naturally after its 1-hour TTL.
- **CSRF Protection:** All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) automatically include the custom `X-AeroRUL-Request: 1` header.
- **Role-Based Access Control:** `ProtectedRoute.jsx` checks the user's role against allowed roles (`BUYER`, `SUPPLIER`, `ADMIN`) and redirects unauthenticated or unauthorized visitors.

## Workspaces & Routes

| Path | Layout | Access | Purpose |
|---|---|---|---|
| `/` | `PublicLayout` | Public | Marketplace catalog, product detail, and supplier offers |
| `/login`, `/register` | `PublicLayout` | Public | Account creation and authentication (email verification omitted in MVP) |
| `/buyer/*` | `BuyerLayout` | Role: `BUYER` | Engine management, RUL prediction, replacement recommendations, cart, and checkout |
| `/supplier/*` | `SupplierLayout` | Role: `SUPPLIER` | Store overview, listings management, inventory stock, and order fulfillment |
| `/admin/*` | `AdminLayout` | Role: `ADMIN` | Dashboard metrics, supplier approval, payment confirmation/cancellation, RUL health |

### Supplier Modes
The Supplier workspace supports two operating modes controlled by `VITE_SUPPLIER_DEMO_MODE`:
- `VITE_SUPPLIER_DEMO_MODE=false` (Production / Staging): Interacts directly with the live `/api/v1/supplier/*` backend endpoints.
- `VITE_SUPPLIER_DEMO_MODE=true` (Default fallback for local demos): Uses local mock fixtures for offline demonstrations.

## Production Deployment (Vercel)

Live production origin: `https://www.aerotradehub.top` (apex `aerotradehub.top` redirects via HTTP 308 to `www`; Cloudflare Free operates in **DNS Only** mode with Vercel terminating TLS; `VITE_SUPPLIER_DEMO_MODE=false`).

Production routing is configured via [`vercel.json`](./vercel.json):
- `/docs` redirects (HTTP 307, `permanent: false`) to `/docs/`.
- `/api/:path*`, `/docs/`, and `/docs/:path*` rewrite same-origin to the Render Express backend (`https://aerorul-backend.onrender.com/...`).
- All remaining client-side SPA navigation routes fall back to `/index.html`.
