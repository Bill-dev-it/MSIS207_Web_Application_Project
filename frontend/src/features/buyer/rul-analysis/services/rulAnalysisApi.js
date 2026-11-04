const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

export async function getRulEngines({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/v1/rul/engines`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load engines list (${response.status})`);
  }
  const json = await response.json();
  if (!json.success || !Array.isArray(json.data)) {
    throw new Error("Unexpected RUL engines response");
  }
  return json.data;
}

export async function uploadSensorCsv({ engineId, fileName, csvContent, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/v1/rul/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ engineId, fileName, csvContent }),
    signal,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || `Upload failed with status ${response.status}`);
  }
  return json.data;
}

export async function runRulPrediction({ engineId, uploadId, csvContent, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/v1/rul/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ engineId, uploadId, csvContent }),
    signal,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || `Prediction failed with status ${response.status}`);
  }
  return json.data;
}

export async function getEnginePredictionHistory(engineId, { signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/v1/rul/engines/${encodeURIComponent(engineId)}/history`,
    { signal }
  );

  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`Failed to load history (${response.status})`);
  }

  const json = await response.json();
  return json.data || [];
}

