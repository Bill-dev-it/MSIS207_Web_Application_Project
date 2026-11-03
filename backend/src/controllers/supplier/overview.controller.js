const service = require("../../services/supplier/overview.service");

async function getOverview(req, res) {
  try {
    const data = await service.getOverview(req.supplierId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Supplier overview failed:", error);
    return res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Unable to load supplier overview." } });
  }
}
module.exports = { getOverview };
