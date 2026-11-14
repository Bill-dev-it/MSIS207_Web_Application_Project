# AeroRUL Cloud Deployment Architecture & Runbook

## 1. Architecture Overview

AeroRUL is structured for cloud deployment using standard serverless and platform-as-a-service providers:
- **Frontend:** React 18 Single-Page Application (SPA) deployed on **Vercel**.
- **Backend API:** Node.js / Express 5 REST API deployed as a Web Service on **Render**.
- **Database:** PostgreSQL relational database hosted on **Render PostgreSQL** (or Supabase/Neon).
- **RUL AI Service:** Python 3.11 / FastAPI / TensorFlow inference service deployed as a **Render Private Service**.

```text
[ Browser / Client ]
       │
       ▼ (HTTPS)
[ Vercel: React 18 SPA ] ──────────┐
       │ (Rewrites /api/* & /docs)  │
       ▼ (HTTPS)                   │
[ Render: Express REST API ]       │
   ├── (PostgreSQL Wire Protocol) ─┼──► [ Render PostgreSQL ]
   │                               │
   └── (Internal HTTP, Private DNS)│
       │                           │
       ▼                           │
[ Render Private Service: FastAPI ] ┘
```

---

## 2. PostgreSQL Database Setup & Fresh Initialization

### Connection Configuration Split
- **Express Backend (`backend/src/config/db.js`):** Uses discrete parameters (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`). On Render, find these in your PostgreSQL dashboard under **Connections → Connection Details**.
- **Migration & Seeding Scripts:** Use `DATABASE_URL` for `psql` and `database/seed/load_gold.py`. On Render, find this under **Connections → Internal Database URL** (or External for local runs).

### Fresh Database Initialization Sequence
Execute in order using `psql -d $DATABASE_URL` (or the Render Database Console):

1. **Baseline DDL Schema:**
   ```bash
   psql $DATABASE_URL -f database/schema/01_schema.sql
   ```
   *Creates baseline 26 relational tables, domains, constraints, and audit triggers.*

2. **Authentication Extensions:**
   ```bash
   psql $DATABASE_URL -f database/authentication/01_authentication_setup.sql
   ```
   *Adds `email_verified_at`, `auth_version`, and the `account_tokens` table (retained for historical schema compatibility; unused by active MVP runtime).*

3. **B2B Payment MVP Constraints & Migration:**
   ```bash
   psql $DATABASE_URL -f database/migrations/04_b2b_payment_mvp.sql
   ```
   *Enforces payment method constraint matrix (`SIMULATION`, `BANK_TRANSFER`) and transaction safety.*

4. **Gold Dataset Seeding (Catalog & Demo Users):**
   ```bash
   python database/seed/load_gold.py
   ```
   *Transactionally loads the 10 Gold CSVs (`data/etl/gold/`) into PostgreSQL.*

5. **RUL Model Metadata Seed:**
   ```bash
   psql $DATABASE_URL -f database/seed/03_ml_model_version_seed.sql
   ```
   *Registers the active frozen FD002 Condition-Aware iTransformer model record in `ml_model_versions` (required by Buyer RUL prediction service).*

6. **Schema Validation & Integrity Verification:**
   ```bash
   psql $DATABASE_URL -f database/validation/03_validation.sql
   psql $DATABASE_URL -f database/authentication/02_authentication_validation.sql
   ```
   *Read-only check confirming all 27 tables, constraints, foreign keys, and indexes are healthy.*

---

## 3. Render Private Service — FastAPI RUL Inference

The RUL AI engine runs as a **Render Private Service**, which has no public IP or public HTTP URL, protecting it from direct internet access.

- **Service Type:** `Private Service`
- **Root Directory:** `rul-service`
- **Environment:** `Python 3.11`
- **Build Command:**
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command:**
  ```bash
  uvicorn api:app --host 0.0.0.0 --port 8000
  ```
  *(Module: `rul-service/api.py`, ASGI object: `app`)*
- **Environment Variables:**
  | Variable | Required Value / Description |
  |---|---|
  | `RUL_SERVICE_TOKEN` | Shared secret token (min 32 characters, ASCII `\x21-\x7e`). Must match backend. |
  | `TF_ENABLE_ONEDNN_OPTS` | `0` (Prevents oneDNN floating-point rounding warnings on Linux CPU) |
  | `PORT` | `8000` |

*Private Hostname:* Render assigns a private service hostname (e.g. `aerorul-fastapi` or `aerorul-fastapi.internal`). Express connects via `http://<private-service-name>:8000`.

---

## 4. Render Web Service — Express Backend

The REST API coordinates business data, orders, payments, authentication, and internal RUL prediction calls.

- **Service Type:** `Web Service`
- **Root Directory:** `backend`
- **Environment:** `Node` (Node.js 18 or 22)
- **Build Command:**
  ```bash
  npm ci --include=dev && npm run build
  ```
  *(`--include=dev` ensures `apidoc` is installed even when `NODE_ENV=production`; `npm run build` runs `npm run doc` via `apidoc.config.js`).*
- **Start Command:**
  ```bash
  npm start
  ```
- **Environment Variables:**
  | Variable | Description / Source |
  |---|---|
  | `NODE_ENV` | `production` |
  | `PORT` | `3000` (or leave unset to let Render bind `$PORT`) |
  | `DB_HOST` | Database hostname from Render PostgreSQL Connection Details |
  | `DB_PORT` | `5432` |
  | `DB_NAME` | Database name from Render PostgreSQL Connection Details |
  | `DB_USER` | Database user from Render PostgreSQL Connection Details |
  | `DB_PASSWORD` | Database password from Render PostgreSQL Connection Details |
  | `AUTH_JWT_SECRET` | 32-byte hex secret (`openssl rand -hex 32`) for HS256 JWT signing |
  | `PUBLIC_WEB_URL` | Frontend origin: `https://<your-app>.vercel.app` (mandatory for CSRF origin validation and apiDoc) |
  | `RUL_SERVICE_URL` | Private RUL URL: `http://<private-service-name>:8000` |
  | `RUL_SERVICE_TOKEN` | Same 32+ character secret token configured on the FastAPI service |
  | `RUL_STORAGE_DIR` | Optional. Persistent disk mount point (e.g. `/var/data/storage/rul`). If omitted, uses local `backend/storage/rul`. |

### Email Delivery Note
> [!NOTE]
> In this academic MVP, mandatory email ownership verification is deliberately removed to avoid third-party email provider dependencies. Registration creates active accounts immediately, and users log in directly with their credentials. No SMTP environment variables (`SMTP_*`) or mail services are required.

### Storage Persistence Note
> [!NOTE]
> On Render free web services, the local filesystem is ephemeral across service restarts and redeployments. Uploaded raw CSV files in `storage/rul/` will be reset upon redeploy. Relational prediction records and metrics in PostgreSQL remain persistent. For permanent file persistence on Render, attach a paid Persistent Disk and set `RUL_STORAGE_DIR=/var/data/storage/rul`.

---

## 5. Vercel — React Frontend

The React frontend compiles to static assets and is hosted on Vercel with serverless rewrites.

- **Framework Preset:** `Vite`
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`
- **Environment Variables:**
  | Variable | Value | Description |
  |---|---|---|
  | `VITE_SUPPLIER_DEMO_MODE` | `false` | Enables live API communication for Supplier workflows |

### Frontend Rewrites (`frontend/vercel.json`)
Before deploying to Vercel, replace `YOUR_BACKEND_RENDER_SERVICE.onrender.com` in `frontend/vercel.json` with your real Render Express backend hostname:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR_BACKEND_RENDER_SERVICE.onrender.com/api/:path*"
    },
    {
      "source": "/docs/:path*",
      "destination": "https://YOUR_BACKEND_RENDER_SERVICE.onrender.com/docs/:path*"
    },
    {
      "source": "/docs",
      "destination": "https://YOUR_BACKEND_RENDER_SERVICE.onrender.com/docs"
    },
    {
      "source": "/((?!api/|docs).*)",
      "destination": "/index.html"
    }
  ]
}
```

> [!IMPORTANT]
> `YOUR_BACKEND_RENDER_SERVICE.onrender.com` is a **placeholder**. It MUST be replaced with the provisioned Render backend URL once deployed. Rewrites are not currently live until both services are deployed and connected.

---

## 6. Verification Status Matrix

| Component / Flow | Verification Status | Notes / Limitations |
|---|:---:|---|
| **Backend Unit Tests** | **PASS** | Automated tests pass locally with `node:test`. |
| **Frontend Unit Tests** | **PASS** | 3/3 tests pass locally with `node:test`. |
| **Frontend Production Build** | **PASS** | Vite compiles `dist/` cleanly with 0 errors. |
| **apiDoc Generation** | **PASS** | 57/57 endpoints generated and verified; dynamic `PUBLIC_WEB_URL` support verified. |
| **Python Offline Inference** | **PASS** | Full CPU model load and inference verified locally (`7/7` tests pass in `rul-service`). |
| **Git & Whitespace Hygiene** | **PASS** | `git diff --check` passes with exit code `0`. |
| **Cloud Deployment** | **NOT VERIFIED** | Cloud resources (Vercel project, Render services, Render PostgreSQL) have not been provisioned yet. |
| **Live Browser Login E2E** | **NOT VERIFIED** | Requires live browser interaction and deployed authentication cookies. |
| **Express → FastAPI HTTP Integration** | **NOT VERIFIED** | Requires both Express and FastAPI running simultaneously in cloud network. |
| **Email Delivery** | **OMITTED** | Academic MVP deliberately removes email verification; no SMTP or email provider required. |
| **Persistent Disk Storage** | **NOT VERIFIED** | Requires attaching a paid Render Persistent Disk. |
