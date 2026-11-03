const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export class AuthApiError extends Error {
  constructor(message, { status = 0, code = "NETWORK_ERROR" } = {}) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  const write = !["GET", "HEAD"].includes(method.toUpperCase());
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(write ? { "X-AeroRUL-Request": "1" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new AuthApiError("Unable to connect to AeroRUL. Please try again.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true) {
    throw new AuthApiError(
      payload?.error?.message || `Request failed (HTTP ${response.status}).`,
      { status: response.status, code: payload?.error?.code || "HTTP_ERROR" }
    );
  }
  return payload.data;
}

export function registerAccount(details, options) {
  return request("/v1/auth/register", { method: "POST", body: details, ...options });
}
export function loginAccount(credentials, options) {
  return request("/v1/auth/login", { method: "POST", body: credentials, ...options });
}
export function getCurrentUser(options) {
  return request("/v1/auth/me", options);
}
export function logoutAccount(options) {
  return request("/v1/auth/logout", { method: "POST", ...options });
}
export function verifyEmailToken(token, options) {
  return request("/v1/auth/verify-email", { method: "POST", body: { token }, ...options });
}
export function resendVerificationEmail(email, options) {
  return request("/v1/auth/resend-verification", { method: "POST", body: { email }, ...options });
}
// The backend checks APPROVED supplier ownership using the verified session.
// This is a read-only authorization probe, NOT a Supplier demo-data request.
export function checkSupplierApproval(options) {
  return request("/v1/supplier/overview", options);
}
