# System Architecture

## Overview

The Aviation B2B E-Commerce Platform is designed as a decoupled web application
that integrates a B2B aircraft-parts marketplace with an AI-based Remaining
Useful Life (RUL) prediction service.

The system separates the presentation, application, data, and AI layers to
improve maintainability, scalability, and deployment flexibility.

## Architecture Diagram

![Aviation B2B E-Commerce System Architecture](./system_structure.png)

## Architecture Components

### 1. Client Layer
The platform supports three primary user groups:
- Buyer organizations such as airlines, MROs, and aircraft operators
- Suppliers such as aircraft-parts manufacturers and distributors
- Platform administrators

### 2. Edge and Delivery Layer
The application is accessed through a custom domain.

Cloudflare is positioned at the edge and provides:
- DNS management
- HTTPS/TLS
- CDN
- DDoS protection
- Web Application Firewall (WAF)

### 3. Presentation Layer
The frontend is implemented using React as a Single Page Application (SPA).

Major interfaces include:
- Authentication
- Marketplace
- Product search and product details
- Cart and checkout
- Order management
- Buyer portal
- Supplier portal
- Engine health monitoring
- RUL-based recommendations

The frontend communicates with the backend through REST APIs over HTTPS.

### 4. Application Layer
Node.js and Express provide the REST API and business logic layer.

The backend follows a modular monolith architecture with modules for:
- Authentication and authorization
- User and company management
- Product catalog
- Supplier management
- Inventory management
- Order management
- Aircraft and engine management
- Recommendation logic

### 5. Data Layer
PostgreSQL is used as the relational database.

The database stores two major groups of information:

Commerce data:
- Users and companies
- Products and suppliers
- Inventory
- Orders and payments
- Transactions

Aviation and RUL data:
- Aircraft and engines
- Part compatibility
- Engine sensor metadata
- RUL predictions
- Maintenance records

### 6. AI / RUL Service
The RUL model is deployed as an independent service.

The inference pipeline includes:

Input Validation
→ Sensor Data Preprocessing
→ Trained RUL Model
→ RUL Inference
→ Prediction Output

The application sends engine data to the RUL service and receives the predicted
Remaining Useful Life.

### 7. Recommendation Logic
Predicted RUL is combined with:
- Maintenance urgency rules
- Engine/part compatibility
- Inventory availability
- Supplier and product information

The result is a list of recommended spare parts that can be purchased through
the marketplace.

## Deployment Direction

The production architecture is intended to be deployed on AWS, while
Cloudflare provides the public DNS, HTTPS, CDN, and edge security layer.

Detailed AWS service selection and CI/CD configuration will be documented
separately in the deployment architecture.
