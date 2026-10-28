const pool = require("../config/db");

async function getOffersByProductId(productId) {
  const productResult = await pool.query(
    `
    SELECT product_id
    FROM products
    WHERE product_id = $1
      AND is_active = TRUE
    `,
    [productId]
  );

  if (productResult.rows.length === 0) {
    return null;
  }

  const result = await pool.query(
    `
    SELECT
      l.listing_id,
      l.product_id,
      l.supplier_id,
      s.store_name,
      l.seller_sku,
      l.condition,
      l.price,
      l.stock_quantity,
      l.lead_time_days,
      l.status
    FROM seller_listings l
    JOIN suppliers s
      ON l.supplier_id = s.supplier_id
    WHERE l.product_id = $1
      AND l.status = 'ACTIVE'
      AND s.status = 'APPROVED'
    ORDER BY l.price ASC, l.listing_id ASC
    `,
    [productId]
  );

  return result.rows;
}

module.exports = {
  getOffersByProductId,
};
