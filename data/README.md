## 3. Data Pipeline

The project uses a lightweight **Medallion-style data pipeline** to transform heterogeneous aviation datasets into clean, structured, and application-ready data for the B2B marketplace.

The pipeline consists of three layers:

**Bronze → Silver → Gold → PostgreSQL**

![Data Pipeline](./Data_pipeline.png)

### 3.1 Pipeline Overview

```text
External Aviation Datasets
          │
          ▼
┌─────────────────────┐
│       BRONZE        │
│   Original / Raw    │
│       Datasets      │
└──────────┬──────────┘
           │ Clean & Standardize
           ▼
┌─────────────────────┐
│       SILVER        │
│ Cleaned & Filtered  │
│    Reference Data   │
└──────────┬──────────┘
           │ Transform, Map & Enrich
           ▼
┌─────────────────────┐
│        GOLD         │
│ Application-Ready   │
│        Data         │
└──────────┬──────────┘
           │
           ▼
      PostgreSQL
```

The Bronze and Silver layers preserve the larger reference datasets, while the Gold layer creates a smaller, consistent dataset specifically designed to seed and demonstrate the application's core business workflows.

---

### 3.2 Bronze Layer — Raw Source Data

The **Bronze layer** stores the original downloaded datasets without modifying their source content.

Its main purpose is **data preservation and traceability**. Cleaning and application-specific transformations are performed only in later layers.

The active pipeline currently uses:

| Source | Purpose |
|---|---|
| FAA `ENGINE.txt` | Aircraft engine model reference |
| FAA `MASTER.txt` | Aircraft registry/reference data |
| FAA `ACFTREF.txt` | Aircraft manufacturer and model reference |
| Aviation Parts Master | Spare-parts and supplier reference data |

Other downloaded datasets can remain in Bronze for future development but are not automatically treated as active pipeline inputs.

The Bronze layer currently contains **111 source files**. Pipeline execution does not modify these files.

---

### 3.3 Silver Layer — Cleaned & Standardized Data

The **Silver layer** converts selected Bronze sources into consistent reference datasets that can be safely used by the application-data transformation stage.

Processing includes:

- removing invalid and placeholder records;
- consolidating duplicate engine models;
- standardizing identifiers and data types;
- validating aircraft manufacturing years;
- extracting supplier references;
- cleaning and standardizing aviation-part records;
- preserving source relationships required for later mapping.

The current Silver pipeline produces:

| Dataset | Records | Description |
|---|---:|---|
| Engine Models | 4,712 | Cleaned FAA engine model references |
| Aircraft References | 316,659 | Cleaned aircraft reference records |
| Parts | 300 | Standardized aviation spare parts |
| Supplier References | 40 | Unique supplier identifiers extracted from parts data |

For example:

```text
FAA ENGINE.txt
      │
      ├── Remove invalid records
      ├── Normalize manufacturer/model
      ├── Consolidate duplicates
      │
      ▼
engine_models.csv
4,712 engine models
```

The Silver layer remains primarily **reference-oriented**. It does not yet represent marketplace entities such as seller listings, buyer-owned aircraft fleets, or application transactions.

---

### 3.4 Gold Layer — Application-Ready Data

The **Gold layer** transforms Silver reference data into records that follow the application's PostgreSQL/ERD structure.

Unlike an analytical data warehouse, Gold in this project is **not a Data Mart**. It represents operational seed/reference data used by the B2B e-commerce application.

The current Gold dataset contains:

| Table | Records |
|---|---:|
| `companies` | 47 |
| `addresses` | 47 |
| `categories` | 9 |
| `engine_models` | 4,712 |
| `suppliers` | 40 |
| `aircraft` | 24 |
| `engines` | 24 |
| `products` | 312 |
| `seller_listings` | 936 |
| `product_engine_compatibility` | 146 |
| **Total** | **6,297** |

Gold combines cleaned source data with deterministic demo data required to demonstrate marketplace workflows.

For example:

```text
Silver Aircraft Reference
        +
Silver Engine Models
        │
        ▼
Demo Fleet Selection
        │
        ├── 24 Aircraft
        └── 24 Installed Engines
```

and:

```text
300 Silver Parts
        │
        ├── Product Transformation
        ├── Supplier Mapping
        ├── Seller Offer Generation
        └── Demo Compatibility Mapping
        │
        ▼
312 Products
936 Seller Listings
146 Compatibility Records
```

### 3.5 Source Data vs. Demo Data

The Gold layer is intentionally a **hybrid demo seed dataset**.

Some attributes are directly derived or transformed from aviation source datasets, while application-specific business records are generated deterministically where real commercial data is unavailable.

| Data | Origin |
|---|---|
| Engine manufacturers/models | FAA-derived |
| Aircraft manufacturer/model/year | FAA-derived |
| Part source attributes | Aviation-parts dataset |
| Supplier source IDs | Aviation-parts dataset |
| Buyer companies | Demo |
| Supplier business profiles | Demo |
| Aircraft ownership | Demo |
| Engine serial numbers/cycles | Demo |
| Seller listings, prices and inventory | Demo / transformed |
| Product-engine compatibility | Demo |

> **Important:** Product-engine compatibility records are demonstration relationships and should not be interpreted as manufacturer-certified aircraft fitment data.

This approach allows the application to demonstrate realistic B2B e-commerce workflows without presenting generated commercial information as real-world observations.

---

### 3.6 Data Quality & Validation

The pipeline validates data before it is considered application-ready.

Current validation covers:

- required columns and data types;
- primary and unique identifiers;
- foreign-key relationships;
- `NOT NULL` requirements;
- domain and `CHECK` constraints;
- negative inventory rejection;
- duplicate aircraft registration rejection;
- invalid supplier references;
- missing required product information.

The pipeline is also deterministic: running it again with unchanged source data produces the same Gold dataset.

Bronze integrity is preserved throughout the process.

---

### 3.7 Running the Pipeline

Run the pipeline from the project root:

```bash
# Bronze → Silver
python data/scripts/bronze_to_silver/clean.py

# Silver → Gold
python data/scripts/silver_to_gold/build_gold.py

# Validate Gold output
python data/scripts/silver_to_gold/build_gold.py --check
```

The complete flow is:

```text
Bronze
  ↓
Cleaning & Standardization
  ↓
Silver
  ↓
Mapping + Transformation + Demo Enrichment
  ↓
Gold
  ↓
Schema Validation
  ↓
PostgreSQL
  ↓
Application / REST API
```

The Gold datasets therefore act as the bridge between the external aviation datasets and the operational PostgreSQL database used by the Aviation B2B E-Commerce Platform.
