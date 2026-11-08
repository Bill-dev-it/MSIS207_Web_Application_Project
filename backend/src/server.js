const express = require("express");
const cookieParser = require("cookie-parser");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

const productRoutes = require("./routes/product.routes");
const productV1Routes = require("./routes/product-v1.routes");
const supplierRoutes = require("./routes/supplier");
const authRoutes = require("./routes/auth");
const requireAdmin = require("./middleware/require-admin");
const requireBuyer = require("./middleware/require-buyer");
const adminPaymentRoutes = require("./routes/admin/payments.routes");
const adminSupplierRoutes = require("./routes/admin/suppliers.routes");
const adminDashboardRoutes = require("./routes/admin/dashboard.routes");
const adminRulHealthRoutes = require("./routes/admin/rul-health.routes");
const buyerCartRoutes = require("./routes/buyer/cart.routes");
const buyerCheckoutRoutes = require("./routes/buyer/checkout.routes");
const buyerOrderRoutes = require("./routes/buyer/orders.routes");
const buyerDashboardRoutes = require("./routes/buyer/dashboard.routes");
const buyerEngineRoutes = require("./routes/buyer/engines.routes");
const buyerRulRoutes = require("./routes/buyer/rul.routes");

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
  res.json({ message: "Aviation B2B API is running" });
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
      SELECT current_database() AS database, current_user AS db_user,
             COUNT(*) AS product_count FROM products;
    `);
    res.json({ success: true, connection: result.rows[0] });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

app.use("/api/v1/products", productV1Routes);
app.use("/api/v1/supplier", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin/payments", requireAdmin, adminPaymentRoutes);
app.use("/api/v1/admin/suppliers", requireAdmin, adminSupplierRoutes);
app.use("/api/v1/admin/dashboard", requireAdmin, adminDashboardRoutes);
app.use("/api/v1/admin/rul", requireAdmin, adminRulHealthRoutes);
app.use("/api/v1/cart", requireBuyer, buyerCartRoutes);
app.use("/api/v1/checkout", requireBuyer, buyerCheckoutRoutes);
app.use("/api/v1/orders", requireBuyer, buyerOrderRoutes);
app.use("/api/v1/dashboard", requireBuyer, buyerDashboardRoutes);
app.use("/api/v1/engines", requireBuyer, buyerEngineRoutes);
app.use("/api/v1/rul", requireBuyer, buyerRulRoutes);

app.use((error, req, res, next) => {
  if (!req.path.startsWith("/api/v1/rul/")) return next(error);
  if (error.type === "entity.too.large") {
    return res.status(413).json({ success: false, error: {
      code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds the accepted size limit."
    } });
  }
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, error: {
      code: "INVALID_REQUEST_BODY", message: "Unable to parse the request body."
    } });
  }
  if (error.status === 415 || error.type === "charset.unsupported" ||
      error.type === "encoding.unsupported") {
    return res.status(415).json({ success: false, error: {
      code: "UNSUPPORTED_MEDIA_TYPE", message: "Upload CSV as UTF-8 text/csv."
    } });
  }
  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ success: false, error: {
      code: "INVALID_REQUEST_BODY", message: "The request body is invalid."
    } });
  }
  console.error("Buyer RUL request error:", error.type || error.code || "UNKNOWN");
  return res.status(500).json({ success: false, error: {
    code: "INTERNAL_SERVER_ERROR", message: "Unable to process RUL request."
  } });
});

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
