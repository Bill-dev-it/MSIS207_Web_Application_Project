# RUL Service Integration Design

> **Current runtime status:** The approved architecture is implemented as
> React → authenticated Express Buyer API → internal FastAPI HTTP API →
> Condition-Aware iTransformer. Express calls FastAPI over HTTP and persists
> successful results in the existing PostgreSQL schema; FastAPI does not access
> Buyer authentication or the database. The service loads its frozen model and
> scaler once at startup. The standalone Python CLI remains for offline use
> only. Compatible-part recommendations are not implemented. See the current
> [Buyer RUL runtime contract](./README.md) and
> [REST API documentation](../api/README.md) for authoritative behavior.

## 1. Overview

The Aviation B2B E-Commerce Platform integrates a Remaining Useful Life (RUL)
prediction service with the e-commerce backend.

The RUL service estimates the remaining operating cycles of an aircraft engine.
The current application stores successful predictions and derives a project
demo urgency label. The compatible-parts recommendation workflow described
later in this document is a planned design, not an implemented feature.

The RUL model is deployed as an independent service and communicates with the
Node.js / Express backend through a REST API.

## Architecture diagram references

The system diagrams preserve the broader architecture and workflow, including
future recommendation concepts:

- [00 — Master System Architecture](<../architecture/diagrams/System_Design_ver 1.0-00 Master System Architecture.drawio.svg>) — overall system boundary for the RUL workflow.
- [05 — AI/RUL & Recommendation](<../architecture/diagrams/System_Design_ver 1.0-05 AI-RUL & Recommendation.drawio.svg>) — inference pipeline, model input/output, and recommendation process.
- [07 — End-to-End Integration](<../architecture/diagrams/System_Design_ver 1.0-07 End-to-End Integration.drawio.svg>) — end-to-end request flow from UI through business logic to RUL and cart checkout.

See also: [Architecture overview](../architecture/README.md).

## Original System Design and Responsibilities

The original System Design's service boundary is now the implemented runtime:
Express sends validated CSV to an internal FastAPI REST service. The detailed
current endpoint contracts and local startup instructions are in the linked
runtime documentation above. Recommendation-generation items below remain
deferred and are not part of the current application behavior.

## 2. Integration Flow

![RUL integration flow](./images/RUL_integration.jpg)
## 3. Responsibilities

### Node.js / Express Backend

The current backend is responsible for:

- authenticating and authorizing users;
- identifying the aircraft and engine;
- sending prediction requests to the RUL service;
- receiving prediction results;
- storing prediction records;
- deriving the project's demo urgency label;
- returning prediction history and results to the frontend.

The following recommendation responsibilities are planned and are not part of
the current RUL implementation:

- finding compatible products;
- checking seller inventory for recommendation candidates;
- returning RUL-based recommendations to the frontend.

### AI / RUL Service

The RUL service is responsible only for machine-learning inference:

1. Receive engine sensor data.
2. Validate the input.
3. Apply the preprocessing required by the trained model.
4. Run RUL inference.
5. Return the predicted RUL.

The AI service does **not** manage products, suppliers, orders, inventory,
or e-commerce business logic.

## 4. Internal FastAPI REST API

The public React client calls only the authenticated Express Buyer endpoints.
Express sends the raw CSV to FastAPI on the private service network using the
shared `X-RUL-Service-Token`.

| Method | Internal path | Contract |
|---|---|---|
| GET | `/health` | Authenticated readiness status and model-loaded state |
| GET | `/v1/model-info` | Authenticated model metadata and input contract |
| POST | `/v1/predict` | Authenticated raw `text/csv; charset=utf-8` body, maximum 1 MiB |

`POST /v1/predict` requires 19 input columns, unique headers, one unit, at
least 30 observations, no ground-truth labels, and valid numeric data accepted
by the frozen preprocessor. It returns the existing inference result as JSON:

```json
{
  "success": true,
  "model_id": "condition_aware_itransformer_v3",
  "dataset": "NASA_CMAPSS_FD002",
  "predicted_rul_cycles": 19.33,
  "unit": "engine_cycles",
  "input_summary": {
    "engine_id": 1,
    "total_cycles_provided": 30,
    "window_length_used": 30
  }
}
```

Failures use `{ "success": false, "error": { "code": "...", "message": "..." } }`.
The internal FastAPI contract and local service startup are documented in
[`./README.md`](./README.md). It is separate from the public Express
Buyer API and does not receive Buyer identity or connect to PostgreSQL.

The existing FastAPI service reuses the actual inference runner and loads the
frozen model/scaler once per worker at startup. The standalone
`predict_cli.py` is for offline use only.
## 5. Prediction Storage

Successful predictions are stored in the `rul_predictions` table.

The prediction record links:

```text
Engine
  │
  ├── Sensor Upload
  │
  ├── Model Version
  │
  └── Predicted RUL
```

This allows the application to keep prediction history and identify which model
version produced each result.


## Database Mapping

The implemented prediction workflow uses `sensor_uploads`, `rul_predictions`,
and `ml_model_versions`. The diagram also includes
`replacement_recommendations` as a planned extension; current RUL prediction
does not write or generate recommendation records.

```text
sensor_uploads
      │
      │ provides engine sensor data
      ▼
rul_predictions
      │
      │ uses
      ├──────────────► ml_model_versions
      │
      │ produces prediction
      ▼
replacement_recommendations
      │
      │ references available marketplace listings
      ▼
seller_listings
```

### Sensor Upload

`sensor_uploads` represents the sensor dataset submitted for an engine.

It records:

- the target engine;
- the user who uploaded the data;
- the original file information;
- dataset cycle range;
- validation status.

A validated sensor upload can be used as the input source for an RUL prediction.

### Model Version

`ml_model_versions` identifies the exact model configuration used for inference.

It stores information such as:

- model name and version;
- model artifact location;
- preprocessing version;
- sensor schema;
- window size;
- scaler configuration.

This allows predictions to remain traceable when the RUL model changes.

### RUL Prediction

`rul_predictions` connects:

```text
Engine
+
Sensor Upload
+
Model Version
        ↓
Predicted RUL
```

Each prediction records the model and input dataset used to produce the result,
together with the predicted RUL and prediction status.

### Planned: Replacement Recommendation

The original design proposes using a successful prediction as an input to a
future recommendation process. This flow is not implemented.

```text
RUL Prediction
        +
Maintenance Urgency
        +
Engine / Part Compatibility
        +
Seller Inventory
        ↓
Replacement Recommendations
```

In the planned design, `replacement_recommendations` would store ranked
marketplace listings associated with a prediction.

The recommendation therefore remains separate from the ML model:

- **RUL Service:** predicts remaining useful life.
- **Backend Recommendation Engine:** determines which spare parts should be
  recommended for purchase.


## 6. Planned Recommendation Flow

RUL prediction alone does not directly select a product.

The backend combines the prediction with operational and marketplace data:

```text
Predicted RUL
      +
Maintenance Rules
      +
Engine / Part Compatibility
      +
Seller Inventory
      +
Supplier / Listing Data
      ↓
Spare-Part Recommendations
```

The resulting recommendations can then be displayed in the buyer portal.

## 7. Failure Handling

If the RUL service is unavailable or inference fails:

- the request returns an error and does not create a successful prediction;
- no fabricated RUL value is generated;
- existing marketplace functionality remains available;
- the frontend receives an appropriate error response;
- the user may retry the prediction later.

This keeps the AI component isolated from the core e-commerce workflow.

## 8. Scope

This document records the broader system design and current service boundary.
The frozen model, preprocessing, FastAPI inference service, Express integration,
and PostgreSQL persistence are implemented. The recommendation flow remains
planned and deferred; see the [current RUL runtime contract](./README.md).
