const express = require("express");
const ordersController = require("./orders.controller");
const orderDetailController = require("./order-detail/orderDetail.controller");
const orderConfirmationController = require("./order-confirmation/orderConfirmation.controller");

const router = express.Router();

router.get("/", ordersController.getOrders);
router.get("/:orderId/confirmation", orderConfirmationController.getOrderConfirmation);
router.get("/:orderId", orderDetailController.getOrderDetail);

module.exports = router;


