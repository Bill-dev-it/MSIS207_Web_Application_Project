# AeroRUL — Condition-Aware iTransformer Inference Transfer Package

> **Notice for the AeroRUL Platform Developer:**
> This package contains the complete, verified, standalone Python ML inference pipeline for the **Condition-Aware iTransformer Remaining Useful Life (RUL)** prediction model. It is configured for immediate integration with your React + Express + PostgreSQL marketplace.
>
> **Project-specific runtime contract:** Express calls the internal FastAPI
> service in `rul-service/api.py` over HTTP. The service loads this package's
> model and scaler once per worker. The standalone
> `inference/predict_cli.py` is for offline use, not Express web requests. The
> public Buyer endpoints and internal inference contract are described in
> [`README.md`](./README.md). The Replace & Buy recommendation MVP is
> implemented by Express; trade-in and exchange-credit workflows are deferred.

---

## 1. Package Highlights & Selected Artifacts

- **Model Architecture:** Condition-Aware iTransformer (v3: 14 Inverted Sensor Tokens + 1 Flight Regime Condition Token).
- **Supported Dataset Domain:** **NASA C-MAPSS FD002** (6 flight regimes, multi-operating conditions).
- **Selected Checkpoint:** `checkpoints/best_model.weights.h5` (Seed 42, Epoch 59/74).
- **Verified Offline Test RMSE:** **13.94 cycles** (10-seed research mean: **14.17 ± 0.30 cycles**).
- **Sample Engine Prediction (Unit 1):** **19.33 cycles** (NASA test ground truth: 18.0 cycles).
- **Execution Target:** **CPU Compatible** (AMD64 64-bit, zero GPU requirements).
- **Inference Latency:** ~115 ms warm evaluation (~1.5s cold process startup).

---

## 2. Runtime Package Structure

```text
Project root/
├── rul-service/
├── docs/rul/                           # Canonical detailed RUL documentation
│   ├── README.md
│   ├── SETUP_GUIDE.md                  # This guide
│   ├── SYSTEM_DESIGN.md
│   ├── CSV_INPUT_SPECIFICATION.md
│   ├── MODEL_INFERENCE_CONTRACT.md
│   ├── MODEL_EVALUATION.md
│   ├── INTEGRATION_GUIDE.md
│   └── AUDIT_REPORT.md
└── database/seed/03_ml_model_version_seed.sql

rul-service/
├── requirements.txt                    # Minimal CPU Python dependencies
├── manifest.json                       # Package file inventory with SHA-256 hashes
├── inference_contract.json             # Machine-readable integration specification
├── checksums.sha256                    # Integrity hashes for all shipped files
├── api.py                              # Internal FastAPI service
├── model/
│   ├── __init__.py
│   ├── layers.py                       # Self-contained custom Keras layers
│   ├── architecture.py                 # Condition-Aware iTransformer model definition
│   └── config.json                     # Hyperparameter & tensor configuration
├── preprocessing/
│   ├── __init__.py
│   ├── preprocessor.py                 # Regime clustering & sensor z-score normalizer
│   └── scaler_artifacts.json           # Frozen pre-fitted KMeans centroids & scalers
├── checkpoints/
│   ├── best_model.weights.h5           # Authentic trained model weights (477 KB)
│   └── checkpoint_metadata.json        # Training provenance & evaluation metrics
├── inference/
│   ├── __init__.py
│   ├── runner.py                       # High-level RULInferenceEngine API class
│   ├── predict_cli.py                  # Standalone offline CLI
│   └── ...
├── samples/
│   ├── valid_engine_sample.csv         # Authentic C-MAPSS FD002 test sample (Unit 1)
│   └── invalid_engine_sample.csv       # Corrupt sample for testing error handling
├── tests/
│   ├── __init__.py
│   └── test_offline_inference.py       # 7 automated unit tests for CPU verification
└── README.md                           # Short module entry point
```

The full scientific audit, model evaluation and runtime documentation is in
`docs/rul/`; documentation is not part of the executable `rul-service/`
package inventory.

---

## 3. Quick Start on Your Development Laptop

### Step 1: Prerequisites
- Windows 10/11 or Linux (x86_64 / AMD64).
- Python **3.10**, **3.11**, or **3.12** (Python 3.11.15 is the reference runtime).

### Step 2: Create Virtual Environment
From the repository root, create the environment inside `rul-service/`:

```powershell
Set-Location rul-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

*(On Linux / macOS: `python3 -m venv .venv && source .venv/bin/activate`)*

### Step 3: Install Requirements
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Run Verification Tests
Verify all 7 offline unit tests pass on your CPU:

```powershell
python -m unittest tests/test_offline_inference.py
```

Expected output:
```text
Ran 7 tests in ~6s
OK
```

### Step 5: Test the Inference CLI
Run prediction on the included genuine engine sample:

```powershell
python inference/predict_cli.py --input samples/valid_engine_sample.csv
```

Expected JSON response:
```json
{
  "success": true,
  "model_id": "condition_aware_itransformer_v3",
  "dataset": "NASA_CMAPSS_FD002",
  "predicted_rul_cycles": 19.33,
  "unit": "engine_cycles",
  "input_summary": {
    "engine_id": 1,
    "total_cycles_provided": 258,
    "window_length_used": 30
  },
  "evaluation": {
    "metric": "RMSE_125",
    "checkpoint_test_rmse_cycles": 13.94,
    "subset_10seed_mean_rmse_cycles": 14.17
  }
}
```

---

## 4. Troubleshooting & Diagnostic Indicators

| Observed Behavior | Probable Cause | Action |
|---|---|---|
| `ModuleNotFoundError: No module named 'tensorflow'` | Virtual environment not active or dependencies not installed | Activate `.venv` and run `pip install -r requirements.txt` |
| `PreprocessingValidationError: Missing required columns` | Uploaded CSV missing some of the 14 sensors or 3 settings | Check CSV against [`CSV_INPUT_SPECIFICATION.md`](./CSV_INPUT_SPECIFICATION.md) |
| `FileNotFoundError: Checkpoint weights not found` | `checkpoints/best_model.weights.h5` was moved or deleted | Ensure directory structure is intact |
| Exit code `1` with JSON error | Input data failed validation | Read the `error` field in JSON output for exact issue |

---

## 5. Files That Must NOT Be Altered
To maintain 100% numerical fidelity with published research:
1. `checkpoints/best_model.weights.h5`: The binary trained weights.
2. `preprocessing/scaler_artifacts.json`: Contains the exact frozen centroids and per-regime scaling statistics.
3. `model/architecture.py` & `model/layers.py`: Defines the exact 15-token inverted attention mechanism.

---

## 6. Express / FastAPI Integration

The normal web prediction path is React → Express Buyer API → internal
FastAPI → model. FastAPI exposes authenticated `GET /health`,
`GET /v1/model-info`, and `POST /v1/predict` routes. See
[`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md) for separate Express/FastAPI
startup and the request/response contract. FastAPI does not access Buyer
authentication or PostgreSQL. The CLI remains an offline-only interface and
is not used for web requests.
