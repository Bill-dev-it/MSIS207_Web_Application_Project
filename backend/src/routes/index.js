const express = require("express");

const marketplaceRoutes = require("../modules/buyers/marketplace/marketplace.routes");
const productV1Routes = require("../modules/buyers/marketplace/products/product-v1.routes");
const cartRoutes = require("../modules/buyers/cart/cart.routes");
const checkoutRoutes = require("../modules/buyers/checkout/checkout.routes");
const ordersRoutes = require("../modules/buyers/orders/orders.routes");
const dashboardRoutes = require("../modules/buyers/dashboard/dashboard.routes");
const enginesRoutes = require("../modules/buyers/engines/engines.routes");
const rulRoutes = require("../modules/buyers/rul-analysis/rul.routes");

const router = express.Router();

// Legacy API: GET /api/products
router.use("/products", marketplaceRoutes);

// Versioned API: GET /api/v1/products
router.use("/v1/products", productV1Routes);

// Versioned API: GET /api/v1/cart
router.use("/v1/cart", cartRoutes);

// Versioned API: /api/v1/checkout
router.use("/v1/checkout", checkoutRoutes);

// Versioned API: /api/v1/orders
router.use("/v1/orders", ordersRoutes);

// Versioned API: /api/v1/dashboard
router.use("/v1/dashboard", dashboardRoutes);

// Versioned API: /api/v1/engines
router.use("/v1/engines", enginesRoutes);

// Versioned API: /api/v1/rul
router.use("/v1/rul", rulRoutes);

module.exports = router;
