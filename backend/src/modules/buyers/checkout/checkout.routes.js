const express = require("express");
const checkoutController = require("./checkout.controller");

const router = express.Router();

router.get("/addresses", checkoutController.getAddresses);
router.post("/addresses", checkoutController.addAddress);
router.get("/delivery-methods", checkoutController.getDeliveryMethods);
router.get("/company", checkoutController.getCompanyDetails);
router.post("/orders", checkoutController.placeOrder);

module.exports = router;

