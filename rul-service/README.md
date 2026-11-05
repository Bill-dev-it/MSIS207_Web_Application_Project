# AeroRUL RUL Service

This directory contains executable inference code, runtime dependencies, model
artifacts, samples, tests, and package integrity metadata. FastAPI is an
internal service; the browser calls the Express API, not this service.

- [RUL documentation](../docs/rul/README.md) — canonical application contract,
  architecture, data requirements, scientific evaluation, and limitations.
- [RUL setup guide](../docs/rul/SETUP_GUIDE.md) — local environment and
  service-start instructions.

The web prediction path is React → Express → internal FastAPI → the frozen
FD002-trained model. The standalone CLI is for offline use only.
