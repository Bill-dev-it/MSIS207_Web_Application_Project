const express = require("express");
const ordersController = require("../../controllers/buyer/orders.controller");
const orderDetailController = require("../../controllers/buyer/orderDetail.controller");
const orderConfirmationController = require("../../controllers/buyer/orderConfirmation.controller");

const router = express.Router();

/**
 * @api {get} /api/v1/orders List buyer orders
 * @apiName GetBuyerOrders
 * @apiGroup Buyer Orders
 * @apiVersion 1.0.0
 * @apiDescription Lists orders belonging to the authenticated Buyer company, including primary fulfillment status and payment summary fields (payment_method, payment_status, paid_at).
 * @apiPermission Buyer
 * @apiQuery {String="ALL","CONFIRMED","PROCESSING","SHIPPED","DELIVERED"} [status=ALL] Supplier fulfillment status.
 * @apiQuery {String} [search] Order number or purchase reference, max 200 characters.
 * @apiQuery {Number} [page=1] Positive page number.
 * @apiQuery {Number} [limit=10] Page size from 1 to 100.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object[]} data Company orders.
 * @apiSuccess {Object} meta Counts and pagination.
 * @apiError (400 Bad Request) INVALID_QUERY, INVALID_STATUS, INVALID_PAGINATION, INVALID_SEARCH Invalid query values.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Orders could not be retrieved.
 * @apiSuccessExample {json} 200 OK:
 *     { "success": true, "data": [], "meta": { "counts": { "ALL": 0 }, "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } } }
 */
router.get("/", ordersController.getOrders);

/**
 * @api {get} /api/v1/orders/:orderId/confirmation Get order confirmation
 * @apiName GetBuyerOrderConfirmation
 * @apiGroup Buyer Orders
 * @apiVersion 1.0.0
 * @apiDescription Returns a confirmation (including flat payment_method, payment_status, payment_amount, paid_at, and transfer_reference) only when the order belongs to the authenticated Buyer company.
 * @apiPermission Buyer
 * @apiParam {String} orderId Positive BIGINT order ID.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Order confirmation details.
 * @apiError (404 Not Found) ORDER_NOT_FOUND Order not found for this company.
 * @apiError (400 Bad Request) INVALID_ORDER_ID Order ID is not a positive BIGINT.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Confirmation could not be retrieved.
 */
router.get("/:orderId/confirmation", orderConfirmationController.getOrderConfirmation);

/**
 * @api {get} /api/v1/orders/:orderId Get buyer order detail
 * @apiName GetBuyerOrderDetail
 * @apiGroup Buyer Orders
 * @apiVersion 1.0.0
 * @apiDescription Returns supplier fulfillment, line items and payment record for an order belonging to the authenticated Buyer company.
 * @apiPermission Buyer
 * @apiParam {String} orderId Positive BIGINT order ID.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Order detail.
 * @apiError (404 Not Found) ORDER_NOT_FOUND Order not found for this company.
 * @apiError (400 Bad Request) INVALID_ORDER_ID Order ID is not a positive BIGINT.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Order details could not be retrieved.
 */
router.get("/:orderId", orderDetailController.getOrderDetail);

module.exports = router;
