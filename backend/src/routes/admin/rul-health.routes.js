"use strict";

const router = require("express").Router();
const controller = require("../../controllers/admin/rul-health.controller");

/**
 * @api {get} /api/v1/admin/rul/health Check the internal RUL service
 * @apiName GetAdminRulHealth
 * @apiGroup Admin RUL
 * @apiVersion 1.0.0
 * @apiPermission Admin
 * @apiDescription Authenticated Admin-only status check through Express. The private RUL token is never returned to React.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Monitoring status and model_loaded; unavailable is a valid result.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Admin session required.
 * @apiError (403 Forbidden) ADMIN_REQUIRED Admin role required.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected backend error.
 */
router.get("/health", controller.getHealth);

module.exports = router;

