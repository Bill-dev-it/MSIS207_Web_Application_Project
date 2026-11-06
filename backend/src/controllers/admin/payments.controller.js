"use strict";

const service = require("../../services/admin/payments.service");

function fail(res, error) {
  const status = error.statusCode || 500;
  if (status >= 500) {
    console.error("Admin payment transition failed:", error);
  }
  return res.status(status).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message:
        status >= 500
          ? "Unable to process payment transition."
          : error.message,
    },
  });
}

async function confirmPayment(req, res) {
  try {
    // Role, identity, and target status are server-controlled; req.body is ignored.
    const data = await service.confirmPayment(req.params.orderId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function cancelPayment(req, res) {
  try {
    // Role, identity, and target status are server-controlled; req.body is ignored.
    const data = await service.cancelPayment(req.params.orderId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

module.exports = {
  confirmPayment,
  cancelPayment,
};

