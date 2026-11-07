# AeroRUL – Admin Remaining Modules Postman API Test Report

- **Executed At:** `2026-11-07T12:46:55.961Z`
- **Base URL:** `http://localhost:3000`
- **Database:** `aerorul` (Real PostgreSQL Data)
- **Total Test Cases:** 25
- **Passed:** 25
- **Failed:** 0

## 1. Postman Test Execution Matrix (25 Test Cases)

| # | Module | Test Case | Method & Endpoint | HTTP Status | Duration | Result | Details |
|---|--------|-----------|-------------------|-------------|----------|--------|---------|
| 01 | Companies / Buyers | 01 - Auth Required Without Token | `GET /api/v1/admin/companies` | `401` | 76 ms | PASS | HTTP 401 (AUTH_REQUIRED) |
| 02 | Companies / Buyers | 02 - Forbidden For Non-Admin | `GET /api/v1/admin/companies` | `403` | 87 ms | PASS | HTTP 403 (FORBIDDEN) |
| 03 | Companies / Buyers | 03 - List All Buyer Companies | `GET /api/v1/admin/companies` | `200` | 44 ms | PASS | HTTP 200, total=6, first=Demo Horizon Airlines (spend=$61039.27) |
| 04 | Companies / Buyers | 04 - Search Companies By Name Or Tax ID | `GET /api/v1/admin/companies?search=Horizon` | `200` | 34 ms | PASS | HTTP 200, matched=1 (Demo Horizon Airlines, status=ACTIVE) |
| 05 | Companies / Buyers | 05 - Get Company Detail | `GET /api/v1/admin/companies/1` | `200` | 70 ms | PASS | HTTP 200, company=Demo Horizon Airlines, users=2, engines=4, recent_orders=3 |
| 06 | Companies / Buyers | 06 - Invalid Company ID Or Not Found | `GET /api/v1/admin/companies/999999` | `404` | 33 ms | PASS | Not found HTTP 404 (COMPANY_NOT_FOUND); Invalid ID HTTP 400 (INVALID_COMPANY_ID) |
| 07 | Reviews / Reports | 07 - Auth Required Without Token | `GET /api/v1/admin/reports` | `401` | 4 ms | PASS | HTTP 401 (AUTH_REQUIRED) |
| 08 | Reviews / Reports | 08 - Forbidden For Non-Admin | `GET /api/v1/admin/reports` | `403` | 25 ms | PASS | HTTP 403 (FORBIDDEN) |
| 09 | Reviews / Reports | 09 - List Open Reports | `GET /api/v1/admin/reports?status=OPEN` | `200` | 20 ms | PASS | HTTP 200, counts={"OPEN":0,"RESOLVED":0,"ALL":0} |
| 10 | Reviews / Reports | 10 - List Resolved Reports | `GET /api/v1/admin/reports?status=RESOLVED` | `200` | 33 ms | PASS | HTTP 200, resolved_items=0 |
| 11 | Reviews / Reports | 11 - List All Reports | `GET /api/v1/admin/reports?status=ALL` | `200` | 9 ms | PASS | HTTP 200, total_items=0 |
| 12 | Reviews / Reports | 12 - Hide Report Action (No review rows in DB -> 404 REPORT_NOT_FOUND) | `PATCH /api/v1/admin/reports/999999/hide` | `404` | 35 ms | PASS | HTTP 404 (REPORT_NOT_FOUND: verified on empty PostgreSQL reviews table without fabricating rows) |
| 13 | Reviews / Reports | 13 - Dismiss Report Action (No review rows in DB -> 404 REPORT_NOT_FOUND) | `PATCH /api/v1/admin/reports/999999/dismiss` | `404` | 10 ms | PASS | HTTP 404 (REPORT_NOT_FOUND: verified on empty PostgreSQL reviews table without fabricating rows) |
| 14 | Reviews / Reports | 14 - Invalid Report ID Or Status Filter | `PATCH /api/v1/admin/reports/invalid-id/hide` | `400` | 6 ms | PASS | Invalid ID HTTP 400 (INVALID_REPORT_ID); Invalid status HTTP 400 (INVALID_STATUS_FILTER) |
| 15 | RUL System Status | 15 - Auth Required Without Token | `GET /api/v1/admin/rul-status` | `401` | 3 ms | PASS | HTTP 401 (AUTH_REQUIRED) |
| 16 | RUL System Status | 16 - Forbidden For Non-Admin | `GET /api/v1/admin/rul-status` | `403` | 23 ms | PASS | HTTP 403 (FORBIDDEN) |
| 17 | RUL System Status | 17 - Get RUL System Status | `GET /api/v1/admin/rul-status` | `200` | 185 ms | PASS | HTTP 200, service=Operational, model=v1.0.0 (Deployed Nov 4) |
| 18 | RUL System Status | 18 - Verify 14-Day Prediction Volume Structure | `GET /api/v1/admin/rul-status` | `200` | 185 ms | PASS | 14-day series count=14, range=2026-10-25..2026-11-07 |
| 19 | RUL System Status | 19 - Verify Urgency Distribution Structure | `GET /api/v1/admin/rul-status` | `200` | 185 ms | PASS | Urgency buckets=Normal:1, Monitor:0, Prepare:0, Prioritize:0 |
| 20 | RUL System Status | 20 - Verify Recent Predictions Structure | `GET /api/v1/admin/rul-status` | `200` | 185 ms | PASS | Recent predictions=1, latest=ENG-001 (Demo Horizon Airlines, 119 cyc, OK) |
| 21 | System Settings | 21 - Auth Required Without Token | `GET /api/v1/admin/settings` | `401` | 3 ms | PASS | HTTP 401 (AUTH_REQUIRED) |
| 22 | System Settings | 22 - Forbidden For Non-Admin | `GET /api/v1/admin/settings` | `403` | 11 ms | PASS | HTTP 403 (FORBIDDEN) |
| 23 | System Settings | 23 - Get Current System Settings | `GET /api/v1/admin/settings` | `200` | 5 ms | PASS | HTTP 200, currency=USD, shipping="3-5 business days", thresholds={"prioritize_at_or_below":20,"prepare_at_or_below":40,"monitor_at_or_below":80,"normal_above":80} |
| 24 | System Settings | 24 - Validate Invalid Settings Input | `PUT /api/v1/admin/settings` | `400` | 46 ms | PASS | HTTP 400 (INVALID_SETTINGS_PAYLOAD: RUL thresholds must satisfy: Prioritize < Prepare < Monitor.) |
| 25 | System Settings | 25 - Update And Restore System Settings | `PUT /api/v1/admin/settings` | `200` | 8 ms | PASS | Updated shipping="5-7 business days" (HTTP 200) -> verified -> restored="3-5 business days" (HTTP 200) |

## 2. Existing Admin Modules Regression Matrix

| Endpoint | HTTP Status | Result |
|----------|-------------|--------|
| `GET /api/v1/admin/dashboard` | `200` | PASS |
| `GET /api/v1/admin/users` | `200` | PASS |
| `GET /api/v1/admin/suppliers` | `200` | PASS |
| `GET /api/v1/admin/orders` | `200` | PASS |
| `GET /api/v1/admin/orders/10` | `200` | PASS |
