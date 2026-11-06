
const express = require("express");

const { requireAuth } = require("../../../middleware/require-auth");
const requireAdmin = require("../../../middleware/require-admin");

const dashboardController = require("./dashboard.controller");

const router = express.Router();

// Only authenticated Admin users can access dashboard.
router.get(
    "/",
    requireAuth,
    requireAdmin,
    dashboardController.getDashboard
);

module.exports = router;
