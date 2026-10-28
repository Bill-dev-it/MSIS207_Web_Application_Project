const express = require("express");
const productController = require("../controllers/product.controller");

const router = express.Router();

/**
 * @api {get} /api/v1/products Get Products Collection
 * @apiName GetProductsCollection
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription Search, filter, sort and paginate
 * active products from the AeroRUL catalog.
 *
 * @apiQuery {String} [q] Free-text search.
 * @apiQuery {String} [sort=product_name] Sorting fields.
 * @apiQuery {String} [filter] JSON array of filter rules.
 * @apiQuery {Number} [page=1] Page number.
 * @apiQuery {Number} [per_page=12] Results per page (1-100).
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {Number} count Returned items on this page.
 * @apiSuccess {Object} meta Pagination metadata.
 * @apiSuccess {Number} meta.page Current page.
 * @apiSuccess {Number} meta.per_page Page size.
 * @apiSuccess {Number} meta.total_items Matching products.
 * @apiSuccess {Number} meta.total_pages Total pages.
 * @apiSuccess {Object[]} data Products for this page.
 *
 * @apiError (400) {Object} error Invalid query parameters.
 * @apiError (500) {Object} error Internal server error.
 */
router.get("/", productController.getProductsV1);

/**
 * @api {get} /api/v1/products/:productId Get Product By ID
 * @apiName GetProductByIdV1
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
