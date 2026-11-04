const express = require("express");
const cookieParser = require("cookie-parser");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

const productRoutes = require("./routes/product.routes");
const productV1Routes = require("./routes/product-v1.routes");
const supplierRoutes = require("./routes/supplier");
const authRoutes = require("./routes/auth");

const cartRoutes = require("./modules/buyers/cart/cart.routes");
const checkoutRoutes = require("./modules/buyers/checkout/checkout.routes");
const ordersRoutes = require("./modules/buyers/orders/orders.routes");
const dashboardRoutes = require("./modules/buyers/dashboard/dashboard.routes");
const enginesRoutes = require("./modules/buyers/engines/engines.routes");
const rulRoutes = require("./modules/buyers/rul-analysis/rul.routes");

app.use(express.json());
app.use(cookieParser());

/**
 * @api {get} / API Health Message
 * @apiName GetApiRoot
 * @apiGroup System
 * @apiVersion 1.0.0
 * @apiDescription Returns an informational message to confirm that the Express server is running. Does not query PostgreSQL.
 * @apiSuccess {String} message Server startup message.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "message": "Aviation B2B API is running"
 *     }
 */
app.get("/", (req, res) => {
  res.json({
    message: "Aviation B2B API is running",
  });
});

/**
 * @api {get} /api/db-test Database Connectivity Check
 * @apiName GetDatabaseConnection
 * @apiGroup System
 * @apiVersion 1.0.0
 * @apiDescription Tests PostgreSQL connectivity and counts products. Development diagnostic only; do not expose publicly on a production deployment without access controls.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} connection Database details.
 * @apiSuccess {String} connection.database Current database name.
 * @apiSuccess {String} connection.db_user PostgreSQL login name.
 * @apiSuccess {String} connection.product_count Count returned as a string by pg BIGINT.
 * @apiError (500 Internal Server Error) message Database connection failed.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "connection": {
 *         "database": "aerorul_db",
 *         "db_user": "postgres",
 *         "product_count": "10"
 *       }
 *     }
 */
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS db_user,
        COUNT(*) AS product_count
      FROM products;
    `);

    res.json({
      success: true,
      connection: result.rows[0],
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use("/api/v1/products", productV1Routes);
app.use("/api/v1/supplier", supplierRoutes);

app.use("/api/products", productRoutes);
app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/checkout", checkoutRoutes);
app.use("/api/v1/orders", ordersRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/engines", enginesRoutes);
app.use("/api/v1/rul", rulRoutes);

if (process.env.NODE_ENV !== "production") {
  const path = require("path");

  app.use(
    "/docs",
    express.static(path.join(__dirname, "../docs/apidoc"))
  );
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});