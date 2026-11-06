
const dashboardService = require("./dashboard.service");

/**
 * GET /api/v1/admin/dashboard
 * Return dashboard statistics for Admin.
 */
const getDashboard = async (req, res, next) => {
    try {
        const dashboardData = await dashboardService.getSummary();

        return res.status(200).json({
            success: true,
            data: dashboardData,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getDashboard,
};
