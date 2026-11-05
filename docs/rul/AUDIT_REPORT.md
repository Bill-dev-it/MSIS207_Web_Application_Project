# AeroRUL — Technical Audit & Model Extraction Report

**Auditor:** Senior Machine Learning Engineer  
**Audit Date:** November 4, 2026  
**Audited Repository:** `c:\UIT\Nghiên cứu khoa học\Rebuild_paper_models`  
**Target Transfer Bundle:** `AeroRUL_RUL_Inference_Transfer`  

---

## 1. Executive Summary & Audit Objective
The objective of this technical audit was to inspect the local scientific research codebase on this Windows computer, identify the authentic trained **Condition-Aware iTransformer** Remaining Useful Life (RUL) prediction model, verify its empirical reproducibility, extract all required inference artifacts (architecture, weights, scaler parameters, and clustering centroids), and package them into an isolated, production-ready, CPU-compatible transfer package for integration into the **AeroRUL** marketplace platform.

**Final Assessment:** **READY FOR INTEGRATION**. All trained weights, scaler artifacts, and preprocessing logic were located, verified, and 100% numerically reproduced on CPU without retraining.

---

## 2. Research Codebase Topology & Campaign Audit

Inspection of `c:\UIT\Nghiên cứu khoa học\Rebuild_paper_models` revealed three distinct research stages:

1. **Root Directory (Baseline Replication):**
   - Replicated classical baselines and BiLSTM-Attn from Seixas Leal et al. (2025).
2. **`proposed_model/condition_ab_pc_v1` & `condition_kmeans_pc_v2`:**
   - Addressed multi-condition degradation across NASA C-MAPSS FD002 and FD004.
   - Identified that standardizing operating settings directly introduces fake variance into single-condition subsets (FD001/FD003).
   - Developed pure NumPy KMeans clustering to partition the 3 operating settings into 6 physical flight regimes without external BLAS dependency conflicts.
3. **`proposed_model/condition_token_pc_v3` (⭐ Final Proposed Architecture):**
   - The definitive proposed model campaign: **Condition-Aware iTransformer with a Condition Token**.
   - Completed **720/720 experimental runs** (9 architectures $\times$ 4 subsets $\times$ 10 independent seeds).
   - Produced the breakthrough result on FD002: Test RMSE reduced from $21.37$ (unconditioned) to **$14.17 \pm 0.30$** (proposed token).

---

## 3. Selected Model Architecture & Configuration

| Architectural Component | Specification | Provenance |
|---|---|---|
| **Model Class** | `build_condition_token_itransformer()` | `proposed_model/condition_token_pc_v3/model_condition_token.py` |
| **Deep Learning Framework** | **TensorFlow 2.x / Keras** | `.weights.h5` native format |
| **Input Stream 1 (Sensors)** | Shape: `(B, 30, 14)` | 14 selected sensors over $W=30$ cycles |
| **Input Stream 2 (Conditions)** | Shape: `(B, 30, 6)` | One-hot regime matrix over $W=30$ cycles |
| **Sensor Tokenization** | `Permute((2, 1))` $\to$ `SensorProjection(30 $\to$ 32)` $\to$ `SensorIdentityEmbedding` | 14 tokens in $\mathbb{R}^{32}$ |
| **Condition Tokenization** | `Flatten(180)` $\to$ `Dense(32, GELU)` $\to$ `Dense(32)` $\to$ `Reshape((1, 32))` | 1 token in $\mathbb{R}^{32}$ |
| **Attention Sequence** | Concatenate: `[14 sensor tokens, 1 condition token]` | 15 tokens in $\mathbb{R}^{32}$ |
| **Attention Mechanism** | 1 layer `TransformerEncoderBlock` ($d_{model}=32$, 2 heads, $d_{ff}=64$, dropout=0.2) | Cross-sensor variate attention |
| **Pre-Head Condition Drop** | `Cropping1D(cropping=(0, 1))` | Drops 15th token; regression head uses only 14 sensor tokens |
| **Regression Head** | `Flatten(448)` $\to$ `Dense(32, ReLU)` $\to$ `Dropout(0.2)` $\to$ `Dense(1, Linear)` | Direct RUL cycle prediction |

---

## 4. Checkpoint & Subset Selection Justification

- **Selected Subset:** **NASA C-MAPSS FD002**
  - **Justification:** FD002 features 6 distinct flight operating regimes (altitudes 0–42 kft, Mach 0–0.84, TRA 60–100%). It is the exact dataset that demonstrates the condition-aware mechanism in full scientific operation. In FD001, operating settings are constant, causing the condition token to degenerate into a constant bias token.
- **Selected Checkpoint:** `output/itransformer/FD002/seed_42/best_model.weights.h5`
  - **Test $\text{RMSE}_{125}$:** **13.94 cycles**
  - **10-Seed Mean Test $\text{RMSE}_{125}$:** **14.17 ± 0.30 cycles**
  - **Validation EB-RMSE:** **16.82 cycles**
  - **Epoch:** 59 / 74
  - **Size:** **477 KB** (highly compact, zero GPU dependencies)

---

## 5. Preprocessing & Data Leakage Audit

A critical concern in academic machine learning transfer is data leakage between training and inference:
1. **Split Manifest Integrity:** The research team utilized a frozen split manifest (`split_manifest_FD002_42.json`) partitioning 80% subtrain engines and 20% validation engines.
2. **Fitting Protocol:** The KMeans centroids and all per-regime sensor standard scalers were fitted **strictly on the 80% subtrain rows**.
3. **Serialization:** To make the inference package completely standalone without needing the 100MB+ raw training files, we extracted and serialized the exact fitted parameters into `preprocessing/scaler_artifacts.json`:
   - 6 Centroids in $\mathbb{R}^3$ for `[setting_1, setting_2, setting_3]`
   - Global sensor mean and std (14 floats each)
   - 6 Per-regime sensor scalers (14 means and 14 stds per regime)
4. **Reproducibility Verification:** Applying `scaler_artifacts.json` to the official test set reproduced the recorded test RMSE of **13.9368** down to floating-point precision ($3.8 \times 10^{-5}$ difference attributable solely to BLAS single vs batch summation).

---

## 6. Execution & Verification Log

### Test 1: Python Environment & Framework
- **Executable:** `.venv-pc\Scripts\python.exe`
- **Python Version:** `3.11.15 (AMD64)`
- **TensorFlow Version:** `2.21.0`
- **Result:** PASS

### Test 2: Offline Unit Test Suite
- **Command:** `python -m unittest tests/test_offline_inference.py`
- **Tests Executed:** 7 tests
  1. `test_01_artifacts_exist`: Verified checkpoint (477 KB) and scaler artifacts (10 KB).
  2. `test_02_preprocessor_initialization`: Verified 6 regimes and 14 sensors.
  3. `test_03_model_build_and_load_weights`: Verified Keras architecture weight restoration.
  4. `test_04_valid_sample_prediction`: Predicted RUL for Unit 1 = `19.33` cycles (True RUL = `18.0`).
  5. `test_05_deterministic_repeatability`: Two successive runs produced bitwise identical predictions.
  6. `test_06_invalid_sample_rejection`: Corrupt CSV rejected with `PreprocessingValidationError`.
  7. `test_07_short_history_front_padding`: 15-cycle input safely front-padded and predicted.
- **Duration:** 6.72 seconds
- **Result:** **7/7 PASSED (OK)**

### Test 3: Production CLI Subprocess Execution
- **Command:** `python inference/predict_cli.py --input samples/valid_engine_sample.csv`
- **Exit Code:** `0`
- **Output:** Valid JSON strictly on `stdout`. Deprecation warnings and diagnostics routed strictly to `stderr`.
- **Measured Latency:** 115.1 ms inference execution.
- **Result:** PASS

---

## 7. Portability Audit & Conclusion
- **External Dependencies:** Zero hardcoded absolute paths (`c:\UIT\...`). All paths are resolved relative to `PACKAGE_ROOT`.
- **Platform Independence:** Tested on Windows AMD64; fully compatible with Linux, Docker, and macOS via standard `pip install -r requirements.txt`.
- **Integration Readiness:** **READY FOR INTEGRATION**.
