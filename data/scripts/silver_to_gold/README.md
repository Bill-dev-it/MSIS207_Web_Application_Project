# Silver to gold

Run `python data/scripts/silver_to_gold/build_gold.py` after the cleaning step.
Run `python data/scripts/silver_to_gold/build_gold.py --check` to validate existing CSVs.

The builder combines cleaned references with reproducible custom demo data
(seed 42) into one application-ready Gold seed. Gold is intentionally one
dataset to keep the initial PostgreSQL import and cloud deployment simple; it
is not split into separate reference and demo folders. Output columns come
from docs/database/database-schema.dbml. It validates types, required values,
uniqueness, foreign keys and declared CHECK constraints before writing. Local
constraint validation uses an in-memory SQLite connection; the application
remains PostgreSQL. No server is contacted.

It writes only ten managed gold tables. Company/category prerequisites are
included. Users, transactions, images, model artifacts and inference outputs
are not invented. Gold is a seed dataset, not an existing-database migration.
Source context is retained where the current schema supports it, especially
in products.technical_specs and compatibility evidence. DEMO-* values and
is_demo=true identify synthetic sample data rather than verified commercial
data.
