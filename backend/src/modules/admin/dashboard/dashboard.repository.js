
const pool = require("../../../config/db");
async function getDashboardSummary() {
  const [
    usersResult,
    suppliersResult,
    ordersResult,
    revenueResult,
    productsResult,
    salesTrendResult,
    rulStatusResult,
    supplierRequestsResult,
  ] = await Promise.all([
    // Users
    pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
        )::int AS created_this_month,
        COUNT(*) FILTER (
          WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP - INTERVAL '1 month')
            AND created_at < date_trunc('month', CURRENT_TIMESTAMP)
        )::int AS created_last_month
      FROM users
      WHERE is_active = TRUE
    `),

    // Suppliers
    pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending
      FROM suppliers
    `),

    // Orders
    pool.query(`
      SELECT COUNT(*)::int AS total
      FROM orders
    `),

    // Confirmed revenue: only successful payments
    pool.query(`
      SELECT
        COALESCE(SUM(p.amount), 0)::numeric AS total_revenue,
        COALESCE(
          SUM(p.amount) FILTER (
            WHERE p.paid_at >= date_trunc('month', CURRENT_TIMESTAMP)
          ), 0
        )::numeric AS current_month_revenue,
        COALESCE(
          SUM(p.amount) FILTER (
            WHERE p.paid_at >= date_trunc('month', CURRENT_TIMESTAMP - INTERVAL '1 month')
              AND p.paid_at < date_trunc('month', CURRENT_TIMESTAMP)
          ), 0
        )::numeric AS previous_month_revenue
      FROM payments p
      WHERE p.status = 'SUCCEEDED'
    `),

    // Active products and draft listings
    pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM products WHERE is_active = TRUE)
          AS total_products,
        (
          SELECT COUNT(*)::int
          FROM seller_listings
          WHERE status = 'DRAFT'
        ) AS draft_listings
    `),

    // Last six calendar months, including months without revenue
    pool.query(`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
          date_trunc('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) AS month_start
      ),
      monthly_revenue AS (
        SELECT
          date_trunc('month', p.paid_at) AS month_start,
          SUM(p.amount)::numeric AS revenue
        FROM payments p
        WHERE p.status = 'SUCCEEDED'
          AND p.paid_at >=
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY date_trunc('month', p.paid_at)
      )
      SELECT
        TO_CHAR(m.month_start, 'Mon') AS month,
        COALESCE(mr.revenue, 0)::numeric AS revenue
      FROM months m
      LEFT JOIN monthly_revenue mr
        ON mr.month_start = m.month_start
      ORDER BY m.month_start
    `),

    // RUL prediction and model information
    pool.query(`
      SELECT
        (
          SELECT version
          FROM ml_model_versions
          WHERE is_active = TRUE
          ORDER BY created_at DESC
          LIMIT 1
        ) AS model_version,
        (
          SELECT prediction_date
          FROM rul_predictions
          ORDER BY prediction_date DESC
          LIMIT 1
        ) AS last_prediction,
        (
          SELECT COUNT(*)::int
          FROM rul_predictions
          WHERE prediction_date >= CURRENT_DATE
            AND prediction_date < CURRENT_DATE + INTERVAL '1 day'
        ) AS predictions_today,
        (
          SELECT AVG(
            EXTRACT(EPOCH FROM (completed_at - prediction_date)) * 1000
          )
          FROM rul_predictions
          WHERE status = 'SUCCEEDED'
            AND completed_at IS NOT NULL
            AND completed_at >= prediction_date
        ) AS average_latency_ms
    `),

    // Latest pending supplier applications
    pool.query(`
      SELECT
        supplier_id AS id,
        store_name AS name,
        created_at AS applied_at,
        status
      FROM suppliers
      WHERE status = 'PENDING'
      ORDER BY created_at DESC
      LIMIT 5
    `),
  ]);

  return {
    users: usersResult.rows[0],
    suppliers: suppliersResult.rows[0],
    orders: ordersResult.rows[0],
    revenue: revenueResult.rows[0],
    products: productsResult.rows[0],
    salesTrend: salesTrendResult.rows,
    rulStatus: rulStatusResult.rows[0],
    newSupplierRequests: supplierRequestsResult.rows,
    // No report table has been verified in the supplied schema.
    reportedItems: [],
  };
}

module.exports = { getDashboardSummary };
