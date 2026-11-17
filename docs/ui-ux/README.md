# UI/UX

This directory documents user interface and experience design rules for **AeroRUL**.

- [**Public & Supplier Frontend Rules**](./PUBLIC_SUPPLIER_FRONTEND_RULES.md) — design rules, data integrity, and responsive breakpoints for Public Marketplace and Supplier screens.
- See also: [Frontend Authentication Guide](../auth/FRONTEND_GUIDE.md) and [Frontend README](../../frontend/README.md).

## Current Implementation Status

**Implemented & Deployed:** The React 18 + Vite 5 + Tailwind CSS interface is live on **Vercel** at `https://www.aerotradehub.top`, covering Public Marketplace, Auth (`/login`, `/register` without email verification), Buyer (Dashboard, Engines, RUL Analysis & Replace & Buy Recommendations, Cart, Checkout with `SIMULATION` / `BANK_TRANSFER`, Orders), Supplier (Dashboard, Listings, Inventory, Fulfillment), and Admin (Dashboard, Supplier Approval, Bank Transfer Reconciliation, RUL Service Health).

## Related architecture diagrams

The user experience and frontend structure map to the following synchronized architecture views:

- [00 — Master System Architecture](<../architecture/diagrams/Final system-design-00 Master System Architecture.drawio.png>) — overall user journeys and platform boundaries.
- [01 — Business & User Workflows](<../architecture/diagrams/Final system-design-01 Business & User Workflows.drawio.png>) — role-based business flows and buyer actions.
- [02 — Frontend Architecture](<../architecture/diagrams/Final system-design-02 Frontend Architecture.drawio.png>) — React screens, router guard, and frontend service boundaries.
- [07 — End-to-End Integration](<../architecture/diagrams/Final system-design-07 End-to-End Integration.drawio.png>) — how the frontend participates in the end-to-end purchase flow.

See also: [Architecture overview](../architecture/README.md).
