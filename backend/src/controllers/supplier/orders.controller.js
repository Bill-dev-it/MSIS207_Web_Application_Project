const service = require("../../services/supplier/orders.service");

function validId(value) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value) && BigInt(value) <= 9223372036854775807n;
}
function missing(res) {
  return res.status(404).json({ success: false, error: { code: "ORDER_NOT_FOUND", message: "Supplier order not found." } });
}
function failed(res, error) {
  console.error("Supplier order failed:", error);
  return res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Unable to process supplier order." } });
}

async function getAll(req, res) {
  try {
    const data = await service.getAll(req.supplierId);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) { return failed(res, error); }
}

async function getOne(req, res) {
  if (!validId(req.params.sellerOrderId)) {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Invalid order ID." } });
  }
  try {
    const data = await service.getOne(req.supplierId, req.params.sellerOrderId);
    return data ? res.status(200).json({ success: true, data }) : missing(res);
  } catch (error) { return failed(res, error); }
}

async function updateStatus(req, res) {
  const id = req.params.sellerOrderId;
  const next = req.body?.status;
  if (!validId(id) || !req.body || Object.keys(req.body).length !== 1 ||
      !["PROCESSING", "SHIPPED", "DELIVERED"].includes(next)) {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Invalid order ID or next status." } });
  }
  try {
    const current = await service.getOne(req.supplierId, id);
    if (!current) return missing(res);
    if (current.payment_status !== "SUCCEEDED") {
      const cancelled = current.payment_status === "CANCELLED";
      return res.status(409).json({
        success: false,
        error: {
          code: cancelled ? "PAYMENT_CANCELLED" : "PAYMENT_PENDING",
          message: cancelled
            ? "Cannot advance fulfillment because the order payment was cancelled."
            : "Cannot advance fulfillment until the order payment is confirmed as SUCCEEDED.",
        },
      });
    }
    const nextByStatus = { CONFIRMED: "PROCESSING", PROCESSING: "SHIPPED", SHIPPED: "DELIVERED" };
    if (nextByStatus[current.status] !== next) {
      return res.status(409).json({ success: false, error: { code: "INVALID_TRANSITION", message: "Order status must advance one step." } });
    }
    const changed = await service.updateStatus(req.supplierId, id, current.status, next);
    if (!changed) return res.status(409).json({ success: false, error: { code: "ORDER_CHANGED", message: "Order status changed. Reload and try again." } });
    const data = await service.getOne(req.supplierId, id);
    return res.status(200).json({ success: true, data });
  } catch (error) { return failed(res, error); }
}

module.exports = { getAll, getOne, updateStatus };
