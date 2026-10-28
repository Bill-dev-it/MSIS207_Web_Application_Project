const express = require("express");
const productController = require("../controllers/product.controller");

const router = express.Router();

/**
 * @api {get} /api/v1/products Get All Products
 * @apiName GetAllProducts
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve all active aviation parts
 * from the AeroRUL product catalog.
 *
 * @apiSuccess {Boolean} success Request success status.
 * @apiSuccess {Number} count Number of returned products.
 * @apiSuccess {Object[]} data List of products.
 * @apiSuccess {String} data.product_id Product identifier.
 * @apiSuccess {String} data.product_name Product name.
 * @apiSuccess {String} data.part_number Part number.
 * @apiSuccess {String} data.manufacturer Manufacturer name.
 * @apiSuccess {String} data.product_type Product type.
 * @apiSuccess {String} data.category_name Category name.
 * @apiSuccess {Object} data.technical_specs Technical specifications.
 *
 * @apiSuccessExample {json} Success Response:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "count": 1,
 *   "data": [
 *     {
 *       "product_id": "1",
 *       "product_name": "Engine Ignition Lead 001",
 *       "part_number": "DEMO-PART-00001",
 *       "manufacturer": "Demo Aero Components 2",
 *       "product_type": "COMPONENT",
 *       "category_name": "Electrical",
 *       "technical_specs": {}
 *     }
 *   ]
 * }
 *
 * @apiError (500) {Boolean} success=false Request failed.
 * @apiError (500) {String} message Error description.
 */
router.get("/", productController.getProducts);

/**
 * @api {get} /api/v1/products/:productId Get Product By ID
 * @apiName GetProductById
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve one active product from
 * the aviation parts catalog.
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
 * @apiSuccess {Object} data.technical_specs Technical specifications.
 *
 * @apiError (400) {Object} error Invalid product ID.
 * @apiError (404) {Object} error Product not found.
 * @apiError (500) {Object} error Internal server error.
 */
router.get("/:productId", productController.getProductById);

module.exports = router;