const usersService = require("./users.service");

function handleError(res, error, next) {
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code || "ADMIN_USERS_ERROR",
                message: error.message || "Unable to process user request.",
            },
        });
    }

    return next(error);
}

async function getUsers(req, res, next) {
    try {
        const result = await usersService.getUsers(req.query);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleError(res, error, next);
    }
}

async function getUserById(req, res, next) {
    try {
        const result = await usersService.getUserById(req.params.userId);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleError(res, error, next);
    }
}

async function changeUserStatus(req, res, next) {
    try {
        const result = await usersService.changeUserStatus(
            req.params.userId,
            req.body?.status,
            req.authUser
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
    getUsers,
    getUserById,
    changeUserStatus,
};