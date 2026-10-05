const pool = require("../config/db");

async function getAllProducts() {
  const result = await pool.query(`
    SELECT
      p.product_id,
      p.product_name,
      p.manufacturer,
      p.part_number,
      p.product_type,
      p.description,
      p.technical_specs,
      p.is_active,
      c.category_name
    FROM products p
    JOIN categories c
      ON p.category_id = c.category_id
    WHERE p.is_active = TRUE
    ORDER BY p.product_id;
  `);

  return result.rows;
}

module.exports = {
  getAllProducts,
};