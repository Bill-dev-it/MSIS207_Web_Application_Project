const express = require("express");
const { asyncHandler } = require("../middleware/error");
const { authenticate, authorizeRole } = require("../middleware/auth");
const svc = require("../services/buyer.service");
const { intParam, enumParam, stringParam, parsePagination, pageMeta } = require("../utils/validate");
const { validation } = require("../utils/errors");

const router = express.Router();

// EVERY /api/buyer/* endpoint requires a valid session with role BUYER.
// Tenant scoping: companyId / userId come from req.user (DB), never from the request.
router.use(authenticate, authorizeRole("BUYER"));

router.get("/engines", asyncHandler(async (req, res) => {
  res.json({ items: await svc.listEngines(req.user.companyId) });
}));

router.get("/orders", asyncHandler(async (req, res) => {
  const page = parsePagination(req.query);
  const search = stringParam(req.query.search, "search", { max: 100 });
  const status = enumParam(req.query.status, "status", ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]);
  const [{ items, total }, statusCounts] = await Promise.all([
    svc.listOrders(req.user.companyId, { search, status, limit: page.limit, offset: page.offset }),
    svc.orderStatusCounts(req.user.companyId),
  ]);
  res.json({ items, statusCounts, pagination: pageMeta(page, total) });
}));

router.get("/orders/:id", asyncHandler(async (req, res) => {
  const id = stringParam(req.params.id, "id", { required: true, max: 60 });
  res.json(await svc.getOrderDetail(req.user.companyId, id));
}));

router.post("/orders", asyncHandler(async (req, res) => {
  const body = req.body || {};
  const result = await svc.createOrderFromCart(req.user, {
    checkoutKey: stringParam(body.checkoutKey, "checkoutKey", { max: 100 }),
    purchaseReference: stringParam(body.purchaseReference, "purchaseReference", { max: 100 }),
    addressId: intParam(body.addressId, "addressId", { required: false }),
  });
  res.status(result.duplicate ? 200 : 201).json(result);
}));

router.get("/cart", asyncHandler(async (req, res) => {
  res.json(await svc.getCart(req.user.userId));
}));

router.post("/cart/items", asyncHandler(async (req, res) => {
  const listingId = intParam(req.body?.listingId, "listingId");
  const quantity = intParam(req.body?.quantity ?? 1, "quantity", { max: 10000 });
  res.status(201).json(await svc.addToCart(req.user.userId, listingId, quantity));
}));

router.delete("/cart/items/:itemId", asyncHandler(async (req, res) => {
  res.json(await svc.removeCartItem(req.user.userId, intParam(req.params.itemId, "itemId")));
}));

router.get("/recommendations", asyncHandler(async (req, res) => {
  const engineId = intParam(req.query.engineId, "engineId", { required: false });
  res.json({ items: await svc.listRecommendations(req.user.companyId, engineId) });
}));

router.post("/inquiries", asyncHandler(async (req, res) => {
  const b = req.body || {};
  const subject = stringParam(b.subject, "subject", { required: true, max: 200 });
  const message = stringParam(b.message, "message", { required: true, max: 4000 });
  if (message.length < 10) throw validation("message must be at least 10 characters", { field: "message" });
  res.status(201).json(await svc.createInquiry(req.user, {
    supplierId: intParam(b.supplierId, "supplierId"),
    sellerOrderId: intParam(b.sellerOrderId, "sellerOrderId", { required: false }),
    subject, message,
  }));
}));

router.get("/search", asyncHandler(async (req, res) => {
  const q = stringParam(req.query.q, "q", { required: true, max: 60 });
  if (q.length < 2) return res.json({ engines: [], orders: [], parts: [] });
  res.json(await svc.search(req.user.companyId, q));
}));

module.exports = router;
