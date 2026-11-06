"use strict";
const path = require("node:path");
const fs = require("node:fs/promises");
const crypto = require("node:crypto");
const repository = require("./rul.repository");
const { predictCsv } = require("../rul-inference.service");

const MAX_CSV_BYTES = 1024 * 1024;
const MAX_BIGINT = 9223372036854775807n;
const SOURCE_CLASSIFICATIONS = Object.freeze([
  "NASA_CMAPSS_FD002",
  "CUSTOM_SYNTHETIC",
  "EXTERNAL_MAPPED",
]);
function sourceClassificationForResponse(value) {
  return value === "FD002" ? "LEGACY_UNCLASSIFIED" : value;
}
const REQUIRED_COLUMNS = ["unit", "cycle", "setting_1", "setting_2", "setting_3",
  "sensor_2", "sensor_3", "sensor_4", "sensor_7", "sensor_8", "sensor_9",
  "sensor_11", "sensor_12", "sensor_13", "sensor_14", "sensor_15",
  "sensor_17", "sensor_20", "sensor_21"];
const DECISION_RULE = Object.freeze({ rule: "fd002-demo-thresholds-v1", unit: "engine_cycles",
  thresholds: { PRIORITIZE: 20, PREPARE: 40, MONITOR: 80 },
  disclaimer: "Academic simulation only; not certified maintenance guidance." });

class RulError extends Error {
  constructor(code, status, message) {
    super(message); this.code = code; this.status = status;
  }
}
function validId(id) {
  return typeof id === "string" && /^[1-9]\d*$/.test(id) && BigInt(id) <= MAX_BIGINT;
}
function validateRequestKey(value) {
  if (typeof value !== "string" || !/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(value)) {
    throw new RulError("INVALID_REQUEST_KEY", 400, "A valid UUID Idempotency-Key is required.");
  }
  return value.toLowerCase();
}
function safeFilename(value) {
  if (typeof value !== "string" || !value || value.length > 255 ||
      value.includes("/") || value.includes("\\") || /[\x00-\x1f]/.test(value) || !/\.csv$/i.test(value)) {
    throw new RulError("INVALID_FILENAME", 400, "A simple .csv filename is required.");
  }
  return value;
}
function validateSourceClassification(value) {
  if (!SOURCE_CLASSIFICATIONS.includes(value)) {
    throw new RulError("INVALID_SOURCE_CLASSIFICATION", 400,
      `Source classification must be one of: ${SOURCE_CLASSIFICATIONS.join(", ")}.`);
  }
  return value;
}
function isGroundTruthLabel(column) {
  const normalized = column.toLowerCase().replace(/[^a-z0-9]/g, "");
  const tokens = column.toLowerCase().split(/[^a-z0-9]+/);
  return tokens.includes("rul") ||
    (normalized.startsWith("rul") && !normalized.startsWith("rule")) ||
    /^(?:true|predicted|actual)rul/.test(normalized) ||
    /^(?:target|label|remaining(?:useful)?(?:life|rul)|groundtruth)/.test(normalized);
}
function validateCsv(csv) {
  if (typeof csv !== "string") throw new RulError("INVALID_CONTENT_TYPE", 415, "Upload text/csv content.");
  const bytes = Buffer.byteLength(csv, "utf8");
  if (bytes < 1) throw new RulError("INVALID_SENSOR_CSV", 422, "CSV cannot be empty.");
  if (bytes > MAX_CSV_BYTES) throw new RulError("INVALID_FILE_SIZE", 413, "CSV must be 1 MiB or smaller.");
  if (csv.charCodeAt(0) === 0xfeff || csv.includes("\0") || csv.includes("\ufffd")) {
    throw new RulError("INVALID_SENSOR_CSV", 422, "Use valid UTF-8 CSV without BOM or null bytes.");
  }
  const lines = csv.trimEnd().split(/\r?\n/);
  if (lines.length < 31) throw new RulError("INSUFFICIENT_HISTORY", 422, "Provide 30 or more observations.");
  const headers = lines[0].split(",").map(s => s.trim());
  if (headers.length !== new Set(headers).size || REQUIRED_COLUMNS.some(name => !headers.includes(name)) ||
      headers.some(isGroundTruthLabel)) {
    throw new RulError("INVALID_SENSOR_CSV", 422, "Invalid sensor CSV header; include all 19 required columns and remove ground-truth labels.");
  }
  const unitIdx = headers.indexOf("unit"), cycleIdx = headers.indexOf("cycle");
  let unit = null, first = null, last = null;
  const seen = new Set();
  for (const line of lines.slice(1)) {
    const fields = line.split(",");
    if (fields.length !== headers.length) throw new RulError("INVALID_SENSOR_CSV", 422, "CSV row length does not match header.");
    const u = fields[unitIdx]?.trim(), c = fields[cycleIdx]?.trim();
    if (!validId(u) || !validId(c) || (unit !== null && u !== unit) || seen.has(c)) {
      throw new RulError("INVALID_SENSOR_CSV", 422, "Use one positive unit ID and unique positive cycle numbers.");
    }
    for (const col of REQUIRED_COLUMNS) {
      const cell = fields[headers.indexOf(col)]?.trim();
      if (cell === "" || cell === undefined || !Number.isFinite(Number(cell))) {
        throw new RulError("INVALID_SENSOR_CSV", 422, `Non-numeric value in ${col}.`);
      }
    }
    unit = u; seen.add(c);
    if (first === null || BigInt(c) < BigInt(first)) first = c;
    if (last === null || BigInt(c) > BigInt(last)) last = c;
  }
  return { datasetUnitId: unit, firstCycle: first, lastCycle: last, rowCount: lines.length - 1,
    sha256: crypto.createHash("sha256").update(csv).digest("hex") };
}
function urgencyFor(prediction) {
  return prediction <= 20 ? "PRIORITIZE" : prediction <= 40 ? "PREPARE" : prediction <= 80 ? "MONITOR" : "NORMAL";
}
function formatResult(row) {
  return { prediction_id: String(row.prediction_id), upload_id: String(row.upload_id),
    engine_id: String(row.engine_id), status: row.status,
    predicted_rul: Number(row.predicted_rul), unit: "engine_cycles",
    urgency: row.urgency, cycle_at_prediction: String(row.cycle_at_prediction),
    source_classification: sourceClassificationForResponse(row.source_classification),
    dataset_unit_id: row.dataset_unit_id,
    row_count: row.row_count, is_demo: row.is_demo,
    model: { name: row.model_name, version: row.version, dataset_subset: row.model_dataset_subset },
    request_key: row.request_key, completed_at: row.completed_at,
    disclaimer: DECISION_RULE.disclaimer };
}
async function checkOwnedEngine(engineId, companyId) {
  if (!validId(engineId)) throw new RulError("INVALID_ENGINE_ID", 400, "Engine ID must be a positive BIGINT string.");
  const engine = await repository.getOwnedEngine(engineId, companyId);
  if (!engine) throw new RulError("ENGINE_NOT_FOUND", 404, "Engine not found for your company.");
  return engine;
}
async function getHistory({ engineId, companyId, limit }) {
  await checkOwnedEngine(engineId, companyId);
  const cap = Number(limit ?? 10);
  if (!Number.isSafeInteger(cap) || cap < 1 || cap > 50) throw new RulError("INVALID_LIMIT", 400, "limit must be an integer from 1 to 50.");
  const rows = await repository.getHistory(engineId, companyId, cap);
  return rows.map(row => ({ ...row,
    prediction_id: String(row.prediction_id), upload_id: String(row.upload_id),
    predicted_rul: row.predicted_rul == null ? null : Number(row.predicted_rul),
    cycle_at_prediction: row.cycle_at_prediction == null ? null : String(row.cycle_at_prediction),
    source_classification: sourceClassificationForResponse(row.source_classification),
    model: { name: row.model_name, version: row.version, dataset_subset: row.model_dataset_subset },
    unit: "engine_cycles" }));
}
async function predict({ engineId, userId, companyId, csv, filename, requestKey, sourceClassification }) {
  // Buyer identity is always from requireBuyer / req.authUser, never request fields.
  await checkOwnedEngine(engineId, companyId);
  const key = validateRequestKey(requestKey), name = safeFilename(filename);
  const source = validateSourceClassification(sourceClassification);
  const meta = validateCsv(csv);
  const previous = await repository.getByRequestKey(key);
  if (previous) {
    if (String(previous.requested_by) !== String(userId) || String(previous.engine_id) !== engineId ||
        previous.file_sha256 !== meta.sha256 || previous.source_classification !== source) {
      throw new RulError("IDEMPOTENCY_CONFLICT", 409, "This Idempotency-Key was used for a different request.");
    }
    return { replay: true, data: formatResult(previous) };
  }
  const model = await repository.getModelVersion();
  if (!model) throw new RulError("MODEL_NOT_REGISTERED", 503,
    "The FD002 model version is not registered. Run the reviewed seed SQL during deployment.");
  const storeRoot = path.resolve(__dirname, "../../../storage/rul");
  const safeUserId = String(userId);
  if (!validId(safeUserId)) {
    throw new RulError("AUTH_REQUIRED", 401, "A verified Buyer session is required.");
  }
  const userFolder = path.join(storeRoot, safeUserId);
  await fs.mkdir(userFolder, { recursive: true, mode: 0o700 });
  await fs.chmod(userFolder, 0o700);
  const filenameKey = `${crypto.randomUUID()}.csv`;
  const objectKey = `${safeUserId}/${filenameKey}`;
  const filePath = path.join(userFolder, filenameKey);
  try {
    await fs.writeFile(filePath, csv, { encoding: "utf8", mode: 0o600, flag: "wx" });
    const inference = await predictCsv(csv);
    if (inference.dataset !== "NASA_CMAPSS_FD002") {
      throw new RulError("MODEL_MISMATCH", 502, "Expected a NASA C-MAPSS FD002 prediction.");
    }
    const prediction = Number(inference.predicted_rul_cycles);
    const urgency = urgencyFor(prediction);
    const saved = await repository.saveSuccess({
      engineId, userId: safeUserId, filename: name, objectKey, fileSha256: meta.sha256,
      sourceClassification: source,
      datasetUnitId: meta.datasetUnitId, firstCycle: meta.firstCycle,
      lastCycle: meta.lastCycle, rowCount: meta.rowCount,
      modelVersionId: model.model_version_id, requestKey: key,
      prediction, urgency, decisionRule: DECISION_RULE,
    });
    return { replay: false, data: {
      prediction_id: String(saved.prediction_id), upload_id: String(saved.upload_id),
      engine_id: engineId, status: "SUCCEEDED", predicted_rul: prediction,
      unit: "engine_cycles", urgency, cycle_at_prediction: meta.lastCycle,
      source_classification: source, dataset_unit_id: meta.datasetUnitId,
      row_count: meta.rowCount, is_demo: true,
      model: { name: repository.MODEL_NAME, version: repository.MODEL_VERSION,
        dataset_subset: model.dataset_subset },
      request_key: key, completed_at: saved.completed_at,
      disclaimer: DECISION_RULE.disclaimer,
      input_summary: inference.input_summary,
    }};
  } catch (error) {
    await fs.unlink(filePath).catch(cleanupError => {
      if (cleanupError.code !== "ENOENT") {
        console.error("Buyer RUL private input cleanup failed:", cleanupError.code || "UNKNOWN");
      }
    });
    if (error.code === "23505") {
      const existing = await repository.getByRequestKey(key);
      if (existing && String(existing.requested_by) === String(userId) &&
          String(existing.engine_id) === engineId && existing.file_sha256 === meta.sha256 &&
          existing.source_classification === source) {
        return { replay: true, data: formatResult(existing) };
      }
      throw new RulError("IDEMPOTENCY_CONFLICT", 409, "Idempotency-Key conflict.");
    }
    throw error;
  }
}
module.exports = { RulError, getHistory, predict };
