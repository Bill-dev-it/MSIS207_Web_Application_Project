"use strict";

const pool = require("../../config/db");

const STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

async function getBuyerOrders({ companyId, status, search, page, limit }) {
  const baseValues = [companyId];
  const conditions = ["o.buyer_company_id = $1"];
  let nextParameter = 2;
  if (search) {
    conditions.push(`(o.order_number ILIKE $${nextParameter} OR o.purchase_reference ILIKE $${nextParameter})`);
    baseValues.push(`%${search}%`);
    nextParameter++;
  }
  const searchClause = conditions.join(" AND ");

  const countsResult = await pool.query(`
    SELECT COUNT(DISTINCT o.order_id)::INT AS total_all,
           COUNT(DISTINCT o.order_id) FILTER (WHERE so.status = 'CONFIRMED')::INT AS confirmed,
           COUNT(DISTINCT o.order_id) FILTER (WHERE so.status = 'PROCESSING')::INT AS processing,
           COUNT(DISTINCT o.order_id) FILTER (WHERE so.status = 'SHIPPED')::INT AS shipped,
           COUNT(DISTINCT o.order_id) FILTER (WHERE so.status = 'DELIVERED')::INT AS delivered
    FROM orders o
    LEFT JOIN seller_orders so ON so.order_id = o.order_id
    WHERE ${searchClause}
  `, baseValues);

  const listConditions = [...conditions];
  const listValues = [...baseValues];
  if (status && status !== "ALL") {
    listConditions.push(`EXISTS (
      SELECT 1 FROM seller_orders filter_so
      WHERE filter_so.order_id = o.order_id AND filter_so.status = $${nextParameter}
    )`);
    listValues.push(status);
    nextParameter++;
  }
  const whereClause = listConditions.join(" AND ");
  const totalResult = await pool.query(`
    SELECT COUNT(*)::INT AS total FROM orders o WHERE ${whereClause}
  `, listValues);
  const total = totalResult.rows[0].total;

  const result = await pool.query(`
    SELECT o.order_id, o.order_number, o.purchase_reference, o.created_at,
           o.grand_total, o.currency,
           p.payment_method, p.status AS payment_status, p.paid_at,
           COALESCE(
             (SELECT CASE
               WHEN BOOL_OR(status = 'PROCESSING') THEN 'PROCESSING'
               WHEN BOOL_OR(status = 'CONFIRMED') THEN 'CONFIRMED'
               WHEN BOOL_OR(status = 'SHIPPED') THEN 'SHIPPED'
               ELSE 'DELIVERED'
             END FROM seller_orders WHERE order_id = o.order_id),
             'CONFIRMED'
           ) AS primary_status,
           COALESCE(
             (SELECT SUM(oi.quantity) FROM order_items oi
              JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
              WHERE so.order_id = o.order_id), 0
           )::INT AS total_items,
           COALESCE(
             (SELECT STRING_AGG(DISTINCT supplier_name_snapshot, ', ')
              FROM seller_orders WHERE order_id = o.order_id), ''
           ) AS suppliers_list
    FROM orders o
    LEFT JOIN payments p ON p.order_id = o.order_id
    WHERE ${whereClause}
    ORDER BY o.created_at DESC, o.order_id DESC
    LIMIT $${nextParameter} OFFSET $${nextParameter + 1}
  `, [...listValues, limit, (page - 1) * limit]);

  const counts = countsResult.rows[0];
  return {
    orders: result.rows,
    counts: {
      ALL: counts.total_all,
      CONFIRMED: counts.confirmed,
      PROCESSING: counts.processing,
      SHIPPED: counts.shipped,
      DELIVERED: counts.delivered,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
    },
  };
}

module.exports = { STATUSES, getBuyerOrders };
