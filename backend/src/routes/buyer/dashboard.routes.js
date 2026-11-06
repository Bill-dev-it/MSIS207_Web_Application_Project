const express = require("express");
const dashboardController = require("../../controllers/buyer/dashboard.controller");

const router = express.Router();

/**
 * @api {get} /api/v1/dashboard/summary Get buyer dashboard summary
 * @apiName GetBuyerDashboardSummary
 * @apiGroup Buyer Dashboard
 * @apiVersion 1.0.0
 * @apiDescription Returns counts and critical alerts derived from records belonging to the authenticated Buyer company and user. Does not run RUL inference.
 * @apiPermission Buyer
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Company summary, engine/order/wishlist counts, and stored critical prediction when present.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Engine overview could not be loaded.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Summary could not be loaded.
 */
router.get("/summary", dashboardController.getSummary);

/**
 * @api {get} /api/v1/dashboard/engine-health Get buyer engine overview
 * @apiName GetBuyerDashboardEngineHealth
 * @apiGroup Buyer Dashboard
 * @apiVersion 1.0.0
 * @apiDescription Returns company-owned engines and previously stored successful predictions only.
 * @apiPermission Buyer
 * @apiQuery {Number} [limit=5] Result limit from 1 to 100.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object[]} data Engine overview records.
 * @apiError (400 Bad Request) INVALID_LIMIT Limit must be an integer from 1 to 100.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Recent orders could not be loaded.
 */
router.get("/engine-health", dashboardController.getEngineHealth);

/**
 * @api {get} /api/v1/dashboard/recent-orders Get buyer recent orders
 * @apiName GetBuyerDashboardRecentOrders
 * @apiGroup Buyer Dashboard
 * @apiVersion 1.0.0
 * @apiDescription Returns recent orders belonging to the authenticated Buyer company.
 * @apiPermission Buyer
 * @apiQuery {Number} [limit=5] Result limit from 1 to 100.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object[]} data Recent orders.
 * @apiError (400 Bad Request) INVALID_LIMIT Limit must be an integer from 1 to 100.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 */
router.get("/recent-orders", dashboardController.getRecentOrders);

module.exports = router;
