"use strict";

const pool = require("../../../config/db");

const STATUSES = [
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
];

/**
 * Build the Admin Orders CTE.
 *
 * primary_status follows the same precedence used by
 * the existing Buyer Orders repository.
 *
 * Admin listing is not scoped to buyer_company_id.
 */
const ADMIN_ORDERS_CTE = `
    WITH admin_orders AS (
        SELECT
            o.order_id,
            o.order_number,
            o.purchase_reference,
            o.buyer_company_id,
            o.placed_by,
            o.company_name_snapshot,
            o.tax_id_snapshot,
            o.shipping_address_snapshot,
            o.billing_address_snapshot,
            o.subtotal,
            o.shipping_total,
            o.grand_total,
            o.currency,
            o.created_at,

            p.payment_method,
            p.status AS payment_status,
            p.paid_at,

            COALESCE(
                (
                    SELECT CASE
                        WHEN BOOL_OR(so.status = 'PROCESSING')
                            THEN 'PROCESSING'
                        WHEN BOOL_OR(so.status = 'CONFIRMED')
                            THEN 'CONFIRMED'
                        WHEN BOOL_OR(so.status = 'SHIPPED')
                            THEN 'SHIPPED'
                        ELSE 'DELIVERED'
                    END
                    FROM public.seller_orders so
                    WHERE so.order_id = o.order_id
                ),
                'CONFIRMED'
            ) AS primary_status,

            COALESCE(
                (
                    SELECT SUM(oi.quantity)
                    FROM public.order_items oi
                    INNER JOIN public.seller_orders so
                        ON so.seller_order_id = oi.seller_order_id
                    WHERE so.order_id = o.order_id
                ),
                0
            )::INT AS total_items,

            COALESCE(
                (
                    SELECT STRING_AGG(
                        DISTINCT so.supplier_name_snapshot,
                        ', '
                    )
                    FROM public.seller_orders so
                    WHERE so.order_id = o.order_id
                ),
                ''
            ) AS suppliers_list

        FROM public.orders o
        LEFT JOIN public.payments p
            ON p.order_id = o.order_id
    )
`;

/**
 * List all orders for Admin.
 *
 * Search fields:
 * - order_number
 * - purchase_reference
 * - company_name_snapshot
 * - suppliers_list
 *
 * Counts are calculated using primary_status,
 * so each order belongs to one status group only.
 */
async function findOrders({
    status = null,
    search = null,
    page = 1,
    limit = 10,
}) {
    const searchPattern = search ? `%${search}%` : null;

    const countsQuery = `
        ${ADMIN_ORDERS_CTE}
        SELECT
            COUNT(*)::INT AS total_all,

            COUNT(*) FILTER (
                WHERE primary_status = 'CONFIRMED'
            )::INT AS confirmed,

            COUNT(*) FILTER (
                WHERE primary_status = 'PROCESSING'
            )::INT AS processing,

            COUNT(*) FILTER (
                WHERE primary_status = 'SHIPPED'
            )::INT AS shipped,

            COUNT(*) FILTER (
                WHERE primary_status = 'DELIVERED'
            )::INT AS delivered,

            COUNT(*) FILTER (
                WHERE
                    $2::TEXT IS NULL
                    OR $2 = 'ALL'
                    OR primary_status = $2
            )::INT AS total_filtered

        FROM admin_orders

        WHERE
            $1::TEXT IS NULL
            OR order_number ILIKE $1
            OR purchase_reference ILIKE $1
            OR company_name_snapshot ILIKE $1
            OR suppliers_list ILIKE $1
    `;

    const countsResult = await pool.query(countsQuery, [
        searchPattern,
        status,
    ]);

    const counts = countsResult.rows[0];
    const total = counts.total_filtered;

    const listQuery = `
        ${ADMIN_ORDERS_CTE}
        SELECT *
        FROM admin_orders

        WHERE
            (
                $1::TEXT IS NULL
                OR order_number ILIKE $1
                OR purchase_reference ILIKE $1
                OR company_name_snapshot ILIKE $1
                OR suppliers_list ILIKE $1
            )
            AND (
                $2::TEXT IS NULL
                OR $2 = 'ALL'
                OR primary_status = $2
            )

        ORDER BY created_at DESC, order_id DESC

        LIMIT $3
        OFFSET $4
    `;

    const result = await pool.query(listQuery, [
        searchPattern,
        status,
        limit,
        (page - 1) * limit,
    ]);

    return {
        items: result.rows,

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
            totalPages: total
                ? Math.ceil(total / limit)
                : 0,
        },
    };
}

/**
 * Get one order with:
 * - Master order information
 * - Buyer information
 * - Seller orders
 * - Shipment tracking
 * - Order items
 * - Payment information
 *
 * Admin can view all orders.
 * No buyer_company_id condition is applied.
 */
async function findOrderById(orderId) {
    // 1. Master order and buyer information.
    const orderQuery = `
        SELECT
            o.order_id,
            o.order_number,
            o.buyer_company_id,
            o.placed_by,
            o.purchase_reference,
            o.company_name_snapshot,
            o.tax_id_snapshot,
            o.shipping_address_snapshot,
            o.billing_address_snapshot,
            o.subtotal,
            o.shipping_total,
            o.grand_total,
            o.currency,
            o.created_at,

            u.full_name AS placed_by_name,
            u.email AS placed_by_email,

            COALESCE(
                (
                    SELECT CASE
                        WHEN BOOL_OR(so.status = 'PROCESSING')
                            THEN 'PROCESSING'
                        WHEN BOOL_OR(so.status = 'CONFIRMED')
                            THEN 'CONFIRMED'
                        WHEN BOOL_OR(so.status = 'SHIPPED')
                            THEN 'SHIPPED'
                        ELSE 'DELIVERED'
                    END
                    FROM public.seller_orders so
                    WHERE so.order_id = o.order_id
                ),
                'CONFIRMED'
            ) AS primary_status

        FROM public.orders o

        LEFT JOIN public.users u
            ON u.user_id = o.placed_by

        WHERE o.order_id = $1

        LIMIT 1
    `;

    const orderResult = await pool.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
        return null;
    }

    const order = orderResult.rows[0];

    // 2. Seller orders and shipment tracking.
    const sellerOrdersQuery = `
        SELECT
            so.seller_order_id,
            so.order_id,
            so.supplier_id,
            so.supplier_name_snapshot,
            so.status,
            so.subtotal,
            so.shipping_fee,
            so.grand_total,
            so.created_at,
            so.processing_at,

            sh.shipment_id,
            sh.carrier,
            sh.tracking_number,
            sh.shipped_at,
            sh.estimated_delivery_at,
            sh.delivered_at

        FROM public.seller_orders so

        LEFT JOIN public.shipments sh
            ON sh.seller_order_id = so.seller_order_id

        WHERE so.order_id = $1

        ORDER BY so.seller_order_id ASC
    `;

    const sellerOrdersResult = await pool.query(
        sellerOrdersQuery,
        [orderId]
    );

    const sellerOrders = sellerOrdersResult.rows;

    // 3. Order items for each seller order.
    for (const sellerOrder of sellerOrders) {
        const itemsQuery = `
            SELECT
                oi.order_item_id,
                oi.seller_order_id,
                oi.listing_id,
                oi.quantity,
                oi.unit_price,
                oi.line_total,
                oi.condition_snapshot,
                oi.product_name_snapshot,
                oi.part_number_snapshot,
                oi.seller_sku_snapshot,

                p.product_id,
                p.product_type,
                c.category_name

            FROM public.order_items oi

            LEFT JOIN public.seller_listings sl
                ON oi.listing_id = sl.listing_id

            LEFT JOIN public.products p
                ON sl.product_id = p.product_id

            LEFT JOIN public.categories c
                ON p.category_id = c.category_id

            WHERE oi.seller_order_id = $1

            ORDER BY oi.order_item_id ASC
        `;

        const itemsResult = await pool.query(
            itemsQuery,
            [sellerOrder.seller_order_id]
        );

        sellerOrder.items = itemsResult.rows;
    }

    // 4. Payment information.
    const paymentQuery = `
        SELECT
            payment_id,
            order_id,
            amount,
            payment_method,
            status,
            paid_at

        FROM public.payments

        WHERE order_id = $1

        ORDER BY payment_id DESC

        LIMIT 1
    `;

    const paymentResult = await pool.query(
        paymentQuery,
        [orderId]
    );

    const paymentRow = paymentResult.rows[0] || null;

    const payment = paymentRow
        ? {
            ...paymentRow,
            currency: order.currency,
            transfer_reference: order.order_number,
        }
        : null;

    return {
        ...order,

        payment_method: payment
            ? payment.payment_method
            : null,

        payment_status: payment
            ? payment.status
            : null,

        paid_at: payment
            ? payment.paid_at
            : null,

        seller_orders: sellerOrders,
        payment,
    };
}

module.exports = {
    STATUSES,
    findOrders,
    findOrderById,
};

