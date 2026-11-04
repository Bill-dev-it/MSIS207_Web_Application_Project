const orderDetailService = require("./orderDetail.service");

function getBuyerContext(req) {
  return {
    userId: req.user?.id ? Number(req.user.id) : 1,
    companyId: req.user?.companyId ? Number(req.user.companyId) : 1,
  };
}

async function getOrderDetail(req, res) {
  try {
    const { companyId } = getBuyerContext(req);
    const { orderId } = req.params;

    const order = await orderDetailService.getOrderDetail(orderId, companyId);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order detail error:", error);
    const status = error.message.includes("not found") ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve order details.",
    });
  }
}

module.exports = {
  getOrderDetail,
};

