const express = require("express");
const productController = require("../controllers/product.controller");

const router = express.Router();

router.get("/", productController.getProducts);

/**
 * @api {get} /api/products/:productId Get Product By ID (Legacy)
 * @apiName GetProductByIdLegacy
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription Temporary legacy route for frontend compatibility.
 *
 * @apiParam {String} productId Positive product identifier.
 *
 * @apiSuccess {Boolean} success Request succeeded.
 * @apiSuccess {Object} data Product information.
 * @apiSuccess {String} data.product_id Product identifier.
 * @apiSuccess {String} data.product_name Product name.
 * @apiSuccess {String} data.part_number Part number.
 * @apiSuccess {String} data.manufacturer Manufacturer.
 * @apiSuccess {String} data.category_name Product category.
 *
 * @apiError (400) {Object} error Invalid product ID.
 * @apiError (404) {Object} error Product not found.
 * @apiError (500) {Object} error Internal server error.
 */
router.get("/:productId", productController.getProductById);

module.exports = router;