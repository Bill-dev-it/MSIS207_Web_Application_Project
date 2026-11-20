"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const rulRepo = require("../src/services/buyer/rul/rul.repository");
const rulService = require("../src/services/buyer/rul/rul.service");

const VALID_CSV =
  "unit,cycle,setting_1,setting_2,setting_3,sensor_2,sensor_3,sensor_4,sensor_7,sensor_8,sensor_9,sensor_11,sensor_12,sensor_13,sensor_14,sensor_15,sensor_17,sensor_20,sensor_21\n" +
  Array.from({ length: 30 }, (_, i) => `1,${i + 1},10,0.25,100,642,1580,1400,553,2388,9050,47,521,2388,8120,8.4,392,38.8,23.3`).join("\n");

test("RUL repository model constants match FD002 deployment specification", () => {
  assert.equal(rulRepo.MODEL_NAME, "condition_aware_itransformer_v3");
  assert.equal(rulRepo.MODEL_VERSION, "fd002-seed42-v3");
});

test("predict fails with 503 MODEL_NOT_REGISTERED before calling inference if model is unregistered", async () => {
  const originals = {
    getModelVersion: rulRepo.getModelVersion,
    getOwnedEngine: rulRepo.getOwnedEngine,
    getByRequestKey: rulRepo.getByRequestKey,
    fetch: global.fetch,
  };
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; throw new Error("Inference should not run"); };
  rulRepo.getOwnedEngine = async () => ({ engine_id: 25, engine_code: "ENG-001" });
  rulRepo.getByRequestKey = async () => null;
  rulRepo.getModelVersion = async () => null;

  try {
    await assert.rejects(() => rulService.predict({
      engineId: "25", userId: "1", companyId: "1", csv: VALID_CSV,
      filename: "test.csv", requestKey: crypto.randomUUID(), sourceClassification: "NASA_CMAPSS_FD002",
    }), { code: "MODEL_NOT_REGISTERED", status: 503 });
    assert.equal(fetchCalled, false);
  } finally {
    rulRepo.getModelVersion = originals.getModelVersion;
    rulRepo.getOwnedEngine = originals.getOwnedEngine;
    rulRepo.getByRequestKey = originals.getByRequestKey;
    global.fetch = originals.fetch;
  }
});
