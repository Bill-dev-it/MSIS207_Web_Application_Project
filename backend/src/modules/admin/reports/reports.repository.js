"use strict";

const fs = require("fs");
const path = require("path");
const pool = require("../../../config/db");

const DISMISSED_STORE_PATH = path.join(
    __dirname,
    "../../../../storage/admin-dismissed-reviews.json"
);

function readDismissedSet() {
    try {
        if (!fs.existsSync(DISMISSED_STORE_PATH)) {
            return new Set();
        }
        const raw = fs.readFileSync(DISMISSED_STORE_PATH, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.dismissed_ids)) {
            return new Set(parsed.dismissed_ids.map((id) => String(id)));
        }
        return new Set();
    } catch (_err) {
        return new Set();
    }
}

function writeDismissedSet(set) {
    const dir = path.dirname(DISMISSED_STORE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
        DISMISSED_STORE_PATH,
        JSON.stringify({ dismissed_ids: Array.from(set) }, null, 2),
        "utf8"
    );
}

const BASE_REVIEWS_QUERY = `
    SELECT
        r.review_id::text AS id,
        r.review_id::text AS review_id,
        r.order_item_id::text AS order_item_id,
        r.reviewer_user_id::text AS reviewer_user_id,
        r.product_rating,
        r.supplier_rating,
        r.comment,
        r.is_visible,
        r.created_at,
        oi.product_name_snapshot,
        oi.part_number_snapshot,
        so.supplier_name_snapshot,
        u.full_name AS reviewer_name,
        u.email AS reviewer_email,
        c.company_name AS reviewer_company_name
    FROM reviews r
    LEFT JOIN order_items oi
        ON oi.order_item_id = r.order_item_id
    LEFT JOIN seller_orders so
        ON so.seller_order_id = oi.seller_order_id
    LEFT JOIN users u
        ON u.user_id = r.reviewer_user_id
    LEFT JOIN companies c
        ON c.company_id = u.company_id
`;

function mapReviewRowToReportItem(row, dismissedSet) {
    const idStr = String(row.id);
    const isHidden = row.is_visible === false;
    const isDismissed = dismissedSet.has(idStr);
    const status = isHidden || isDismissed ? "RESOLVED" : "OPEN";

    const isSellerFocused =
        Number(row.supplier_rating) <= 2 &&
        Number(row.product_rating) > Number(row.supplier_rating);

    const type = isSellerFocused ? "Seller" : "Review";

    let target = `Review #${idStr}`;
    if (isSellerFocused && row.supplier_name_snapshot) {
        target = row.supplier_name_snapshot;
    } else if (row.part_number_snapshot) {
        target = `${row.part_number_snapshot} review`;
    } else if (row.product_name_snapshot) {
        target = `${row.product_name_snapshot} review`;
    }

    const commentText = row.comment ? String(row.comment).trim() : "";
    const reason =
        commentText ||
        `Product rating ${row.product_rating}/5 · Supplier rating ${row.supplier_rating}/5`;

    const reportedBy =
        row.reviewer_company_name ||
        row.reviewer_name ||
        row.reviewer_email ||
        `User #${row.reviewer_user_id}`;

    return {
        id: idStr,
        review_id: idStr,
        type,
        target,
        reason,
        reported_by: reportedBy,
        status,
        resolution: isHidden ? "HIDDEN" : isDismissed ? "DISMISSED" : null,
        is_visible: Boolean(row.is_visible),
        product_rating: Number(row.product_rating),
        supplier_rating: Number(row.supplier_rating),
        created_at: row.created_at,
    };
}

/**
 * List all review/report items from PostgreSQL `reviews` table
 * with dynamic Open / Resolved / All counts.
 */
async function findReports({ status = "ALL" } = {}) {
    const result = await pool.query(`
        ${BASE_REVIEWS_QUERY}
        ORDER BY r.created_at DESC, r.review_id DESC
    `);

    const dismissedSet = readDismissedSet();
    const allItems = result.rows.map((row) =>
        mapReviewRowToReportItem(row, dismissedSet)
    );

    const counts = {
        OPEN: 0,
        RESOLVED: 0,
        ALL: allItems.length,
    };

    for (const item of allItems) {
        if (item.status === "OPEN") {
            counts.OPEN += 1;
        } else {
            counts.RESOLVED += 1;
        }
    }

    const normalizedStatus = String(status || "ALL").toUpperCase();
    const filteredItems =
        normalizedStatus === "OPEN" || normalizedStatus === "RESOLVED"
            ? allItems.filter((item) => item.status === normalizedStatus)
            : allItems;

    return {
        items: filteredItems,
        counts,
    };
}

/**
 * Find a single review/report item by review_id.
 */
async function findReportById(reviewId) {
    const result = await pool.query(
        `
        ${BASE_REVIEWS_QUERY}
        WHERE r.review_id = $1::bigint
        LIMIT 1
        `,
        [reviewId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const dismissedSet = readDismissedSet();
    return mapReviewRowToReportItem(result.rows[0], dismissedSet);
}

/**
 * Hide a review (`is_visible = FALSE` in PostgreSQL) and mark it RESOLVED.
 */
async function hideReportById(reviewId) {
    const updateResult = await pool.query(
        `
        UPDATE reviews
        SET is_visible = FALSE
        WHERE review_id = $1::bigint
        RETURNING review_id
        `,
        [reviewId]
    );

    if (updateResult.rows.length === 0) {
        return null;
    }

    return findReportById(reviewId);
}

/**
 * Dismiss a report on a review (keeps `is_visible = TRUE` in PostgreSQL
 * and records dismissal state so status becomes RESOLVED).
 */
async function dismissReportById(reviewId) {
    const existing = await findReportById(reviewId);
    if (!existing) {
        return null;
    }

    const dismissedSet = readDismissedSet();
    dismissedSet.add(String(reviewId));
    writeDismissedSet(dismissedSet);

    return findReportById(reviewId);
}

module.exports = {
    findReports,
    findReportById,
    hideReportById,
    dismissReportById,
};

