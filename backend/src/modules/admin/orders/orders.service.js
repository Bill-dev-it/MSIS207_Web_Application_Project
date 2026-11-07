"use strict";

const ordersRepository = require("./orders.repository");

const VALID_STATUSES = [
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
];

const MAX_BIGINT = 9223372036854775807n;

function createServiceError(statusCode, code, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

/**
 * Validate PostgreSQL BIGINT order ID.
 * Keep the ID as a string to avoid JavaScript precision loss.
 */
function validateOrderId(orderId) {
    const value = String(orderId ?? "");

    if (!/^[1-9]\d*$/.test(value)) {
        throw createServiceError(
            400,
            "INVALID_ORDER_ID",
            "Order ID must be a valid positive integer."
        );
    }

    if (BigInt(value) > MAX_BIGINT) {
        throw createServiceError(
            400,
            "INVALID_ORDER_ID",
            "Order ID is outside the supported range."
        );
    }

    return value;
}

/**
 * Validate and normalize Admin Orders query parameters.
 */
function normalizeListQuery(query = {}) {
    const status = query.status
        ? String(query.status).trim().toUpperCase()
        : null;

    const search = query.search
        ? String(query.search).trim()
        : null;

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    if (
        status &&
        status !== "ALL" &&
        !VALID_STATUSES.includes(status)
    ) {
        throw createServiceError(
            400,
            "INVALID_STATUS",
            "The requested order status is invalid."
        );
    }

    if (!Number.isSafeInteger(page) || page < 1) {
        throw createServiceError(
            400,
            "INVALID_PAGE",
            "Page must be a positive integer."
        );
    }

    if (
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100
    ) {
        throw createServiceError(
            400,
            "INVALID_LIMIT",
            "Limit must be between 1 and 100."
        );
    }

    if (search && search.length > 100) {
        throw createServiceError(
            400,
            "SEARCH_TOO_LONG",
            "Search query cannot exceed 100 characters."
        );
    }

    return {
        status,
        search: search || null,
        page,
        limit,
    };
}

/**
 * List Admin Orders.
 */
async function getOrders(query) {
    const filters = normalizeListQuery(query);

    return ordersRepository.findOrders(filters);
}

/**
 * Get Admin Order detail.
 */
async function getOrderById(orderId) {
    const validOrderId = validateOrderId(orderId);

    const order = await ordersRepository.findOrderById(
        validOrderId
    );

    if (!order) {
        throw createServiceError(
            404,
            "ORDER_NOT_FOUND",
            "The requested order was not found."
        );
    }

    return order;
}

module.exports = {
    getOrders,
    getOrderById,
};

