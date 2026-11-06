
const dashboardRepository = require("./dashboard.repository");

/**
 * Get aggregated dashboard data for Admin.
 *
 * Business logic belongs in this service.
 * SQL queries are handled by dashboard.repository.js.
 */
const getSummary = async () => {
    const summary = await dashboardRepository.getDashboardSummary();

    return summary;
};

module.exports = {
    getSummary,
};
