const orderConfirmationService = require("./orderConfirmation.service");

function getBuyerContext(req) {
  return {
    userId: req.user?.id ? Number(req.user.id) : 1,
    companyId: req.user?.companyId ? Number(req.user.companyId) : 1,
  };
}

async function getOrderConfirmation(req, res) {
  try {
    const { companyId } = getBuyerContext(req);
    const { orderId } = req.params;

    const data = await orderConfirmationService.getConfirmation(orderId, companyId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get order confirmation error:", error);
    const status = error.message.includes("not found") ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve order confirmation.",
    });
  }
}

module.exports = {
  getOrderConfirmation,
};

