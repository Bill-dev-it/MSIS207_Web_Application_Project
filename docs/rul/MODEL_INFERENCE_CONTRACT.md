# AeroRUL Internal FastAPI Inference Contract

This is the internal service-to-service contract between the existing Express
Buyer API and the Python inference service. It is not a public/browser API.
Public Buyer REST endpoints, authentication, CSV request-source classification,
idempotency and persistence are documented in
[`README.md`](./README.md).

## Runtime and model lifecycle

- ASGI application: `api:app` in `rul-service/api.py`.
- Local development command, from `rul-service/`:
  `python -m uvicorn api:app --host 127.0.0.1 --port 8000`.
- Model implementation: `inference/runner.py` and the existing model and
  preprocessing modules.
- The lifespan startup hook loads one `RULInferenceEngine` per worker. The
  checkpoint and frozen scaler are not reloaded for each request.
- CPU inference runs through the existing TensorFlow/Keras model architecture.
- `inference/predict_cli.py` is retained for standalone/offline use only;
  Express does not launch it.

## Internal security

All service endpoints require `X-RUL-Service-Token`, compared against the
service's `RUL_SERVICE_TOKEN`. The token must contain at least 32 characters
and must be provided to both processes through their runtime environment.

Bind to localhost for local development. In a deployed environment, use a
private service network, restrict ingress to Express, and use HTTPS for remote
service-to-service traffic. Do not expose this service through the browser,
public ingress, or the public Express gateway.

## Endpoints

### `GET /health`

Requires the internal service token. Returns readiness:

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

Requires the token. Returns model ID, architecture, model training/evaluation
subset, window size and input requirements. It does not expose database
records, user identities, or secrets.

### `POST /v1/predict`

Headers:

```text
Content-Type: text/csv; charset=utf-8
X-RUL-Service-Token: <private shared token>
```

The request body is raw CSV, maximum 1 MiB. FastAPI validates valid UTF-8
without BOM/nulls, unique headers, all 19 required columns, at least 30
observations, no ground-truth label columns, and the model preprocessor's
single-unit and numeric input requirements. The input values remain raw and
unscaled in compatible physical units. Express independently applies its
public API contract before making the internal call.

Success response is the JSON produced by the existing `RULInferenceEngine`:

```json
{
  "success": true,
  "model_id": "condition_aware_itransformer_v3",
  "model_architecture": "Condition Token iTransformer (14 Inverted Sensor Tokens + 1 Condition Token)",
  "dataset": "NASA_CMAPSS_FD002",
  "predicted_rul_cycles": 19.33,
  "unit": "engine_cycles",
  "input_summary": {
    "engine_id": 1,
    "total_cycles_provided": 30,
    "window_length_used": 30
  }
}
```

Errors use a stable JSON envelope:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SENSOR_CSV",
    "message": "CSV must contain all 19 required sensor input columns."
  }
}
```

Relevant statuses include 401 for missing/invalid service authentication,
413 for oversized CSV, 415 for unsupported media types, 422 for invalid sensor
data, and 500 for inference failure. Startup fails if service authentication,
checkpoint, scaler, or model initialization is unavailable.

## Express responsibilities

Express uses `RUL_SERVICE_URL` (base URL; local default
`http://127.0.0.1:8000`) and the shared `RUL_SERVICE_TOKEN` to make the
internal request. It enforces Buyer cookie authentication, role and engine
ownership, checks the response, and owns private upload files, idempotency,
PostgreSQL transactions, result history and the final public response.
FastAPI has no PostgreSQL connection or Buyer authentication.

The result reports the model's FD002 training/evaluation domain. The public
upload-source classification remains a separate Express-level user declaration
and does not establish the upload's origin or guarantee prediction accuracy.
