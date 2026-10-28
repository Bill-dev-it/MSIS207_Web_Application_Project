const express = require("express");
const productController = require("../controllers/product.controller");
const publicListingController = require(
  "../controllers/public-listing.controller"
);

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
 * @api {get} /api/v1/products/filter-options Get Product Filter Options
 * @apiName GetProductFilterOptions
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription Get available categories and manufacturers.
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {Object} data Filter options.
 * @apiSuccess {String[]} data.categories Categories.
 * @apiSuccess {String[]} data.manufacturers Manufacturers.
 *
 * @apiError (500) {Object} error Server error.
 */
router.get(
  "/filter-options",
  productController.getProductFilterOptions
);

/**
 * @api {get} /api/v1/products/:productId/listings Get Product Supplier Offers
 * @apiName GetProductSupplierOffers
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieve active supplier listings
 * for one active product. Only approved suppliers
 * and active listings are publicly visible.
 *
 * @apiParam {String} productId Positive product identifier.
 *
 * @apiSuccess {Boolean} success Request succeeded.
 * @apiSuccess {Number} count Number of returned offers.
 * @apiSuccess {Object[]} data Supplier offers.
 * @apiSuccess {String} data.listing_id Listing identifier.
 * @apiSuccess {String} data.product_id Product identifier.
 * @apiSuccess {String} data.supplier_id Supplier identifier.
 * @apiSuccess {String} data.store_name Supplier store name.
 * @apiSuccess {String} data.seller_sku Supplier SKU.
 * @apiSuccess {String} data.condition Part condition.
 * @apiSuccess {String} data.price Decimal price in USD.
 * @apiSuccess {Number} data.stock_quantity Available stock.
 * @apiSuccess {Number} data.lead_time_days Lead time in days.
 * @apiSuccess {String} data.status Listing status.
 *
 * @apiError (400) {Object} error Invalid product ID.
 * @apiError (404) {Object} error Product not found.
 * @apiError (500) {Object} error Server error.
 */
router.get(
  "/:productId/listings",
  publicListingController.getProductOffers
);

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
