const router = require("express").Router();
const controller = require("../../controllers/supplier/overview.controller");
/**
 * @api {get} /api/v1/supplier/overview Get Supplier Overview
 * @apiName GetSupplierOverview
 * @apiGroup Supplier Overview
 * @apiVersion 1.0.0
 * @apiDescription Counts all owned listings by visibility/stock and supplier orders by fulfillment state. Pre-login: always returns HTTP 401 AUTH_REQUIRED. After Login integration, endpoints must check the authenticated supplier. Do not pass supplier_id from the client.
 * @apiPermission Supplier
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Supplier summary.
 * @apiSuccess {Object} data.listings Counts: total, active, draft, hidden, in_stock, low_stock, out_of_stock.
 * @apiSuccess {Object} data.orders Counts: total, confirmed, processing, shipped, delivered.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Supplier login required; all Supplier APIs return 401 before Login integration.
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
 * @apiErrorExample {json} 401 Pre-login:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.get("/", controller.getOverview);
module.exports = router;
