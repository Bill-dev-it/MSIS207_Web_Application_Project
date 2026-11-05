# AeroRUL Buyer RUL Prediction — FD002-Trained Model Runtime

**Implementation contract**: an authenticated Buyer chooses a company-owned engine, declares an upload-source classification, submits compatible telemetry, receives a Condition-Aware iTransformer v3 prediction, and can revisit it in PostgreSQL history. Express sends the validated CSV to the internal FastAPI inference service over HTTP. FD002 describes the frozen model's training/evaluation subset; it does not assert the origin of every uploaded CSV.

## Routes

- `POST /api/v1/rul/engines/:engineId/predict` — raw UTF-8 `Content-Type: text/csv`, max 1 MiB; `X-RUL-Source` is required and must be `NASA_CMAPSS_FD002`, `CUSTOM_SYNTHETIC`, or `EXTERNAL_MAPPED`; also requires `X-AeroRUL-Request: 1`, `Idempotency-Key: UUID`, and `X-RUL-Filename: sample.csv`. The browser includes the existing HttpOnly JWT cookie. Returns `201` on a new saved inference and `200` on a same-key, same-user, same-engine, same-content, same-source replay. Different input or source with an existing key returns `409`.
- `GET /api/v1/rul/engines/:engineId/history?limit=10` — returns saved records for only engines owned by the logged-in Buyer company.
- `POST /api/v1/rul/predictions/:predictionId/recommendations` — generates and transactionally stores up to five replacement ENGINE listings for a successful company-owned prediction. Repeated calls return the existing saved result.
- `GET /api/v1/rul/predictions/:predictionId/recommendations` — reads saved recommendation snapshots only; it does not rerun inference or write to the database.

Source: `backend/src/routes/buyer/rul.routes.js` and
`frontend/src/features/buyer/rul-analysis/services/rulApi.js`. The actual
frontend route is `/buyer/rul`, nested in the existing BuyerLayout and
BUYER-protected route group. The shared `buyerRequest` client sends the existing
HttpOnly-cookie credentials and trusted-mutation header.

## Model

The frozen model package resides in repository-root `rul-service/`. The actual
checkpoint is `checkpoints/best_model.weights.h5`; scaler is
`preprocessing/scaler_artifacts.json`. The FastAPI process loads
`RULInferenceEngine` (checkpoint and scaler) once at startup and reuses it for
requests. Express calls the internal service; it does not spawn Python for web
predictions. The CLI remains available for offline package use. The model is
the FD002 Condition-Aware iTransformer v3, seed 42, with the supplied
RMSE_125 ~13.94 benchmark result. **It is not an ensemble prediction.**

## Internal FastAPI contract

The Python service is internal and requires the shared `RUL_SERVICE_TOKEN` in
`X-RUL-Service-Token` for every endpoint. Do not publish it through the public
frontend or API gateway. Locally it binds to `127.0.0.1:8000`; production
deployment must use a private service network and HTTPS between services.

| Method | Internal path | Request | Success |
|---|---|---|---|
| GET | `/health` | `X-RUL-Service-Token` | `{success:true,data:{status:"healthy",model_loaded:true}}` |
| GET | `/v1/model-info` | `X-RUL-Service-Token` | Model ID, architecture, FD002 subset, window and input contract |
| POST | `/v1/predict` | `text/csv; charset=utf-8` body, `X-RUL-Service-Token` | Existing inference output JSON with `success`, model metadata, prediction, input summary and evaluation metadata |

`POST /v1/predict` independently enforces the 1 MiB maximum, UTF-8/no BOM,
19 required columns, unique headers, one unit, at least 30 observations, no
ground-truth labels, and valid model preprocessing. Errors use
`{success:false,error:{code,message}}`. The Buyer Express endpoints and their
public API contract are unchanged.

### Start services separately (local development)

Use the already provisioned Python environment after its dependencies have
been approved and installed by the operator. Set the same randomly generated,
private value (at least 32 characters) as `RUL_SERVICE_TOKEN` in both
terminals; do not commit it or put it in frontend configuration.

Terminal 1 — FastAPI, bound only to localhost:

```powershell
Set-Location rul-service
$env:RUL_SERVICE_TOKEN = "<same private value in both terminals>"
.\.venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000
```

Terminal 2 — existing Express public API:

```powershell
Set-Location backend
$env:RUL_SERVICE_URL = "http://127.0.0.1:8000"
$env:RUL_SERVICE_TOKEN = "<same private value in both terminals>"
npm run dev
```

The Express API remains the only RUL entry point for React. No service startup,
inference, or database operation is part of the static build checks.

## Input and provenance contract

Required headers: `unit,cycle,setting_1,setting_2,setting_3,sensor_2,sensor_3,sensor_4,sensor_7,sensor_8,sensor_9,sensor_11,sensor_12,sensor_13,sensor_14,sensor_15,sensor_17,sensor_20,sensor_21`. The Buyer API checks that the CSV has exactly one unit, at least 30 observations, no ground-truth-label columns, valid numeric values for required fields, UTF-8 without BOM, and a maximum size of 1 MiB. The submitter must provide raw, unscaled values in compatible physical units; physical units and source authenticity are not independently verified. Additional non-label columns may be present and are ignored by preprocessing.

The allowed, user-declared source classifications mean:

| `X-RUL-Source` | Meaning persisted in `sensor_uploads.dataset_subset` |
|---|---|
| `NASA_CMAPSS_FD002` | User identifies the uploaded sample as originating from NASA C-MAPSS FD002 |
| `CUSTOM_SYNTHETIC` | User identifies the upload as custom synthetic telemetry |
| `EXTERNAL_MAPPED` | User identifies externally sourced telemetry mapped to the required columns and physical units |

This self-declared value is provenance metadata, not an origin check, model validation, or accuracy guarantee. `ml_model_versions.dataset_subset` remains `FD002` and identifies the model's training/evaluation subset. The existing `sensor_uploads.dataset_subset` column stores the upload classification without a schema change. The source classification is returned in prediction and history data and participates in idempotency matching. Records created before source classification was added return `LEGACY_UNCLASSIFIED`; the old stored `FD002` value is not treated as verified provenance.

The Python preprocessor uses the frozen FD002 scaler and condition token for every accepted source. A schema-compatible external or synthetic CSV is not thereby validated as physically equivalent to C-MAPSS and does not imply accurate predictions.

## Data persistence

- `ml_model_versions`: one manually registered active model row (see [`03_ml_model_version_seed.sql`](../../database/seed/03_ml_model_version_seed.sql); only an authorized operator executes it after approval).
- `sensor_uploads`: engine FK, uploaded_by, sanitized filename, private object key, SHA-256, declared upload-source classification in the existing `dataset_subset` field, unit, cycle bounds and row count, `is_demo=true`, `status='VALID'`.
- `rul_predictions`: one successful inference result linked by upload, model and request key, demo decision rule snapshot and `SUCCEEDED` status.
- `replacement_recommendations`: up to five saved, ranked listing snapshots per prediction. `recommendation_status` becomes `READY`, `NO_MATCH`, or `FAILED`; recommendation failures do not change the RUL prediction's `SUCCEEDED` status.
- Raw CSV under private `backend/storage/rul/<authenticated-user-id>/`
  (ignored in Git, not a public static directory). Failed requests remove their
  private upload when cleanup succeeds. No frontend direct DB access.

## Limitations

C-MAPSS units are simulator identifiers; they do **not** provide a verified mapping to real aircraft or manufacturer/engine models. The association to a company engine is a user-selected **demo mapping**, not physical sensor verification. The model was trained/evaluated on FD002, but uploaded files may be FD002 samples, custom synthetic data, or externally sourced data mapped by the submitter. Do not update `engines.current_cycle` from uploaded CSV. Planning urgency thresholds 20/40/80 are project-defined demo thresholds, not FAA/EASA requirements. The Replace & Buy recommendation MVP uses only explicit `product_engine_compatibility` evidence as an eligibility gate and may return demo-only evidence. It does not certify installation compatibility, infer interchangeability from names, or provide fair-market valuations. Trade-in, buyback, old-asset collection, valuation and exchange credit remain deferred.

## Verification status

Code-only integration checks are not operational proof. Actual Python dependencies, PostgreSQL writes, cookie middleware and inference must be verified together during the user's final single end-to-end testing round.

## Detailed RUL documentation

This directory is the single canonical location for detailed RUL documentation:

- [System design and architecture](./SYSTEM_DESIGN.md)
- [Setup guide](./SETUP_GUIDE.md)
- [CSV input specification](./CSV_INPUT_SPECIFICATION.md)
- [Internal FastAPI inference contract](./MODEL_INFERENCE_CONTRACT.md)
- [Express/FastAPI integration guide](./INTEGRATION_GUIDE.md)
- [Scientific model evaluation](./MODEL_EVALUATION.md)
- [Scientific artifact audit](./AUDIT_REPORT.md)
- [RUL integration diagram](./images/RUL_integration.jpg)

The application runtime and public API behavior documented above are current.
Historical research and future trade-in or exchange-credit concepts are
identified separately and are not claims of functionality included in the
Replace & Buy recommendation MVP.
