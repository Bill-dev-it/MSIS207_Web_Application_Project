const dashboardService = require("./dashboard.service");

async function getSummary(req, res) {
  try {
    const companyId = req.user?.companyId ? Number(req.user.companyId) : 1;
    const summary = await dashboardService.getSummary({ companyId });

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Dashboard getSummary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary metrics.",
    });
  }
}

async function getEngineHealth(req, res) {
  try {
    const companyId = req.user?.companyId ? Number(req.user.companyId) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;

    const engines = await dashboardService.getEngineHealth({
      companyId,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: engines,
    });
  } catch (error) {
    console.error("Dashboard getEngineHealth error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load engine health overview.",
    });
  }
}

async function getRecentOrders(req, res) {
  try {
    const companyId = req.user?.companyId ? Number(req.user.companyId) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;

    const orders = await dashboardService.getRecentOrders({
      companyId,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Dashboard getRecentOrders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load recent orders.",
    });
  }
}

module.exports = {
  getSummary,
  getEngineHealth,
  getRecentOrders,
};

