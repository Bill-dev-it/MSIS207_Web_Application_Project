# Bronze Layer — Raw Source Data

The Bronze layer contains the **original raw datasets** collected for the
Aviation B2B E-Commerce Platform.

Its purpose is to preserve source data before any cleaning, transformation, or
application-specific mapping is performed.

```text
External Data Sources
        ↓
Bronze — Raw Data
        ↓
Silver — Cleaned & Standardized Data
```

## Data Sources

Bronze contains raw data from multiple domains used by the project, including:

- FAA aircraft and engine reference data;
- NASA C-MAPSS engine degradation data;
- aviation spare-parts data;
- supply-chain and inventory data;
- e-commerce reference data.

Not every Bronze dataset or record is required in the final application. Relevant
data is selected and processed during the Bronze → Silver transformation.

## Data Integrity

Bronze data is treated as **immutable**.

Source files should not be manually cleaned or modified. All cleaning and
standardization must be performed by the transformation scripts and written to
the Silver layer.

```text
Bronze (Original)
       │
       │ Clean & Standardize
       ▼
Silver (Processed)
```

This preserves the original datasets for **traceability and reproducibility**.
