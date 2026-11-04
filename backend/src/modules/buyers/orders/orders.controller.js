const ordersService = require("./orders.service");

function getBuyerContext(req) {
  return {
    userId: req.user?.id ? Number(req.user.id) : 1,
    companyId: req.user?.companyId ? Number(req.user.companyId) : 1,
  };
}

async function getOrders(req, res) {
  try {
    const { companyId } = getBuyerContext(req);
    const { status, search, page, limit } = req.query;

    const data = await ordersService.getOrders({
      companyId,
      status,
      search,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get orders list error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve orders.",
    });
  }
}

module.exports = {
  getOrders,
};

