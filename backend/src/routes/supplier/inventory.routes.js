const router = require("express").Router();
const controller = require("../../controllers/supplier/inventory.controller");

/**
 * @api {get} /api/v1/supplier/inventory Get My Inventory
 * @apiName GetSupplierInventory
 * @apiGroup Supplier Inventory
 * @apiVersion 1.0.0
 * @apiDescription Stock is stored on seller_listings, not in a separate warehouse subsystem. Includes DRAFT and HIDDEN listings. Requires an authenticated user with SUPPLIER role and an APPROVED supplier account. Resource ownership is checked by the backend; supplier_id is never accepted from the client.
 * @apiPermission Supplier
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Inventory information.
 * @apiSuccess {Object} data.summary Stock counters.
 * @apiSuccess {Number} data.summary.total_listings Total listing rows.
 * @apiSuccess {Number} data.summary.in_stock Quantity greater than five.
 * @apiSuccess {Number} data.summary.low_stock Quantity 1 through 5.
 * @apiSuccess {Number} data.summary.out_of_stock Quantity zero.
 * @apiSuccess {Object[]} data.items Listing ID, SKU, product name, quantity, status, timestamp.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) FORBIDDEN, SUPPLIER_NOT_APPROVED Authenticated user role is not SUPPLIER or supplier account is not APPROVED.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "data": {
 *         "summary": {
 *           "total_listings": 1,
 *           "in_stock": 1,
 *           "low_stock": 0,
 *           "out_of_stock": 0
 *         },
 *         "items": [
 *           {
 *             "listing_id": "1",
 *             "seller_sku": "DEMO-S01-P0001",
 *             "product_id": "1",
 *             "product_name": "Engine Ignition Lead",
 *             "stock_quantity": 12,
 *             "status": "ACTIVE",
 *             "updated_at": "2026-10-20T09:30:00.000Z"
 *           }
 *         ]
 *       }
 *     }
 * @apiErrorExample {json} 401 Unauthorized:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.get("/", controller.getInventory);

/**
 * @api {patch} /api/v1/supplier/inventory/:listingId Update Stock
 * @apiName UpdateSupplierStock
 * @apiGroup Supplier Inventory
 * @apiVersion 1.0.0
 * @apiDescription Update stock quantity of one owned listing. Request body must contain only stock_quantity. Requires an authenticated user with SUPPLIER role, an APPROVED supplier account, and X-AeroRUL-Request: 1. Resource ownership is checked by the backend.
 * @apiPermission Supplier
 * @apiSampleRequest off
 * @apiParam {String} listingId Positive BIGINT listing ID.
 * @apiBody {Number} stock_quantity Integer from 0 through 2147483647 (not a string).
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Listing ID, quantity, status, updated_at.
 * @apiError (400 Bad Request) INVALID_INPUT Invalid ID, type, value, or extra body field.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) FORBIDDEN, SUPPLIER_NOT_APPROVED, UNTRUSTED_REQUEST or UNTRUSTED_ORIGIN Supplier role, approved account, or trusted mutation header is required.
 * @apiError (404 Not Found) LISTING_NOT_FOUND Listing missing or not owned.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "data": {
 *         "listing_id": "1",
 *         "stock_quantity": 8,
 *         "status": "ACTIVE",
 *         "updated_at": "2026-10-20T09:30:00.000Z"
 *       }
 *     }
 * @apiErrorExample {json} 401 Unauthorized:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.patch("/:listingId", controller.updateStock);
module.exports = router;
