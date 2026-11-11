"use strict";

const pool = require("../../config/db");

async function listPayments({ status, page, limit }) {
  const values = [];
  let where = "WHERE p.payment_method = 'BANK_TRANSFER'";

  if (status !== "ALL") {
    values.push(status);
    where += ` AND p.status = $${values.length}`;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*)::INT AS total FROM public.payments p ${where}`,
    values
  );
  const total = countResult.rows[0]?.total ?? 0;

  const listResult = await pool.query(
    `
      SELECT
        p.payment_id, p.order_id, o.order_number, o.purchase_reference,
        o.created_at AS placed_at, c.company_name AS buyer_company,
        p.payment_method, p.amount, o.currency, p.status, p.paid_at
      FROM public.payments p
      JOIN public.orders o ON o.order_id = p.order_id
      JOIN public.companies c ON c.company_id = o.buyer_company_id
      ${where}
      ORDER BY o.created_at DESC, p.payment_id DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `,
    [...values, limit, (page - 1) * limit]
  );

  const payments = listResult.rows.map((row) => ({
    payment_id: String(row.payment_id),
    order_id: String(row.order_id),
    order_number: row.order_number,
    purchase_reference: row.purchase_reference,
    placed_at: row.placed_at,
    buyer_company: row.buyer_company,
    payment_method: row.payment_method,
    amount: String(row.amount),
    currency: row.currency,
    status: row.status,
    paid_at: row.paid_at,
  }));

  return {
    payments,
    status,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { listPayments };

