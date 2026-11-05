"use strict";

const MAX_CSV_BYTES = 1024 * 1024;
const MAX_RESPONSE_BYTES = 64 * 1024;
const TIMEOUT_MS = 90_000;
const MODEL_ID = "condition_aware_itransformer_v3";

class RulInferenceError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = "RulInferenceError";
    this.code = code;
    this.status = status;
  }
}

function serviceConfiguration() {
  const serviceUrl = process.env.RUL_SERVICE_URL || "http://127.0.0.1:8000";
  const token = process.env.RUL_SERVICE_TOKEN || "";
  if (!/^[\x21-\x7e]{32,}$/.test(token)) {
    throw new RulInferenceError("RUL_UNAVAILABLE", 503, "Internal RUL service authentication is not configured.");
  }
  let base;
  try {
    base = new URL(serviceUrl);
  } catch {
    throw new RulInferenceError("RUL_UNAVAILABLE", 503, "Internal RUL service address is invalid.");
  }
  const localHost = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(base.hostname);
  if (!["http:", "https:"].includes(base.protocol) ||
      (base.protocol === "http:" && !localHost) ||
      base.username || base.password || base.search || base.hash) {
    throw new RulInferenceError("RUL_UNAVAILABLE", 503, "Internal RUL service must use localhost HTTP or HTTPS.");
  }
  return {
    endpoint: new URL("/v1/predict", base).toString(),
    token,
  };
}

function parseResponsePayload(text) {
  if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) {
    throw new RulInferenceError("RUL_FAILURE", 502, "Internal RUL service returned too much data.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new RulInferenceError("RUL_FAILURE", 502, "Internal RUL service returned invalid JSON.");
  }
}

async function readResponseText(response) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new RulInferenceError("RUL_FAILURE", 502, "Internal RUL service returned too much data.");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new RulInferenceError("RUL_FAILURE", 502, "Internal RUL service returned an empty response.");
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new RulInferenceError("RUL_FAILURE", 502, "Internal RUL service returned too much data.");
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks.map(chunk => Buffer.from(chunk))));
}

async function predictCsv(csv) {
  if (typeof csv !== "string" || Buffer.byteLength(csv, "utf8") < 1) {
    throw new RulInferenceError("INVALID_SENSOR_CSV", 422, "CSV cannot be empty.");
  }
  if (Buffer.byteLength(csv, "utf8") > MAX_CSV_BYTES) {
    throw new RulInferenceError("INVALID_FILE_SIZE", 413, "CSV must be 1 MiB or smaller.");
  }
  const { endpoint, token } = serviceConfiguration();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  let payload;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "X-RUL-Service-Token": token,
      },
      body: csv,
      redirect: "error",
      signal: controller.signal,
    });
    payload = parseResponsePayload(await readResponseText(response));
  } catch (error) {
    if (error instanceof RulInferenceError) throw error;
    if (error.name === "AbortError") {
      throw new RulInferenceError("RUL_TIMEOUT", 504, "RUL inference exceeded the service timeout.");
    }
    throw new RulInferenceError("RUL_UNAVAILABLE", 503, "Internal RUL inference service is unavailable.");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const error = payload?.error;
    if (response.status === 422) {
      throw new RulInferenceError(error?.code || "INVALID_SENSOR_CSV", 422,
        error?.message || "CSV failed model preprocessing validation.");
    }
    if (response.status === 413) {
      throw new RulInferenceError("INVALID_FILE_SIZE", 413, error?.message || "CSV must be 1 MiB or smaller.");
    }
    if (response.status === 415) {
      throw new RulInferenceError("INVALID_CONTENT_TYPE", 415, error?.message || "Upload CSV as UTF-8 text/csv.");
    }
    if (response.status === 429) {
      throw new RulInferenceError("RUL_BUSY", 429, error?.message || "RUL inference is busy; retry shortly.");
    }
    if (response.status === 401 || response.status === 403 || response.status >= 500) {
      throw new RulInferenceError("RUL_UNAVAILABLE", 503, "Internal RUL inference service is not ready.");
    }
    throw new RulInferenceError("RUL_FAILURE", 502, "Internal RUL inference request failed.");
  }

  const prediction = Number(payload?.predicted_rul_cycles);
  if (payload?.success !== true || payload.model_id !== MODEL_ID ||
      payload.dataset !== "NASA_CMAPSS_FD002" || !Number.isFinite(prediction) ||
      prediction < 0 || prediction > 125 ||
      !payload.input_summary || typeof payload.input_summary !== "object") {
    throw new RulInferenceError("RUL_FAILURE", 502, "Internal RUL service returned an unexpected model result.");
  }
  return {
    model_id: payload.model_id,
    dataset: payload.dataset,
    predicted_rul_cycles: prediction,
    unit: "engine_cycles",
    input_summary: payload.input_summary,
    evaluation: payload.evaluation || null,
  };
}

module.exports = { predictCsv, RulInferenceError };
