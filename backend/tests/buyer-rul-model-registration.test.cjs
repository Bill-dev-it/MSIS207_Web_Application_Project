"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const rulRepo = require("../src/services/buyer/rul.repository");
const rulService = require("../src/services/buyer/rul.service");
const pool = require("../src/config/db");

test.after(async () => {
  try {
    await pool.end();
  } catch {
    // Ignore pool cleanup error if pool was never connected
  }
});

test("Model Registry Constants: Repository constants match deployment schema specification", async () => {
  assert.equal(rulRepo.MODEL_NAME, "condition_aware_itransformer_v3");
  assert.equal(rulRepo.MODEL_VERSION, "fd002-seed42-v3");
});

test("Model Registry Lookup: Returns active registered model when present in database", async (t) => {
  let client;
  try {
    client = await pool.connect();
  } catch {
    t.skip("Live PostgreSQL database is not reachable; skipping live lookup check.");
    return;
  }

  try {
    const model = await rulRepo.getModelVersion();
    if (!model) {
      t.skip("Database does not contain registered model version seed; skipping live lookup.");
      return;
    }
    assert.equal(model.model_name, "condition_aware_itransformer_v3");
    assert.equal(model.version, "fd002-seed42-v3");
    assert.equal(model.dataset_subset, "FD002");
    assert.equal(model.window_size, 30);
    assert.ok(model.model_version_id, "model_version_id must be populated");
  } finally {
    client.release();
  }
});

test("Error Guard: Service throws MODEL_NOT_REGISTERED 503 if getModelVersion returns null", async () => {
  const originalGetModel = rulRepo.getModelVersion;
  const originalGetOwnedEngine = rulRepo.getOwnedEngine;
  const originalGetByRequestKey = rulRepo.getByRequestKey;

  try {
    rulRepo.getOwnedEngine = async () => ({ engine_id: 25, engine_code: "ENG-QA-001" });
    rulRepo.getByRequestKey = async () => null;
    rulRepo.getModelVersion = async () => null;

    let threw = false;
    try {
      await rulService.predict({
        engineId: "25",
        userId: "1",
        companyId: "1",
        csv: "unit,cycle,setting_1,setting_2,setting_3,sensor_2,sensor_3,sensor_4,sensor_7,sensor_8,sensor_9,sensor_11,sensor_12,sensor_13,sensor_14,sensor_15,sensor_17,sensor_20,sensor_21\n" +
             Array.from({ length: 30 }, (_, i) => `1,${i + 1},10.0,0.25,100.0,642.0,1580.0,1400.0,553.0,2388.0,9050.0,47.0,521.0,2388.0,8120.0,8.4,392,38.8,23.3`).join("\n"),
        filename: "test.csv",
        requestKey: crypto.randomUUID(),
        sourceClassification: "NASA_CMAPSS_FD002",
      });
    } catch (err) {
      threw = true;
      assert.equal(err instanceof rulService.RulError, true);
      assert.equal(err.code, "MODEL_NOT_REGISTERED");
      assert.equal(err.status, 503);
      assert.equal(err.message, "The FD002 model version is not registered. Run the reviewed seed SQL during deployment.");
    }
    assert.equal(threw, true, "Expected MODEL_NOT_REGISTERED error to be thrown");
  } finally {
    rulRepo.getModelVersion = originalGetModel;
    rulRepo.getOwnedEngine = originalGetOwnedEngine;
    rulRepo.getByRequestKey = originalGetByRequestKey;
  }
});
