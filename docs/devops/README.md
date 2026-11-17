# DevOps & Production Operations

This directory contains deployment, containerization, and CI/CD documentation for **AeroRUL**.

## Documentation Index

- [**Cloud Deployment Architecture & Runbook**](./deployment/README.md) — Production topology across **iNET**, **Cloudflare (DNS Only)**, **Vercel**, **Render Web Service**, **Neon PostgreSQL**, and **Google Cloud Run**, including environment variables, cold-start characteristics, verification, and recovery.
- [**Containerization Strategy**](./containerization/README.md) — RUL service Docker packaging (`rul-service/Dockerfile`) deployed to Google Cloud Run vs. planned local Docker Compose orchestration.
- [**CI/CD & Release Architecture**](./cicd/README.md) — GitHub Actions CI offline quality gates (`.github/workflows/ci.yml`), production branch workflow (`deployment`), and verification/recovery steps.

## Production Status Summary

- **Production Domain:** `https://www.aerotradehub.top` (with HTTP 308 apex redirect from `aerotradehub.top`).
- **API Documentation:** `https://www.aerotradehub.top/docs/` (served from Express apiDoc via Vercel rewrites).
- **Verification:** Production deployment and end-to-end acceptance testing (Authentication, RUL prediction & recommendations, Cart, Checkout, and Payment) were verified by the project owner on **November 16, 2026**.

## Related Architecture Diagrams

> [!NOTE]
> The PNG diagrams below are synchronized with the verified production architecture (iNET/Cloudflare DNS Only, Vercel rewrites, Render Express, Neon PostgreSQL, Google Cloud Run, cookie auth, and `BANK_TRANSFER` / Replace & Buy flows).

- [00 — Master System Architecture](<../architecture/diagrams/Final system-design-00 Master System Architecture.drawio.png>) — overall service boundaries.
- [06 — Deployment & Runtime](<../architecture/diagrams/Final system-design-06 Deployment & Runtime.drawio.png>) — hosting, runtime, and infrastructure boundaries.
- [07 — End-to-End Integration](<../architecture/diagrams/Final system-design-07 End-to-End Integration.drawio.png>) — cross-component request and data flows.
- [08 — Physical Infrastructure & Scalability](<../architecture/diagrams/Final system-design-08 Physical Infrastructure & Scalability.drawio.png>) — AS-IS deployed topology and TO-BE horizontal scaling architecture.

See also: [Architecture overview](../architecture/README.md).
