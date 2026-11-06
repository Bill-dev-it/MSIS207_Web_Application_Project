const { resolveAuthenticatedUser } = require("./require-auth");

async function requireAdmin(req, res, next) {
    try {
        const user = await resolveAuthenticatedUser(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "AUTH_REQUIRED",
                    message: "Admin login is required.",
                },
            });
        }

        if (user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: "Admin role is required.",
                },
            });
        }

        req.authUser = user;

        return next();
    } catch (error) {
        const unavailable = error.code === "AUTH_NOT_CONFIGURED";

        return res.status(unavailable ? 503 : 500).json({
            success: false,
            error: {
                code: unavailable
                    ? "AUTH_UNAVAILABLE"
                    : "INTERNAL_SERVER_ERROR",
                message: "Unable to verify admin access.",
            },
        });
    }
}

module.exports = requireAdmin;