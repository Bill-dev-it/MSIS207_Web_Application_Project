
const supplierService = require("./supplier.service");

function handleError(res, error, next) {
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code || "BAD_REQUEST",
                message: error.message,
            },
        });
    }
    return next(error);
}

/**
 * GET /
 * Get supplier list with filters and pagination.
 */
async function getSuppliers(req, res, next) {
    try {
        const result = await supplierService.getSuppliers({
            status: req.query.status,
            search: req.query.search,
            page: req.query.page ?? 1,
            limit: req.query.limit ?? 10,
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleError(res, error, next);
    }
}

/**
 * GET /:supplierId
 * Get supplier detail.
 */
async function getSupplierById(req, res, next) {
    try {
        const supplier = await supplierService.getSupplierById(
            req.params.supplierId
        );

        return res.status(200).json({
            success: true,
            data: supplier,
        });
    } catch (error) {
        return handleError(res, error, next);
    }
}

/**
 * PATCH /:supplierId/status
 * Update supplier status.
 *
 * Request body:
 * {
 *   "status": "APPROVED"
 * }
 */
async function changeSupplierStatus(req, res, next) {
    try {
        const result = await supplierService.changeSupplierStatus(
            req.params.supplierId,
            req.body?.status
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
    getSuppliers,
    getSupplierById,
    changeSupplierStatus,
};
