const pool = require("../../config/db");

const LISTING_COLUMNS = `
  l.listing_id, l.product_id, l.supplier_id, l.seller_sku,
  l.condition, l.price, l.stock_quantity, l.lead_time_days,
  l.status, l.updated_at, p.product_name, p.part_number
`;

async function getAll(supplierId) {
  const result = await pool.query(`
    SELECT ${LISTING_COLUMNS}
    FROM seller_listings l
    JOIN products p ON p.product_id = l.product_id
    WHERE l.supplier_id = $1
    ORDER BY l.updated_at DESC, l.listing_id DESC
  `, [supplierId]);
  return result.rows;
}

async function getOne(supplierId, listingId) {
  const result = await pool.query(`
    SELECT ${LISTING_COLUMNS}
    FROM seller_listings l
    JOIN products p ON p.product_id = l.product_id
    WHERE l.supplier_id = $1 AND l.listing_id = $2
  `, [supplierId, listingId]);
  return result.rows[0] || null;
}

async function productIsActive(productId) {
  const result = await pool.query(
    "SELECT 1 FROM products WHERE product_id = $1 AND is_active = TRUE",
    [productId]
  );
  return result.rowCount > 0;
}

async function create(supplierId, data) {
  if (!(await productIsActive(data.product_id))) return null;
  const result = await pool.query(`
    INSERT INTO seller_listings
      (supplier_id, product_id, seller_sku, condition, price,
       stock_quantity, lead_time_days, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING listing_id
  `, [
    supplierId, data.product_id, data.seller_sku, data.condition,
    data.price, data.stock_quantity, data.lead_time_days, data.status,
  ]);
  return getOne(supplierId, result.rows[0].listing_id);
}

// Column names are fixed in code. All user values use PostgreSQL parameters.
async function update(supplierId, listingId, data) {
  const columns = {
    product_id: "product_id", seller_sku: "seller_sku",
    condition: "condition", price: "price",
    stock_quantity: "stock_quantity", lead_time_days: "lead_time_days",
    status: "status",
  };
  if (data.product_id !== undefined && !(await productIsActive(data.product_id))) {
    return { invalidProduct: true };
  }
  const keys = Object.keys(data);
  const values = [supplierId, listingId, ...keys.map((key) => data[key])];
  const setters = keys.map((key, i) => `${columns[key]} = $${i + 3}`);
  const result = await pool.query(`
    UPDATE seller_listings
    SET ${setters.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE supplier_id = $1 AND listing_id = $2
    RETURNING listing_id
  `, values);
  if (!result.rowCount) return null;
  return getOne(supplierId, listingId);
}

async function hide(supplierId, listingId) {
  const result = await pool.query(`
    UPDATE seller_listings SET status = 'HIDDEN', updated_at = CURRENT_TIMESTAMP
    WHERE supplier_id = $1 AND listing_id = $2
    RETURNING listing_id
  `, [supplierId, listingId]);
  return result.rowCount > 0;
}

module.exports = { getAll, getOne, create, update, hide };
