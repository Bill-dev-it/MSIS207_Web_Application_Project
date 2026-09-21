# MSIS207_Web_Application_Project

## Data layout

```text
data/
  bronze/                 # original downloads, unchanged
    cmapss/
    faa/
    aviation_parts/
    supply_chain/
    ecommerce/
  silver/                 # cleaned reference datasets
    aircraft/
    engines/
    products/
    suppliers/
  gold/                   # schema-aligned demo seed data
scripts/
  bronze_to_silver/
  silver_to_gold/
  notebooks/
docs/database/            # current website schema and documentation
archive/                  # previous Dataset repository and old empty folders
```

See [data layer guide](data/README.md) for source locations and pipeline status.
The current schema is [database-schema.dbml](docs/database/database-schema.dbml).
Run scripts/bronze_to_silver/clean.py then scripts/silver_to_gold/build_gold.py.
Silver contains cleaned references; gold combines those references with custom demo seed data.
