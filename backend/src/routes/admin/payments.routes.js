"use strict";

const express = require("express");
const paymentsController = require("../../controllers/admin/payments.controller");

const router = express.Router();

/**
 * @api {post} /api/v1/admin/payments/:orderId/confirm Confirm pending bank transfer payment
 * @apiName ConfirmAdminOrderPayment
 * @apiGroup Admin Payments
 * @apiVersion 1.0.0
 * @apiDescription Transitions a PENDING BANK_TRANSFER payment to SUCCEEDED and records paid_at. Repeated confirmation of a SUCCEEDED BANK_TRANSFER payment is idempotent. Requires an authenticated ADMIN cookie session and X-AeroRUL-Request: 1.
 * @apiPermission Admin
 * @apiParam {String} orderId Positive BIGINT order ID.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Updated or already confirmed payment summary.
 * @apiError (400 Bad Request) INVALID_ORDER_ID Order ID is not a positive BIGINT.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) ADMIN_REQUIRED, UNTRUSTED_REQUEST or UNTRUSTED_ORIGIN Admin role, trusted mutation header, or allowed origin is required.
 * @apiError (404 Not Found) PAYMENT_NOT_FOUND Order payment was not found.
 * @apiError (409 Conflict) INVALID_PAYMENT_METHOD, PAYMENT_ALREADY_CANCELLED or INVALID_PAYMENT_STATUS Payment cannot be confirmed.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Payment confirmation failed.
 */
router.post("/:orderId/confirm", paymentsController.confirmPayment);

/**
 * @api {post} /api/v1/admin/payments/:orderId/cancel Cancel pending bank transfer payment
 * @apiName CancelAdminOrderPayment
 * @apiGroup Admin Payments
 * @apiVersion 1.0.0
 * @apiDescription Transitions a PENDING BANK_TRANSFER payment to CANCELLED and restores reserved seller_listings stock for all order_items in the same PostgreSQL transaction. Repeated cancellation of an already CANCELLED BANK_TRANSFER payment is idempotent and never restores stock twice. Requires an authenticated ADMIN cookie session and X-AeroRUL-Request: 1.
 * @apiPermission Admin
 * @apiParam {String} orderId Positive BIGINT order ID.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Updated or already cancelled payment summary.
 * @apiError (400 Bad Request) INVALID_ORDER_ID Order ID is not a positive BIGINT.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) ADMIN_REQUIRED, UNTRUSTED_REQUEST or UNTRUSTED_ORIGIN Admin role, trusted mutation header, or allowed origin is required.
 * @apiError (404 Not Found) PAYMENT_NOT_FOUND Order payment was not found.
 * @apiError (409 Conflict) INVALID_PAYMENT_METHOD, PAYMENT_ALREADY_SUCCEEDED, ORDER_ALREADY_IN_FULFILLMENT or STOCK_RESTORE_FAILED Payment cannot be cancelled.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Payment cancellation failed and was rolled back.
 */
router.post("/:orderId/cancel", paymentsController.cancelPayment);

module.exports = router;

