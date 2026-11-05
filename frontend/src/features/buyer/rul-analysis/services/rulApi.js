import { buyerRequest } from "../../../../services/buyerApi";

const MAX_BYTES = 1024 * 1024;

export async function getRulHistory(engineId, { limit = 10, signal } = {}) {
  const query = new URLSearchParams({ limit: String(limit) });
  const response = await buyerRequest(
    `/v1/rul/engines/${encodeURIComponent(engineId)}/history?${query}`,
    { signal }
  );
  return response.data;
}

export async function predictRul({ engineId, file, requestKey, sourceClassification, signal }) {
  if (!file || !/\.csv$/i.test(file.name)) throw new Error("Select a .csv file.");
  if (!file.size || file.size > MAX_BYTES) throw new Error("CSV must be between 1 byte and 1 MiB.");
  if (!requestKey) throw new Error("Prediction request key is required.");
  if (!["NASA_CMAPSS_FD002", "CUSTOM_SYNTHETIC", "EXTERNAL_MAPPED"].includes(sourceClassification)) {
    throw new Error("Select a valid CSV source classification.");
  }
  const csv = await file.text();
  const safeName = file.name.replace(/[^\w.-]/g, "_").slice(-200);
  const response = await buyerRequest(
    `/v1/rul/engines/${encodeURIComponent(engineId)}/predict`,
    {
      method: "POST",
      signal,
      body: csv,
      contentType: "text/csv; charset=utf-8",
      headers: {
        "X-RUL-Filename": safeName,
        "X-RUL-Source": sourceClassification,
        "Idempotency-Key": requestKey,
      },
    }
  );
  return response.data;
}

export async function generateReplacementRecommendations(predictionId, { signal } = {}) {
  const response = await buyerRequest(
    `/v1/rul/predictions/${encodeURIComponent(predictionId)}/recommendations`,
    { method: "POST", signal }
  );
  return response.data;
}

export async function getReplacementRecommendations(predictionId, { signal } = {}) {
  const response = await buyerRequest(
    `/v1/rul/predictions/${encodeURIComponent(predictionId)}/recommendations`,
    { signal }
  );
  return response.data;
}
