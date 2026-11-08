// Admin-only feature transport. Reuses established cookie + trusted-mutation contracts.
// No second auth context, token storage, or divergent API response envelope.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export class AdminApiError extends Error {
  constructor(message, status = 0, code = "NETWORK_ERROR") {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  if (typeof path !== "string" || !path.startsWith("/v1/admin/")) {
    throw new Error("Admin API paths must start with /v1/admin/.");
  }

  const normalizedMethod = method.toUpperCase();
  const isMutating = !["GET", "HEAD"].includes(normalizedMethod);
  const hasBody = body !== undefined;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: normalizedMethod,
      credentials: "include",
      signal,
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(isMutating ? { "X-AeroRUL-Request": "1" } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }
    throw new AdminApiError("Unable to connect to AeroRUL.");
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || payload?.success !== true) {
    throw new AdminApiError(
      payload?.error?.message || `Request failed (HTTP ${response.status}).`,
      response.status,
      payload?.error?.code || "HTTP_ERROR"
    );
  }

  return payload;
}

function buildQueryString(values = {}) {
  const entries = Object.entries(values).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  return new URLSearchParams(entries).toString();
}

export async function getAdminDashboard({ signal } = {}) {
  return await request("/v1/admin/dashboard/summary", { signal });
}

export async function listAdminSuppliers(query = {}, options = {}) {
  return await request(`/v1/admin/suppliers?${buildQueryString(query)}`, options);
}

export async function approveAdminSupplier(supplierId) {
  return await request(
    `/v1/admin/suppliers/${encodeURIComponent(supplierId)}/approve`,
    { method: "POST" }
  );
}

export async function listAdminPayments(query = {}, options = {}) {
  return await request(`/v1/admin/payments?${buildQueryString(query)}`, options);
}

export async function confirmAdminPayment(orderId) {
  return await request(
    `/v1/admin/payments/${encodeURIComponent(orderId)}/confirm`,
    { method: "POST" }
  );
}

export async function cancelAdminPayment(orderId) {
  return await request(
    `/v1/admin/payments/${encodeURIComponent(orderId)}/cancel`,
    { method: "POST" }
  );
}

export async function getAdminRulHealth(options = {}) {
  return await request("/v1/admin/rul/health", options);
}
