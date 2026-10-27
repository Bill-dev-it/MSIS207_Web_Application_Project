require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const pool = require("./config/db");
const { notFoundHandler, errorHandler } = require("./middleware/error");

const productRoutes = require("./routes/product.routes");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/", (req, res) => {
    res.json({ message: "Aviation B2B API is running" });
  });

  app.get("/api/db-test", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT current_database() AS database, current_user AS db_user, COUNT(*) AS product_count
        FROM products;
      `);
      res.json({ success: true, connection: result.rows[0] });
    } catch (error) {
      console.error("Database connection failed:", error);
      res.status(500).json({ success: false, message: "Database connection failed" });
    }
  });

  app.use("/api/products", productRoutes);
  app.use("/api/auth", require("./routes/auth.routes"));
  app.use("/api/buyer", require("./routes/buyer.routes"));
  app.use("/api/admin", require("./routes/admin.routes"));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
