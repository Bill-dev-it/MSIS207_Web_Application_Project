"use strict";

const express = require("express");

const ordersController = require("./orders.controller");

const {
    requireAuth,
} = require("../../../middleware/require-auth");

const requireAdmin = require("../../../middleware/require-admin");

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/", ordersController.getOrders);
router.get("/:orderId", ordersController.getOrderById);

module.exports = router;

