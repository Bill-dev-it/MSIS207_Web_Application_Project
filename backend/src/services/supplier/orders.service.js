const pool = require("../../config/db");

const ORDER_COLUMNS = `
  so.seller_order_id, so.order_id, so.supplier_id,
  o.order_number, o.purchase_reference,
  o.company_name_snapshot AS buyer_name,
  so.status, so.created_at, so.subtotal, so.shipping_fee,
  so.grand_total, o.currency
`;

async function getAll(supplierId) {
  const result = await pool.query(`
    SELECT ${ORDER_COLUMNS}
    FROM seller_orders so JOIN orders o ON o.order_id = so.order_id
    WHERE so.supplier_id = $1
    ORDER BY so.created_at DESC, so.seller_order_id DESC
  `, [supplierId]);
  if (!result.rowCount) return [];
  const items = await pool.query(`
    SELECT oi.order_item_id, oi.seller_order_id, oi.listing_id,
           oi.product_name_snapshot, oi.part_number_snapshot,
           oi.seller_sku_snapshot, oi.condition_snapshot,
           oi.quantity, oi.unit_price, oi.line_total
    FROM order_items oi
    JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
    WHERE so.supplier_id = $1
    ORDER BY oi.order_item_id
  `, [supplierId]);
  return result.rows.map((order) => ({
    ...order,
    items: items.rows.filter((item) => String(item.seller_order_id) === String(order.seller_order_id)),
  }));
}

async function getOne(supplierId, sellerOrderId) {
  const result = await pool.query(`
    SELECT ${ORDER_COLUMNS}
    FROM seller_orders so JOIN orders o ON o.order_id = so.order_id
    WHERE so.supplier_id = $1 AND so.seller_order_id = $2
  `, [supplierId, sellerOrderId]);
  if (!result.rowCount) return null;
  const items = await pool.query(`
    SELECT oi.order_item_id, oi.seller_order_id, oi.listing_id,
           oi.product_name_snapshot, oi.part_number_snapshot,
           oi.seller_sku_snapshot, oi.condition_snapshot,
           oi.quantity, oi.unit_price, oi.line_total
    FROM order_items oi
    WHERE oi.seller_order_id = $1
    ORDER BY oi.order_item_id
  `, [sellerOrderId]);
  return { ...result.rows[0], items: items.rows };
}

// Only allows forward transitions, and only for this supplier.
async function updateStatus(supplierId, sellerOrderId, current, next) {
  const result = await pool.query(`
    UPDATE seller_orders SET status = $4,
      processing_at = CASE WHEN $4 = 'PROCESSING' THEN CURRENT_TIMESTAMP ELSE processing_at END
    WHERE supplier_id = $1 AND seller_order_id = $2 AND status = $3
    RETURNING seller_order_id
  `, [supplierId, sellerOrderId, current, next]);
  return result.rowCount > 0;
}

module.exports = { getAll, getOne, updateStatus };
