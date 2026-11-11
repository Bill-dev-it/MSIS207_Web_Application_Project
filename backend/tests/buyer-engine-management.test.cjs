"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// 1. Prohibited Async Patterns & Static Code Verification
// ---------------------------------------------------------------------------

test("Coding Rules: No prohibited async patterns in modified files", () => {
  const files = [
    "src/routes/buyer/engines.routes.js",
    "src/controllers/buyer/engines.controller.js",
    "src/services/buyer/engines.service.js",
    "src/services/buyer/engines.repository.js",
  ];

  for (const relativePath of files) {
    const fullPath = path.join(__dirname, "..", relativePath);
    const source = fs.readFileSync(fullPath, "utf8");

    assert.doesNotMatch(
      source,
      /\.then\s*\(/,
      `Found prohibited .then() in ${relativePath}`
    );
    assert.doesNotMatch(
      source,
      /\.catch\s*\(/,
      `Found prohibited .catch() in ${relativePath}`
    );
    assert.doesNotMatch(
      source,
      /Promise\.all\s*\(/,
      `Found prohibited Promise.all() in ${relativePath}`
    );
    assert.doesNotMatch(
      source,
      /new\s+Promise\s*\(/,
      `Found prohibited new Promise() in ${relativePath}`
    );
  }
});

test("Route Order: Static GET routes (/models, /aircraft) registered before /:engineId", () => {
  const routePath = path.join(__dirname, "../src/routes/buyer/engines.routes.js");
  const source = fs.readFileSync(routePath, "utf8");

  const modelsIdx = source.indexOf('"/models"');
  const aircraftIdx = source.indexOf('"/aircraft"');
  const engineIdIdx = source.indexOf('"/:engineId"');

  assert.ok(modelsIdx !== -1, "Expected route /models to be present");
  assert.ok(aircraftIdx !== -1, "Expected route /aircraft to be present");
  assert.ok(engineIdIdx !== -1, "Expected route /:engineId to be present");

  assert.ok(
    modelsIdx < engineIdIdx,
    "GET /models must be registered before /:engineId"
  );
  assert.ok(
    aircraftIdx < engineIdIdx,
    "GET /aircraft must be registered before /:engineId"
  );
});

// ---------------------------------------------------------------------------
// 2. Service Unit Tests (Validation & Business Rules)
// ---------------------------------------------------------------------------

const service = require("../src/services/buyer/engines.service");

test("Service: searchEngineModels validates query and enforces length", async () => {
  await assert.rejects(
    async () => {
      await service.listEngineModels({ search: 12345 });
    },
    { code: "INVALID_QUERY" }
  );

  await assert.rejects(
    async () => {
      await service.listEngineModels({ search: "a".repeat(201) });
    },
    { code: "INVALID_SEARCH" }
  );
});

test("Service: createEngine validates required engine_code and serial_number", async () => {
  // Missing engineCode
  await assert.rejects(
    async () => {
      await service.createEngine({
        companyId: "51",
        engineCode: "",
        serialNumber: "SN-001",
        engineModelId: "1",
        aircraftId: "1",
      });
    },
    { code: "INVALID_ENGINE_CODE" }
  );

  // Missing serialNumber
  await assert.rejects(
    async () => {
      await service.createEngine({
        companyId: "51",
        engineCode: "ENG-001",
        serialNumber: "   ",
        engineModelId: "1",
        aircraftId: "1",
      });
    },
    { code: "INVALID_SERIAL_NUMBER" }
  );
});

test("Service: createEngine validates engineModelId and currentCycle bounds", async () => {
  // Invalid engineModelId
  await assert.rejects(
    async () => {
      await service.createEngine({
        companyId: "51",
        engineCode: "ENG-001",
        serialNumber: "SN-001",
        engineModelId: "invalid-id",
        aircraftId: "1",
      });
    },
    { code: "INVALID_ENGINE_MODEL" }
  );

  // Negative currentCycle
  await assert.rejects(
    async () => {
      await service.createEngine({
        companyId: "51",
        engineCode: "ENG-001",
        serialNumber: "SN-001",
        engineModelId: "1",
        currentCycle: -10,
        aircraftId: "1",
      });
    },
    { code: "INVALID_CURRENT_CYCLE" }
  );

  // Non-integer string currentCycle
  await assert.rejects(
    async () => {
      await service.createEngine({
        companyId: "51",
        engineCode: "ENG-001",
        serialNumber: "SN-001",
        engineModelId: "1",
        currentCycle: "not-a-number",
        aircraftId: "1",
      });
    },
    { code: "INVALID_CURRENT_CYCLE" }
  );
});

test("Service: createEngine requires either aircraftId or valid newAircraft details", async () => {
  // Neither provided
  await assert.rejects(
    async () => {
      await service.createEngine({
        companyId: "51",
        engineCode: "ENG-001",
        serialNumber: "SN-001",
        engineModelId: "1",
      });
    },
    { code: "AIRCRAFT_REQUIRED" }
  );

  // newAircraft missing registration number
  await assert.rejects(
    async () => {
      await service.createEngine({
        companyId: "51",
        engineCode: "ENG-001",
        serialNumber: "SN-001",
        engineModelId: "1",
        newAircraft: { manufacturer: "Boeing", model: "737" },
      });
    },
    { code: "INVALID_AIRCRAFT_REGISTRATION" }
  );

  // newAircraft missing manufacturer
  await assert.rejects(
    async () => {
      await service.createEngine({
        companyId: "51",
        engineCode: "ENG-001",
        serialNumber: "SN-001",
        engineModelId: "1",
        newAircraft: { registrationNumber: "N123", model: "737" },
      });
    },
    { code: "INVALID_AIRCRAFT_MANUFACTURER" }
  );

  // newAircraft missing model
  await assert.rejects(
    async () => {
      await service.createEngine({
        companyId: "51",
        engineCode: "ENG-001",
        serialNumber: "SN-001",
        engineModelId: "1",
        newAircraft: { registrationNumber: "N123", manufacturer: "Boeing" },
      });
    },
    { code: "INVALID_AIRCRAFT_MODEL" }
  );
});

test("Service: updateEngine validates ID, cycle, and string lengths", async () => {
  // Invalid engineId
  await assert.rejects(
    async () => {
      await service.updateEngine({
        companyId: "51",
        engineId: "abc",
        engineCode: "ENG-001",
        serialNumber: "SN-001",
        currentCycle: 100,
      });
    },
    { code: "INVALID_ENGINE_ID" }
  );

  // Negative cycle
  await assert.rejects(
    async () => {
      await service.updateEngine({
        companyId: "51",
        engineId: "1",
        engineCode: "ENG-001",
        serialNumber: "SN-001",
        currentCycle: -5,
      });
    },
    { code: "INVALID_CURRENT_CYCLE" }
  );
});

// ---------------------------------------------------------------------------
// 3. Controller Unit Tests (Request/Response & Contract)
// ---------------------------------------------------------------------------

const controller = require("../src/controllers/buyer/engines.controller");

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

test("Controller: updateEngine rejects invalid engine ID parameter", async () => {
  const res = mockResponse();
  await controller.updateEngine(
    {
      params: { engineId: "invalid-id" },
      authUser: { company_id: "51" },
      body: { engine_code: "ENG-01", serial_number: "SN-01", current_cycle: 10 },
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, "INVALID_ENGINE_ID");
});

test("Controller: createEngine rejects invalid body and formats error response", async () => {
  const res = mockResponse();
  await controller.createEngine(
    {
      authUser: { company_id: "51" },
      body: {
        engine_code: "",
        serial_number: "SN-01",
      },
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, "INVALID_ENGINE_CODE");
});

// ---------------------------------------------------------------------------
// 4. Mocked Database Transaction Verification (Rollback Integrity)
// ---------------------------------------------------------------------------

test("Repository Transaction: Failed engine insert triggers ROLLBACK and releases client", async () => {
  const repository = require("../src/services/buyer/engines.repository");
  const pool = require("../src/config/db");

  // Mock client to intercept transaction operations without modifying real database
  const clientOperations = [];
  let isReleased = false;

  const mockClient = {
    query: async (sql, params) => {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith("BEGIN")) {
        clientOperations.push("BEGIN");
        return { rows: [] };
      }
      if (trimmed.startsWith("COMMIT")) {
        clientOperations.push("COMMIT");
        return { rows: [] };
      }
      if (trimmed.startsWith("ROLLBACK")) {
        clientOperations.push("ROLLBACK");
        return { rows: [] };
      }
      if (trimmed.startsWith("INSERT INTO AIRCRAFT")) {
        clientOperations.push("INSERT_AIRCRAFT");
        return { rows: [{ aircraft_id: "9999" }] };
      }
      if (trimmed.startsWith("SELECT ENGINE_MODEL_ID")) {
        clientOperations.push("SELECT_MODEL");
        return { rows: [{ engine_model_id: "1" }] };
      }
      if (trimmed.startsWith("INSERT INTO ENGINES")) {
        clientOperations.push("INSERT_ENGINES_FAILED");
        const duplicateErr = new Error("Unique constraint violation");
        duplicateErr.code = "23505";
        duplicateErr.constraint = "uq_engines_model_serial";
        throw duplicateErr;
      }
      return { rows: [] };
    },
    release: () => {
      isReleased = true;
      clientOperations.push("RELEASE");
    },
  };

  // Temporarily stub pool.connect
  const originalConnect = pool.connect;
  pool.connect = async () => mockClient;

  try {
    await assert.rejects(
      async () => {
        await repository.createEngineWithAircraft({
          companyId: "51",
          engineCode: "ENG-ROLLBACK-TEST",
          serialNumber: "SN-DUPLICATE",
          currentCycle: 0,
          engineModelId: "1",
          newAircraft: {
            registrationNumber: "TAIL-ROLLBACK",
            manufacturer: "Boeing",
            model: "737",
          },
        });
      },
      {
        code: "DUPLICATE_SERIAL_NUMBER",
        statusCode: 409,
      }
    );

    // Verify transaction lifecycle:
    // 1. BEGIN
    // 2. Aircraft was inserted
    // 3. Engine insert failed
    // 4. ROLLBACK executed (aircraft is not orphaned)
    // 5. Client was released
    assert.deepEqual(clientOperations, [
      "BEGIN",
      "INSERT_AIRCRAFT",
      "SELECT_MODEL",
      "INSERT_ENGINES_FAILED",
      "ROLLBACK",
      "RELEASE",
    ]);
    assert.equal(isReleased, true, "Client must be released even on failure");
  } finally {
    pool.connect = originalConnect;
  }
});

