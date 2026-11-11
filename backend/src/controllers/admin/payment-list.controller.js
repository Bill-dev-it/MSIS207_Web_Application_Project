"use strict";

const paymentListService = require("../../services/admin/payment-list.service");

async function listPayments(req, res) {
  try {
    const query = req.query || {};
    for (const key of ["status", "page", "limit"]) {
      if (query[key] !== undefined && typeof query[key] !== "string") {
        const error = new Error(`${key} must be a single text value.`);
        error.statusCode = 400;
        error.code = "INVALID_QUERY";
        throw error;
      }
    }

    const result = await paymentListService.listPayments(query);
    return res.status(200).json({
      success: true,
      data: result.payments,
      meta: {
        status: result.status,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) {
      console.error("Admin payment list failed:", error.code || "UNKNOWN");
    }
    return res.status(status).json({
      success: false,
      error: {
        code: status >= 500 ? "INTERNAL_SERVER_ERROR" : error.code,
        message: status >= 500 ? "Unable to load bank transfers." : error.message,
      },
    });
  }
}

module.exports = { listPayments };

