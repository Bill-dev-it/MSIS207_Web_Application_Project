# REST API Design

The Aviation B2B E-Commerce Platform exposes a RESTful API through the
Node.js/Express backend.

## Base URL

```text
/api/v1
```

All API responses use JSON.

API documentation is versioned with the application schema and data pipeline.

## Authentication

Protected endpoints require a JWT access token:

```http
Authorization: Bearer <access_token>
```

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