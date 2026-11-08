"use strict";

const service = require("../../services/admin/rul-health.service");

async function getHealth(req, res) {
  try {
    const data = await service.getHealth();
    // A 200 response means the check ran, not that the model is healthy.
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Admin RUL health check failed:", error.code || "UNKNOWN");
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Unable to check RUL service." },
    });
  }
}

module.exports = { getHealth };

