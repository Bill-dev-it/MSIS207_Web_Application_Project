"use strict";

const service = require("../../services/buyer/dashboard.service");

function parseLimit(value, defaultValue = 5) {
  if (value === undefined) return defaultValue;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value) || Number(value) > 100) {
    const error = new Error("Limit must be an integer between 1 and 100.");
    error.statusCode = 400;
    error.code = "INVALID_LIMIT";
    throw error;
  }
  return Number(value);
}

function fail(res, error) {
  const status = error.statusCode || 500;
  if (status >= 500) console.error("Buyer dashboard request failed:", error);
  return res.status(status).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: status >= 500 ? "Unable to load Buyer dashboard." : error.message,
    },
  });
}

async function getSummary(req, res) {
  try {
    const data = await service.getSummary({
      companyId: req.authUser.company_id,
      userId: req.authUser.user_id,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function getEngineHealth(req, res) {
  try {
    const data = await service.getEngineHealth({
      companyId: req.authUser.company_id,
      limit: parseLimit(req.query.limit),
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function getRecentOrders(req, res) {
  try {
    const data = await service.getRecentOrders({
      companyId: req.authUser.company_id,
      limit: parseLimit(req.query.limit),
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

module.exports = { getSummary, getEngineHealth, getRecentOrders };
