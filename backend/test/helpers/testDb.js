/**
 * Boots a REAL PostgreSQL (embedded-postgres), applies the project schema + migration,
 * loads the Gold CSVs exactly like database/seed/load_gold.py (explicit IDs, '' → NULL,
 * sequences realigned) and runs the demo runtime seed.
 *
 * Tests therefore run against the real schema and the real Gold dataset.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");

const ROOT = path.resolve(__dirname, "../../..");
const GOLD = path.join(ROOT, "data/etl/gold");
const GOLD_TABLES = [
  "companies", "addresses", "categories", "engine_models", "suppliers",
  "aircraft", "engines", "products", "seller_listings", "product_engine_compatibility",
];

const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });

async function loadGold(client) {
  for (const table of GOLD_TABLES) {
    const file = path.join(GOLD, `${table}.csv`);
    const header = fs.readFileSync(file, "utf8").split(/\r?\n/)[0].replace(/^\uFEFF/, "").split(",");
    await client.query(
      `COPY ${table} (${header.join(",")}) FROM '${file.replace(/'/g, "''")}' WITH (FORMAT CSV, HEADER TRUE, NULL '')`
    );
  }
  for (const table of GOLD_TABLES) {
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name=$1 AND is_identity='YES'`, [table]);
    for (const { column_name: col } of rows) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1,$2), (SELECT COALESCE(MAX(${col}),1) FROM ${table}))`,
        [table, col]
      );
    }
  }
}

async function startTestDb({ seedDemo = true } = {}) {
  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aerorul-pg-"));
  const port = await freePort();
  const pg = new EmbeddedPostgres({
    databaseDir: dir, user: "postgres", password: "postgres", port, persistent: false,
    onLog: () => {}, onError: () => {},
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("aerorul_test");

  const env = {
    DB_HOST: "127.0.0.1", DB_PORT: String(port), DB_NAME: "aerorul_test",
    DB_USER: "postgres", DB_PASSWORD: "postgres",
    JWT_SECRET: "test-secret-test-secret-test-secret", COOKIE_SECURE: "false",
  };
  Object.assign(process.env, env);

  const { Client } = require("pg");
  const client = new Client({
    host: env.DB_HOST, port, database: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD,
  });
  await client.connect();
  await client.query(fs.readFileSync(path.join(ROOT, "database/schema/01_schema.sql"), "utf8"));
  await client.query(fs.readFileSync(path.join(ROOT, "database/schema/02_runtime_extensions.sql"), "utf8"));
  await loadGold(client);
  if (seedDemo) await require("../../db/seed_demo_runtime").seedDemoRuntime(client);

  return {
    client,
    env,
    async stop() {
      await client.end();
      try { await require("../../src/config/db").end(); } catch { /* pool never used */ }
      await pg.stop();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

module.exports = { startTestDb, GOLD_TABLES };
