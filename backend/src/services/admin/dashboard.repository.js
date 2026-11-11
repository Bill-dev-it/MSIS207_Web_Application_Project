"use strict";

const pool = require("../../config/db");

async function getSummary() {
  const snapshot = await pool.query(`
      SELECT
        (
          SELECT COUNT(*)::INT
          FROM public.users
          WHERE role = 'BUYER' AND is_active = TRUE
        ) AS buyers,
        (
          SELECT COUNT(*)::INT
          FROM public.suppliers
        ) AS suppliers_total,
        (
          SELECT COUNT(*)::INT
          FROM public.suppliers
          WHERE status = 'PENDING'
        ) AS suppliers_pending,
        (
          SELECT COUNT(*)::INT
          FROM public.suppliers
          WHERE status = 'APPROVED'
        ) AS suppliers_approved,
        (
          SELECT COUNT(*)::INT
          FROM public.products
          WHERE is_active = TRUE
        ) AS products_active,
        (
          SELECT COUNT(*)::INT
          FROM public.seller_listings sl
          JOIN public.suppliers s ON s.supplier_id = sl.supplier_id
          JOIN public.products p ON p.product_id = sl.product_id
          WHERE sl.status = 'ACTIVE'
            AND s.status = 'APPROVED'
            AND p.is_active = TRUE
        ) AS listings_active,
        (
          SELECT COUNT(*)::INT
          FROM public.orders
        ) AS orders_total,
        (
          SELECT COUNT(*)::INT
          FROM public.payments
          WHERE payment_method = 'BANK_TRANSFER' AND status = 'PENDING'
        ) AS payments_pending,
        (
          SELECT COALESCE(SUM(amount), 0)::TEXT
          FROM public.payments
          WHERE status = 'SUCCEEDED'
        ) AS succeeded_payment_volume_usd,
        (
          SELECT COUNT(*)::INT
          FROM public.rul_predictions
          WHERE prediction_date >= CURRENT_DATE
            AND prediction_date < CURRENT_DATE + INTERVAL '1 day'
        ) AS predictions_today,
        (
          SELECT MAX(prediction_date)
          FROM public.rul_predictions
        ) AS last_prediction,
        (
          SELECT version
          FROM public.ml_model_versions
          WHERE is_active = TRUE
          ORDER BY created_at DESC, model_version_id DESC
          LIMIT 1
        ) AS model_version
    `);
  const trend = await pool.query(`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '5 months',
          date_trunc('month', CURRENT_TIMESTAMP),
          INTERVAL '1 month'
        ) AS month_start
      )
      SELECT
        to_char(m.month_start, 'YYYY-MM') AS month,
        COALESCE(SUM(p.amount), 0)::TEXT AS total_usd
      FROM months m
      LEFT JOIN public.payments p
        ON p.status = 'SUCCEEDED'
        AND p.paid_at >= m.month_start
        AND p.paid_at < m.month_start + INTERVAL '1 month'
      GROUP BY m.month_start
      ORDER BY m.month_start
    `);

  return {
    ...snapshot.rows[0],
    sales_trend: trend.rows,
  };
}

module.exports = {
  getSummary,
};
