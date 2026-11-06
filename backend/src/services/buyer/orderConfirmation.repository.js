const pool = require("../../config/db");

async function getOrderConfirmation(orderId, companyId) {
  const query = `
    SELECT
      o.order_id,
      o.order_number,
      o.purchase_reference,
      o.company_name_snapshot,
      o.shipping_address_snapshot,
      o.currency,
      o.subtotal,
      o.shipping_total,
      o.grand_total,
      o.created_at,
      p.payment_id,
      p.payment_method,
      p.amount AS payment_amount,
      p.status AS payment_status,
      p.paid_at,
      o.order_number AS transfer_reference,
      COALESCE(
        (SELECT status FROM seller_orders WHERE order_id = o.order_id LIMIT 1),
        'CONFIRMED'
      ) AS primary_status,
      COALESCE(
        (SELECT SUM(quantity) FROM order_items oi JOIN seller_orders so ON oi.seller_order_id = so.seller_order_id WHERE so.order_id = o.order_id),
        0
      )::integer AS total_items
    FROM orders o
    LEFT JOIN payments p ON o.order_id = p.order_id
    WHERE o.order_id = $1 AND o.buyer_company_id = $2
    LIMIT 1
  `;
  const result = await pool.query(query, [orderId, companyId]);
  return result.rows[0] || null;
}

module.exports = {
  getOrderConfirmation,
};
