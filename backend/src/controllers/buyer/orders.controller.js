"use strict";

const service = require("../../services/buyer/orders.service");

async function getOrders(req, res) {
  try {
    for (const key of ["status", "search", "page", "limit"]) {
      if (req.query[key] !== undefined && typeof req.query[key] !== "string") {
        const error = new Error(`Query parameter "${key}" must be a single text value.`);
        error.statusCode = 400;
        error.code = "INVALID_QUERY";
        throw error;
      }
    }
    const data = await service.getOrders({
      companyId: req.authUser.company_id,
      status: req.query.status ?? "ALL",
      search: req.query.search ?? "",
      page: req.query.page ?? "1",
      limit: req.query.limit ?? "10",
    });
    const { orders, ...meta } = data;
    return res.status(200).json({ success: true, data: orders, meta });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) console.error("Buyer orders request failed:", error);
    return res.status(status).json({
      success: false,
      error: {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: status >= 500 ? "Unable to retrieve Buyer orders." : error.message,
      },
    });
  }
}

module.exports = { getOrders };
