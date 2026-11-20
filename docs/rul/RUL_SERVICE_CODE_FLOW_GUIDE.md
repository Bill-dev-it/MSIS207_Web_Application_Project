# AeroRUL — RUL Service Code Flow Guide (`rul-service/`)

This guide explains the execution flow and safety boundaries of `rul-service/` (internal FastAPI + TensorFlow/Keras CPU inference service for **NASA C-MAPSS FD002** Remaining Useful Life prediction). It is documentation for developers and academic review—**the frozen numerical model and preprocessing code are intentionally untouched**.

---

## 1. End-to-End Request Flow & Service Token Guard

```text
React SPA (Browser)
  └─► Express API (auth cookie, CSRF, Buyer company ownership, Idempotency-Key)
        └─► HTTPS POST /v1/predict + X-RUL-Service-Token
              ├─► api.py: require_service_token()        [401 before touching body]
              ├─► api.py: read_csv()                     [415 / 400 / 413 / 422 HTTP checks]
              ├─► api.py: async with inference_lock + run_in_threadpool(...)
              │     └─► runner.py: RULInferenceEngine.predict_from_dataframe()
              │           ├─► preprocessor.py: validate_dataframe() + transform()
              │           └─► model/: Condition-Aware iTransformer forward pass
              └─► Stateless JSON response -> Express persists rows to PostgreSQL
```

- **Startup (`lifespan` in `rul-service/api.py`):** Validates `RUL_SERVICE_TOKEN` (`>= 32` ASCII characters, no whitespace) and loads **one** shared `RULInferenceEngine` (frozen checkpoint + scaler artifacts) into `app.state.engine`.
- **Internal authentication (`require_service_token`):** Runs **before** reading or parsing any CSV body on `GET /health`, `GET /v1/model-info`, and `POST /v1/predict`, using constant-time `hmac.compare_digest`. Interactive Swagger/OpenAPI routes remain disabled (`docs_url=None`, `redoc_url=None`, `openapi_url=None`).

---

## 2. Two-Layer CSV Validation (`api.py` vs `preprocessor.py`)

Validation is split intentionally between the HTTP boundary and the scientific preprocessor:

1. **Layer 1 — FastAPI HTTP boundary (`read_csv`, `_validate_csv_headers`, `_validate_sensor_dataframe` in `api.py`):**
   - Enforces `Content-Type: text/csv` (UTF-8 charset only; `415 UNSUPPORTED_MEDIA_TYPE`).
   - Checks both `Content-Length` and **actual streamed chunks** against `MAX_CSV_BYTES = 1 MiB` (`413 PAYLOAD_TOO_LARGE`) so spoofed or missing `Content-Length` headers cannot exhaust memory.
   - Rejects empty bodies, invalid UTF-8, BOM (`\ufeff`), NUL (`\x00`), duplicate header columns, and ground-truth label prefixes (`rul`, `true_rul`, `target`, etc., while permitting benign columns such as `rule_*`).
   - Requires all `19` columns (`unit`, `cycle`, `setting_1..3`, 14 sensors), **at least `30` observations** (`MIN_OBSERVATIONS = 30` -> `422 INSUFFICIENT_HISTORY`), and positive integer `unit` / `cycle` values.
2. **Layer 2 — Domain Preprocessor (`ConditionAwarePreprocessor.validate_dataframe` in `preprocessing/preprocessor.py`):**
   - Verifies exactly **one engine (`unit`) per CSV**, numeric coercion, zero `NaN`/`Inf` values, ascending sort by `cycle`, and zero duplicate cycle numbers.
   - **Important distinction:** `ConditionAwarePreprocessor.transform()` still supports `< 30` cycles by front-padding the earliest row for standalone offline CLI compatibility (`inference/predict_cli.py`), while the HTTP API intentionally keeps the `>= 30` row minimum.

---

## 3. Flight Regime Inference & Per-Regime Normalization (`preprocessor.py`)

`ConditionAwarePreprocessor` loads frozen KMeans centroids and per-regime scalers from `preprocessing/scaler_artifacts.json`:

1. **Operating Regime Assignment:** Reads `setting_1`, `setting_2`, `setting_3` `(N, 3)` in `float64`, computes squared Euclidean distance to the `6` frozen centroids `(6, 3)`, and assigns each cycle to its nearest regime `0..5`.
2. **Per-Regime Sensor Scaling:** Normalizes the `14` selected sensors `(N, 14)` (`sensor_2, 3, 4, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20, 21`) using `(x - mean_regime) / std_regime` for each cycle's assigned flight regime.
3. **One-Hot Condition Stream:** Encodes regimes into `(N, 6)` `float32` one-hot vectors.

---

## 4. Tensor Shapes & Model Architecture (`model/architecture.py`, `model/layers.py`)

From the normalized arrays, `transform()` selects the most recent `30` cycles (or front-pads if `N < 30` on offline CLI runs), returning batch size `1`:

- **`sensor_tensor`:** `(1, 30, 14)` `float32`
- **`condition_tensor`:** `(1, 30, 6)` `float32`

Inside `build_condition_token_itransformer()`:
1. **Inverted Sensor Tokens:** `(B, 30, 14)` -> `Permute((2, 1))` -> `(B, 14, 30)` -> `SensorProjection(d_model=32)` + learnable `SensorIdentityEmbedding(14, 32)` -> **14 sensor tokens `(B, 14, 32)`**.
2. **Condition Token:** `(B, 30, 6)` -> `Flatten(180)` -> `Dense(32, gelu)` -> `Dense(32)` -> `Reshape((1, 32))` -> **1 condition token `(B, 1, 32)`**.
3. **Joint Cross-Sensor Attention:** Concatenates `[14 sensor tokens, 1 condition token]` -> `(B, 15, 32)` -> `TransformerEncoderBlock` (Pre-LayerNorm + 2-head MultiHeadAttention + GELU FFN, `ff_dim=64`).
4. **Condition Drop & Head:** `Cropping1D((0, 1))` removes the condition token so predictions depend solely on attention-routed sensor tokens `(B, 14, 32)` -> `Flatten(448)` -> `Dense(32, relu)` -> `Dropout(0.2)` -> `Dense(1, linear)`.

---

## 5. Inference, Clipping, Concurrency & Response Boundary (`runner.py`, `api.py`)

- **Concurrency (`api.py`):** TensorFlow CPU execution is synchronous; `async with inference_lock:` + `await run_in_threadpool(...)` prevents blocking FastAPI's async event loop and avoids concurrent TensorFlow session execution across simultaneous requests (paired with `--workers 1` in `Dockerfile`).
- **Clipping & Rounding (`runner.py`):** Evaluates `model([sensor_tensor, condition_tensor], training=False)`, applies `np.clip(raw_pred, 0.0, 125.0)` (matching NASA C-MAPSS FD002 `RMSE_125` training), rounds both `predicted_rul_cycles` and `raw_predicted_rul_cycles` to 2 decimal places, and records `dominant_regime` and research evaluation metadata.
- **Database Persistence Boundary:** `rul-service` has **no PostgreSQL connection**. Express validates the returned `success === True` and `model_id === "condition_aware_itransformer_v3"`, maps predicted RUL to urgency, and stores `sensor_uploads` and `rul_predictions` inside Neon PostgreSQL.

---

## 6. Why Numerical Core Files Must Remain Untouched

- `model/architecture.py`, `model/layers.py`, `preprocessing/preprocessor.py`, `inference/runner.py`, `checkpoints/best_model.weights.h5`, and `preprocessing/scaler_artifacts.json` encode exact weight names, `float64 -> float32` precision boundaries, sensor column ordering, KMeans centroids, and per-regime z-scores from the evaluated seed-42 checkpoint (`RMSE_125 = 13.94`). Changing layer names, tensor shapes, normalization precision, or token order would break checkpoint loading or invalidate academic benchmark alignment.
- Offline CLI (`inference/predict_cli.py`) exists strictly for local verification/debugging; Express only calls FastAPI over HTTPS (`Cloud Run` in production, `127.0.0.1:8000` locally).
- **Cloud Run Deployment Note:** Updating files in Git or running CI `rul-integrity` checks does **not** redeploy Google Cloud Run; production requires an explicit container build (`rul-service/Dockerfile`) and revision deployment by the owner.
