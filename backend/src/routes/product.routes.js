const express = require("express");
const productController = require("../controllers/product.controller");

const router = express.Router();

/**
 * @api {get} /api/products List Products (Legacy)
 * @apiName ListProductsLegacy
 * @apiGroup Legacy Products
 * @apiVersion 1.0.0
 * @apiDescription Legacy unpaginated collection endpoint for compatibility; returns all active products. Prefer GET /api/v1/products for search/filter/pagination.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Number} count Number of active products.
 * @apiSuccess {Object[]} data Product catalog rows.
 * @apiError (500 Internal Server Error) message Failed to retrieve products.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "count": 1,
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
 */
router.get("/", productController.getProducts);

/**
 * @api {get} /api/products/:productId Get Product By ID (Legacy)
 * @apiName GetProductByIdLegacy
 * @apiGroup Legacy Products
 * @apiVersion 1.0.0
 * @apiDescription Legacy URL for one active catalog product. Prefer GET /api/v1/products/:productId.
 * @apiParam {String} productId Positive BIGINT product identifier.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Active product.
 * @apiError (400 Bad Request) INVALID_PRODUCT_ID Nonpositive or invalid BIGINT.
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
