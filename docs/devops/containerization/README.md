# Containerization Strategy

AeroRUL applies Docker containerization selectively to isolate the **Python 3.11 / TensorFlow** RUL inference runtime on **Google Cloud Run**, while the **React SPA (Vercel)**, **Express 5 API (Render)**, and **Neon PostgreSQL** run on managed non-containerized/platform runtimes.

## 1. Containerization Architecture Overview

![Containerization Architecture](./Containerization_Architecture_%20AeroRUL_Cloud.png)

*Interactive cross-system diagram: [06 — Deployment & Runtime](<../../architecture/diagrams/Final system-design-06 Deployment & Runtime.drawio.png>).*

1. **RUL Container Build & Deployment Pipeline:** Only `rul-service/` is packaged as a container: Source code (FastAPI + frozen model artifacts) $\to$ `Dockerfile` build recipe (`python:3.11-slim-bookworm`) $\to$ **Google Cloud Build** $\to$ **Artifact Registry** (versioned image) $\to$ **Google Cloud Run** (pulls image and scales on demand). *A `Dockerfile` defines an image build recipe, not a running container.*
2. **Local Development:** Developers run React/Vite (`localhost:5173`) and Node/Express (`localhost:3000`) natively; Docker Desktop is **optional** and needed only if building/running the `rul-service` container locally (no `docker-compose.yml` exists in this repository).
3. **Production Request Path:** Browser $\to$ **Vercel** (SPA + `/api/*` rewrite) $\to$ **Render** (Express 5 API) $\to$ **Google Cloud Run** (RUL container) & **Neon PostgreSQL** (persisted OLTP data).
4. **Critical Design Rules:**
   - **Only RUL is Dockerized** by repository config; Vercel and Render manage frontend/backend builds natively.
   - **Model Bundled in Image:** `checkpoints/best_model.weights.h5` and `preprocessing/scaler_artifacts.json` are copied and verified inside the image at build time (no runtime S3/GCS download).
   - **Controlled Inference Access:** Express calls Cloud Run over HTTPS with `X-RUL-Service-Token`; FastAPI disables Swagger/OpenAPI routes (`docs_url=None`, `redoc_url=None`, `openapi_url=None`) and validates tokens with `hmac.compare_digest`.
   - **No DB Inside Container:** Cloud Run is stateless; relational state lives strictly in Neon PostgreSQL (managed via Express).

---

## 2. Runtime & Environment Mapping

| Component | Technology | Local Development | Production (Verified) |
|---|---|---|---|
| **Frontend** | React 18 / Vite 5 | `npm run dev` (`localhost:5173`) | **Vercel** static CDN (`https://www.aerotradehub.top`) |
| **Backend API** | Node.js / Express 5 | `npm run dev` (`localhost:3000`) | **Render Web Service** (`https://aerorul-backend.onrender.com`) |
| **RUL Inference** | Python 3.11 / FastAPI / TF | `uvicorn api:app` (`127.0.0.1:8000`) or Docker | **Google Cloud Run** container (`rul-service/Dockerfile`) |
| **Database** | PostgreSQL | Local PostgreSQL | **Neon** managed PostgreSQL (`PGSSLMODE=require`) |
| **Edge / DNS** | Cloudflare / Vercel | Vite `/api` proxy | **iNET** + **Cloudflare Free (DNS Only)** + **Vercel** TLS |

---

## 3. RUL Docker Packaging (`rul-service/Dockerfile`)

- **Base & Env:** [`rul-service/Dockerfile`](../../../rul-service/Dockerfile) uses `python:3.11-slim-bookworm` with `PYTHONDONTWRITEBYTECODE=1`, `PYTHONUNBUFFERED=1`, and `TF_CPP_MIN_LOG_LEVEL=2`.
- **Context Filtering:** [`rul-service/.dockerignore`](../../../rul-service/.dockerignore) excludes `.venv*`, `venv/`, `__pycache__/`, `*.pyc`, `.pytest_cache/`, `.env*`, and `.git/`.
- **Build Verification:** Installs `requirements.txt`, copies `rul-service/`, and fails build unless both `checkpoints/best_model.weights.h5` and `preprocessing/scaler_artifacts.json` are non-empty (`test -s`).
- **Container Entrypoint:** Exposes `8080` and runs:
  ```sh
  exec uvicorn api:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1
  ```
  Cloud Run scales instances to zero when idle and loads `RULInferenceEngine` once at container startup via FastAPI `lifespan`.

---

## 4. Service Boundaries, Persistence & Configuration

```text
Browser (https://www.aerotradehub.top)
  └─► Vercel Same-Origin Rewrites (/api/*, /docs/*)
        └─► Render Web Service (Express 5 Modular Monolith)
              ├──► Neon PostgreSQL (TLS wire protocol via PGSSLMODE=require)
              └──► Google Cloud Run Container (HTTPS + X-RUL-Service-Token)
```

- **State & Storage Boundaries:**
  - **Neon PostgreSQL:** Stores all relational tables (26 core + `account_tokens` compatibility table).
  - **Immutable Container Image:** Bundles FD002 weights + scaler inside Cloud Run.
  - **Ephemeral CSV Filesystem:** Raw uploaded CSVs write privately to `backend/storage/rul/` (`RUL_STORAGE_DIR`), which resets on Render Free restarts/redeploys (no S3/GCS bucket or Render Persistent Disk provisioned).
- **Container/Runtime Env Names (configured privately on providers):**
  - **Cloud Run (`rul-service`):** `RUL_SERVICE_TOKEN`, `PORT` (`8080` default).
  - **Render (`backend`):** `NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PGSSLMODE`, `AUTH_JWT_SECRET`, `PUBLIC_WEB_URL`, `RUL_SERVICE_URL`, `RUL_SERVICE_TOKEN`, `RUL_STORAGE_DIR` (optional).
- **Related Runbook:** [`docs/devops/deployment/README.md`](../deployment/README.md).
