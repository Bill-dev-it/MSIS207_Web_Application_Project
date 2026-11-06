
const pool = require("../../../config/db");

/**
 * Get supplier list with company and supplier-account information.
 *
 * Supported filters:
 * - status: PENDING | APPROVED | SUSPENDED
 * - search: store name, company name, or slug
 * - page: positive integer
 * - limit: positive integer
 */
async function findSuppliers({
    status = null,
    search = null,
    page = 1,
    limit = 10,
}) {
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];

    if (status) {
        values.push(status);
        conditions.push(`s.status = $${values.length}`);
    }

    if (search) {
        values.push(`%${search}%`);
        const searchIndex = values.length;

        conditions.push(`
      (
        s.store_name ILIKE $${searchIndex}
        OR s.slug ILIKE $${searchIndex}
        OR c.company_name ILIKE $${searchIndex}
      )
    `);
    }

    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

    const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM suppliers s
    INNER JOIN companies c
      ON c.company_id = s.company_id
    ${whereClause}
  `;

    const countResult = await pool.query(countQuery, values);
    const total = countResult.rows[0].total;

    const dataValues = [...values, limit, offset];

    const dataQuery = `
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
      (
        SELECT u.full_name
        FROM users u
        WHERE u.company_id = s.company_id
          AND u.role = 'SUPPLIER'
        ORDER BY u.created_at ASC
        LIMIT 1
      ) AS contact_name,
      (
        SELECT u.email
        FROM users u
        WHERE u.company_id = s.company_id
          AND u.role = 'SUPPLIER'
        ORDER BY u.created_at ASC
        LIMIT 1
      ) AS contact_email
    FROM suppliers s
    INNER JOIN companies c
      ON c.company_id = s.company_id
    ${whereClause}
    ORDER BY
      CASE s.status
        WHEN 'PENDING' THEN 1
        WHEN 'APPROVED' THEN 2
        WHEN 'SUSPENDED' THEN 3
        ELSE 4
      END,
      s.created_at DESC
    LIMIT $${dataValues.length - 1}
    OFFSET $${dataValues.length}
  `;

    const dataResult = await pool.query(dataQuery, dataValues);

    return {
        items: dataResult.rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get one supplier by ID.
 */
async function findSupplierById(supplierId) {
    const query = `
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
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'userId', u.user_id,
              'fullName', u.full_name,
              'email', u.email,
              'isActive', u.is_active,
              'emailVerifiedAt', u.email_verified_at
            )
            ORDER BY u.created_at ASC
          )
          FROM users u
          WHERE u.company_id = s.company_id
            AND u.role = 'SUPPLIER'
        ),
        '[]'::json
      ) AS supplier_users
    FROM suppliers s
    INNER JOIN companies c
      ON c.company_id = s.company_id
    WHERE s.supplier_id = $1
    LIMIT 1
  `;

    const result = await pool.query(query, [supplierId]);

    return result.rows[0] || null;
}

/**
 * Update supplier status only when its current status matches
 * the expected status.
 *
 * This conditional UPDATE protects against concurrent status changes.
 */
async function updateSupplierStatus(
    supplierId,
    newStatus,
    expectedCurrentStatus
) {
    const query = `
    UPDATE suppliers
    SET status = $2
    WHERE supplier_id = $1
      AND status = $3
    RETURNING
      supplier_id,
      company_id,
      store_name,
      status,
      created_at
  `;

    const result = await pool.query(query, [
        supplierId,
        newStatus,
        expectedCurrentStatus,
    ]);

    return result.rows[0] || null;
}

module.exports = {
    findSuppliers,
    findSupplierById,
    updateSupplierStatus,
};
