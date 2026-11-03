const pool = require("../../config/db");

async function getInventory(supplierId) {
  const result = await pool.query(`
    SELECT l.listing_id, l.seller_sku, l.product_id, p.product_name,
           l.stock_quantity, l.status, l.updated_at
    FROM seller_listings l
    JOIN products p ON p.product_id = l.product_id
    WHERE l.supplier_id = $1
    ORDER BY p.product_name, l.listing_id
  `, [supplierId]);
  const summary = { total_listings: result.rows.length, in_stock: 0, low_stock: 0, out_of_stock: 0 };
  for (const listing of result.rows) {
    if (listing.stock_quantity === 0) summary.out_of_stock++;
    else if (listing.stock_quantity <= 5) summary.low_stock++;
    else summary.in_stock++;
  }
  return { summary, items: result.rows };
}

async function updateStock(supplierId, listingId, stockQuantity) {
  const result = await pool.query(`
    UPDATE seller_listings
    SET stock_quantity = $3, updated_at = CURRENT_TIMESTAMP
    WHERE supplier_id = $1 AND listing_id = $2
    RETURNING listing_id, stock_quantity, status, updated_at
  `, [supplierId, listingId, stockQuantity]);
  return result.rows[0] || null;
}

module.exports = { getInventory, updateStock };
