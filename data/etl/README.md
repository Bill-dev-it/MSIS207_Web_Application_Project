# Reference Data ETL Pipeline

The B2B Aviation Engine & Parts Marketplace uses a lightweight **Extract, Transform, Load (ETL)** pipeline to prepare external aviation reference datasets and initialize the application's PostgreSQL database.

The pipeline adopts a **Medallion-style Bronze–Silver–Gold structure** to organize data according to its processing stage. These layers support the ETL workflow but do not represent a separate data warehouse.

The overall process is:

**Extract → Transform → Validate → Load**

![Reference ETL Pipeline](./ETL_pipeline.png)

The ETL pipeline prepares the initial reference and demonstration records required by the marketplace. It is **not responsible for processing live marketplace transactions**, which are handled separately through the application backend.

---

## 1. ETL Process Overview

The pipeline consists of three ETL operations implemented across the Bronze, Silver, and Gold layers.

| ETL Operation | Implementation | Input | Output |
|---|---|---|---|
| **Extract** | `clean.py` | Selected raw datasets in Bronze | Source records for cleaning |
| **Transform — Stage 1** | `clean.py` | Extracted FAA and aviation-parts records | Four Silver CSV datasets |
| **Transform — Stage 2** | `build_gold.py` | Silver datasets and application schema | Ten Gold seed CSVs |
| **Validate** | `build_gold.py --check` | Existing Gold CSVs | Validation result |
| **Load** | `load_gold.py` | Validated Gold CSVs | Ten PostgreSQL application tables |

### Extract

External FAA and aviation-parts datasets are first acquired and preserved in the Bronze layer.

During pipeline execution, `clean.py` reads selected Bronze files, extracts the required source records, and prepares them for cleaning and standardization.

The current extraction step operates on **locally stored source files**, rather than directly querying external APIs or downloading datasets automatically.

### Transform

Transformation occurs in two stages.

**Bronze → Silver:** `clean.py` performs cleaning, normalization, deduplication, reference mapping, and data validation.

**Silver → Gold:** `build_gold.py` converts cleaned references into application-specific relational records. It also generates deterministic demonstration entities needed for marketplace workflows.

### Load

The loading stage is implemented separately in `database/seed/load_gold.py`.

The loader connects to PostgreSQL, validates the Gold CSV inputs, checks that the target application schema contains no existing data, and imports the ten seed tables in foreign-key dependency order.

All database inserts are performed within a **single transaction**. If any operation fails, the transaction is rolled back.

After a successful import, PostgreSQL identity sequences are synchronized with the imported IDs.

The loader is designed for **initial database bootstrap**, not continuous synchronization or destructive re-imports.

---

## 2. Bronze Layer — Raw Source Data

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

## 3. Silver Layer — Cleaned & Standardized Data

The **Silver layer** converts selected Bronze sources into consistent reference datasets that can be safely used by the application-data transformation stage.

Processing includes:

- Removing invalid and placeholder records.
- Consolidating duplicate engine models.
- Standardizing identifiers and data types.
- Validating aircraft manufacturing years.
- Extracting supplier references.
- Cleaning and standardizing aviation-part records.
- Preserving source relationships required for later mapping.

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
      |
      +-- Remove invalid records
      +-- Normalize manufacturer/model
      +-- Consolidate duplicates
      |
      v
engine_models.csv
4,712 engine models
```

The Silver layer remains primarily **reference-oriented**. It does not yet represent marketplace entities such as seller listings, buyer-owned aircraft fleets, or application transactions.

---

## 4. Gold Layer — Application-Ready Seed Data

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
Silver Aircraft References
          +
Silver Engine Models
          |
          v
  Demo Fleet Selection
          |
          +-- 24 Aircraft
          +-- 24 Installed Engines
```

And:

```text
300 Silver Parts
        |
        +-- Product Transformation
        +-- Supplier Mapping
        +-- Seller Offer Generation
        +-- Demo Compatibility Mapping
        |
        v
312 Products
936 Seller Listings
146 Compatibility Records
```

### Source Data vs. Demo Data

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

**Important:** Product-engine compatibility records are demonstration relationships and should not be interpreted as manufacturer-certified aircraft fitment data.

This approach allows the application to demonstrate realistic B2B e-commerce workflows without presenting generated commercial information as real-world observations.

---

## 5. Data Quality & Validation

The pipeline validates data before it is considered application-ready.

Current validation covers:

- Required columns and data types.
- Primary and unique identifiers.
- Foreign-key relationships.
- `NOT NULL` requirements.
- Domain and `CHECK` constraints.
- Negative inventory rejection.
- Duplicate aircraft registration rejection.
- Invalid supplier references.
- Missing required product information.

The pipeline is deterministic: running it again with unchanged source data and configuration produces the same Gold dataset.

Bronze integrity is preserved throughout the process.

### Database Loading Safety

The PostgreSQL seed loader additionally enforces:

| Safety Control | Behavior |
|---|---|
| Input validation | Checks Gold CSV files before database import |
| Empty-schema requirement | Refuses to import when application tables already contain data |
| Foreign-key order | Imports tables in dependency order |
| Transaction integrity | Commits all imported tables together or rolls back on failure |
| Identity synchronization | Updates PostgreSQL identity sequences after loading |
| Runtime data protection | Prevents destructive re-import into an active application database |

These controls separate data preparation from operational database management.

---

## 6. Running the ETL Pipeline

Run the following commands from the project root.

### Step 1 — Extract and Transform: Bronze → Silver

```bash
python data/etl/scripts/bronze_to_silver/clean.py
```

This command reads the selected Bronze source files, performs cleaning and standardization, and writes the four Silver datasets.

### Step 2 — Transform: Silver → Gold

```bash
python data/etl/scripts/silver_to_gold/build_gold.py
```

This command generates the ten application-ready Gold CSV files.

### Step 3 — Validate Gold

```bash
python data/etl/scripts/silver_to_gold/build_gold.py --check
```

This command validates the existing Gold datasets without regenerating them.

### Step 4 — Load: Gold → PostgreSQL

Before loading, ensure that:

1. PostgreSQL is running and accessible.
2. The target database has been created.
3. The 26-table application schema has been initialized using `database/schema/01_schema.sql`.
4. The application tables are empty.
5. The connection environment variable points to the intended database.

In PowerShell:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@localhost:5432/DB_NAME"

python database/seed/load_gold.py
```

Replace the placeholder connection details with your own environment-specific values. Do not commit database credentials to the repository.

For cloud-hosted PostgreSQL, the same loader can be used with an appropriate secure connection URL, provided the database is reachable and its schema has been initialized.

**Important:** The loader is intended for first-time database initialization. Running it against a populated application database will be rejected to protect existing data.

---

## 7. ETL and Application Data Lifecycle

The reference ETL pipeline and the live marketplace operate through separate data flows.

**Initial Reference Data Bootstrap**

```text
Bronze
  |
  v
Silver
  |
  v
Gold
  |
  v
PostgreSQL Seed Loader
  |
  v
PostgreSQL OLTP
```

**Marketplace Runtime Operations**

```text
Buyer / Supplier / Admin
          |
          v
     React Frontend
          |
          v
     Express REST API
          |
          v
     PostgreSQL OLTP
```

Once Gold has been imported, PostgreSQL becomes the operational source of truth for marketplace data.

For example, when a supplier updates a product listing's price or inventory, the application updates PostgreSQL through Express. It does not modify the original Gold CSV.

Similarly, regenerating Gold CSVs does not automatically update an existing PostgreSQL database.

Any future reference-data refresh must be performed through a controlled process that preserves application-owned records and transactional data.

The ETL pipeline is therefore responsible for **preparing and loading initial reference data**, while the application backend is responsible for **ongoing operational data management**.

---

## 8. Repository Structure

```text
data/
├── etl/
│   ├── bronze/                 # Original source datasets
│   ├── silver/                 # Cleaned reference datasets
│   ├── gold/                   # Application-ready seed CSVs
│   ├── scripts/
│   │   ├── bronze_to_silver/
│   │   │   └── clean.py
│   │   └── silver_to_gold/
│   │       └── build_gold.py
│   ├── bronze_manifest.csv
│   └── README.md
├── Data_pipeline.png
└── README.md

database/
├── schema/
│   └── 01_schema.sql
├── seed/
│   ├── 02_seed.sql
│   └── load_gold.py
└── validation/
    └── 03_validation.sql
```

The separation between `data/etl/` and `database/` is intentional:

- `data/etl/` manages source datasets, cleaning, transformation, and Gold generation.
- `database/` manages PostgreSQL schema initialization, seed loading, and database validation.

For the broader data architecture, including marketplace transactions and AI/RUL data flows, see the documentation in `docs/data/`.

---

The resulting ETL process provides a reproducible and validated path from selected aviation reference datasets to the marketplace's PostgreSQL database, while maintaining a clear separation between initial data preparation and live business operations.
  ↓
Application / REST API
```

The Gold datasets therefore act as the bridge between the external aviation datasets and the operational PostgreSQL database used by the Aviation B2B E-Commerce Platform.
