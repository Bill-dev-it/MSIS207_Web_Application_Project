/**
 * Single HTTP client used by every service (buyerService, adminService, authService…).
 *
 * - Base URL comes from VITE_API_URL (default "/api" → Vite dev proxy → Express).
 * - Auth is a httpOnly cookie, so requests always send `credentials: "include"`.
 *   No token is ever stored in JS-accessible storage.
 * - Backend errors have the shape `{ error, code }`; they are surfaced as ApiError.
 */

export const API_URL = (import.meta.env?.VITE_API_URL || "/api").replace(/\/$/, "");
export const DEFAULT_TIMEOUT_MS = Number(import.meta.env?.VITE_API_TIMEOUT_MS) || 15000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = "UNKNOWN", details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Listeners notified on 401 so AuthContext can drop a stale session. */
const unauthorizedListeners = new Set();
export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

function buildUrl(path, params) {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!params) return url;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function request(path, { method = "GET", params, body, signal, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), timeout);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err; // caller cancelled (e.g. React Query / unmount)
    if (err?.name === "TimeoutError" || controller.signal.reason?.name === "TimeoutError") {
      throw new ApiError("The server took too long to respond.", { code: "TIMEOUT" });
    }
    throw new ApiError("Cannot reach the server. Check your connection.", { code: "NETWORK_ERROR" });
  } finally {
    clearTimeout(timer);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 401) unauthorizedListeners.forEach((fn) => fn());
    throw new ApiError(payload?.error || `Request failed (${response.status})`, {
      status: response.status,
      code: payload?.code || `HTTP_${response.status}`,
      details: payload?.details,
    });
  }
  return payload;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body: body ?? {} }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body: body ?? {} }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};
