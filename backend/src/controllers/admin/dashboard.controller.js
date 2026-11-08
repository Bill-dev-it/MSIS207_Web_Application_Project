"use strict";

const dashboardService = require("../../services/admin/dashboard.service");

async function getSummary(req, res) {
  try {
    const data = await dashboardService.getSummary();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin dashboard failed:", error.code || "UNKNOWN");
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to load Admin dashboard.",
      },
    });
  }
}

module.exports = {
  getSummary,
};
