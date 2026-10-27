const test = require("node:test");
const assert = require("node:assert/strict");
const { startTestDb } = require("./helpers/testDb");
const { seedDemoRuntime } = require("../db/seed_demo_runtime");

test("Gold + demo runtime seed", async (t) => {
  const db = await startTestDb();
  t.after(() => db.stop());
  const count = async (sql) => Number((await db.client.query(sql)).rows[0].n);

  await t.test("Gold row counts match build_gold.py", async () => {
    const expected = {
      companies: 47, addresses: 47, categories: 9, engine_models: 4712, suppliers: 40,
      aircraft: 24, engines: 24, products: 312, seller_listings: 936, product_engine_compatibility: 146,
    };
    for (const [table, n] of Object.entries(expected)) {
      assert.equal(await count(`SELECT COUNT(*) n FROM ${table}`), n, table);
    }
  });

  await t.test("identity sequences realigned after explicit IDs", async () => {
    const { rows } = await db.client.query(
      `INSERT INTO categories (category_name, slug) VALUES ('Seq test','seq-test') RETURNING category_id`);
    assert.equal(Number(rows[0].category_id), 10);
    await db.client.query(`DELETE FROM categories WHERE slug='seq-test'`);
  });

  await t.test("demo data references real Gold ids", async () => {
    assert.equal(await count(`SELECT COUNT(*) n FROM users WHERE email LIKE '%@demo.aerorul.test'`), 7);
    assert.equal(await count(`SELECT COUNT(*) n FROM sensor_uploads WHERE NOT is_demo`), 0);
    assert.ok((await count(`SELECT COUNT(*) n FROM rul_predictions`)) >= 24);
    assert.equal(await count(`SELECT COUNT(*) n FROM orders WHERE order_number LIKE 'DEMO-ORD-%'`), 10);
    assert.equal(await count(
      `SELECT COUNT(*) n FROM order_items oi LEFT JOIN seller_listings l USING (listing_id) WHERE l.listing_id IS NULL`), 0);
  });

  await t.test("seed is idempotent", async () => {
    const before = await count(`SELECT (SELECT COUNT(*) FROM orders)+(SELECT COUNT(*) FROM rul_predictions)+(SELECT COUNT(*) FROM users) n`);
    await seedDemoRuntime(db.client);
    const after = await count(`SELECT (SELECT COUNT(*) FROM orders)+(SELECT COUNT(*) FROM rul_predictions)+(SELECT COUNT(*) FROM users) n`);
    assert.equal(after, before);
  });
});
