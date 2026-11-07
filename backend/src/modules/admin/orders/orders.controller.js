"use strict";

const ordersService = require("./orders.service");

function handleError(res, error, next) {
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code || "ADMIN_ORDERS_ERROR",
                message:
                    error.message ||
                    "Unable to process order request.",
            },
        });
    }

    return next(error);
}

/**
 * GET /api/v1/admin/orders
 */
async function getOrders(req, res, next) {
    try {
        const result = await ordersService.getOrders(
            req.query
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleError(res, error, next);
    }
}

/**
 * GET /api/v1/admin/orders/:orderId
 */
async function getOrderById(req, res, next) {
    try {
        const result = await ordersService.getOrderById(
            req.params.orderId
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleError(res, error, next);
    }
}

module.exports = {
    getOrders,
    getOrderById,
};

