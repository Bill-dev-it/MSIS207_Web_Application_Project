# Database & Data Architecture

This directory contains the database design, data architecture, and data processing documentation for the **Aviation B2B E-Commerce Platform**.

The platform combines traditional B2B e-commerce functionality with aircraft engine health monitoring and AI-based Remaining Useful Life (RUL) prediction.

Unlike a conventional marketplace where users manually search for products, this platform can use engine condition information to identify potential maintenance needs and connect them with compatible spare parts available from suppliers.

The overall data flow can be summarized as:

**Aircraft / Engine → Sensor Data → RUL Prediction → Maintenance Need → Compatible Parts → Supplier Listings → Purchase**

---

## 1. Database Overview

The system uses **PostgreSQL** as its primary relational database.

PostgreSQL stores both operational e-commerce data and aviation-related data required by the RUL recommendation workflow.

The database supports five main business domains:

| Domain | Main Responsibility |
|---|---|
| Identity & Organization | Users, companies, addresses, and platform access |
| Aviation Assets | Aircraft, engines, and engine models |
| Marketplace | Products, suppliers, listings, inventory, and compatibility |
| Commerce | Cart, orders, payments, shipments, and reviews |
| AI & Maintenance | Sensor uploads, model versions, RUL predictions, and replacement recommendations |

The database is designed as the **operational source of truth** for the application.

It is not intended to be a traditional analytical data warehouse. Instead, it supports real-time marketplace operations, aircraft asset management, and the integration between the web application and the RUL prediction service.

---

## 1.1 Database ERD

The Entity Relationship Diagram (ERD) represents the main entities and relationships used by the Aviation B2B E-Commerce Platform.

![Database ERD](./ERD_B2B_ecommerce_Website.png)

The editable database schema is available in:

`database-schema.dbml`

The schema is written using **DBML (Database Markup Language)** and can be visualized using dbdiagram.io.

### Online Database Documentation

The interactive database documentation is available at:

https://dbdocs.io/billbush0511/ERD-B2B-ecommerce-RUL-Website?view=relationships

---

# 2. Data Architecture

The Aviation B2B E-Commerce Platform combines multiple aviation, supply-chain, and e-commerce data sources.

No single public dataset contains all information required by the system, such as:

- aircraft and engine information;
- engine sensor data;
- Remaining Useful Life information;
- aviation spare parts;
- suppliers;
- inventory;
- orders;
- payments;
- shipping;
- and reviews.

Therefore, the project uses a structured data integration approach that transforms multiple datasets into one unified operational database.

The data architecture contains four logical layers:

1. **Source Data Layer**
2. **Data Preparation Layer**
3. **Operational Data Layer**
4. **AI & Recommendation Layer**

The high-level processing flow is:

```text
External / Research Datasets
            │
            ▼
     Source Data Layer
            │
            ▼
   Data Preparation Layer
   Clean • Validate • Map
            │
            ▼
       PostgreSQL
   Operational Database
        │           │
        │           ▼
        │      AI / RUL Service
        │           │
        │           ▼
        │      RUL Prediction
        │           │
        └───────────┘
              │
              ▼
      Recommendation Logic
              │
              ▼
      B2B Marketplace
```

---

# 3. Source Data Layer

The platform integrates multiple datasets because each source represents a different part of the business domain.

These datasets are mainly used to initialize, simulate, validate, or enrich the platform's operational data.

| Data Source | Main Purpose |
|---|---|
| NASA C-MAPSS | Engine degradation and sensor-cycle data used for RUL prediction |
| FAA Aircraft / Engine Data | Reference information about aircraft and engine models |
| Aviation Spare Parts Dataset | Aviation-specific spare-part information, demand, inventory, and stockout attributes |
| Supply Chain Datasets | Supplier, inventory, stock quantity, lead time, shipping, and availability information |
| E-Commerce Datasets | Customer, seller, product, order, payment, shipping, and review structures |
| Project-Generated Data | Application-specific records not directly available from public datasets |

These datasets should not be interpreted as one single production database.

Instead, they provide source information that is cleaned, standardized, mapped, and loaded into the PostgreSQL schema used by the web application.

Once the platform is running, new operational records such as users, carts, orders, payments, reviews, sensor uploads, and predictions are generated directly through the application.

---

## 3.1 Aviation & Engine Data

Aviation-related data provides the physical asset context required by the platform.

The main entities include:

- `aircraft`
- `engines`
- `engine_models`

An aircraft represents an asset operated by a buyer organization.

Each aircraft can contain one or more engines, while each engine references an engine model.

This relationship allows the system to connect:

**Buyer Organization → Aircraft → Engine → Engine Model**

This information becomes important when RUL predictions and spare-part compatibility rules are evaluated.

---

## 3.2 Engine Sensor Data

Engine sensor data represents the operating condition of an engine over time.

NASA C-MAPSS is used as the primary research dataset for developing and validating the RUL prediction model.

Within the web platform, uploaded sensor data is represented through the `sensor_uploads` entity.

A sensor upload records information such as:

- associated engine;
- uploader;
- source object/file;
- dataset subset;
- cycle range;
- validation status;
- processing status.

The raw sensor data itself does not need to be stored entirely as relational columns in the operational database.

Instead, PostgreSQL stores the metadata required to track each upload and connect it with prediction results.

---

## 3.3 Spare Parts & Supplier Data

Aviation spare-parts and supply-chain datasets provide the basis for marketplace products and supplier availability.

The relevant entities include:

- `products`
- `categories`
- `suppliers`
- `seller_listings`
- `product_engine_compatibility`

A `product` represents a spare part in the marketplace.

A `supplier` represents an organization capable of selling one or more parts.

The `seller_listings` table connects suppliers and products while storing supplier-specific commercial information such as:

- price;
- stock quantity;
- condition;
- lead time;
- listing status.

This separation allows the same aviation part to be offered by multiple suppliers at different prices, stock levels, and lead times.

This is an important characteristic of the B2B marketplace model:

```text
Product
   │
   ├── Supplier A → Price A → Stock A → Lead Time A
   │
   ├── Supplier B → Price B → Stock B → Lead Time B
   │
   └── Supplier C → Price C → Stock C → Lead Time C
```

---

# 4. Data Preparation Layer

The source datasets originate from different domains and therefore use different schemas, naming conventions, identifiers, and data formats.

They cannot be inserted directly into the production database without preparation.

The Data Preparation Layer converts heterogeneous source data into a consistent structure that matches the application's relational schema.

The general transformation process is:

```text
Raw Dataset
     │
     ▼
Data Inspection
     │
     ▼
Cleaning
     │
     ▼
Standardization
     │
     ▼
Identifier Mapping
     │
     ▼
Relationship Validation
     │
     ▼
Application Schema Mapping
     │
     ▼
PostgreSQL
```

---

## 4.1 Data Cleaning

The cleaning stage identifies records that may cause problems when loaded into the application database.

Typical operations include:

- removing duplicate records;
- identifying missing values;
- correcting inconsistent data types;
- standardizing text values;
- validating numeric fields;
- validating dates and timestamps;
- removing unusable records where appropriate.

The goal is not to modify the meaning of the source data, but to ensure that records can be represented consistently in the application's database.

---

## 4.2 Data Standardization

Different datasets may describe the same concept using different names or formats.

For example:

```text
Source A: engine_model
Source B: model
Source C: engine_type
```

These attributes must be reviewed and mapped to the appropriate application entities.

The platform therefore standardizes important concepts such as:

- aircraft identifiers;
- engine model identifiers;
- product identifiers;
- supplier identifiers;
- country codes;
- timestamps;
- monetary values;
- inventory quantities;
- product categories.

---

## 4.3 Schema Mapping

After cleaning and standardization, source attributes are mapped into the relational schema.

Examples include:

```text
FAA / Aviation Reference Data
        ↓
aircraft
engine_models
engines
```

```text
Aviation Spare Parts Data
        ↓
products
categories
product_engine_compatibility
```

```text
Supply Chain Data
        ↓
suppliers
seller_listings
inventory-related attributes
```

```text
E-Commerce Data
        ↓
users
companies
orders
order_items
payments
shipments
reviews
```

Not every field must originate from an external dataset.

Application-specific fields can be generated by the platform when required.

---

# 5. Operational Data Layer

PostgreSQL acts as the primary operational database and the **single source of truth** for the application.

The Node.js / Express backend accesses this database through the application's data-access layer / ORM.

The React frontend does **not** communicate directly with PostgreSQL.

The normal application flow is:

```text
React Frontend
      │
      │ REST API / HTTPS
      ▼
Node.js / Express
      │
      │ SQL / ORM
      ▼
PostgreSQL
```

This architecture keeps database access and business logic inside the backend application.

---

## 5.1 Identity & Organization Domain

The Identity & Organization domain manages users and organizations participating in the marketplace.

Main entities include:

- `users`
- `companies`
- `addresses`
- `notifications`

A company can represent a buyer organization, supplier organization, airline, MRO, operator, or another organization participating in the platform.

Users belong to organizations and access platform functionality according to their roles and permissions.

---

## 5.2 Aviation Asset Domain

The Aviation Asset domain represents aircraft and engines managed by buyer organizations.

Main entities include:

- `aircraft`
- `engines`
- `engine_models`

The core relationship is:

```text
Company
   │
   ▼
Aircraft
   │
   ▼
Engine
   │
   ▼
Engine Model
```

This structure allows predictions and recommendations to be associated with real platform assets rather than existing as isolated AI outputs.

---

## 5.3 Marketplace Domain

The Marketplace domain manages spare parts and supplier offerings.

Main entities include:

- `categories`
- `products`
- `product_images`
- `suppliers`
- `seller_listings`
- `product_engine_compatibility`

The distinction between `products` and `seller_listings` is important.

`products` describes **what the part is**.

`seller_listings` describes **how a particular supplier sells that part**.

For example:

```text
Product
CFM56 Fuel Pump
        │
        ├── Supplier A
        │      Price: ...
        │      Stock: ...
        │      Lead Time: ...
        │
        └── Supplier B
               Price: ...
               Stock: ...
               Lead Time: ...
```

This enables supplier comparison and supports the B2B nature of the marketplace.

---

## 5.4 Commerce Domain

The Commerce domain supports the purchasing lifecycle.

Main entities include:

- `carts`
- `cart_items`
- `orders`
- `seller_orders`
- `order_items`
- `payments`
- `shipments`
- `reviews`
- `wishlist_items`

The normal commerce flow is:

```text
Product / Listing
       │
       ▼
      Cart
       │
       ▼
     Order
       │
       ▼
 Seller Order
       │
       ├── Payment
       │
       └── Shipment
```

Because one B2B order may contain products from different suppliers, supplier-specific order processing can be represented separately through `seller_orders`.

---

# 6. AI & RUL Prediction Layer

The AI service is designed as an independent service connected to the main application.

Its primary responsibility is to estimate the **Remaining Useful Life (RUL)** of an aircraft engine from engine sensor data.

The high-level inference pipeline is:

```text
Engine Sensor Data
        │
        ▼
Input Validation
        │
        ▼
Sensor Data Preprocessing
        │
        ▼
Trained RUL Model
        │
        ▼
RUL Inference
        │
        ▼
Predicted RUL
        │
        ▼
rul_predictions
```

---

## 6.1 Model Version Management

The `ml_model_versions` table stores information about model versions used by the RUL service.

This makes predictions traceable.

A prediction can therefore answer questions such as:

- Which model generated this result?
- Which preprocessing version was used?
- Which sensor configuration was expected?
- Which window size was used?

This is particularly useful when different versions of the RUL model are deployed during development.

---

## 6.2 Sensor Upload Processing

Engine condition data enters the AI pipeline through a sensor upload.

The platform records the upload in `sensor_uploads` and associates it with a registered engine.

The processing flow is:

```text
Registered Engine
       │
       ▼
Sensor Upload
       │
       ▼
Validation
       │
       ▼
RUL Service
       │
       ▼
Prediction
```

The AI service performs the preprocessing required by the trained model before inference.

---

## 6.3 RUL Prediction

After preprocessing, the trained model estimates the engine's Remaining Useful Life.

The result is stored in:

`rul_predictions`

A prediction can contain information such as:

- associated engine;
- sensor upload;
- model version;
- predicted RUL;
- prediction cycle;
- urgency;
- processing status;
- prediction timestamp.

The prediction is not treated as a product recommendation by itself.

Instead, it becomes an input to the Recommendation Engine.

---

# 7. RUL-Driven Recommendation Flow

The Recommendation Engine connects the AI component with the e-commerce marketplace.

This is one of the central features of the platform.

A conventional e-commerce platform typically follows:

```text
Search
  ↓
Product
  ↓
Cart
  ↓
Order
```

The Aviation B2B E-Commerce Platform additionally supports:

```text
Engine Condition
       ↓
RUL Prediction
       ↓
Maintenance Need
       ↓
Compatible Parts
       ↓
Available Supplier Listings
       ↓
Recommended Spare Parts
       ↓
Purchase
```

The Recommendation Engine therefore converts an engineering prediction into an actionable procurement workflow.

---

## 7.1 Recommendation Stages

The recommendation process consists of several logical stages.

| Stage | Business Question |
|---|---|
| Predicted RUL | How much useful operating life is estimated to remain? |
| Maintenance Urgency | How urgently should maintenance or replacement be considered? |
| Engine-Part Compatibility | Which spare parts are applicable to this engine model? |
| Inventory Availability | Which compatible parts are currently available? |
| Supplier / Product Selection | Which supplier listings satisfy the purchasing requirements? |
| Replacement Recommendation | Which parts should be presented to the buyer? |

The output of this process can be stored in:

`replacement_recommendations`

---

## 7.2 Engine-Part Compatibility

The `product_engine_compatibility` relationship connects marketplace products with supported engine models.

Conceptually:

```text
Engine
   │
   ▼
Engine Model
   │
   ▼
Compatibility Rules
   │
   ▼
Compatible Products
```

This prevents the Recommendation Engine from treating every marketplace product as a possible replacement part.

Only products associated with the relevant engine model should proceed to the next recommendation stage.

---

## 7.3 Inventory & Supplier Filtering

Compatible products are then evaluated against active supplier listings.

The system can consider information such as:

- listing status;
- stock quantity;
- product condition;
- unit price;
- supplier;
- lead time.

Conceptually:

```text
Compatible Products
        │
        ▼
Active Seller Listings
        │
        ▼
Inventory Availability
        │
        ▼
Supplier / Product Candidates
```

This connects engineering requirements with actual marketplace availability.

---

# 8. End-to-End Example

Consider a buyer organization operating an aircraft registered in the platform.

The aircraft contains an engine whose condition needs to be evaluated.

### Step 1 — Engine Registration

The organization registers its aircraft and engine information.

```text
Buyer Company
      ↓
Aircraft
      ↓
Engine
```

### Step 2 — Sensor Data Submission

Engine sensor data is submitted and associated with the registered engine.

```text
Engine
   ↓
Sensor Upload
```

### Step 3 — RUL Prediction

The AI service processes the sensor data.

```text
Sensor Upload
      ↓
Preprocessing
      ↓
RUL Model
      ↓
Predicted RUL
```

The result is stored in `rul_predictions`.

### Step 4 — Maintenance Evaluation

The system interprets the prediction using maintenance/business rules.

```text
Predicted RUL
      ↓
Maintenance Urgency
```

A lower predicted RUL can result in a higher maintenance urgency.

### Step 5 — Compatible Part Identification

The engine model is used to identify compatible spare parts.

```text
Engine
   ↓
Engine Model
   ↓
product_engine_compatibility
   ↓
Compatible Products
```

### Step 6 — Marketplace Availability

The system checks supplier listings for those products.

```text
Compatible Products
        ↓
seller_listings
        ↓
Stock + Price + Lead Time
```

### Step 7 — Recommendation

The Recommendation Engine ranks or filters suitable supplier listings and creates replacement recommendations.

```text
RUL
 +
Compatibility
 +
Inventory
 +
Supplier Listings
        │
        ▼
Replacement Recommendation
```

### Step 8 — Purchase

The buyer can then continue through the normal e-commerce process.

```text
Recommended Part
       ↓
Product / Supplier Listing
       ↓
Cart
       ↓
Order
       ↓
Payment
       ↓
Shipment
```

Therefore, the complete business flow becomes:

```text
Aircraft
   │
   ▼
Engine
   │
   ▼
Sensor Data
   │
   ▼
RUL Prediction
   │
   ▼
Maintenance Urgency
   │
   ▼
Compatible Spare Parts
   │
   ▼
Supplier & Inventory Availability
   │
   ▼
Recommended Spare Parts
   │
   ▼
Cart
   │
   ▼
Order
   │
   ├── Payment
   │
   └── Shipment
```

---

# 9. Business Value of the Data Architecture

The database architecture is designed to connect aircraft maintenance information with the B2B procurement process.

The main objective is not simply to store e-commerce transactions or RUL predictions independently.

Instead, the platform connects:

**Aircraft Condition → Maintenance Decision → Spare-Part Procurement**

This integration allows the system to support several business capabilities:

| Capability | Business Value |
|---|---|
| Engine Health Monitoring | Provides visibility into the condition of registered engines |
| RUL Prediction | Estimates remaining useful operating life |
| Maintenance Urgency | Helps identify when maintenance attention may be required |
| Part Compatibility | Reduces irrelevant spare-part recommendations |
| Supplier Availability | Connects maintenance needs with currently available inventory |
| B2B Marketplace | Allows organizations to purchase required aviation parts |
| Traceable Predictions | Records which model and sensor input generated each RUL result |

The resulting architecture transforms the RUL model from an isolated machine-learning component into a feature that directly supports the e-commerce purchasing workflow.

---

# 10. Data Ownership & Runtime Data

The external datasets are primarily used for project initialization, research, simulation, and reference data.

After initialization, the application itself becomes responsible for generating operational data.

For example:

| Data | Generated By |
|---|---|
| User accounts | Web application |
| Companies | Web application / seed data |
| Aircraft & Engines | Buyer registration / seed data |
| Products | Seed data / supplier management |
| Seller Listings | Supplier portal |
| Cart | Buyer activity |
| Orders | Buyer checkout |
| Payments | Checkout/payment workflow |
| Shipments | Order fulfillment workflow |
| Reviews | Buyer activity |
| Sensor Uploads | Buyer / engine monitoring workflow |
| RUL Predictions | AI service |
| Replacement Recommendations | Recommendation Engine |
| Notifications | Application business events |

This distinction is important because the final application does not continuously depend on the original public datasets to function.

The datasets provide the initial data foundation, while the running application creates and manages its own operational records.

---

# 11. Repository Files

The main database artifacts are:

```text
database/
│
├── README.md
├── database-schema.dbml
└── ERD_B2B_ecommerce_Website.png
```

- **`README.md`** — explains the database architecture, data pipeline, and business data flow.
- **`database-schema.dbml`** — source definition of the relational database schema.
- **`ERD_B2B_ecommerce_Website.png`** — visual Entity Relationship Diagram.

---

# 12. Technology Stack

| Component | Technology |
|---|---|
| Relational Database | PostgreSQL |
| Database Schema | DBML |
| ERD / Documentation | dbdiagram.io / dbdocs |
| Backend | Node.js / Express |
| Frontend | React |
| AI Component | RUL Prediction Service |
| Cloud Environment | AWS |
| External Delivery / Security | Cloudflare |

---

# 13. Architecture Summary

The database architecture supports three tightly connected areas:

```text
┌──────────────────────┐
│   AVIATION DOMAIN    │
│ Aircraft             │
│ Engines              │
│ Sensor Data          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    AI / RUL DOMAIN   │
│ RUL Prediction       │
│ Maintenance Urgency  │
│ Recommendation       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  E-COMMERCE DOMAIN   │
│ Products             │
│ Suppliers            │
│ Inventory            │
│ Orders               │
│ Payments             │
│ Shipments            │
└──────────────────────┘
```

Together, these components implement the main concept of the platform:

> **Use aircraft engine condition and Remaining Useful Life predictions to support timely B2B aviation spare-parts procurement.**

The database therefore serves not only as storage for the web application, but also as the integration point between **aircraft assets, AI-based predictive maintenance, supplier inventory, and B2B e-commerce transactions**.
