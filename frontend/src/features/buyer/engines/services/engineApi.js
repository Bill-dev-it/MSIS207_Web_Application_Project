import { buyerRequest } from "../../../../services/buyerApi";

export async function getEngines({
  search = "", urgency = "ALL", page = 1, limit = 10, signal,
} = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set("search", search.trim());
  if (urgency && urgency !== "ALL") params.set("urgency", urgency);
  const response = await buyerRequest(`/v1/engines?${params}`, { signal });
  return { data: response.data, ...response.meta };
}

export async function getEngineById(engineId, { signal } = {}) {
  const response = await buyerRequest(`/v1/engines/${encodeURIComponent(engineId)}`, { signal });
  return response.data;
}

export async function getEngineSensorUploads(engineId, { limit = 10, signal } = {}) {
  const response = await buyerRequest(
    `/v1/engines/${encodeURIComponent(engineId)}/sensor-uploads?limit=${encodeURIComponent(limit)}`,
    { signal }
  );
  return response.data;
}
