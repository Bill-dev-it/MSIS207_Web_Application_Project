# Bronze to silver

Run `python data/scripts/bronze_to_silver/clean.py` from the project root.

The script reads FAA ENGINE/ACFTREF/MASTER and parts_master, trims fields,
removes invalid identity records, consolidates duplicate engine identities while
preserving source codes, normalizes numeric fields and writes four silver CSVs.
Year validation uses the demo snapshot year 2026. Original source files are never
modified. Counts are printed to the terminal; no mapping/report folder is created.

Outputs: silver/aircraft/aircraft.csv, silver/engines/engine_models.csv,
silver/products/parts.csv and silver/suppliers/suppliers.csv.
