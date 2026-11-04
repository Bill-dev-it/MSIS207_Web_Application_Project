const ordersRepository = require("./orders.repository");

async function getOrders({ companyId, status, search, page, limit }) {
  return await ordersRepository.getBuyerOrders({
    companyId,
    status,
    search,
    page: Math.max(1, Number(page) || 1),
    limit: Math.max(1, Math.min(100, Number(limit) || 10)),
  });
}

module.exports = {
  getOrders,
};

