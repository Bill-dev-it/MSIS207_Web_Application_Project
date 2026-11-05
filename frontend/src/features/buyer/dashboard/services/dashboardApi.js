import { buyerRequest } from "../../../../services/buyerApi";

export async function getDashboardSummary({ signal } = {}) {
  return (await buyerRequest("/v1/dashboard/summary", { signal })).data;
}

export async function getDashboardEngineHealth({ limit = 5, signal } = {}) {
  return (await buyerRequest(`/v1/dashboard/engine-health?limit=${encodeURIComponent(limit)}`, { signal })).data;
}

export async function getDashboardRecentOrders({ limit = 5, signal } = {}) {
  return (await buyerRequest(`/v1/dashboard/recent-orders?limit=${encodeURIComponent(limit)}`, { signal })).data;
}
