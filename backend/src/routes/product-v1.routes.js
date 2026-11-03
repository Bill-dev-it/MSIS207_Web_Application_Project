const express = require("express");
const productController = require("../controllers/product.controller");
const publicListingController = require(
  "../controllers/public-listing.controller"
);

const router = express.Router();

/**
 * @api {get} /api/v1/products Search & Paginate Products
 * @apiName GetProductsCollection
 * @apiGroup Public Products
 * @apiVersion 1.0.0
 * @apiDescription Active products only. Search is case insensitive over name, part number, manufacturer and description. Sort supports comma-separated fields product_name, part_number, manufacturer, category_name, with optional - for descending (max 4 fields). Filter is JSON array (max 10) of objects with key category_name/manufacturer/product_type, operator = or LIKE, and string value (max 200 characters).
 * @apiQuery {String} [q] Search text (max 200 characters).
 * @apiQuery {String} [sort=product_name] Sort fields, e.g. -manufacturer,product_name.
 * @apiQuery {String} [filter] JSON-encoded array such as [{"key":"category_name","operator":"=","value":"Electrical"}].
 * @apiQuery {Number} [page=1] Positive integer page number.
 * @apiQuery {Number} [per_page=12] Positive integer page size 1-100.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Number} count Returned items on current page.
 * @apiSuccess {Object} meta Pagination metadata.
 * @apiSuccess {Number} meta.page Current page.
 * @apiSuccess {Number} meta.per_page Page size.
 * @apiSuccess {Number} meta.total_items Number matching products.
 * @apiSuccess {Number} meta.total_pages Page count.
 * @apiSuccess {Object[]} data Current page of product rows.
 * @apiError (400 Bad Request) INVALID_QUERY Query values must be strings.
 * @apiError (400 Bad Request) INVALID_PAGINATION Invalid page or per_page.
 * @apiError (400 Bad Request) INVALID_SEARCH Search too long.
 * @apiError (400 Bad Request) INVALID_SORT Unsupported sort field.
 * @apiError (400 Bad Request) INVALID_FILTER Invalid JSON or filter rule.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "count": 1,
 *       "meta": {
 *         "page": 1,
 *         "per_page": 12,
 *         "total_items": 1,
 *         "total_pages": 1
 *       },
 *       "data": [
 *         {
 *           "product_id": "1",
 *           "product_name": "Engine Ignition Lead",
 *           "part_number": "DEMO-PART-00001",
 *           "manufacturer": "Example Manufacturer",
 *           "category_name": "Electrical",
 *           "product_type": "COMPONENT",
 *           "description": "Example aviation component.",
 *           "technical_specs": {},
 *           "is_active": true
 *         }
 *       ]
 *     }
 * @apiErrorExample {json} 400 Bad Request error:
 *     {
 *       "success": false,
 *       "error": {
 *         "code": "INVALID_FILTER",
 *         "message": "filter must be a valid JSON array."
 *       }
 *     }
 */
router.get("/", productController.getProductsV1);
/**
 * @api {get} /api/v1/products/filter-options Get Product Filter Options
 * @apiName GetProductFilterOptions
 * @apiGroup Public Products
 * @apiVersion 1.0.0
 * @apiDescription Lists distinct categories and manufacturers of active products for Marketplace filter dropdowns.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Filter options.
 * @apiSuccess {String[]} data.categories Available category names.
 * @apiSuccess {String[]} data.manufacturers Available manufacturer names.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "data": {
 *         "categories": [
 *           "Electrical",
 *           "Engine"
 *         ],
 *         "manufacturers": [
 *           "Example Manufacturer"
 *         ]
 *       }
 *     }
 */
router.get(
  "/filter-options",
  productController.getProductFilterOptions
);
/**
 * @api {get} /api/v1/products/:productId/listings Get Public Supplier Offers
 * @apiName GetProductSupplierOffers
 * @apiGroup Public Products
 * @apiVersion 1.0.0
 * @apiDescription For an existing active product, returns ACTIVE seller listings from APPROVED suppliers only, sorted by price ascending, then listing ID. Empty data means product exists but has no visible offers.
 * @apiParam {String} productId Positive BIGINT product identifier.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Number} count Number of visible offers.
 * @apiSuccess {Object[]} data Public supplier offers.
 * @apiSuccess {String} data.listing_id Listing identifier.
 * @apiSuccess {String} data.product_id Product identifier.
 * @apiSuccess {String} data.supplier_id Supplier identifier.
 * @apiSuccess {String} data.store_name Supplier store name.
 * @apiSuccess {String} data.seller_sku Supplier SKU.
 * @apiSuccess {String} data.condition NEW, USED or REFURBISHED.
 * @apiSuccess {String} data.price USD decimal string.
 * @apiSuccess {Number} data.stock_quantity Available stock.
 * @apiSuccess {Number} data.lead_time_days Lead time in days.
 * @apiSuccess {String} data.status ACTIVE.
 * @apiError (400 Bad Request) INVALID_PRODUCT_ID Invalid product ID.
 * @apiError (404 Not Found) PRODUCT_NOT_FOUND Product not found or inactive.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "count": 1,
 *       "data": [
 *         {
 *           "listing_id": "1",
 *           "product_id": "1",
 *           "supplier_id": "1",
 *           "seller_sku": "DEMO-S01-P0001",
 *           "condition": "NEW",
 *           "price": "320.00",
 *           "stock_quantity": 12,
 *           "lead_time_days": 3,
 *           "status": "ACTIVE",
 *           "store_name": "Example Supplier"
 *         }
 *       ]
 *     }
 */
router.get(
  "/:productId/listings",
  publicListingController.getProductOffers
);
/**
 * @api {get} /api/v1/products/:productId Get Product By ID
 * @apiName GetProductByIdV1
 * @apiGroup Public Products
 * @apiVersion 1.0.0
 * @apiDescription Returns one active product, including its category and technical specifications.
 * @apiParam {String} productId Positive BIGINT product ID.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Active catalog product.
 * @apiSuccess {String} data.product_id Product identifier.
 * @apiSuccess {String} data.product_name Product name.
 * @apiSuccess {String} data.manufacturer Manufacturer name.
 * @apiSuccess {String} data.part_number Part number.
 * @apiSuccess {String} data.product_type ENGINE, MODULE or COMPONENT.
 * @apiSuccess {String} data.category_name Category name.
 * @apiSuccess {Object} data.technical_specs JSON technical specifications, when available.
 * @apiError (400 Bad Request) INVALID_PRODUCT_ID Invalid positive BIGINT.
 * @apiError (404 Not Found) PRODUCT_NOT_FOUND Not found or inactive.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "data": {
 *         "product_id": "1",
 *         "product_name": "Engine Ignition Lead",
 *         "part_number": "DEMO-PART-00001",
 *         "manufacturer": "Example Manufacturer",
 *         "category_name": "Electrical",
 *         "product_type": "COMPONENT",
 *         "description": "Example aviation component.",
 *         "technical_specs": {},
 *         "is_active": true
 *       }
 *     }
 * @apiErrorExample {json} 404 Not Found error:
 *     {
 *       "success": false,
 *       "error": {
 *         "code": "PRODUCT_NOT_FOUND",
 *         "message": "Product not found."
 *       }
 *     }
 */
router.get("/:productId", productController.getProductById);

module.exports = router;
