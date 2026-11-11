"use strict";

const pool = require("../../config/db");

const SUPPLIER_STATUSES = ["PENDING", "APPROVED", "SUSPENDED"];

function formatSupplierRow(row) {
  return {
    supplier_id: String(row.supplier_id),
    company_id: String(row.company_id),
    store_name: row.store_name,
    slug: row.slug,
    description: row.description,
    logo_object_key: row.logo_object_key,
    status: row.status,
    created_at: row.created_at,
    company_name: row.company_name,
    company_type: row.company_type,
    tax_id: row.tax_id,
    country_code: row.country_code,
    company_created_at: row.company_created_at,
    contact_user_id:
      row.contact_user_id != null ? String(row.contact_user_id) : null,
    contact_name: row.contact_name ?? null,
    contact_email: row.contact_email ?? null,
    contact_is_active: row.contact_is_active ?? null,
    contact_email_verified_at: row.contact_email_verified_at ?? null,
  };
}

async function listSuppliers({ status, page, limit, search = "" }) {
  const offset = (page - 1) * limit;
  const values = [status];
  const conditions = ["s.status = $1"];
  if (search) {
    values.push(`%${search.replace(/[\\%_]/g, "\\$&")}%`);
    conditions.push(`(s.store_name ILIKE $2 ESCAPE '\\' OR c.company_name ILIKE $2 ESCAPE '\\')`);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;

  const totalResult = await pool.query(
    `
      SELECT COUNT(*)::INT AS total
      FROM public.suppliers s
      JOIN public.companies c ON c.company_id = s.company_id
      ${where}
    `,
    values
  );
  const total = totalResult.rows[0]?.total ?? 0;

  const listResult = await pool.query(
    `
      SELECT
        s.supplier_id,
        s.company_id,
        s.store_name,
        s.slug,
        s.description,
        s.logo_object_key,
        s.status,
        s.created_at,
        c.company_name,
        c.company_type,
        c.tax_id,
        c.country_code,
        c.created_at AS company_created_at,
        u.user_id AS contact_user_id,
        u.full_name AS contact_name,
        u.email AS contact_email,
        u.is_active AS contact_is_active,
        u.email_verified_at AS contact_email_verified_at
      FROM public.suppliers s
      JOIN public.companies c ON c.company_id = s.company_id
      LEFT JOIN LATERAL (
        SELECT
          usr.user_id,
          usr.full_name,
          usr.email,
          usr.is_active,
          usr.email_verified_at
        FROM public.users usr
        WHERE usr.company_id = s.company_id
          AND usr.role = 'SUPPLIER'
        ORDER BY usr.created_at ASC, usr.user_id ASC
        LIMIT 1
      ) u ON TRUE
      ${where}
      ORDER BY s.created_at DESC, s.supplier_id DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `,
    [...values, limit, offset]
  );

  return {
    suppliers: listResult.rows.map(formatSupplierRow),
    status,
    pagination: {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
    },
  };
}

const MAX_ID = 9223372036854775807n;
function validSupplierId(id) {
  return typeof id === "string" && /^[1-9]\d*$/.test(id) && BigInt(id) <= MAX_ID;
}

async function approveSupplier(supplierId) {
  // A conditional UPDATE is atomic; concurrent approvers cannot both perform a transition.
  const result = await pool.query(`
    UPDATE public.suppliers SET status = 'APPROVED'
    WHERE supplier_id = $1 AND status = 'PENDING'
    RETURNING supplier_id, status
  `, [supplierId]);
  if (result.rows.length) {
    return { supplier_id: String(result.rows[0].supplier_id), status: "APPROVED", already_approved: false };
  }
  const existing = await pool.query(
    `SELECT supplier_id, status FROM public.suppliers WHERE supplier_id = $1`, [supplierId]
  );
  if (!existing.rows.length) {
    const error = new Error("Supplier not found.");
    error.statusCode = 404; error.code = "SUPPLIER_NOT_FOUND"; throw error;
  }
  if (existing.rows[0].status === "APPROVED") {
    return { supplier_id: String(existing.rows[0].supplier_id), status: "APPROVED", already_approved: true };
  }
  const error = new Error("Only pending suppliers may be approved. Suspended suppliers require a separate review policy.");
  error.statusCode = 409; error.code = "SUPPLIER_STATUS_CONFLICT"; throw error;
}

module.exports = {
  SUPPLIER_STATUSES,
  validSupplierId,
  listSuppliers,
  approveSupplier,
};
