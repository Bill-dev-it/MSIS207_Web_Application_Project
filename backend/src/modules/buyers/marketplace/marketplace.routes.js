
const express = require("express");
const productController = require("./marketplace.controller");

const router = express.Router();

router.get("/", productController.getProducts);

module.exports = router;
