# Data

This directory contains the data assets and processing workflows used to prepare reference datasets for the **B2B Aviation Engine & Parts Marketplace**.

The current implementation focuses on a lightweight **Extract, Transform, Load (ETL)** workflow that converts external aviation reference data into validated application-ready seed datasets.

## Directory Structure

```text
data/
├── etl/
│   ├── bronze/                 # Original source datasets
│   ├── silver/                 # Cleaned and standardized references
│   ├── gold/                   # Application-ready seed datasets
│   ├── scripts/                # ETL transformation scripts
│   ├── bronze_manifest.csv     # Source dataset inventory
│   └── README.md               # Detailed ETL documentation
├── Data_pipeline.png          # ETL workflow diagram
└── README.md
```

## Reference Data ETL

The reference-data workflow follows:

**External Sources → Bronze → Silver → Gold → PostgreSQL**

- **Bronze:** Preserves raw FAA and aviation-parts source datasets.
- **Silver:** Contains cleaned and standardized reference records.
- **Gold:** Contains ten relational seed datasets aligned with the application schema.
- **PostgreSQL:** Stores the validated seed data in the operational OLTP database.

The ETL workflow is used for initial database preparation. Live marketplace transactions are handled separately by the application backend.

For pipeline implementation, dataset descriptions, validation rules, and execution instructions, see the **[Reference Data ETL Documentation](etl/README.md)**.

## Related Documentation

- [Overall Data Architecture](../docs/data/overall_data_architecture.md)
- [Database Documentation](../docs/database/README.md)

The `data/` directory manages reference-data preparation. Database schemas and seed-loading logic are maintained separately under `database/`.