# AeroRUL — AI-Enhanced B2B Aviation Engine & Parts Marketplace

- **Production Website:** `https://www.aerotradehub.top`
- **Production API Reference (apiDoc):** `https://www.aerotradehub.top/docs/`
- **Repository:** `Bill-dev-it/MSIS207_Web_Application_Project`

AeroRUL is an academic B2B aviation parts and engine marketplace connecting Airlines/MRO Buyers with approved Suppliers, integrated with an educational Remaining Useful Life (RUL) analysis workflow powered by a Condition-Aware iTransformer model (NASA C-MAPSS FD002) and a **Replace & Buy** replacement-engine recommendation MVP.

---

## Verified Production Architecture

| Layer | Technology | Provider |
|---|---|---|
| **Domain Registrar** | `aerotradehub.top` (HTTP 308 apex $\to$ `www`) | **iNET** |
| **Authoritative DNS** | Cloudflare Free (**DNS Only**, proxy disabled) | **Cloudflare** |
| **Frontend & Edge Routing** | React 18, Vite 5, Tailwind CSS, React Router 6 (`/api/*` & `/docs/*` rewrites) | **Vercel** |
| **Application Backend** | Node.js / Express 5 modular monolith REST API | **Render Web Service** |
| **Operational Database** | Managed PostgreSQL (OLTP, TLS) | **Neon** |
| **AI Inference Service** | Python 3.11 / FastAPI / TensorFlow (`rul-service/Dockerfile`) | **Google Cloud Run** |
| **Source Control & CI** | GitHub + GitHub Actions offline CI gates | **GitHub** |

Production deployment and end-to-end acceptance testing—covering Authentication, RUL prediction & Replace & Buy recommendations, Cart, Checkout (`SIMULATION` and `BANK_TRANSFER`), and Admin workflows—passed owner verification on **November 16, 2026**.

---

## Repository Modules & Documentation

- [**System Documentation Hub**](./docs/README.md) — Central documentation index
- [**Architecture Overview**](./docs/architecture/README.md) — Service boundaries, flows, and synchronized draw.io / SVG system diagrams
- [**Cloud Deployment Runbook**](./docs/devops/deployment/README.md) — Vercel, Render, Neon, Google Cloud Run, Cloudflare/iNET configuration, and recovery steps
- [**REST API Design**](./docs/api/README.md) — Complete Express `/api/v1` contract and security conventions
- [**Frontend (`frontend/`)**](./frontend/README.md) — React 18 SPA and Vercel proxy rules
- [**Backend (`backend/`)**](./backend/README.md) — Express 5 layered architecture and PostgreSQL repositories
- [**Database (`database/`)**](./database/README.md) — DDL schemas, migrations, Gold seed loader, and validation scripts
- [**RUL Service (`rul-service/`)**](./rul-service/README.md) — FastAPI container, frozen FD002 Condition-Aware iTransformer weights, and scaler artifacts
