# Documentation

Project documentation is organized by system area. The verified production system is deployed at `https://www.aerotradehub.top` (interactive API reference at `https://www.aerotradehub.top/docs/`).

- [Architecture](./architecture/README.md) — system design, verified production boundaries, and editable diagram source.
- [API](./api/README.md) — Express REST API contracts, cookie auth, checkout/payments, and RUL/recommendation routes.
- [Authentication](./auth/README.md) — Argon2id hashing, 1-hour HttpOnly JWT cookie sessions, CSRF header checks, and no-email registration MVP.
- [Buyer integration](./roles/buyer/README.md) — authenticated cart, checkout, payment MVP, orders, dashboard, engine records, and FD002 RUL analysis.
- [Supplier integration](./roles/supplier/README.md) — approved supplier portal overview, listings CRUD, inventory management, and fulfillment progression.
- [Admin integration](./roles/admin/README.md) — marketplace dashboard, supplier approval moderation, `BANK_TRANSFER` reconciliation, and RUL service health proxy.
- [Buyer RUL documentation](./rul/README.md) — canonical RUL documentation, public Express API, internal FastAPI service, model input contract, persistence, setup, scientific evaluation, and limitations.
- [Database](./database/README.md) — schema, Neon/PostgreSQL OLTP design, and Bronze/Silver/Gold seed pipeline documentation.
- [Data](./data/README.md) — reference data architecture.
- [UI/UX](./ui-ux/README.md) — interface and experience design rules.
- [DevOps](./devops/README.md) — production deployment (Vercel, Render, Neon, Google Cloud Run, Cloudflare/iNET), containerization, and CI/CD.

## Architecture diagram links

The editable architecture source is maintained under [docs/architecture](./architecture/README.md).

> [!NOTE]
> The eight draw.io pages and exported SVG diagrams below are synchronized with the verified production architecture (iNET/Cloudflare DNS Only, Vercel same-origin rewrites, Render Express monolith, Neon PostgreSQL, Google Cloud Run, cookie auth, `BANK_TRANSFER`, and implemented Replace & Buy recommendations).

- [00 — Master System Architecture](<./architecture/diagrams/System_Design_ver 1.0-00 Master System Architecture.drawio.svg>) — system boundaries and core business flows.
- [01 — Business & User Workflows](<./architecture/diagrams/System_Design_ver 1.0-01 Business & User Workflows.drawio.svg>) — buyer, supplier, admin, and AI-assisted procurement flows.
- [02 — Frontend Architecture](<./architecture/diagrams/System_Design_ver 1.0-02 Frontend Architecture.drawio.svg>) — React screens, routing, and role-based navigation.
- [03 — REST API & Backend](<./architecture/diagrams/System_Design_ver 1.0-03 REST API & Backend.drawio.svg>) — Express backend modules and API dependencies.
- [04 — PostgreSQL OLTP](<./architecture/diagrams/System_Design_ver 1.0-04 PostgreSQL OLTP (26 tables).drawio.svg>) — data domains and relational schema structure.
- [05 — AI/RUL & Recommendation](<./architecture/diagrams/System_Design_ver 1.0-05 AI-RUL & Recommendation.drawio.svg>) — inference and recommendation logic.
- [06 — Deployment & Runtime](<./architecture/diagrams/System_Design_ver 1.0-06 Deployment & Runtime.drawio.svg>) — hosting and runtime boundaries.
- [07 — End-to-End Integration](<./architecture/diagrams/System_Design_ver 1.0-07 End-to-End Integration.drawio.svg>) — cross-system request and data flow.
