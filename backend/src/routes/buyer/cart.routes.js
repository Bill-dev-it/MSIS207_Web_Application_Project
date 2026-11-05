const express = require("express");
const cartController = require("../../controllers/buyer/cart.controller");

const router = express.Router();

/**
 * @api {get} /api/v1/cart Get buyer cart
 * @apiName GetBuyerCart
 * @apiGroup Buyer Cart
 * @apiVersion 1.0.0
 * @apiDescription Requires a BUYER session and returns the cart owned by the authenticated user.
 * @apiPermission Buyer
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Cart with items, subtotal and total_items.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Cart could not be read.
 * @apiSuccessExample {json} 200 OK:
 *     { "success": true, "data": { "items": [], "subtotal": 0, "total_items": 0 } }
 */
router.get("/", (req, res) => cartController.getCart(req, res));

/**
 * @api {post} /api/v1/cart/items Add listing to buyer cart
 * @apiName AddBuyerCartItem
 * @apiGroup Buyer Cart
 * @apiVersion 1.0.0
 * @apiDescription Adds an ACTIVE offer from an APPROVED supplier after checking stock. Requires X-AeroRUL-Request: 1.
 * @apiPermission Buyer
 * @apiBody {String} listing_id Positive BIGINT seller listing ID.
 * @apiBody {Number} [quantity=1] Positive integer quantity.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Updated cart.
 * @apiError (400 Bad Request) INVALID_LISTING_ID Invalid listing ID.
 * @apiError (400 Bad Request) INVALID_QUANTITY Quantity must be a positive integer no greater than 2147483647.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED, UNTRUSTED_REQUEST or UNTRUSTED_ORIGIN Buyer role, trusted mutation header or allowed origin is required.
 * @apiError (404 Not Found) LISTING_NOT_FOUND Listing or active product not found.
 * @apiError (409 Conflict) OFFER_UNAVAILABLE or INSUFFICIENT_STOCK Listing is hidden, supplier unapproved, or stock is insufficient.
 * @apiSuccessExample {json} 200 OK:
 *     { "success": true, "data": { "items": [], "subtotal": 0, "total_items": 0 } }
 * @apiError (409 Conflict) INSUFFICIENT_STOCK Requested quantity exceeds available stock.
 */
router.post("/items", (req, res) => cartController.addItem(req, res));

/**
 * @api {put} /api/v1/cart/items/:cartItemId Update buyer cart quantity
 * @apiName UpdateBuyerCartItem
 * @apiGroup Buyer Cart
 * @apiVersion 1.0.0
 * @apiDescription Updates an item owned by the authenticated user after checking offer availability and stock. Requires X-AeroRUL-Request: 1.
 * @apiPermission Buyer
 * @apiParam {String} cartItemId Positive BIGINT cart item ID.
 * @apiBody {Number} quantity Positive integer quantity.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Updated cart.
 * @apiError (404 Not Found) CART_ITEM_NOT_FOUND Item does not belong to this Buyer.
 * @apiError (409 Conflict) INSUFFICIENT_STOCK Requested quantity exceeds available stock.
 * @apiError (400 Bad Request) INVALID_CART_ITEM_ID or INVALID_QUANTITY Invalid item ID or quantity.
 * @apiError (409 Conflict) OFFER_UNAVAILABLE Listing is no longer available.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED, UNTRUSTED_REQUEST or UNTRUSTED_ORIGIN Buyer role, trusted mutation header or allowed origin is required.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Cart could not be updated.
 */
router.put("/items/:cartItemId", (req, res) => cartController.updateQuantity(req, res));

/**
 * @api {delete} /api/v1/cart/items/:cartItemId Remove buyer cart item
 * @apiName RemoveBuyerCartItem
 * @apiGroup Buyer Cart
 * @apiVersion 1.0.0
 * @apiDescription Removes only an item owned by the authenticated user. Requires X-AeroRUL-Request: 1.
 * @apiPermission Buyer
 * @apiParam {String} cartItemId Positive BIGINT cart item ID.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Updated cart.
 * @apiError (404 Not Found) CART_ITEM_NOT_FOUND Item does not belong to this Buyer.
 * @apiError (400 Bad Request) INVALID_CART_ITEM_ID Invalid cart item ID.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED, UNTRUSTED_REQUEST or UNTRUSTED_ORIGIN Buyer role, trusted mutation header or allowed origin is required.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Cart item could not be removed.
 */
router.delete("/items/:cartItemId", (req, res) => cartController.removeItem(req, res));

/**
 * @api {delete} /api/v1/cart Clear buyer cart
 * @apiName ClearBuyerCart
 * @apiGroup Buyer Cart
 * @apiVersion 1.0.0
 * @apiDescription Clears only the authenticated user's cart. Requires X-AeroRUL-Request: 1.
 * @apiPermission Buyer
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Empty cart.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED, UNTRUSTED_REQUEST or UNTRUSTED_ORIGIN Buyer role, trusted mutation header or allowed origin is required.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Cart could not be cleared.
 */
router.delete("/", (req, res) => cartController.clearCart(req, res));

module.exports = router;
