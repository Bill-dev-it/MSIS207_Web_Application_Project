const express = require("express");
const { asyncHandler } = require("../middleware/error");
const { authenticate, authorizeRole } = require("../middleware/auth");
const svc = require("../services/admin.service");
const { intParam, enumParam, stringParam, parsePagination, pageMeta } = require("../utils/validate");

const router = express.Router();

// EVERY /api/admin/* endpoint strictly requires a valid session with role ADMIN.
router.use(authenticate, authorizeRole("ADMIN"));

router.get("/dashboard", asyncHandler(async (req, res) => {
  res.json(await svc.getDashboardMetrics());
}));

router.get("/moderation", asyncHandler(async (req, res) => {
  const page = parsePagination(req.query);
  const status = enumParam(req.query.status, "status", ["ALL", "DRAFT", "ACTIVE", "HIDDEN"]);
  const { total, items } = await svc.listModerationQueue({
    status: status || "DRAFT",
    limit: page.limit,
    offset: page.offset,
  });
  res.json({ items, pagination: pageMeta(page, total) });
}));

router.patch("/moderation/:id", asyncHandler(async (req, res) => {
  const listingId = intParam(req.params.id, "id");
  const decision = enumParam(req.body?.decision, "decision", ["APPROVED", "REJECTED"], { required: true });
  const note = stringParam(req.body?.note, "note", { max: 1000 });
  const result = await svc.moderateListing(req.user, listingId, decision, note);
  res.json(result);
}));

router.get("/rul-status", asyncHandler(async (req, res) => {
  res.json(await svc.getRulSystemStatus());
}));

router.post("/rul-status/check", asyncHandler(async (req, res) => {
  res.json(await svc.checkRulHealth(req.user));
}));

router.get("/recommendations", asyncHandler(async (req, res) => {
  const page = parsePagination(req.query, { defaultSize: 30 });
  const items = await svc.listAllRecommendations({ limit: page.limit, offset: page.offset });
  res.json({ items });
}));

// Supplemental endpoints to eliminate dead links from the admin navigation menu
router.get("/users", asyncHandler(async (req, res) => {
  const page = parsePagination(req.query, { defaultSize: 100 });
  const items = await svc.listUsers({ limit: page.limit, offset: page.offset });
  res.json({ items });
}));

router.get("/companies", asyncHandler(async (req, res) => {
  const page = parsePagination(req.query, { defaultSize: 100 });
  const items = await svc.listCompanies({ limit: page.limit, offset: page.offset });
  res.json({ items });
}));

router.get("/suppliers", asyncHandler(async (req, res) => {
  const page = parsePagination(req.query, { defaultSize: 100 });
  const items = await svc.listSuppliers({ limit: page.limit, offset: page.offset });
  res.json({ items });
}));

module.exports = router;
