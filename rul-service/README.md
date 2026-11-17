# AeroRUL RUL Service

This directory contains executable inference code, runtime dependencies, model
artifacts, samples, tests, and package integrity metadata. FastAPI is an
internal service; the browser calls the Express API, not this service.

- [RUL documentation](../docs/rul/README.md) — canonical application contract,
  architecture, data requirements, scientific evaluation, and limitations.
- [RUL setup guide](../docs/rul/setup/SETUP_GUIDE.md) — local environment and
  service-start instructions.

The web prediction path is React (Vercel) → Express (Render) → FastAPI container (Google Cloud Run in production, `127.0.0.1:8000` locally) → the frozen
FD002-trained model. Production container packaging is defined in [`Dockerfile`](./Dockerfile) and [`.dockerignore`](./.dockerignore); Express invokes the service over HTTPS with `X-RUL-Service-Token`. The standalone CLI (`inference/predict_cli.py`) is for offline use only.
