# Silver Layer — Cleaned & Standardized Data

The Silver layer contains **cleaned and standardized data** derived from the
raw datasets stored in the Bronze layer.

Its purpose is to preserve useful source information while resolving common
data-quality problems before the data is mapped into the application's Gold
schema.

```text
Bronze Raw Data
      │
      ▼
Clean + Validate + Standardize
      │
      ▼
Silver Data
      │
      ▼
Transform + Integrate
      │
      ▼
Gold Application Data
```

## Silver Dataset

The current pipeline produces four main cleaned datasets:

| Dataset | Records | Purpose |
|---|---:|---|
| Engine Models | 4,712 | Cleaned aircraft engine reference data |
| Aircraft Reference | 316,659 | Aircraft reference records used for fleet construction |
| Parts | 300 | Cleaned aviation spare-part records |
| Supplier IDs | 40 | Standardized supplier references |

Silver data remains close to the original source datasets and is **not yet
structured as final application tables**.

---

## Data Cleaning

The Bronze → Silver pipeline performs cleaning and standardization such as:

- removing invalid or placeholder records;
- removing or consolidating duplicate records;
- standardizing column names and data types;
- normalizing manufacturer and model information;
- handling missing or invalid values;
- preserving source identifiers for traceability;
- validating records before further transformation.

For example, the current pipeline:

- removes an invalid engine placeholder record;
- consolidates duplicate manufacturer/model combinations while preserving
  source identifiers;
- converts invalid aircraft year values to `NULL` rather than inventing values.

The objective is to improve data quality **without changing the original
business meaning of the source data**.

---

## Data Provenance

Silver records are derived from the project's external source datasets,
including aviation, aircraft, engine, spare-part, supply-chain and e-commerce
data where applicable.

```text
External Sources
      ↓
Bronze
(original files)
      ↓
Silver
(cleaned source data)
```

Unlike the Gold layer, Silver should generally **not introduce application-specific
demo entities or relationships**.

For example, supplier-product offers, demo fleets and engine-part compatibility
relationships are created later when building the Gold layer.

---

## Build Process

Silver data is generated from Bronze data using:

```bash
python data/scripts/bronze_to_silver/clean.py
```

The original Bronze files are treated as immutable source data.

Cleaning operations should therefore write their results to the Silver layer
instead of modifying the original files.

```text
Bronze
  │
  │ clean.py
  ▼
Silver
```

---

## Silver → Gold

Silver data provides the trusted intermediate datasets used to construct the
application-ready Gold layer.

During the next stage, Silver records are mapped against the database schema and
combined where necessary:

```text
Engine References ───────► engine_models

Aircraft References ─────► aircraft
                           engines

Parts ───────────────────► products
                           categories

Supplier References ─────► suppliers
                           seller_listings

Multiple Sources
        +
Controlled Demo Rules ───► product_engine_compatibility
```

Not every Silver record must become an application record.

For example, the large aircraft reference dataset can serve as a source/reference
pool while only a smaller controlled fleet is selected for the demonstration
application.

---

## Reproducibility

The transformation process is designed to be reproducible.

Bronze files should remain unchanged across pipeline executions, while Silver
outputs can be regenerated from the same source data and cleaning logic.

Manual modification of generated Silver files is discouraged. Data-quality
changes should instead be implemented in:

```text
data/scripts/bronze_to_silver/clean.py
```

This keeps the transformation process traceable and repeatable.
