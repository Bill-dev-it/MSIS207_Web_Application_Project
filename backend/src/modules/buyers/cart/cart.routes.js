const express = require("express");
const cartController = require("./cart.controller");

const router = express.Router();

/**
 * @api {get} /api/v1/cart Get Cart
 */
router.get("/", (req, res) => cartController.getCart(req, res));

/**
 * @api {post} /api/v1/cart/items Add item to cart
 */
router.post("/items", (req, res) => cartController.addItem(req, res));

/**
 * @api {put} /api/v1/cart/items/:cartItemId Update item quantity
 */
router.put("/items/:cartItemId", (req, res) => cartController.updateQuantity(req, res));

/**
 * @api {delete} /api/v1/cart/items/:cartItemId Remove item from cart
 */
router.delete("/items/:cartItemId", (req, res) => cartController.removeItem(req, res));

/**
 * @api {delete} /api/v1/cart Clear cart
 */
router.delete("/", (req, res) => cartController.clearCart(req, res));

module.exports = router;

