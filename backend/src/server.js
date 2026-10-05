const express = require("express");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

const productRoutes = require("./routes/product.routes");

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Aviation B2B API is running",
  });
});

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

app.use("/api/products", productRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});