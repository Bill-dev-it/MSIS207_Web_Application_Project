# Database Setup

This directory contains AeroRUL's PostgreSQL schema, Authentication database
setup, optional Gold reference data, and validation scripts.

## Preparing a fresh database

Use a new, empty PostgreSQL database with the `public` schema. Follow this
order:

1. Run [`schema/01_schema.sql`](./schema/01_schema.sql) to create the original
   26-table database schema.
2. Run
   [`authentication/01_authentication_setup.sql`](./authentication/01_authentication_setup.sql)
   to add the Authentication database objects.
3. If reference/demo Gold data is needed, run
   [`seed/load_gold.py`](./seed/load_gold.py) to load the CSV files from
   `data/etl/gold/`. The loader requires `DATABASE_URL` to point to a fresh,
   isolated database and refuses to load if any application table already
   contains rows.
4. Run [`validation/03_validation.sql`](./validation/03_validation.sql) for
   general database validation.
5. Run
   [`authentication/02_authentication_validation.sql`](./authentication/02_authentication_validation.sql)
   to verify the Authentication additions after setup.

The original schema creates 26 tables. After Authentication setup, the
database has 27 tables and 215 columns: two added to `users` and seven in
`account_tokens`.

## Seed data and runtime data

[`seed/02_seed.sql`](./seed/02_seed.sql) documents the Gold seed tables,
columns, source files, and foreign-key load order. It is not a complete,
executable data import. Use `seed/load_gold.py` when Gold reference/demo data
is needed.

Users and account tokens are runtime data managed by application workflows;
they are not Gold seed data. Do not insert demo user accounts or authentication
tokens into the Gold datasets.

## Current database and future changes

The current local PostgreSQL database has already had the Authentication SQL
successfully applied and verified. Do not rerun the base schema, seed loader,
or Authentication setup SQL against that database.

For future database changes, add a new, sequentially numbered SQL file in the
appropriate business-function folder. Do not rewrite
`schema/01_schema.sql` to duplicate changes already applied by setup SQL; it
remains the definition of the original 26-table schema.
