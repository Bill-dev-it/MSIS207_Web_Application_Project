const router = require("express").Router();
const controller = require("../../controllers/supplier/overview.controller");
/**
 * @api {get} /api/v1/supplier/overview Get Supplier Overview
 * @apiName GetSupplierOverview
 * @apiGroup Supplier Overview
 * @apiVersion 1.0.0
 * @apiDescription Counts all owned listings by visibility/stock and supplier orders by fulfillment state. Requires an authenticated user with SUPPLIER role and an APPROVED supplier account. Resource ownership is checked by the backend; supplier_id is never accepted from the client.
 * @apiPermission Supplier
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Supplier summary.
 * @apiSuccess {Object} data.listings Counts: total, active, draft, hidden, in_stock, low_stock, out_of_stock.
 * @apiSuccess {Object} data.orders Counts: total, confirmed, processing, shipped, delivered.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) FORBIDDEN, SUPPLIER_NOT_APPROVED Authenticated user role is not SUPPLIER or supplier account is not APPROVED.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "data": {
 *         "listings": {
 *           "total": 3,
 *           "active": 2,
 *           "draft": 1,
 *           "hidden": 0,
 *           "in_stock": 2,
 *           "low_stock": 0,
 *           "out_of_stock": 1
 *         },
 *         "orders": {
 *           "total": 2,
 *           "confirmed": 1,
 *           "processing": 1,
 *           "shipped": 0,
 *           "delivered": 0
 *         }
 *       }
 *     }
 * @apiErrorExample {json} 401 Unauthorized:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.get("/", controller.getOverview);
module.exports = router;
