
const usersRepository = require("./users.repository");

const VALID_ROLES = ["BUYER", "SUPPLIER", "ADMIN"];
const VALID_STATUSES = ["ACTIVE", "INACTIVE"];

const MAX_BIGINT = 9223372036854775807n;

function createServiceError(statusCode, code, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

/**
 * Validate PostgreSQL BIGINT identifiers without converting
 * them to JavaScript Number (which may lose precision).
 */
function validateUserId(userId) {
    const value = String(userId ?? "");

    if (!/^[1-9]\d*$/.test(value)) {
        throw createServiceError(
            400,
            "INVALID_USER_ID",
            "User ID must be a valid positive integer."
        );
    }

    if (BigInt(value) > MAX_BIGINT) {
        throw createServiceError(
            400,
            "INVALID_USER_ID",
            "User ID is outside the supported range."
        );
    }

    return value;
}

/**
 * Validate and normalize list filters.
 */
function normalizeListQuery(query = {}) {
    const role = query.role
        ? String(query.role).trim().toUpperCase()
        : null;

    const status = query.status
        ? String(query.status).trim().toUpperCase()
        : null;

    const search = query.search
        ? String(query.search).trim()
        : null;

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    if (role && !VALID_ROLES.includes(role)) {
        throw createServiceError(
            400,
            "INVALID_ROLE",
            "The requested user role is invalid."
        );
    }

    if (status && !VALID_STATUSES.includes(status)) {
        throw createServiceError(
            400,
            "INVALID_STATUS",
            "The requested user status is invalid."
        );
    }

    if (!Number.isSafeInteger(page) || page < 1) {
        throw createServiceError(
            400,
            "INVALID_PAGE",
            "Page must be a positive integer."
        );
    }

    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
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
        role,
        status,
        search: search || null,
        page,
        limit,
    };
}

/**
 * List users.
 */
async function getUsers(query) {
    const filters = normalizeListQuery(query);

    return usersRepository.findUsers(filters);
}

/**
 * Get user details.
 */
async function getUserById(userId) {
    const validUserId = validateUserId(userId);

    const user = await usersRepository.findUserById(validUserId);

    if (!user) {
        throw createServiceError(
            404,
            "USER_NOT_FOUND",
            "The requested user was not found."
        );
    }

    return user;
}

/**
 * Suspend or activate a user.
 */
async function changeUserStatus(userId, status, authenticatedUser) {
    const validUserId = validateUserId(userId);

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
        throw createServiceError(
            400,
            "INVALID_STATUS",
            "Status must be ACTIVE or INACTIVE."
        );
    }

    if (!authenticatedUser || !authenticatedUser.user_id) {
        throw createServiceError(
            401,
            "AUTH_REQUIRED",
            "Authentication is required."
        );
    }

    const isActive = status === "ACTIVE";

    // An administrator cannot suspend their own account.
    if (
        !isActive &&
        String(authenticatedUser.user_id) === validUserId
    ) {
        throw createServiceError(
            403,
            "SELF_SUSPENSION_FORBIDDEN",
            "You cannot suspend your own account."
        );
    }

    const result = await usersRepository.updateUserStatus(
        validUserId,
        isActive
    );

    if (result.outcome === "NOT_FOUND") {
        throw createServiceError(
            404,
            "USER_NOT_FOUND",
            "The requested user was not found."
        );
    }

    if (result.outcome === "LAST_ADMIN") {
        throw createServiceError(
            403,
            "LAST_ADMIN_SUSPENSION_FORBIDDEN",
            "The last active administrator cannot be suspended."
        );
    }

    if (result.outcome === "UNCHANGED") {
        return {
            userId: result.userId,
            status: result.isActive ? "ACTIVE" : "INACTIVE",
            changed: false,
            message: "User status is already up to date.",
        };
    }

    return {
        userId: result.userId,
        status: result.isActive ? "ACTIVE" : "INACTIVE",
        changed: true,
        message: isActive
            ? "User account has been activated."
            : "User account has been suspended.",
    };
}

module.exports = {
    getUsers,
    getUserById,
    changeUserStatus,
};
