const dashboardRepository = require("./dashboard.repository");
const ordersRepository = require("./orders.repository");

async function getSummary({ companyId, userId }) {
  return await dashboardRepository.getDashboardSummary({ companyId, userId });
}

async function getEngineHealth({ companyId, limit }) {
  return await dashboardRepository.getDashboardEngineHealth({ companyId, limit });
}

async function getRecentOrders({ companyId, limit = 5 }) {
  const result = await ordersRepository.getBuyerOrders({
    companyId,
    page: 1,
    limit,
  });
  return result.orders;
}

module.exports = {
  getSummary,
  getEngineHealth,
  getRecentOrders,
};
