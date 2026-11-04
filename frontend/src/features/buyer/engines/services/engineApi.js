const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

export async function getEngines({
  search = "",
  urgency = "ALL",
  page = 1,
  limit = 10,
  signal,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search.trim()) params.set("search", search.trim());
  if (urgency && urgency !== "ALL") params.set("urgency", urgency);

  const response = await fetch(`${API_BASE_URL}/v1/engines?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load engines list (${response.status})`);
  }

  const json = await response.json();
  if (!json.success || !Array.isArray(json.data)) {
    throw new Error("Unexpected Engines API response");
  }

  return json;
}

export async function getEngineById(engineId, { signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/v1/engines/${encodeURIComponent(engineId)}`,
    { signal }
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load engine details (${response.status})`);
  }

  const json = await response.json();
  return json.data;
}

export async function getEngineSensorUploads(engineId, { limit = 10, signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/v1/engines/${encodeURIComponent(engineId)}/sensor-uploads?limit=${limit}`,
    { signal }
  );

  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`Failed to load sensor upload history (${response.status})`);
  }

  const json = await response.json();
  return json.data || [];
}

