const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { startTestDb } = require("./helpers/testDb");

const PASSWORD = "Demo@12345";

test("admin API endpoints", async (t) => {
  const db = await startTestDb();
  t.after(() => db.stop());
  const { createApp } = require("../src/app");
  const app = createApp();

  const adminAgent = request.agent(app);
  const buyerAgent = request.agent(app);

  await adminAgent.post("/api/auth/login").send({ email: "admin@demo.aerorul.test", password: PASSWORD });
  await buyerAgent.post("/api/auth/login").send({ email: "buyer.horizon@demo.aerorul.test", password: PASSWORD });

  await t.test("access control: non-admin is rejected with 401/403", async () => {
    const unauth = await request(app).get("/api/admin/dashboard");
    assert.equal(unauth.status, 401);

    const forbidden = await buyerAgent.get("/api/admin/dashboard");
    assert.equal(forbidden.status, 403);
  });

  await t.test("GET /api/admin/dashboard returns real SQL metrics matching Gold", async () => {
    const res = await adminAgent.get("/api/admin/dashboard");
    assert.equal(res.status, 200);

    // Engines in Gold: exactly 24
    assert.equal(res.body.engines.total, 24);
    // Suppliers in Gold: exactly 40
    assert.equal(res.body.suppliers.total, 40);
    // Listings in Gold: exactly 936
    assert.equal(res.body.listings.total, 936);

    assert.ok(res.body.orders.total >= 10);
    assert.ok(res.body.rulUrgencyDistribution);
    assert.ok(Array.isArray(res.body.recentActivity));
  });

  await t.test("GET /api/admin/moderation & PATCH /api/admin/moderation/:id (Approve/Reject persistence)", async () => {
    // 1. Find a draft listing
    const queue = await adminAgent.get("/api/admin/moderation?status=DRAFT&pageSize=5");
    assert.equal(queue.status, 200);
    assert.ok(queue.body.items.length > 0);
    const target = queue.body.items[0];
    assert.equal(target.status, "DRAFT");

    // 2. Approve listing
    const approveRes = await adminAgent.patch(`/api/admin/moderation/${target.listingId}`).send({
      decision: "APPROVED",
      note: "Documents and FAA conformity verified.",
    });
    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.status, "ACTIVE");
    assert.equal(approveRes.body.decision, "APPROVED");

    // 3. Verify in DB directly that state was persisted
    const dbCheck = await db.client.query(
      `SELECT status FROM seller_listings WHERE listing_id = $1`,
      [target.listingId]
    );
    assert.equal(dbCheck.rows[0].status, "ACTIVE");

    // Verify moderation decision record
    const decCheck = await db.client.query(
      `SELECT * FROM moderation_decisions WHERE listing_id = $1 ORDER BY decided_at DESC`,
      [target.listingId]
    );
    assert.equal(decCheck.rows[0].decision, "APPROVED");
    assert.equal(decCheck.rows[0].note, "Documents and FAA conformity verified.");

    // 4. Reject listing
    const rejectRes = await adminAgent.patch(`/api/admin/moderation/${target.listingId}`).send({
      decision: "REJECTED",
      note: "Price discrepancy with commercial invoice.",
    });
    assert.equal(rejectRes.status, 200);
    assert.equal(rejectRes.body.status, "HIDDEN");

    const dbCheck2 = await db.client.query(
      `SELECT status FROM seller_listings WHERE listing_id = $1`,
      [target.listingId]
    );
    assert.equal(dbCheck2.rows[0].status, "HIDDEN");
  });

  await t.test("GET /api/admin/rul-status & POST /api/admin/rul-status/check", async () => {
    const statusRes = await adminAgent.get("/api/admin/rul-status");
    assert.equal(statusRes.status, 200);
    assert.ok(statusRes.body.uploadsCount > 0);
    assert.ok(statusRes.body.predictions.total > 0);
    assert.ok(statusRes.body.activeModelVersion);
    assert.ok(Array.isArray(statusRes.body.recentPredictions));

    // Health check invocation
    const checkRes = await adminAgent.post("/api/admin/rul-status/check").send({});
    assert.equal(checkRes.status, 200);
    assert.ok(checkRes.body.checkId);
    assert.ok(checkRes.body.status);
    assert.ok(checkRes.body.checkedAt);
  });

  await t.test("Admin supplemental lists (users, companies, suppliers) are functional", async () => {
    const [users, companies, suppliers] = await Promise.all([
      adminAgent.get("/api/admin/users"),
      adminAgent.get("/api/admin/companies"),
      adminAgent.get("/api/admin/suppliers"),
    ]);
    assert.equal(users.status, 200);
    assert.ok(users.body.items.length >= 7);

    assert.equal(companies.status, 200);
    assert.equal(companies.body.items.length, 47); // 47 companies in Gold

    assert.equal(suppliers.status, 200);
    assert.equal(suppliers.body.items.length, 40); // 40 suppliers in Gold
  });
});
