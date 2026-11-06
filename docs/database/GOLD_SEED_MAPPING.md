# Gold Seed Data Mapping & Load Specification

This document preserves and expands the Gold seed specification formerly kept as SQL comments in `database/seed/`.

## 1. Purpose and Scope

- **Source Directory**: `data/etl/gold/*.csv`
- **Executable Loader**: [`database/seed/load_gold.py`](../../database/seed/load_gold.py)
- **Baseline Schema Prerequisite**: [`database/schema/01_schema.sql`](../../database/schema/01_schema.sql)

Gold CSV files contain **initial/reference seed data only** for the Aviation B2B E-Commerce Platform.

Runtime and workflow tables—including `users`, `account_tokens`, `carts`, `cart_items`, `wishlist_items`, `orders`, `seller_orders`, `order_items`, `payments`, `shipments`, `sensor_uploads`, `rul_predictions`, `replacement_recommendations`, `reviews`, and `notifications`—are populated by application workflows and must **not** be seeded via Gold CSV files.

> [!NOTE]
> Model version metadata for the Buyer RUL prediction pipeline (`ml_model_versions`) is seeded separately via [`database/seed/03_ml_model_version_seed.sql`](../../database/seed/03_ml_model_version_seed.sql).

---

## 2. Foreign-Key Load Order

Because Gold tables reference one another via foreign keys, [`database/seed/load_gold.py`](../../database/seed/load_gold.py) loads the 10 CSV files in strict dependency order:

1. `companies`
2. `addresses`
3. `categories`
4. `engine_models`
5. `suppliers`
6. `aircraft`
7. `engines`
8. `products`
9. `seller_listings`
10. `product_engine_compatibility`

---

## 3. Gold CSV Table & Column Mapping

### 1. `companies`
- **Source**: `data/etl/gold/companies.csv`
- **Columns**:
  - `company_id`, `company_name`, `company_type`, `tax_id`, `country_code`, `created_at`

### 2. `addresses`
- **Source**: `data/etl/gold/addresses.csv`
- **Foreign Keys**: `company_id` → `companies(company_id)`
- **Columns**:
  - `address_id`, `company_id`, `recipient_name`, `phone`, `address_line`, `city`, `region`, `postal_code`, `country_code`

### 3. `categories`
- **Source**: `data/etl/gold/categories.csv`
- **Columns**:
  - `category_id`, `category_name`, `slug`, `description`

### 4. `engine_models`
- **Source**: `data/etl/gold/engine_models.csv`
- **Columns**:
  - `engine_model_id`, `manufacturer`, `model_name`, `engine_family`, `engine_type`

### 5. `suppliers`
- **Source**: `data/etl/gold/suppliers.csv`
- **Foreign Keys**: `company_id` → `companies(company_id)`
- **Columns**:
  - `supplier_id`, `company_id`, `store_name`, `slug`, `description`, `logo_object_key`, `status`, `created_at`

### 6. `aircraft`
- **Source**: `data/etl/gold/aircraft.csv`
- **Foreign Keys**: `company_id` → `companies(company_id)`
- **Columns**:
  - `aircraft_id`, `company_id`, `registration_number`, `manufacturer`, `model`, `aircraft_type`, `year`, `status`, `created_at`

### 7. `engines`
- **Source**: `data/etl/gold/engines.csv`
- **Foreign Keys**: `aircraft_id` → `aircraft(aircraft_id)`, `engine_model_id` → `engine_models(engine_model_id)`
- **Columns**:
  - `engine_id`, `aircraft_id`, `engine_model_id`, `engine_code`, `serial_number`, `current_cycle`, `created_at`

### 8. `products`
- **Source**: `data/etl/gold/products.csv`
- **Foreign Keys**: `category_id` → `categories(category_id)`
- **Columns**:
  - `product_id`, `category_id`, `product_name`, `manufacturer`, `part_number`, `product_type`, `description`, `technical_specs`, `is_active`, `created_at`

### 9. `seller_listings`
- **Source**: `data/etl/gold/seller_listings.csv`
- **Foreign Keys**: `supplier_id` → `suppliers(supplier_id)`, `product_id` → `products(product_id)`
- **Columns**:
  - `listing_id`, `supplier_id`, `product_id`, `seller_sku`, `condition`, `price`, `stock_quantity`, `lead_time_days`, `status`, `updated_at`

### 10. `product_engine_compatibility`
- **Source**: `data/etl/gold/product_engine_compatibility.csv`
- **Foreign Keys**: `product_id` → `products(product_id)`, `engine_model_id` → `engine_models(engine_model_id)`
- **Columns**:
  - `product_id`, `engine_model_id`, `evidence_reference`, `is_demo`

---

## 4. Role of `database/seed/load_gold.py`

[`database/seed/load_gold.py`](../../database/seed/load_gold.py) is the single executable loader for Gold CSV reference data:

1. **Pre-Flight CSV Validation**: Verifies that all 10 CSV files exist under `data/etl/gold/`, have valid non-empty snake_case column headers, and contain consistent column counts per row before connecting to PostgreSQL.
2. **Single-Transaction Safety & Advisory Lock**: Opens one PostgreSQL transaction (`autocommit=False`) and acquires `pg_advisory_xact_lock(83012026)` to prevent concurrent seed runs.
3. **Empty-Schema Guard**: Verifies `current_schema() == 'public'`, checks that all required tables exist, and refuses to run (`RuntimeError`) if **any** table in `public` already contains rows.
4. **Header-to-Schema Verification & `COPY`**: Compares each CSV header against `information_schema.columns` in ordinal order, streams records via `COPY ... FROM STDIN WITH (FORMAT CSV, HEADER TRUE, NULL '')`, and verifies the inserted row count.
5. **Identity Sequence Synchronization**: Because explicit IDs in `COPY` do not advance PostgreSQL `GENERATED BY DEFAULT AS IDENTITY` sequences, the script inspects identity columns on all loaded tables and executes `ALTER SEQUENCE ... RESTART WITH <max_id + 1>` inside the same transaction so subsequent application inserts never collide with seeded IDs.

