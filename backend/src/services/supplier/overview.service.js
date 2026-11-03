const pool = require("../../config/db");

async function getOverview(supplierId) {
  const listings = await pool.query(`
    SELECT COUNT(*)::INT AS total,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::INT AS active,
      COUNT(*) FILTER (WHERE status = 'DRAFT')::INT AS draft,
      COUNT(*) FILTER (WHERE status = 'HIDDEN')::INT AS hidden,
      COUNT(*) FILTER (WHERE stock_quantity > 5)::INT AS in_stock,
      COUNT(*) FILTER (WHERE stock_quantity BETWEEN 1 AND 5)::INT AS low_stock,
      COUNT(*) FILTER (WHERE stock_quantity = 0)::INT AS out_of_stock
    FROM seller_listings WHERE supplier_id = $1
  `, [supplierId]);
  const orders = await pool.query(`
    SELECT COUNT(*)::INT AS total,
      COUNT(*) FILTER (WHERE status = 'CONFIRMED')::INT AS confirmed,
      COUNT(*) FILTER (WHERE status = 'PROCESSING')::INT AS processing,
      COUNT(*) FILTER (WHERE status = 'SHIPPED')::INT AS shipped,
      COUNT(*) FILTER (WHERE status = 'DELIVERED')::INT AS delivered
    FROM seller_orders WHERE supplier_id = $1
  `, [supplierId]);
  return { listings: listings.rows[0], orders: orders.rows[0] };
}
module.exports = { getOverview };
