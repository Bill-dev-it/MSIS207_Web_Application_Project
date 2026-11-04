const express = require("express");
const dashboardController = require("./dashboard.controller");

const router = express.Router();

router.get("/summary", dashboardController.getSummary);
router.get("/engine-health", dashboardController.getEngineHealth);
router.get("/recent-orders", dashboardController.getRecentOrders);

module.exports = router;

