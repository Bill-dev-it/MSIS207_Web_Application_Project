// Supplier APIs are protected. No supplier ID is supplied by the browser.
// The login implementation will establish the authenticated identity later.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
export const SUPPLIER_DEMO_MODE = import.meta.env.VITE_SUPPLIER_DEMO_MODE !== "false";

export async function supplierRequest(path, { method = "GET", body, signal } = {}) {
  const stateChanging = ["POST", "PATCH", "PUT", "DELETE"].includes(method.toUpperCase());
  const response = await fetch(`${BASE_URL}/v1/supplier${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(stateChanging ? { "X-AeroRUL-Request": "1" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Supplier request failed (${response.status})`);
  }
  return json;
}
