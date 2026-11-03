const service = require("../../services/supplier/inventory.service");

function fail(res, error) {
  console.error("Supplier inventory failed:", error);
  return res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Unable to process inventory." } });
}

async function getInventory(req, res) {
  try {
    const data = await service.getInventory(req.supplierId);
    return res.status(200).json({ success: true, data });
  } catch (error) { return fail(res, error); }
}

async function updateStock(req, res) {
  const id = req.params.listingId;
  const stock = req.body?.stock_quantity;
  if (!/^[1-9]\d*$/.test(id) || BigInt(id) > 9223372036854775807n ||
      !Number.isInteger(stock) || stock < 0 || stock > 2147483647 ||
      Object.keys(req.body).length !== 1) {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Invalid listing ID or stock quantity." } });
  }
  try {
    const data = await service.updateStock(req.supplierId, id, stock);
    return data
      ? res.status(200).json({ success: true, data })
      : res.status(404).json({ success: false, error: { code: "LISTING_NOT_FOUND", message: "Listing not found." } });
  } catch (error) { return fail(res, error); }
}

module.exports = { getInventory, updateStock };
