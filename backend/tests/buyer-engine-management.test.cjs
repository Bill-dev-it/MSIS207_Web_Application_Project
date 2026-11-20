"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const pool = require("../src/config/db");
const enginesRepository = require("../src/services/buyer/engines.repository");
const enginesService = require("../src/services/buyer/engines.service");
const enginesController = require("../src/controllers/buyer/engines.controller");

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

test("listEngineModels forwards valid search and rejects invalid or oversized queries", async () => {
  await assert.rejects(() => enginesService.listEngineModels({ search: 123 }), { code: "INVALID_QUERY" });
  await assert.rejects(() => enginesService.listEngineModels({ search: "a".repeat(201) }), { code: "INVALID_SEARCH" });

  const original = enginesRepository.searchEngineModels;
  let captured = null;
  enginesRepository.searchEngineModels = async (args) => { captured = args; return []; };
  try {
    await enginesService.listEngineModels({ search: "CFM56", limit: 10 });
    assert.deepEqual(captured, { search: "CFM56", limit: 10 });
  } finally {
    enginesRepository.searchEngineModels = original;
  }
});

test("createEngine supports existing aircraft, newAircraft aliases, and year boundaries", async () => {
  const originalCreate = enginesRepository.createEngineWithAircraft;
  const originalGetById = enginesRepository.getEngineById;
  const calls = [];
  enginesRepository.createEngineWithAircraft = async (args) => { calls.push(args); return "700"; };
  enginesRepository.getEngineById = async ({ companyId, engineId }) => ({ engine_id: engineId, company_id: companyId });

  try {
    // Existing aircraftId takes precedence over newAircraft when both are supplied
    const createdExisting = await enginesService.createEngine({
      companyId: "51", engineCode: " ENG-1 ", serialNumber: " SN-1 ", engineModelId: 4,
      currentCycle: "25", aircraftId: 9, newAircraft: { registrationNumber: "IGNORED" },
    });
    assert.equal(calls[0].aircraftId, "9");
    assert.equal(calls[0].newAircraft, null);
    assert.deepEqual(createdExisting, { engine_id: "700", company_id: "51" });

    // snake_case & camelCase aliases plus boundary years 1900 and 2100
    await enginesService.createEngine({
      companyId: "51", engineCode: "ENG-2", serialNumber: "SN-2", engineModelId: "3",
      newAircraft: { registration_number: " VN-A321 ", manufacturer: "Airbus", model: "A321", year: 1900 },
    });
    assert.deepEqual(calls[1].newAircraft, {
      registrationNumber: "VN-A321", manufacturer: "Airbus", model: "A321",
      aircraftType: "Commercial Fixed-Wing", year: 1900, status: "ACTIVE",
    });

    await enginesService.createEngine({
      companyId: "51", engineCode: "ENG-3", serialNumber: "SN-3", engineModelId: "3",
      newAircraft: { registrationNumber: "N999", manufacturer: "Boeing", model: "787", aircraftType: " Widebody ", year: "2100" },
    });
    assert.equal(calls[2].newAircraft.aircraftType, "Widebody");
    assert.equal(calls[2].newAircraft.year, 2100);
  } finally {
    enginesRepository.createEngineWithAircraft = originalCreate;
    enginesRepository.getEngineById = originalGetById;
  }
});

test("createEngine and controller enforce validation order, company ownership, and error responses", async () => {
  await assert.rejects(() => enginesService.createEngine({ companyId: "bad", engineCode: "" }), { code: "AUTH_REQUIRED", statusCode: 401 });
  await assert.rejects(() => enginesService.createEngine({ companyId: "51", engineCode: "", serialNumber: "" }), { code: "INVALID_ENGINE_CODE" });
  await assert.rejects(() => enginesService.createEngine({ companyId: "51", engineCode: "ENG", serialNumber: "SN", engineModelId: "1", aircraftId: 0 }), { code: "INVALID_AIRCRAFT_ID" });
  await assert.rejects(() => enginesService.createEngine({ companyId: "51", engineCode: "ENG", serialNumber: "SN", engineModelId: "1", newAircraft: { registrationNumber: "N1", manufacturer: "Boeing", model: "737", year: 2101 } }), { code: "INVALID_AIRCRAFT_YEAR" });

  const res = createRes();
  await enginesController.updateEngine({
    params: { engineId: "abc" }, authUser: { company_id: "51" },
    body: { engine_code: "ENG-1", serial_number: "SN-1", current_cycle: 10 },
  }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, "INVALID_ENGINE_ID");
});

test("createEngineWithAircraft rolls back aircraft insert and releases client on duplicate engine serial", async () => {
  const ops = [];
  let released = false;
  const originalConnect = pool.connect;
  pool.connect = async () => ({
    async query(sql, params) {
      const upper = sql.trim().toUpperCase();
      if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") { ops.push(upper); return { rows: [] }; }
      if (upper.startsWith("INSERT INTO AIRCRAFT")) { ops.push("INSERT_AIRCRAFT"); assert.equal(params[0], "51"); return { rows: [{ aircraft_id: "99" }] }; }
      if (upper.startsWith("SELECT ENGINE_MODEL_ID")) { ops.push("SELECT_MODEL"); return { rows: [{ engine_model_id: "1" }] }; }
      if (upper.startsWith("INSERT INTO ENGINES")) {
        ops.push("INSERT_ENGINES_FAILED");
        const err = new Error("duplicate"); err.code = "23505"; err.constraint = "uq_engines_model_serial"; throw err;
      }
      return { rows: [] };
    },
    release() { released = true; ops.push("RELEASE"); },
  });

  try {
    await assert.rejects(() => enginesRepository.createEngineWithAircraft({
      companyId: "51", engineCode: "ENG-1", serialNumber: "SN-DUP", currentCycle: 0, engineModelId: "1",
      newAircraft: { registrationNumber: "TAIL-1", manufacturer: "Boeing", model: "737" },
    }), { code: "DUPLICATE_SERIAL_NUMBER", statusCode: 409 });
    assert.deepEqual(ops, ["BEGIN", "INSERT_AIRCRAFT", "SELECT_MODEL", "INSERT_ENGINES_FAILED", "ROLLBACK", "RELEASE"]);
    assert.equal(released, true);
  } finally {
    pool.connect = originalConnect;
  }
});
