"use strict";

const pool = require("../../../config/db");

const BUYER_COMPANY_TYPES = ["AIRLINE", "MRO", "MIXED"];

const COMPANIES_CTE = `
  WITH buyer_companies AS (
    SELECT
      c.company_id,
      c.company_name,
      c.company_type,
      c.tax_id,
      c.country_code,
      c.created_at,
      COUNT(DISTINCT e.engine_id)::int AS engine_count,
      COALESCE(
        (
          SELECT SUM(p.amount)
          FROM public.orders o
          JOIN public.payments p
            ON p.order_id = o.order_id
           AND p.status = 'SUCCEEDED'
          WHERE o.buyer_company_id = c.company_id
        ),
        0
      )::numeric(18,2) AS total_spend,
      COUNT(DISTINCT u.user_id)::int AS total_users,
      COUNT(DISTINCT u.user_id) FILTER (WHERE u.is_active = TRUE)::int AS active_users,
      CASE
        WHEN COUNT(DISTINCT u.user_id) FILTER (WHERE u.is_active = TRUE) > 0 THEN 'ACTIVE'
        WHEN COUNT(DISTINCT u.user_id) = 0 THEN 'PENDING'
        ELSE 'SUSPENDED'
      END AS status
    FROM public.companies c
    LEFT JOIN public.aircraft a
      ON a.company_id = c.company_id
    LEFT JOIN public.engines e
      ON e.aircraft_id = a.aircraft_id
    LEFT JOIN public.users u
      ON u.company_id = c.company_id
    WHERE c.company_type = ANY($1::varchar[])
    GROUP BY
      c.company_id,
      c.company_name,
      c.company_type,
      c.tax_id,
      c.country_code,
      c.created_at
  )
`;

async function findBuyerCompanies({ search }) {
  const params = [BUYER_COMPANY_TYPES];
  let whereClause = "";

  if (search) {
    params.push(`%${search}%`);
    whereClause = `
      WHERE (
        bc.company_name ILIKE $2
        OR COALESCE(bc.tax_id, '') ILIKE $2
      )
    `;
  }

  const sql = `
    ${COMPANIES_CTE}
    SELECT
      bc.company_id::text AS company_id,
      bc.company_name,
      bc.company_type,
      bc.tax_id,
      bc.country_code,
      bc.created_at,
      bc.engine_count,
      bc.total_spend::text AS total_spend,
      bc.total_users,
      bc.active_users,
      bc.status
    FROM buyer_companies bc
    ${whereClause}
    ORDER BY bc.total_spend DESC, bc.company_id ASC
  `;

  const result = await pool.query(sql, params);
  return result.rows;
}

async function findBuyerCompanyById(companyId) {
  const companySql = `
    ${COMPANIES_CTE}
    SELECT
      bc.company_id::text AS company_id,
      bc.company_name,
      bc.company_type,
      bc.tax_id,
      bc.country_code,
      bc.created_at,
      bc.engine_count,
      bc.total_spend::text AS total_spend,
      bc.total_users,
      bc.active_users,
      bc.status
    FROM buyer_companies bc
    WHERE bc.company_id = $2
    LIMIT 1
  `;

  const companyResult = await pool.query(companySql, [
    BUYER_COMPANY_TYPES,
    companyId,
  ]);

  if (companyResult.rows.length === 0) {
    return null;
  }

  const company = companyResult.rows[0];

  const [usersResult, enginesResult, ordersResult] = await Promise.all([
    pool.query(
      `
        SELECT
          user_id::text AS user_id,
          full_name,
          email,
          role,
          is_active,
          created_at
        FROM public.users
        WHERE company_id = $1
        ORDER BY user_id ASC
      `,
      [companyId]
    ),
    pool.query(
      `
        SELECT
          e.engine_id::text AS engine_id,
          e.engine_code,
          e.serial_number,
          e.current_cycle::text AS current_cycle,
          a.registration_number,
          a.model AS aircraft_model,
          em.manufacturer AS engine_manufacturer,
          em.model_name AS engine_model_name
        FROM public.engines e
        JOIN public.aircraft a
          ON a.aircraft_id = e.aircraft_id
        JOIN public.engine_models em
          ON em.engine_model_id = e.engine_model_id
        WHERE a.company_id = $1
        ORDER BY e.engine_id ASC
      `,
      [companyId]
    ),
    pool.query(
      `
        SELECT
          o.order_id::text AS order_id,
          o.order_number,
          o.grand_total::text AS grand_total,
          o.currency,
          o.created_at,
          p.status AS payment_status
        FROM public.orders o
        LEFT JOIN public.payments p
          ON p.order_id = o.order_id
        WHERE o.buyer_company_id = $1
        ORDER BY o.created_at DESC, o.order_id DESC
        LIMIT 10
      `,
      [companyId]
    ),
  ]);

  return {
    ...company,
    users: usersResult.rows,
    engines: enginesResult.rows,
    recent_orders: ordersResult.rows,
  };
}

module.exports = {
  findBuyerCompanies,
  findBuyerCompanyById,
};
