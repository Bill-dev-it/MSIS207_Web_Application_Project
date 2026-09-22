# RUL Service Integration Design

## 1. Overview

The Aviation B2B E-Commerce Platform integrates a Remaining Useful Life (RUL)
prediction service with the e-commerce backend.

The RUL service estimates the remaining operating cycles of an aircraft engine.
The prediction is then used by the application to determine maintenance urgency
and recommend compatible spare parts available from suppliers.

The RUL model is deployed as an independent service and communicates with the
Node.js / Express backend through a REST API.

## 2. Integration Flow

```text
Engine Sensor Data
        │
        ▼
React Frontend
        │
        │ REST API
        ▼
Node.js / Express Backend
        │
        │ Prediction Request
        ▼
AI / RUL Service
        │
        ├── Input Validation
        ├── Sensor Data Preprocessing
        ├── Trained RUL Model
        └── RUL Inference
        │
        ▼
Predicted RUL
        │
        ▼
Node.js / Express Backend
        │
        ├── Store Prediction
        │       ↓
        │   PostgreSQL
        │
        └── Recommendation Engine
                │
                ├── Maintenance Urgency
                ├── Engine / Part Compatibility
                ├── Inventory Availability
                └── Supplier Selection
                        │
                        ▼
                Spare-Part Recommendations
```

## 3. Responsibilities

### Node.js / Express Backend

The main backend is responsible for:

- authenticating and authorizing users;
- identifying the aircraft and engine;
- retrieving engine metadata;
- sending prediction requests to the RUL service;
- receiving prediction results;
- storing prediction records;
- applying business rules;
- finding compatible products;
- checking seller inventory;
- returning recommendations to the frontend.

### AI / RUL Service

The RUL service is responsible only for machine-learning inference:

1. Receive engine sensor data.
2. Validate the input.
3. Apply the preprocessing required by the trained model.
4. Run RUL inference.
5. Return the predicted RUL.

The AI service does **not** manage products, suppliers, orders, inventory,
or e-commerce business logic.

## 4. RUL Prediction API

The Node.js / Express backend communicates with the RUL inference service
through an internal REST API.

### Endpoint

```http
POST /predict
Content-Type: application/json
```

### Prediction Request

Each prediction request contains the engine identifier and the latest
30-cycle sensor window required by the trained RUL model.

```json
{
  "engine_id": 24,
  "engine_model_id": 102,
  "current_cycle": 185,
  "sensor_window": [
    {
      "cycle": 156,
      "sensor_2": 642.15,
      "sensor_3": 1589.70,
      "...": "remaining selected sensor values"
    },
    {
      "cycle": 157,
      "sensor_2": 642.32,
      "sensor_3": 1590.12,
      "...": "remaining selected sensor values"
    }
  ]
}
```

The `sensor_window` contains exactly **30 consecutive cycles**.

Each cycle contains the **14 sensor features selected during model
preprocessing**. The production implementation must use the exact feature
names and ordering defined by the deployed model.

### RUL Service Processing

```text
Prediction Request
        ↓
Input Validation
        ↓
30-cycle Sensor Window
        ↓
Model Preprocessing
        ↓
Trained RUL Model
        ↓
RUL Inference
        ↓
Prediction Response
```

The service validates that the request contains the required window and sensor
features before inference.

### Prediction Response

A successful prediction returns:

```json
{
  "engine_id": 24,
  "predicted_rul": 42.7,
  "unit": "cycles",
  "model_version": "rul-v1",
  "status": "success"
}
```

The RUL service returns the prediction only. Product recommendation and
maintenance business logic remain responsibilities of the Node.js backend.

### Error Response

Example:

```json
{
  "status": "error",
  "error": "INVALID_SENSOR_WINDOW",
  "message": "Expected 30 consecutive sensor cycles."
}
```

No prediction is generated when the input does not satisfy the model
requirements.
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

The RUL workflow is mapped to four main database entities.

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

### Replacement Recommendation

After a successful prediction, the backend uses the RUL result as an input to
the recommendation process.

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

`replacement_recommendations` stores the ranked marketplace listings associated
with a prediction.

The recommendation therefore remains separate from the ML model:

- **RUL Service:** predicts remaining useful life.
- **Backend Recommendation Engine:** determines which spare parts should be
  recommended for purchase.


## 6. Recommendation Flow

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

- the failed prediction request is recorded;
- no fabricated RUL value is generated;
- existing marketplace functionality remains available;
- the frontend receives an appropriate error response;
- the user may retry the prediction later.

This keeps the AI component isolated from the core e-commerce workflow.

## 8. Scope

This document defines the **integration contract and system responsibilities**.

The actual trained model, preprocessing implementation, deployment configuration,
and production inference service will be implemented separately.