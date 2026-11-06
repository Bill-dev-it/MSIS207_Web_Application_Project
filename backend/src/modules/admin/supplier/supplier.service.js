
const supplierRepository = require("./supplier.repository");

const ALLOWED_STATUSES = ["PENDING", "APPROVED", "SUSPENDED"];

const ALLOWED_TRANSITIONS = {
    PENDING: ["APPROVED"],
    APPROVED: ["SUSPENDED"],
    SUSPENDED: ["APPROVED"],
};

function createServiceError(statusCode, code, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

function validateSupplierId(supplierId) {
    const id = Number(supplierId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw createServiceError(
            400,
            "INVALID_SUPPLIER_ID",
            "Supplier ID must be a positive integer."
        );
    }

    return id;
}

function validatePagination(page, limit) {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
        !Number.isInteger(parsedPage) ||
        parsedPage < 1
    ) {
        throw createServiceError(
            400,
            "INVALID_PAGE",
            "Page must be a positive integer."
        );
    }

    if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 100
    ) {
        throw createServiceError(
            400,
            "INVALID_LIMIT",
            "Limit must be between 1 and 100."
        );
    }

    return {
        page: parsedPage,
        limit: parsedLimit,
    };
}

/**
 * Get supplier list with filters and pagination.
 */
async function getSuppliers({
    status,
    search,
    page = 1,
    limit = 10,
} = {}) {
    let normalizedStatus = null;

    if (status !== undefined && status !== null && status !== "") {
        normalizedStatus = String(status).trim().toUpperCase();

        if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
            throw createServiceError(
                400,
                "INVALID_SUPPLIER_STATUS",
                "Status must be PENDING, APPROVED, or SUSPENDED."
            );
        }
    }

    const pagination = validatePagination(page, limit);

    const normalizedSearch =
        typeof search === "string" && search.trim()
            ? search.trim()
            : null;

    return supplierRepository.findSuppliers({
        status: normalizedStatus,
        search: normalizedSearch,
        ...pagination,
    });
}

/**
 * Get supplier detail.
 */
async function getSupplierById(supplierId) {
    const id = validateSupplierId(supplierId);

    const supplier = await supplierRepository.findSupplierById(id);

    if (!supplier) {
        throw createServiceError(
            404,
            "SUPPLIER_NOT_FOUND",
            "Supplier not found."
        );
    }

    return supplier;
}

/**
 * Update supplier status following the allowed transition rules.
 *
 * PENDING   -> APPROVED
 * APPROVED  -> SUSPENDED
 * SUSPENDED -> APPROVED
 */
async function changeSupplierStatus(supplierId, newStatus) {
    const id = validateSupplierId(supplierId);

    if (typeof newStatus !== "string") {
        throw createServiceError(
            400,
            "INVALID_SUPPLIER_STATUS",
            "A valid supplier status is required."
        );
    }

    const normalizedStatus = newStatus.trim().toUpperCase();

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
        throw createServiceError(
            400,
            "INVALID_SUPPLIER_STATUS",
            "Status must be PENDING, APPROVED, or SUSPENDED."
        );
    }

    const currentSupplier =
        await supplierRepository.findSupplierById(id);

    if (!currentSupplier) {
        throw createServiceError(
            404,
            "SUPPLIER_NOT_FOUND",
            "Supplier not found."
        );
    }

    const currentStatus = currentSupplier.status;

    const allowedNextStatuses =
        ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowedNextStatuses.includes(normalizedStatus)) {
        throw createServiceError(
            400,
            "INVALID_STATUS_TRANSITION",
            `Cannot change supplier status from ${currentStatus} to ${normalizedStatus}.`
        );
    }

    // Conditional UPDATE: only succeeds if the status has not changed
    // since it was read above.
    const updatedSupplier =
        await supplierRepository.updateSupplierStatus(
            id,
            normalizedStatus,
            currentStatus
        );

    if (!updatedSupplier) {
        throw createServiceError(
            409,
            "SUPPLIER_STATUS_CONFLICT",
            "Supplier status was changed by another operation. Please refresh and try again."
        );
    }

    return {
        supplierId: updatedSupplier.supplier_id,
        status: updatedSupplier.status,
    };
}

module.exports = {
    getSuppliers,
    getSupplierById,
    changeSupplierStatus,
};
