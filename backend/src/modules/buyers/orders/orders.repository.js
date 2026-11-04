const pool = require("../../../config/db");

async function getBuyerOrders({
  companyId,
  status,
  search,
  page = 1,
  limit = 10,
}) {
  const offset = (page - 1) * limit;
  const conditions = ["o.buyer_company_id = $1"];
  const params = [companyId];
  let paramIdx = 2;

  if (search && search.trim()) {
    conditions.push(
      `(o.order_number ILIKE $${paramIdx} OR o.purchase_reference ILIKE $${paramIdx})`
    );
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  // Calculate dynamic status counts across ALL orders for this company
  const countsQuery = `
    SELECT
      COUNT(DISTINCT o.order_id) AS total_all,
      COUNT(DISTINCT CASE WHEN so.status = 'CONFIRMED' THEN o.order_id END) AS total_confirmed,
      COUNT(DISTINCT CASE WHEN so.status = 'PROCESSING' THEN o.order_id END) AS total_processing,
      COUNT(DISTINCT CASE WHEN so.status = 'SHIPPED' THEN o.order_id END) AS total_shipped,
      COUNT(DISTINCT CASE WHEN so.status = 'DELIVERED' THEN o.order_id END) AS total_delivered,
      COUNT(DISTINCT CASE WHEN so.status = 'CANCELLED' THEN o.order_id END) AS total_cancelled
    FROM orders o
    LEFT JOIN seller_orders so ON o.order_id = so.order_id
    WHERE o.buyer_company_id = $1
  `;
  const countsRes = await pool.query(countsQuery, [companyId]);
  const rawCounts = countsRes.rows[0] || {};

  const counts = {
    ALL: Number(rawCounts.total_all) || 0,
    CONFIRMED: Number(rawCounts.total_confirmed) || 0,
    PROCESSING: Number(rawCounts.total_processing) || 0,
    SHIPPED: Number(rawCounts.total_shipped) || 0,
    DELIVERED: Number(rawCounts.total_delivered) || 0,
    CANCELLED: Number(rawCounts.total_cancelled) || 0,
  };

  // Status filter condition
  if (status && status !== "ALL") {
    conditions.push(
      `EXISTS (SELECT 1 FROM seller_orders so WHERE so.order_id = o.order_id AND so.status = $${paramIdx})`
    );
    params.push(status);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count total matching
  const totalCountQuery = `
    SELECT COUNT(DISTINCT o.order_id) AS total
    FROM orders o
    ${whereClause}
  `;
  const totalCountRes = await pool.query(totalCountQuery, params);
  const total = Number(totalCountRes.rows[0]?.total || 0);

  // Query paginated orders with supplier aggregations
  const ordersQuery = `
    SELECT
      o.order_id,
      o.order_number,
      o.purchase_reference,
      o.created_at,
      o.grand_total,
      o.currency,
      COALESCE(
        (SELECT status FROM seller_orders WHERE order_id = o.order_id ORDER BY seller_order_id ASC LIMIT 1),
        'CONFIRMED'
      ) AS primary_status,
      COALESCE(
        (SELECT SUM(quantity) FROM order_items oi JOIN seller_orders so ON oi.seller_order_id = so.seller_order_id WHERE so.order_id = o.order_id),
        0
      )::integer AS total_items,
      COALESCE(
        (SELECT STRING_AGG(DISTINCT supplier_name_snapshot, ', ') FROM seller_orders WHERE order_id = o.order_id),
        'Authorized Distributor'
      ) AS suppliers_list
    FROM orders o
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  params.push(limit, offset);
  const ordersRes = await pool.query(ordersQuery, params);

  return {
    orders: ordersRes.rows,
    counts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = {
  getBuyerOrders,
};

