const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

export async function getDashboardSummary({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/v1/dashboard/summary`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load dashboard summary (${response.status})`);
  }
  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error("Unexpected Dashboard Summary API response");
  }
  return json.data;
}

export async function getDashboardEngineHealth({ limit = 5, signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/v1/dashboard/engine-health?limit=${limit}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error(`Failed to load engine health overview (${response.status})`);
  }
  const json = await response.json();
  if (!json.success || !Array.isArray(json.data)) {
    throw new Error("Unexpected Engine Health API response");
  }
  return json.data;
}

export async function getDashboardRecentOrders({ limit = 5, signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/v1/dashboard/recent-orders?limit=${limit}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error(`Failed to load recent orders (${response.status})`);
  }
  const json = await response.json();
  if (!json.success || !Array.isArray(json.data)) {
    throw new Error("Unexpected Recent Orders API response");
  }
  return json.data;
}

