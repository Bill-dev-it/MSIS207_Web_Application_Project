# AeroRUL — CSV Upload Specification for Turbofan RUL Prediction

> The Buyer API accepts compatible sensor telemetry from NASA C-MAPSS FD002
> samples, custom synthetic sources, or externally sourced data mapped to the
> required columns/physical units. This is separate from the model's FD002
> training subset. The API requires UTF-8 `text/csv`, at most 1 MiB, one unit,
> and at least 30 observations. The application-specific contract is authoritative:
> [RUL runtime contract](./README.md).

## 1. Overview & Purpose
This document defines the strict data contract for engine sensor time-series CSV files uploaded by Airline/MRO users to the **AeroRUL** marketplace platform. The uploaded CSV contains operational flight history and raw sensor measurements, which are processed by the **Condition-Aware iTransformer** model to estimate Remaining Useful Life (RUL) in flight cycles.

---

## 2. File Format & Encoding
- **File Format:** Standard comma-separated values (`.csv`).
- **Character Encoding:** UTF-8 (ASCII compatible, without BOM).
- **Header Row:** **MANDATORY**. The first row must contain exact column names.
- **Maximum File Size (Buyer API MVP):** **1 MiB** (1,048,576 bytes).
- **Upload Source:** The API requires the user to select `NASA_CMAPSS_FD002`, `CUSTOM_SYNTHETIC`, or `EXTERNAL_MAPPED`. This is a declared provenance label, not a source-verification step; FastAPI receives the CSV and does not infer its origin.

---

## 3. Required Column Schema

The CSV requires **19 core columns** consisting of engine identity, cycle ordering, 3 operational condition settings, and 14 selected sensor measurements.

| Column Name | Category | Data Type | Physical Meaning | Typical C-MAPSS Unit / Range |
|---|---|---|---|---|
| `unit` | Identifier | Integer | Unique engine identifier | Positive integer (e.g., `1`, `2`) |
| `cycle` | Index | Integer | Operational flight cycle number | Ascending integer (e.g., `1, 2, ...`) |
| `setting_1` | Flight Condition | Float | Altitude (scaled) | `0.00` to `42.00` (kft) |
| `setting_2` | Flight Condition | Float | Flight Mach Number | `0.00` to `0.84` |
| `setting_3` | Flight Condition | Float | Throttle Resolver Angle (TRA) | `60.0` or `100.0` (%) |
| `sensor_2` | Degradation Signal | Float | Total Temperature at LPC outlet | `~535` to `~650` °R |
| `sensor_3` | Degradation Signal | Float | Total Temperature at HPC outlet | `~1240` to `~1600` °R |
| `sensor_4` | Degradation Signal | Float | Total Temperature at LPT outlet | `~1020` to `~1450` °R |
| `sensor_7` | Degradation Signal | Float | Total Pressure at HPC outlet | `~130` to `~560` psia |
| `sensor_8` | Degradation Signal | Float | Physical Fan Speed | `~1900` to `~2400` rpm |
| `sensor_9` | Degradation Signal | Float | Physical Core Speed | `~7800` to `~9200` rpm |
| `sensor_11` | Degradation Signal | Float | Static Pressure at HPC outlet | `~36` to `~49` psia |
| `sensor_12` | Degradation Signal | Float | Ratio of fuel flow to Ps30 | `~120` to `~530` pps/psia |
| `sensor_13` | Degradation Signal | Float | Corrected Fan Speed | `~2020` to `~2400` rpm |
| `sensor_14` | Degradation Signal | Float | Corrected Core Speed | `~7800` to `~8250` rpm |
| `sensor_15` | Degradation Signal | Float | Bypass Ratio | `~8.0` to `~11.0` |
| `sensor_17` | Degradation Signal | Float | Bleed Enthalpy | `~300` to `~400` |
| `sensor_20` | Degradation Signal | Float | High-Pressure Turbines (HPT) coolant bleed | `~10` to `~40` lbm/s |
| `sensor_21` | Degradation Signal | Float | Low-Pressure Turbines (LPT) coolant bleed | `~6` to `~24` lbm/s |

### Unused Raw C-MAPSS Sensors
The original NASA simulation produced 21 sensors. Sensors `1, 5, 6, 10, 16, 18, 19` were identified in literature and empirical audits as having zero or near-zero variance across operating conditions, offering negligible degradation signal. If the uploaded CSV includes these columns (or any additional metadata columns), the preprocessor automatically **ignores** them without error.

---

## 4. Time-Series Rules & Constraints

1. **Single Engine per Upload (MVP):**
   - Exactly **ONE** unique engine ID must be present in the `unit` column per file.
   - Files containing records for multiple engines are rejected with a `PreprocessingValidationError`.
2. **Cycle Ordering & Contiguity:**
   - Rows must represent sequential cycles and be sorted in strictly ascending order by `cycle`.
   - The preprocessor sorts by `cycle` automatically if out of order, but duplicate cycle entries are strictly rejected.
   - Non-contiguous cycles (e.g., missing inspection cycles) are permitted as long as the temporal order is monotonically increasing.
3. **Minimum History Length (Buyer API MVP):**
   - At least **30 observations** are required by the Express upload validator, matching the model's sliding-window length ($W=30$).
   - The standalone Python preprocessing implementation can front-pad shorter research inputs, but those inputs are not accepted by the Buyer API. The application limit is authoritative for uploads.
4. **Target Labels Prohibited:**
   - The CSV must **NOT** contain a true RUL, target, label, or future-cycle column. Inference is strictly causal.

---

## 5. Data Validation & Integrity Handling

| Issue | Validation Action | Error / Behavior |
|---|---|---|
| Missing required column | Reject immediately | `PreprocessingValidationError: Missing required columns in CSV: [...]` |
| Multiple engine IDs | Reject immediately | `PreprocessingValidationError: Multiple engine IDs detected [...]` |
| Empty CSV file | Reject immediately | `PreprocessingValidationError: Uploaded CSV is empty.` |
| Duplicate cycles | Reject immediately | `PreprocessingValidationError: Duplicate cycle numbers detected [...]` |
| `NaN`, `null`, or empty cells | Reject immediately | `PreprocessingValidationError: CSV contains NaN or null values [...]` |
| Infinite values (`inf`, `-inf`) | Reject immediately | `PreprocessingValidationError: CSV contains infinite values.` |
| Non-numeric values in numeric fields | Reject immediately | `PreprocessingValidationError: Column '...' must contain valid numeric values.` |
| Unrelated extra columns | Accept & ignore | Stripped silently during feature extraction |
| History length $< 30$ cycles | Buyer API rejects | `INSUFFICIENT_HISTORY`; although the standalone CLI can front-pad research inputs, the application does not permit them |

---

## 6. Preprocessing Executed by Model Runner
Submit **raw, unscaled values in compatible physical units**; do not pre-scale the values. The uploader must map external telemetry to the documented sensor definitions and units. The inference pipeline executes:
1. **Regime Prediction:** Assigns each cycle to one of 6 flight regimes via Euclidean distance to pre-fitted KMeans centroids on `[setting_1, setting_2, setting_3]`.
2. **Per-Regime Normalization:** Scales each of the 14 sensors using the mean and standard deviation specifically fitted on training data for that regime:
   $$\hat{x}_{t, s} = \frac{x_{t, s} - \mu_{c(t), s}}{\sigma_{c(t), s}}$$
3. **One-Hot Condition Encoding:** Creates a $(30, 6)$ condition matrix indicating regime status at each cycle.
4. **Tensor Assembly:** Produces model input tensors:
   - `sensor_input`: `(1, 30, 14)`
   - `condition_input`: `(1, 30, 6)`

---

## 7. Supported Domain & Real-World Telemetry Limitations
> [!WARNING]
> **Academic Simulation Scope & Telemetry Disclaimer:**
> - The model was trained and validated on the **NASA C-MAPSS FD002** benchmark (turbofan engine simulation with 6 operating regimes and high-pressure compressor degradation).
> - FD002 is the frozen model's training/evaluation domain, not a required origin for every submitted CSV. A schema-compatible CSV from another origin is not thereby validated as physically equivalent or guaranteed to produce accurate predictions.
> - C-MAPSS sensor definitions correspond to commercial 90,000-lb thrust class dual-spool turbofan physics models (e.g., CFM56/GE90 class in simulation).
> - **Commercial Aircraft Discrepancy:** Commercial flight data recorders (ARINC 429 / ACARS) do not measure identical sensor channels under identical naming conventions or unscaled voltage channels. Real airline telemetry must be mapped through an ETL pipeline into this normalized schema before running inference.
> - This software is intended for educational demonstration, academic research, and e-commerce parts planning simulation, not certified FAA/EASA airworthiness decisions.
