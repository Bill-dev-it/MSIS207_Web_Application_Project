/**
 * Admin API Service
 * Interacts directly with Express PostgreSQL backend via apiClient.
 * Zero hardcoded mock arrays.
 */
import { api } from "./apiClient";

export async function fetchAdminDashboard() {
  return await api.get("/admin/dashboard");
}

export async function fetchModerationQueue({ status = "DRAFT", page = 1, pageSize = 20 } = {}) {
  const params = { status, page, pageSize };
  const res = await api.get("/admin/moderation", { params });
  return {
    items: res.items || [],
    pagination: res.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  };
}

export async function submitModerationDecision(listingId, decision, note = "") {
  return await api.patch(`/admin/moderation/${listingId}`, { decision, note });
}

export async function fetchRULSystemStatus() {
  return await api.get("/admin/rul-status");
}

export async function checkRULSystemHealth() {
  return await api.post("/admin/rul-status/check", {});
}

export async function fetchReplacementRecommendations(engineId) {
  const res = await api.get("/admin/recommendations", { params: engineId ? { engineId } : {} });
  return {
    engineId,
    items: res.items || [],
  };
}

export async function fetchAdminUsers({ page = 1, pageSize = 50 } = {}) {
  const res = await api.get("/admin/users", { params: { page, pageSize } });
  return res.items || [];
}

export async function fetchAdminCompanies({ page = 1, pageSize = 50 } = {}) {
  const res = await api.get("/admin/companies", { params: { page, pageSize } });
  return res.items || [];
}

export async function fetchAdminSuppliers({ page = 1, pageSize = 50 } = {}) {
  const res = await api.get("/admin/suppliers", { params: { page, pageSize } });
  return res.items || [];
}
