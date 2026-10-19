# AeroRUL Frontend

The frontend is a React application built with Vite, React Router, and
Tailwind CSS. The current scaffold provides basic entry pages and navigation
for public, buyer, supplier, and admin routes.

## Setup

```bash
npm ci
npm run dev
```

Vite serves the app at `http://localhost:5173`. Use `npm run build` to create a
production build and `npm run preview` to preview that build locally.

## Structure

```text
src/
├── app/          # App composition and route definitions
├── auth/         # Authentication and route protection
├── components/   # Reusable UI components
├── layouts/      # Shared role-specific page layouts
├── mocks/        # Demo fixtures and adapters
├── screens/      # Pages grouped by visitor role
├── services/     # API clients and domain requests
├── state/        # Shared application state
├── styles/       # Global styles and Tailwind entry point
├── utils/        # Shared formatting and utility functions
└── main.jsx      # React application entry point
```

Keep new screens in the matching `screens/<role>/` directory, reusable
presentation components in `components/`, and role-level chrome in `layouts/`.
Put API calls in `services/`, shared state in `state/`, and common formatting
in `utils/`. Keep role-specific logic within that role's existing area rather
than duplicating shared code.

## Routes

| Path | Layout | Purpose |
|---|---|---|
| `/` | PublicLayout | Public AeroRUL landing page |
| `/buyer` | BuyerLayout | Buyer workspace home |
| `/supplier` | SupplierLayout | Supplier workspace home |
| `/admin` | AdminLayout | Admin workspace home |

The navigation bar links between all four routes. Unknown paths redirect to
the public home page. These routes are scaffold navigation only; authentication
and authorization are not implemented yet.

## Team conventions

- Use one React component per screen or layout file, with a clear default export.
- Use React Router `Link`/`NavLink` for in-app navigation; avoid hard-coded
  browser navigation.
- Keep shared UI reusable and role-specific screens focused on their own
  workflows.
- Keep API and business logic out of screen presentation where practical.
- Do not commit secrets, `node_modules`, or generated `dist` output.
- Keep `tailwind.config.js` content paths aligned with files under `src/`.
