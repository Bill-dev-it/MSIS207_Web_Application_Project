"use strict";

const express = require("express");
const suppliersController = require("../../controllers/admin/suppliers.controller");

const router = express.Router();

/**
 * @api {get} /api/v1/admin/suppliers List supplier approval requests and profiles
 * @apiName ListAdminSuppliers
 * @apiGroup Admin Suppliers
 * @apiVersion 1.0.0
 * @apiDescription Lists supplier records joined with their company profile and primary supplier contact account for Administrator review. Defaults to status=PENDING. Requires an authenticated ADMIN cookie session. Never exposes password hashes, authentication tokens, or session secrets.
 * @apiPermission Admin
 * @apiQuery {String="PENDING","APPROVED","SUSPENDED"} [status=PENDING] Supplier approval status defined by chk_suppliers_status.
 * @apiQuery {Number} [page=1] Positive integer page number.
 * @apiQuery {Number} [limit=10] Page size from 1 to 100.
 * @apiQuery {String} [search] Search store or company name (max 120 characters).
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Number} count Number of supplier records returned on the current page.
 * @apiSuccess {Object[]} data Supplier records with company and primary contact fields.
 * @apiSuccess {String} data.supplier_id Supplier BIGINT identifier as a decimal string.
 * @apiSuccess {String} data.company_id Company BIGINT identifier as a decimal string.
 * @apiSuccess {String} data.store_name Supplier store name.
 * @apiSuccess {String} data.slug Unique store slug.
 * @apiSuccess {String} [data.description] Store description.
 * @apiSuccess {String} [data.logo_object_key] Store logo object key.
 * @apiSuccess {String="PENDING","APPROVED","SUSPENDED"} data.status Supplier status.
 * @apiSuccess {String} data.created_at Supplier creation timestamp.
 * @apiSuccess {String} data.company_name Legal company name.
 * @apiSuccess {String} data.company_type Company type (e.g. SUPPLIER, MIXED).
 * @apiSuccess {String} [data.tax_id] Company tax identifier.
 * @apiSuccess {String} data.country_code Two-letter ISO country code.
 * @apiSuccess {String} data.company_created_at Company creation timestamp.
 * @apiSuccess {String} [data.contact_user_id] Primary supplier user BIGINT identifier, when a user account exists.
 * @apiSuccess {String} [data.contact_name] Primary supplier user full name.
 * @apiSuccess {String} [data.contact_email] Primary supplier user email address.
 * @apiSuccess {Boolean} [data.contact_is_active] Whether the primary supplier user account is active.
 * @apiSuccess {String} [data.contact_email_verified_at] Email verification timestamp for the primary supplier user.
 * @apiSuccess {Object} meta Applied filter and pagination metadata.
 * @apiSuccess {String="PENDING","APPROVED","SUSPENDED"} meta.status Applied status filter.
 * @apiSuccess {Object} meta.pagination Pagination summary (page, limit, total, totalPages).
 * @apiError (400 Bad Request) INVALID_QUERY Query parameter is not a single text value.
 * @apiError (400 Bad Request) INVALID_STATUS Status filter is not PENDING, APPROVED, or SUSPENDED.
 * @apiError (400 Bad Request) INVALID_PAGINATION Page or limit is out of bounds.
 * @apiError (400 Bad Request) INVALID_SEARCH Search length exceeds 120 characters.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing, invalid, or expired session cookie.
 * @apiError (403 Forbidden) ADMIN_REQUIRED Authenticated user role is not ADMIN.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Supplier records could not be retrieved.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "count": 1,
 *       "data": [
 *         {
 *           "supplier_id": "12",
 *           "company_id": "25",
 *           "store_name": "Pacific Turbine Spares",
 *           "slug": "pacific-turbine-spares-a1b2c3d4e5f6",
 *           "description": null,
 *           "logo_object_key": null,
 *           "status": "PENDING",
 *           "created_at": "2026-11-06T10:00:00.000Z",
 *           "company_name": "Pacific Turbine Spares Ltd.",
 *           "company_type": "SUPPLIER",
 *           "tax_id": "US-99-1234567",
 *           "country_code": "US",
 *           "company_created_at": "2026-11-06T10:00:00.000Z",
 *           "contact_user_id": "31",
 *           "contact_name": "Dana Rivera",
 *           "contact_email": "dana@pacificturbine.example",
 *           "contact_is_active": true,
 *           "contact_email_verified_at": "2026-11-06T10:05:00.000Z"
 *         }
 *       ],
 *       "meta": {
 *         "status": "PENDING",
 *         "pagination": {
 *           "page": 1,
 *           "limit": 10,
 *           "total": 1,
 *           "totalPages": 1
 *         }
 *       }
 *     }
 */
router.get("/", suppliersController.listSuppliers);

/**
 * @api {post} /api/v1/admin/suppliers/:supplierId/approve Approve a pending supplier
 * @apiName ApproveAdminSupplier
 * @apiGroup Admin Suppliers
 * @apiVersion 1.0.0
 * @apiPermission Admin
 * @apiDescription Approves only a PENDING supplier. Repeated requests after approval are idempotent. SUSPENDED suppliers are never silently reactivated. Requires Admin cookie and X-AeroRUL-Request: 1 with trusted origin.
 * @apiParam {String} supplierId Positive BIGINT supplier ID.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Supplier ID, APPROVED status, and already_approved boolean.
 * @apiError (400 Bad Request) INVALID_SUPPLIER_ID Invalid ID.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session.
 * @apiError (403 Forbidden) ADMIN_REQUIRED, UNTRUSTED_REQUEST, UNTRUSTED_ORIGIN.
 * @apiError (404 Not Found) SUPPLIER_NOT_FOUND Supplier does not exist.
 * @apiError (409 Conflict) SUPPLIER_STATUS_CONFLICT Supplier is suspended or otherwise not approvable.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Supplier approval failed.
 */
router.post("/:supplierId/approve", suppliersController.approveSupplier);

module.exports = router;
