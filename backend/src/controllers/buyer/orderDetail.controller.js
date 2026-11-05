"use strict";

const service = require("../../services/buyer/orderDetail.service");

async function getOrderDetail(req, res) {
  try {
    const data = await service.getOrderDetail(req.params.orderId, req.authUser.company_id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) console.error("Buyer order detail failed:", error);
    return res.status(status).json({
      success: false,
      error: {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: status >= 500 ? "Unable to retrieve order details." : error.message,
      },
    });
  }
}

module.exports = { getOrderDetail };
