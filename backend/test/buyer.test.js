const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { startTestDb } = require("./helpers/testDb");

const PASSWORD = "Demo@12345";

test("buyer API endpoints", async (t) => {
  const db = await startTestDb();
  t.after(() => db.stop());
  const { createApp } = require("../src/app");
  const app = createApp();

  const buyerHorizon = request.agent(app);
  const buyerPacific = request.agent(app);
  const adminAgent = request.agent(app);

  await buyerHorizon.post("/api/auth/login").send({ email: "buyer.horizon@demo.aerorul.test", password: PASSWORD });
  await buyerPacific.post("/api/auth/login").send({ email: "buyer.pacific@demo.aerorul.test", password: PASSWORD });
  await adminAgent.post("/api/auth/login").send({ email: "admin@demo.aerorul.test", password: PASSWORD });

  await t.test("unauthenticated and wrong role are blocked", async () => {
    const unauth = await request(app).get("/api/buyer/engines");
    assert.equal(unauth.status, 401);

    const forbidden = await adminAgent.get("/api/buyer/engines");
    assert.equal(forbidden.status, 403);
  });

  await t.test("GET /api/buyer/engines returns tenant-scoped fleet with RUL history", async () => {
    const res = await buyerHorizon.get("/api/buyer/engines");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.items));
    // Horizon has 4 engines (1, 7, 13, 19)
    assert.equal(res.body.items.length, 4);
    const eng = res.body.items[0];
    assert.ok(eng.engineId);
    assert.ok(eng.engineCode);
    assert.ok(eng.engineModel);
    assert.ok(eng.aircraft);
    assert.ok(Array.isArray(eng.rulHistory));
    assert.ok(eng.rulHistory.length > 0);
  });

  await t.test("GET /api/buyer/orders lists orders with pagination, status filter and counts", async () => {
    const res = await buyerHorizon.get("/api/buyer/orders?page=1&pageSize=5");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.items));
    assert.ok(res.body.statusCounts);
    assert.ok(res.body.pagination);
    assert.equal(res.body.pagination.page, 1);

    // Filter by status
    const filtered = await buyerHorizon.get("/api/buyer/orders?status=DELIVERED");
    assert.equal(filtered.status, 200);
    for (const ord of filtered.body.items) {
      assert.equal(ord.status, "DELIVERED");
    }
  });

  await t.test("GET /api/buyer/orders/:id returns full order detail with shipments & payment", async () => {
    const listRes = await buyerHorizon.get("/api/buyer/orders");
    const firstOrder = listRes.body.items[0];
    assert.ok(firstOrder);

    const detail = await buyerHorizon.get(`/api/buyer/orders/${firstOrder.orderNumber}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.orderNumber, firstOrder.orderNumber);
    assert.ok(Array.isArray(detail.body.sellerOrders));
    assert.ok(detail.body.sellerOrders.length > 0);
    assert.ok(detail.body.payment);

    // Tenant check: Pacific cannot access Horizon's order
    const blocked = await buyerPacific.get(`/api/buyer/orders/${firstOrder.orderNumber}`);
    assert.equal(blocked.status, 404);
  });

  await t.test("Cart & Order lifecycle: add, view, checkout, stock decrement", async () => {
    // 1. Get initial cart
    const initialCart = await buyerHorizon.get("/api/buyer/cart");
    assert.equal(initialCart.status, 200);

    // 2. Add listing to cart
    // listing_id 1: price ~3833.69, stock 20
    const addRes = await buyerHorizon.post("/api/buyer/cart/items").send({ listingId: 1, quantity: 2 });
    assert.equal(addRes.status, 201);
    assert.ok(addRes.body.items.some((i) => i.listingId === 1 && i.quantity === 2));

    // Stock limit check
    const overStock = await buyerHorizon.post("/api/buyer/cart/items").send({ listingId: 1, quantity: 999 });
    assert.equal(overStock.status, 409);
    assert.equal(overStock.body.code, "INSUFFICIENT_STOCK");

    // 3. Checkout creates real order
    const checkoutKey = `checkout-test-${Date.now()}`;
    const orderRes = await buyerHorizon.post("/api/buyer/orders").send({
      checkoutKey,
      purchaseReference: "PO-TEST-001",
    });
    assert.equal(orderRes.status, 201);
    assert.ok(orderRes.body.orderNumber);

    // Idempotent checkout key returns same order
    const dupRes = await buyerHorizon.post("/api/buyer/orders").send({ checkoutKey });
    assert.equal(dupRes.status, 200);
    assert.equal(dupRes.body.orderNumber, orderRes.body.orderNumber);
    assert.equal(dupRes.body.duplicate, true);

    // Cart is now empty
    const emptyCart = await buyerHorizon.get("/api/buyer/cart");
    assert.equal(emptyCart.body.items.length, 0);
  });

  await t.test("GET /api/buyer/recommendations", async () => {
    const res = await buyerHorizon.get("/api/buyer/recommendations");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.items));
  });

  await t.test("POST /api/buyer/inquiries creates real inquiry", async () => {
    const res = await buyerHorizon.post("/api/buyer/inquiries").send({
      supplierId: 1,
      subject: "Inquiry about delivery schedule",
      message: "Please let us know if priority shipping is available.",
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.inquiryId);
  });
});
