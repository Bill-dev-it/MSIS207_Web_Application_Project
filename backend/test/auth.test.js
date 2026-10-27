const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { startTestDb } = require("./helpers/testDb");

const PASSWORD = "Demo@12345";

test("auth API", async (t) => {
  const db = await startTestDb();
  t.after(() => db.stop());
  const { createApp } = require("../src/app");
  const app = createApp();

  await t.test("rejects missing/invalid credentials with {error, code}", async () => {
    let res = await request(app).post("/api/auth/login").send({ email: "buyer.horizon@demo.aerorul.test", password: "wrong" });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, "UNAUTHENTICATED");
    res = await request(app).post("/api/auth/login").send({ email: "nobody@x.test", password: PASSWORD });
    assert.equal(res.status, 401);
    res = await request(app).post("/api/auth/login").send({ email: "a@b.c" });
    assert.equal(res.status, 422);
    assert.equal(res.body.code, "VALIDATION_ERROR");
  });

  await t.test("login sets httpOnly cookie, /me returns company from DB", async () => {
    const agent = request.agent(app);
    const res = await agent.post("/api/auth/login").send({ email: "buyer.horizon@demo.aerorul.test", password: PASSWORD });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, "BUYER");
    assert.equal(res.body.user.companyId, 1);
    assert.equal(res.body.user.companyName, "Demo Horizon Airlines");
    assert.match(res.headers["set-cookie"][0], /HttpOnly/i);
    assert.equal(res.body.user.password_hash, undefined);
    const me = await agent.get("/api/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, "buyer.horizon@demo.aerorul.test");
  });

  await t.test("/me without cookie → 401", async () => {
    assert.equal((await request(app).get("/api/auth/me")).status, 401);
  });

  await t.test("logout really revokes the session (old cookie stops working)", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email: "admin@demo.aerorul.test", password: PASSWORD });
    const stolen = (await agent.get("/api/auth/me")).request.header.Cookie;
    assert.equal((await agent.post("/api/auth/logout")).status, 204);
    assert.equal((await agent.get("/api/auth/me")).status, 401);
    // replay the old token directly
    const res = await request(app).get("/api/auth/me").set("Cookie", stolen ?? "");
    assert.equal(res.status, 401);
  });

  await t.test("deactivated user cannot use an existing session", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email: "buyer.pacific@demo.aerorul.test", password: PASSWORD });
    await db.client.query(`UPDATE users SET is_active=FALSE WHERE email='buyer.pacific@demo.aerorul.test'`);
    assert.equal((await agent.get("/api/auth/me")).status, 401);
    await db.client.query(`UPDATE users SET is_active=TRUE WHERE email='buyer.pacific@demo.aerorul.test'`);
  });
});
