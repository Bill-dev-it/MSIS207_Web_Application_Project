# AeroRUL — Express and FastAPI Integration Guide

## Current architecture

```text
React Buyer UI
  -> Express public Buyer API (/api/v1/rul/...)
  -> authenticated internal HTTP request
  -> FastAPI service (rul-service/api.py)
  -> frozen Condition-Aware iTransformer
```

React never calls FastAPI. Express remains responsible for Buyer
authentication, ownership, CSV business validation, idempotency, private file
storage and PostgreSQL persistence. FastAPI does not access the Buyer database
or implement Buyer authentication; it loads the model and scaler at process
startup and handles model-specific validation, preprocessing and inference.

The CLI in `inference/predict_cli.py` is retained for standalone/offline model
use only. It is not part of Express's normal prediction path.

## Internal HTTP API

All routes require `X-RUL-Service-Token`, matching `RUL_SERVICE_TOKEN` in both
processes. Use a private random value of at least 32 characters. Keep this
service internal: localhost binding for local development, and private network
access plus HTTPS for deployment. Do not expose it through the browser or the
public API gateway.

### `GET /health`

Returns readiness after the model/scaler were loaded:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "model_loaded": true
  }
}
```

### `GET /v1/model-info`

Returns model ID and architecture, training/evaluation subset, window size,
and the input contract. No credentials or database identifiers are returned.

### `POST /v1/predict`

- `Content-Type: text/csv; charset=utf-8`
- `X-RUL-Service-Token: <private shared service token>`
- Raw CSV request body, maximum 1 MiB.
- 19 required columns, one unit, at least 30 observations, unique headers,
  valid model input, and no ground-truth labels.
- Input values are raw/unscaled and must use compatible physical units.

Success returns the existing inference JSON payload, including `model_id`,
`dataset`, `predicted_rul_cycles`, `unit`, `input_summary`, `evaluation`, and
`execution`. Failures use:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SENSOR_CSV",
    "message": "CSV must contain all 19 required sensor input columns."
  }
}
```

Input errors use HTTP 400/413/415/422 as applicable; missing/invalid service
authentication uses 401. Model-loading failures prevent the service from
starting. Inference failures use a generic 500 response while diagnostic
details remain in service logs.

## Local development

Do not install packages or start the services without operator approval. Once
the approved Python environment is ready, run each process in a separate
PowerShell terminal from the repository root.

Terminal 1 — FastAPI, bound to localhost:

```powershell
Set-Location rul-service
$env:RUL_SERVICE_TOKEN = "<same private value in both terminals>"
.\.venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000
```

Terminal 2 — Express:

```powershell
Set-Location backend
$env:RUL_SERVICE_URL = "http://127.0.0.1:8000"
$env:RUL_SERVICE_TOKEN = "<same private value in both terminals>"
npm run dev
```

`RUL_SERVICE_URL` is the internal service base URL and defaults in Express to
`http://127.0.0.1:8000`. Non-local HTTP addresses are rejected; use HTTPS for
remote private-network deployment. Never commit the service token.

## Input provenance and model limits

The public Express API requires `X-RUL-Source` to be one of
`NASA_CMAPSS_FD002`, `CUSTOM_SYNTHETIC`, or `EXTERNAL_MAPPED`. This is a
user-declared label that Express stores in the existing
`sensor_uploads.dataset_subset` field. The model's own `FD002` training subset
remains separate. FastAPI processes the supplied compatible sensor values
using the frozen FD002 preprocessor/checkpoint; schema compatibility does not
verify data origin, physical equivalence or prediction accuracy.

The internal FastAPI contract is separate from the public Buyer API contract.
The public paths, cookie authentication, CSRF header, response envelope and
database persistence remain owned by Express; see
[`./README.md`](./README.md).
