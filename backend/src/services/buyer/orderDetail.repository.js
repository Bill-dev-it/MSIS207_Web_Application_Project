const pool = require("../../config/db");

async function getOrderDetailById(orderId, companyId) {
  // 1. Fetch master order
  const orderQuery = `
    SELECT
      o.order_id,
      o.order_number,
      o.buyer_company_id,
      o.placed_by,
      o.currency,
      o.purchase_reference,
      o.company_name_snapshot,
      o.tax_id_snapshot,
      o.shipping_address_snapshot,
      o.billing_address_snapshot,
      o.subtotal,
      o.shipping_total,
      o.grand_total,
      o.created_at,
      u.full_name AS placed_by_name,
      u.email AS placed_by_email
    FROM orders o
    LEFT JOIN users u ON o.placed_by = u.user_id
    WHERE o.order_id = $1 AND o.buyer_company_id = $2
  `;
  const orderRes = await pool.query(orderQuery, [orderId, companyId]);
  if (orderRes.rows.length === 0) {
    return null;
  }
  const order = orderRes.rows[0];

  // 2. Fetch seller orders and order items
  const sellerOrdersQuery = `
    SELECT
      so.seller_order_id,
      so.order_id,
      so.supplier_id,
      so.supplier_name_snapshot,
      so.status,
      so.subtotal,
      so.shipping_fee,
      so.grand_total,
      so.created_at,
      so.processing_at,
      sh.shipment_id,
      sh.carrier,
      sh.tracking_number,
      sh.shipped_at,
      sh.estimated_delivery_at,
      sh.delivered_at
    FROM seller_orders so
    LEFT JOIN shipments sh ON so.seller_order_id = sh.seller_order_id
    WHERE so.order_id = $1
    ORDER BY so.seller_order_id ASC
  `;
  const sellerOrdersRes = await pool.query(sellerOrdersQuery, [orderId]);
  const sellerOrders = sellerOrdersRes.rows;

  // 3. Fetch items for each seller order
  for (const so of sellerOrders) {
    const itemsQuery = `
      SELECT
        oi.order_item_id,
        oi.seller_order_id,
        oi.listing_id,
        oi.quantity,
        oi.unit_price,
        oi.line_total,
        oi.condition_snapshot,
        oi.product_name_snapshot,
        oi.part_number_snapshot,
        oi.seller_sku_snapshot,
        p.product_id,
        p.product_type,
        c.category_name
      FROM order_items oi
      LEFT JOIN seller_listings sl ON oi.listing_id = sl.listing_id
      LEFT JOIN products p ON sl.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE oi.seller_order_id = $1
      ORDER BY oi.order_item_id ASC
    `;
    const itemsRes = await pool.query(itemsQuery, [so.seller_order_id]);
    so.items = itemsRes.rows;
  }

  // 4. Fetch payment record
  const paymentQuery = `
    SELECT
      payment_id,
      order_id,
      amount,
      payment_method,
      status,
      paid_at
    FROM payments
    WHERE order_id = $1
    ORDER BY payment_id DESC
    LIMIT 1
  `;
  const paymentRes = await pool.query(paymentQuery, [orderId]);
  const paymentRow = paymentRes.rows[0] || null;
  const payment = paymentRow
    ? {
        ...paymentRow,
        currency: order.currency,
        transfer_reference: order.order_number,
      }
    : null;

  return {
    ...order,
    payment_method: payment ? payment.payment_method : null,
    payment_status: payment ? payment.status : null,
    paid_at: payment ? payment.paid_at : null,
    seller_orders: sellerOrders,
    payment,
  };
}

module.exports = {
  getOrderDetailById,
};
