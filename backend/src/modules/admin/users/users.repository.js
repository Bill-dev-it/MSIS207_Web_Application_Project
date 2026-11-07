
const pool = require("../../../config/db");

/**
 * Build a safe WHERE clause for user listing.
 * All user-provided values are passed as query parameters.
 */
function buildUserFilters({ role, status, search }) {
    const conditions = [];
    const values = [];

    if (role) {
        values.push(role);
        conditions.push(`u.role = $${values.length}`);
    }

    if (status === "ACTIVE") {
        conditions.push("u.is_active = TRUE");
    } else if (status === "INACTIVE") {
        conditions.push("u.is_active = FALSE");
    }

    if (search) {
        values.push(`%${search}%`);
        const index = values.length;

        conditions.push(`
            (
                u.full_name ILIKE $${index}
                OR u.email ILIKE $${index}
                OR c.company_name ILIKE $${index}
            )
        `);
    }

    return {
        whereClause: conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "",
        values,
    };
}

/**
 * Get users with role/status filters, search and pagination.
 */
async function findUsers({
    role = null,
    status = null,
    search = null,
    page = 1,
    limit = 10,
}) {
    const { whereClause, values } = buildUserFilters({
        role,
        status,
        search,
    });

    const countQuery = `
        SELECT COUNT(*)::int AS total
        FROM public.users u
        INNER JOIN public.companies c
            ON c.company_id = u.company_id
        ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);
    const total = countResult.rows[0].total;

    const dataValues = [...values, limit, (page - 1) * limit];

    const dataQuery = `
        SELECT
            u.user_id,
            u.company_id,
            u.full_name,
            u.email,
            u.role,
            u.is_active,
            u.created_at,
            u.email_verified_at,
            c.company_name,
            c.company_type
        FROM public.users u
        INNER JOIN public.companies c
            ON c.company_id = u.company_id
        ${whereClause}
        ORDER BY u.created_at DESC, u.user_id DESC
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
 * Get one user by ID.
 */
async function findUserById(userId) {
    const query = `
        SELECT
            u.user_id,
            u.company_id,
            u.full_name,
            u.email,
            u.role,
            u.is_active,
            u.created_at,
            u.email_verified_at,
            c.company_name,
            c.company_type,
            c.tax_id,
            c.country_code
        FROM public.users u
        INNER JOIN public.companies c
            ON c.company_id = u.company_id
        WHERE u.user_id = $1
        LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    return result.rows[0] || null;
}

/**
 * Update account status and invalidate existing sessions atomically.
 *
 * Active ADMIN rows are locked in a deterministic order before
 * checking the last-admin constraint. This prevents concurrent
 * requests from suspending the last active administrator.
 *
 * Returns:
 * - NOT_FOUND
 * - UNCHANGED
 * - LAST_ADMIN
 * - UPDATED
 */
async function updateUserStatus(userId, isActive) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Serialize account-status changes involving the admin pool.
        await client.query(`
            SELECT user_id
            FROM public.users
            WHERE role = 'ADMIN'
              AND is_active = TRUE
            ORDER BY user_id
            FOR UPDATE
        `);

        const targetResult = await client.query(`
            SELECT user_id, role, is_active
            FROM public.users
            WHERE user_id = $1
            FOR UPDATE
        `, [userId]);

        const target = targetResult.rows[0];

        if (!target) {
            await client.query("COMMIT");
            return { outcome: "NOT_FOUND" };
        }

        if (target.is_active === isActive) {
            await client.query("COMMIT");

            return {
                outcome: "UNCHANGED",
                userId: target.user_id,
                isActive: target.is_active,
            };
        }

        if (!isActive && target.role === "ADMIN") {
            const adminCountResult = await client.query(`
                SELECT COUNT(*)::int AS total
                FROM public.users
                WHERE role = 'ADMIN'
                  AND is_active = TRUE
            `);

            if (adminCountResult.rows[0].total <= 1) {
                await client.query("COMMIT");
                return { outcome: "LAST_ADMIN" };
            }
        }

        const updateResult = await client.query(`
            UPDATE public.users
            SET
                is_active = $2,
                auth_version = CASE
                    WHEN $2 = FALSE THEN auth_version + 1
                    ELSE auth_version
                END
            WHERE user_id = $1
            RETURNING
                user_id,
                role,
                is_active
        `, [userId, isActive]);

        await client.query("COMMIT");

        return {
            outcome: "UPDATED",
            userId: updateResult.rows[0].user_id,
            role: updateResult.rows[0].role,
            isActive: updateResult.rows[0].is_active,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    findUsers,
    findUserById,
    updateUserStatus,
};
