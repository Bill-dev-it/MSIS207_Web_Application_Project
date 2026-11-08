"use strict";

const express = require("express");
const dashboardController = require("../../controllers/admin/dashboard.controller");

const router = express.Router();

/**
 * @api {get} /api/v1/admin/dashboard/summary Admin marketplace summary
 * @apiName GetAdminDashboardSummary
 * @apiGroup Admin Dashboard
 * @apiVersion 1.0.0
 * @apiPermission Admin
 * @apiDescription Returns actual PostgreSQL marketplace aggregates and a six-month succeeded payment volume trend. Does not imply live FastAPI RUL service health.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Marketplace counts, succeeded payment volume, and six-month trend.
 * @apiSuccess {Number} data.buyers Active BUYER user accounts.
 * @apiSuccess {Number} data.suppliers_total Total supplier profiles across all statuses.
 * @apiSuccess {Number} data.suppliers_pending Supplier profiles with status PENDING.
 * @apiSuccess {Number} data.suppliers_approved Supplier profiles with status APPROVED.
 * @apiSuccess {Number} data.products_active Active catalog products (is_active = TRUE).
 * @apiSuccess {Number} data.listings_active Marketplace-visible active listings (seller_listings.status = ACTIVE, suppliers.status = APPROVED, products.is_active = TRUE).
 * @apiSuccess {Number} data.orders_total Total buyer orders.
 * @apiSuccess {Number} data.payments_pending Pending BANK_TRANSFER payments awaiting Admin review.
 * @apiSuccess {String} data.succeeded_payment_volume_usd Total USD volume across all SUCCEEDED payments (includes SIMULATION and confirmed BANK_TRANSFER payments).
 * @apiSuccess {Number} data.predictions_today Total RUL prediction records created today across all statuses.
 * @apiSuccess {String} [data.last_prediction] Most recent RUL prediction timestamp.
 * @apiSuccess {String} [data.model_version] Active registered RUL model version string.
 * @apiSuccess {Object[]} data.sales_trend Six-month succeeded payment volume series (month, total_usd).
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing, invalid, or expired session cookie.
 * @apiError (403 Forbidden) ADMIN_REQUIRED Authenticated user role is not ADMIN.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unable to load Admin dashboard.
 */
router.get("/summary", dashboardController.getSummary);

module.exports = router;
