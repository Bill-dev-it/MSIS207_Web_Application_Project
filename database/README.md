# Database Setup & Organization

This directory contains AeroRUL's PostgreSQL baseline schema, incremental migrations, Authentication setup scripts, executable seed loaders, and validation scripts.

## Directory Responsibilities

| Directory | Responsibility |
| :--- | :--- |
| [`schema/`](./schema/) | Original baseline DDL ([`01_schema.sql`](./schema/01_schema.sql)) defining the initial 26-table relational schema. Do not rewrite this file to merge later migrations. |
| [`migrations/`](./migrations/) | Incremental schema changes applied after the baseline schema (e.g., [`04_b2b_payment_mvp.sql`](./migrations/04_b2b_payment_mvp.sql) for the B2B Payment MVP). |
| [`authentication/`](./authentication/) | Historical Authentication setup ([`01_authentication_setup.sql`](./authentication/01_authentication_setup.sql)) and validation ([`02_authentication_validation.sql`](./authentication/02_authentication_validation.sql)) scripts. |
| [`seed/`](./seed/) | Executable data-loading scripts ([`load_gold.py`](./seed/load_gold.py)) and feature-specific metadata seed SQL ([`03_ml_model_version_seed.sql`](./seed/03_ml_model_version_seed.sql)). |
| [`validation/`](./validation/) | Database inspection and post-load validation scripts ([`03_validation.sql`](./validation/03_validation.sql)). |
| [`../docs/database/`](../docs/database/) | Explanatory documentation, ERD references, DBML (`database-schema.dbml`), and Gold CSV mapping specifications ([`GOLD_SEED_MAPPING.md`](../docs/database/GOLD_SEED_MAPPING.md)). |

---

## Executable Scripts vs. Documentation

- **Executable SQL / Python Scripts** (located under `database/`):
  - [`schema/01_schema.sql`](./schema/01_schema.sql) — Baseline 26-table DDL.
  - [`authentication/01_authentication_setup.sql`](./authentication/01_authentication_setup.sql) — Adds `users.email_verified_at`, `users.auth_version`, and the `account_tokens` table (bringing the schema to 27 tables and 215 columns).
  - [`authentication/02_authentication_validation.sql`](./authentication/02_authentication_validation.sql) — Read-only verification of Authentication schema objects.
  - [`seed/load_gold.py`](./seed/load_gold.py) — Transactional Python loader for the 10 Gold CSV files in `data/etl/gold/`.
  - [`seed/03_ml_model_version_seed.sql`](./seed/03_ml_model_version_seed.sql) — Registers the FD002 Condition-Aware iTransformer metadata in `ml_model_versions` (required when using the Buyer RUL prediction feature).
  - [`validation/03_validation.sql`](./validation/03_validation.sql) — General database row-count and constraint validation script.
  - [`migrations/04_b2b_payment_mvp.sql`](./migrations/04_b2b_payment_mvp.sql) — Incremental migration enabling `SIMULATION` (`SUCCEEDED`) and `BANK_TRANSFER` (`PENDING`, `SUCCEEDED`, `CANCELLED`) in `public.payments`.
- **Explanatory Documentation** (located under `docs/database/`):
  - [`../docs/database/GOLD_SEED_MAPPING.md`](../docs/database/GOLD_SEED_MAPPING.md) — Documents the 10 Gold CSV tables, columns, foreign-key load order, and [`seed/load_gold.py`](./seed/load_gold.py) behavior (replacing the former comment-only SQL seed reference file).

---

## Preparing a Fresh Database

Use a new, empty PostgreSQL database with the `public` schema. Run the scripts in this conceptual order:

1. **Baseline Schema**: Run [`schema/01_schema.sql`](./schema/01_schema.sql) to create the original 26-table database schema.
2. **Authentication Setup**: Run [`authentication/01_authentication_setup.sql`](./authentication/01_authentication_setup.sql) to add the Authentication columns and `account_tokens` table.
3. **Incremental Migrations**: Run [`migrations/04_b2b_payment_mvp.sql`](./migrations/04_b2b_payment_mvp.sql) so `public.payments` supports explicit `SIMULATION` and `BANK_TRANSFER` lifecycles.
4. **Gold Reference Data (Optional / Recommended for Demo & Marketplace)**: Run [`seed/load_gold.py`](./seed/load_gold.py) with `DATABASE_URL` pointing to the new database to load `data/etl/gold/*.csv`. Note that `load_gold.py` requires all tables in `public` to be empty and will refuse to run if any table already contains rows.
5. **RUL Model Metadata Seed (Required for Buyer RUL Feature)**: Run [`seed/03_ml_model_version_seed.sql`](./seed/03_ml_model_version_seed.sql) after `load_gold.py` (since `load_gold.py` requires an empty schema prior to Gold loading).
6. **Validation**:
   - Run [`validation/03_validation.sql`](./validation/03_validation.sql) for general database validation.
   - Run [`authentication/02_authentication_validation.sql`](./authentication/02_authentication_validation.sql) to verify the Authentication schema objects.

---

## Upgrading an Existing Local Database

- **Do NOT rerun** [`schema/01_schema.sql`](./schema/01_schema.sql), [`seed/load_gold.py`](./seed/load_gold.py), or [`authentication/01_authentication_setup.sql`](./authentication/01_authentication_setup.sql) against an existing local database that already has the baseline schema, Gold data, and Authentication setup applied.
- **Applying the B2B Payment MVP Migration**:
  - [`migrations/04_b2b_payment_mvp.sql`](./migrations/04_b2b_payment_mvp.sql) is idempotent (safely drops prior legacy constraints before adding `chk_payments_b2b_mvp_method_status` and dropping `paid_at NOT NULL`).
  - **Important Role Requirement**: Because PostgreSQL requires table ownership to execute `ALTER TABLE`, migrations must be executed by the database owner/superuser (e.g. `postgres`), not by the limited application DML user (`aviation_app`).
  - **Command (psql)**:
    ```bash
    psql -h localhost -p 5432 -U postgres -d aircraft_marketplace -f database/migrations/04_b2b_payment_mvp.sql
    ```
  - **pgAdmin**: Open the Query Tool connected as `postgres`, open `database/migrations/04_b2b_payment_mvp.sql`, and execute (F5).
  - Existing historical `SIMULATION`/`SUCCEEDED` rows remain completely valid.
- **Applying the RUL Model Version Seed (Required for Buyer RUL Feature)**:
  - [`seed/03_ml_model_version_seed.sql`](./seed/03_ml_model_version_seed.sql) registers the active FD002 Condition-Aware iTransformer model metadata in `public.ml_model_versions`.
  - It is safe and idempotent (`ON CONFLICT (model_name, version) DO NOTHING`).
  - If upgrading an existing local or deployment database where `public.ml_model_versions` was left empty:
    ```bash
    psql -h localhost -p 5432 -U postgres -d aircraft_marketplace -f database/seed/03_ml_model_version_seed.sql
    ```
  - **pgAdmin**: Open the Query Tool connected as `postgres`, open `database/seed/03_ml_model_version_seed.sql`, and execute (F5).
- **Future Schema Changes**:
  - Add new incremental SQL scripts under [`migrations/`](./migrations/). Never destructively rewrite [`schema/01_schema.sql`](./schema/01_schema.sql) as a substitute for a migration.
