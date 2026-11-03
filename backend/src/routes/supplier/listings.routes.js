const router = require("express").Router();
const controller = require("../../controllers/supplier/listings.controller");

/**
 * @api {get} /api/v1/supplier/listings List My Listings
 * @apiName ListSupplierListings
 * @apiGroup Supplier Listings
 * @apiVersion 1.0.0
 * @apiDescription Lists all listings belonging to the authenticated supplier, including DRAFT and HIDDEN. Pre-login: always returns HTTP 401 AUTH_REQUIRED. After Login integration, endpoints must check the authenticated supplier. Do not pass supplier_id from the client.
 * @apiPermission Supplier
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Number} count Number of rows.
 * @apiSuccess {Object[]} data Owned listing rows including product_name, part_number, updated_at.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Supplier login required; all Supplier APIs return 401 before Login integration.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "count": 1,
 *       "data": [
 *         {
 *           "listing_id": "1",
 *           "product_id": "1",
 *           "supplier_id": "1",
 *           "seller_sku": "DEMO-S01-P0001",
 *           "product_name": "Engine Ignition Lead",
 *           "part_number": "DEMO-PART-00001",
 *           "condition": "NEW",
 *           "price": "320.00",
 *           "stock_quantity": 12,
 *           "lead_time_days": 3,
 *           "status": "ACTIVE",
 *           "updated_at": "2026-10-20T09:30:00.000Z"
 *         }
 *       ]
 *     }
 * @apiErrorExample {json} 401 Pre-login:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.get("/", controller.getAll);

/**
 * @api {get} /api/v1/supplier/listings/:listingId Get My Listing
 * @apiName GetSupplierListing
 * @apiGroup Supplier Listings
 * @apiVersion 1.0.0
 * @apiDescription Retrieve a listing only when it belongs to the authenticated supplier. Pre-login: always returns HTTP 401 AUTH_REQUIRED. After Login integration, endpoints must check the authenticated supplier. Do not pass supplier_id from the client.
 * @apiPermission Supplier
 * @apiParam {String} listingId Positive PostgreSQL BIGINT listing identifier.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Owned listing with product fields.
 * @apiError (400 Bad Request) INVALID_INPUT Listing ID must be a positive BIGINT.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Supplier login required; all Supplier APIs return 401 before Login integration.
 * @apiError (404 Not Found) LISTING_NOT_FOUND Listing missing or not owned.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "data": {
 *         "listing_id": "1",
 *         "product_id": "1",
 *         "supplier_id": "1",
 *         "seller_sku": "DEMO-S01-P0001",
 *         "product_name": "Engine Ignition Lead",
 *         "part_number": "DEMO-PART-00001",
 *         "condition": "NEW",
 *         "price": "320.00",
 *         "stock_quantity": 12,
 *         "lead_time_days": 3,
 *         "status": "ACTIVE",
 *         "updated_at": "2026-10-20T09:30:00.000Z"
 *       }
 *     }
 * @apiErrorExample {json} 404 Not Found error:
 *     {
 *       "success": false,
 *       "error": {
 *         "code": "LISTING_NOT_FOUND",
 *         "message": "Listing not found."
 *       }
 *     }
 * @apiErrorExample {json} 401 Pre-login:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.get("/:listingId", controller.getOne);

/**
 * @api {post} /api/v1/supplier/listings Create Listing
 * @apiName CreateSupplierListing
 * @apiGroup Supplier Listings
 * @apiVersion 1.0.0
 * @apiDescription Create a listing for an existing active product. Supplier ID comes from the authenticated session, not from request body. Pre-login: always returns HTTP 401 AUTH_REQUIRED. After Login integration, endpoints must check the authenticated supplier. Do not pass supplier_id from the client.
 * @apiPermission Supplier
 * @apiSampleRequest off
 * @apiBody {String} product_id Positive BIGINT ID of an active catalog product.
 * @apiBody {String} seller_sku Unique per supplier, 1-100 characters.
 * @apiBody {String="NEW","USED","REFURBISHED"} condition Condition of the offer.
 * @apiBody {String} price USD decimal 0 or positive; up to 16 integral digits and 2 decimal places.
 * @apiBody {Number} stock_quantity Integer between 0 and 2147483647.
 * @apiBody {Number} lead_time_days Integer between 0 and 2147483647.
 * @apiBody {String="DRAFT","ACTIVE","HIDDEN"} status Listing status.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Newly created listing including listing_id.
 * @apiError (400 Bad Request) INVALID_INPUT Missing/invalid field or inactive product.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Supplier login required; all Supplier APIs return 401 before Login integration.
 * @apiError (409 Conflict) DUPLICATE_SKU Supplier SKU already exists.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 201 Created:
 *     {
 *       "success": true,
 *       "data": {
 *         "listing_id": "1",
 *         "product_id": "1",
 *         "supplier_id": "1",
 *         "seller_sku": "DEMO-S01-P0001",
 *         "product_name": "Engine Ignition Lead",
 *         "part_number": "DEMO-PART-00001",
 *         "condition": "NEW",
 *         "price": "320.00",
 *         "stock_quantity": 12,
 *         "lead_time_days": 3,
 *         "status": "ACTIVE",
 *         "updated_at": "2026-10-20T09:30:00.000Z"
 *       }
 *     }
 * @apiErrorExample {json} 400 Bad Request error:
 *     {
 *       "success": false,
 *       "error": {
 *         "code": "INVALID_INPUT",
 *         "message": "Invalid listing input."
 *       }
 *     }
 * @apiErrorExample {json} 401 Pre-login:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.post("/", controller.create);

/**
 * @api {patch} /api/v1/supplier/listings/:listingId Update Listing
 * @apiName UpdateSupplierListing
 * @apiGroup Supplier Listings
 * @apiVersion 1.0.0
 * @apiDescription Update one or more allowed fields of a listing owned by the authenticated supplier. Empty body and unknown keys are rejected. Pre-login: always returns HTTP 401 AUTH_REQUIRED. After Login integration, endpoints must check the authenticated supplier. Do not pass supplier_id from the client.
 * @apiPermission Supplier
 * @apiSampleRequest off
 * @apiParam {String} listingId Positive BIGINT listing identifier.
 * @apiBody {String} [product_id] Existing active catalog product ID.
 * @apiBody {String} [seller_sku] Unique supplier SKU, 1-100 characters.
 * @apiBody {String="NEW","USED","REFURBISHED"} [condition] Condition.
 * @apiBody {String} [price] USD nonnegative decimal with up to 2 fractional digits.
 * @apiBody {Number} [stock_quantity] Nonnegative integer within INT range.
 * @apiBody {Number} [lead_time_days] Nonnegative integer within INT range.
 * @apiBody {String="DRAFT","ACTIVE","HIDDEN"} [status] Listing status.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Updated listing.
 * @apiError (400 Bad Request) INVALID_INPUT Invalid ID, invalid fields, or inactive product.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Supplier login required; all Supplier APIs return 401 before Login integration.
 * @apiError (404 Not Found) LISTING_NOT_FOUND Listing missing or not owned.
 * @apiError (409 Conflict) DUPLICATE_SKU SKU already exists.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "data": {
 *         "listing_id": "1",
 *         "product_id": "1",
 *         "supplier_id": "1",
 *         "seller_sku": "DEMO-S01-P0001",
 *         "product_name": "Engine Ignition Lead",
 *         "part_number": "DEMO-PART-00001",
 *         "condition": "NEW",
 *         "price": "320.00",
 *         "stock_quantity": 12,
 *         "lead_time_days": 3,
 *         "status": "ACTIVE",
 *         "updated_at": "2026-10-20T09:30:00.000Z"
 *       }
 *     }
 * @apiErrorExample {json} 401 Pre-login:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.patch("/:listingId", controller.update);

/**
 * @api {delete} /api/v1/supplier/listings/:listingId Hide Listing (Soft Delete)
 * @apiName HideSupplierListing
 * @apiGroup Supplier Listings
 * @apiVersion 1.0.0
 * @apiDescription Sets status to HIDDEN rather than deleting the row. Related order history is preserved. Pre-login: always returns HTTP 401 AUTH_REQUIRED. After Login integration, endpoints must check the authenticated supplier. Do not pass supplier_id from the client.
 * @apiPermission Supplier
 * @apiSampleRequest off
 * @apiParam {String} listingId Positive BIGINT listing identifier.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {String} message "Listing hidden."
 * @apiError (400 Bad Request) INVALID_INPUT Invalid ID.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Supplier login required; all Supplier APIs return 401 before Login integration.
 * @apiError (404 Not Found) LISTING_NOT_FOUND Listing missing or not owned.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "message": "Listing hidden."
 *     }
 * @apiErrorExample {json} 401 Pre-login:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.delete("/:listingId", controller.hide);

module.exports = router;
