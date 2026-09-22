# REST API Design

This document defines the REST API structure for the Aviation B2B E-Commerce Platform.

The API acts as the communication layer between the React frontend, PostgreSQL database, and the AI/RUL service.

## Base URL

```text
/api/v1
```

All API requests and responses use JSON unless otherwise specified.

## Authentication

Protected endpoints require a JWT access token:

```http
Authorization: Bearer <access_token>
```

The platform supports three main user roles:

- Buyer
- Supplier
- Administrator

## Standard Response Format

Successful response:

```json
{
  "success": true,
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Requested resource was not found."
  }
}
```

## API Endpoint Overview

| Module | Method | Endpoint | Access | Purpose |
|---|---|---|---|---|
| Authentication | POST | `/auth/register` | Public | Register a new account |
| Authentication | POST | `/auth/login` | Public | Authenticate user |
| Authentication | GET | `/auth/me` | Authenticated | Get current user |
| Products | GET | `/products` | Public | Browse and search products |
| Products | GET | `/products/:productId` | Public | View product details |
| Listings | GET | `/products/:productId/listings` | Public | View seller offers |
| Supplier | GET | `/supplier/listings` | Supplier | View own listings |
| Supplier | POST | `/supplier/listings` | Supplier | Create a seller listing |
| Supplier | PATCH | `/supplier/listings/:listingId` | Supplier | Update a listing |
| Cart | GET | `/cart` | Buyer | View shopping cart |
| Cart | POST | `/cart/items` | Buyer | Add listing to cart |
| Cart | PATCH | `/cart/items/:cartItemId` | Buyer | Change quantity |
| Cart | DELETE | `/cart/items/:cartItemId` | Buyer | Remove cart item |
| Orders | POST | `/orders` | Buyer | Create an order |
| Orders | GET | `/orders` | Buyer | View order history |
| Orders | GET | `/orders/:orderId` | Buyer | View order details |
| Aircraft | GET | `/aircraft` | Buyer | View company aircraft |
| Aircraft | GET | `/aircraft/:aircraftId` | Buyer | View aircraft details |
| Engines | GET | `/aircraft/:aircraftId/engines` | Buyer | View aircraft engines |
| Engines | GET | `/engines/:engineId` | Buyer | View engine details |
| RUL | POST | `/engines/:engineId/rul-predictions` | Buyer | Request RUL prediction |
| RUL | GET | `/engines/:engineId/rul-predictions/latest` | Buyer | Get latest RUL result |
| Recommendation | GET | `/engines/:engineId/recommendations` | Buyer | Get recommended spare parts |

## Product Marketplace

The marketplace API allows buyers to browse aviation parts and compare offers
from multiple suppliers.

### Search Products

```http
GET /api/v1/products
```

Optional query parameters:

```text
search
category
manufacturer
page
limit
```

Example:

```http
GET /api/v1/products?search=fuel+pump&page=1&limit=20
```

Example response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": 101,
        "productName": "Aircraft Fuel Pump",
        "partNumber": "AFP-1001",
        "manufacturer": "Example Manufacturer"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
}
```

### View Seller Offers

```http
GET /api/v1/products/:productId/listings
```

A product can have multiple seller listings. Each listing represents an offer
from a specific supplier with its own price, condition, inventory and lead time.

## Supplier Management

Suppliers manage their marketplace offers through seller listings.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/supplier/listings` | View supplier's listings |
| POST | `/supplier/listings` | Create a listing |
| PATCH | `/supplier/listings/:listingId` | Update price, stock or listing status |
| DELETE | `/supplier/listings/:listingId` | Remove/deactivate a listing |

A seller listing connects a supplier with a product and stores commercial
information such as price, stock quantity, condition and lead time.

## Cart & Order Management

Buyers purchase specific seller listings rather than products directly.

### Add Item to Cart

```http
POST /api/v1/cart/items
```

Request:

```json
{
  "listingId": 501,
  "quantity": 3
}
```

### Create Order

```http
POST /api/v1/orders
```

The backend validates listing availability and creates the corresponding order,
seller orders and order items.

Order flow:

```text
Cart
  ↓
Order
  ↓
Seller Order
  ↓
Order Items
  ↓
Payment / Shipment
```

## Aircraft & Engine Management

Buyer organizations can access aircraft and engine information associated with
their company.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/aircraft` | List buyer company's aircraft |
| GET | `/aircraft/:aircraftId` | View aircraft details |
| GET | `/aircraft/:aircraftId/engines` | List engines installed on aircraft |
| GET | `/engines/:engineId` | View engine details |

## RUL Prediction

The Express backend acts as the gateway between the web application and the
independent AI/RUL service.

The frontend does not communicate with the AI service directly.

### Request RUL Prediction

```http
POST /api/v1/engines/:engineId/rul-predictions
```

Example request:

```json
{
  "sensorUploadId": 1024
}
```

Processing flow:

```text
React Frontend
      ↓
Express REST API
      ↓
Validate Engine & Sensor Data
      ↓
AI / RUL Service
      ↓
RUL Prediction
      ↓
Store Prediction
      ↓
Return Result
```

Example response:

```json
{
  "success": true,
  "data": {
    "predictionId": 321,
    "engineId": 24,
    "predictedRul": 37.4,
    "urgency": "HIGH"
  }
}
```

### Latest Prediction

```http
GET /api/v1/engines/:engineId/rul-predictions/latest
```

## Spare-Part Recommendations

RUL prediction and spare-part recommendation are separate responsibilities.

RUL prediction estimates engine remaining useful life, while the recommendation
logic combines the prediction with compatibility and marketplace information.

```http
GET /api/v1/engines/:engineId/recommendations
```

Recommendation flow:

```text
Latest RUL Prediction
        ↓
Maintenance Urgency
        ↓
Engine Model
        ↓
Product-Engine Compatibility
        ↓
Compatible Products
        ↓
Seller Listings
        ↓
Inventory / Supplier / Price
        ↓
Recommended Spare Parts
```

Example response:

```json
{
  "success": true,
  "data": {
    "engineId": 24,
    "predictedRul": 37.4,
    "urgency": "HIGH",
    "recommendedParts": [
      {
        "productId": 101,
        "partNumber": "AFP-1001",
        "productName": "Aircraft Fuel Pump",
        "availableListings": 3
      }
    ]
  }
}
```