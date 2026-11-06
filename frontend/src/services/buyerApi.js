// Shared Buyer API transport. Use this from Buyer feature services; do not
// create a second login context or store authentication tokens in JS storage.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export class BuyerApiError extends Error {
  constructor(message, status = 0, code = "NETWORK_ERROR") {
    super(message);
    this.name = "BuyerApiError";
    this.status = status;
    this.code = code;
  }
}

export async function buyerRequest(path, {
  method = "GET", body, signal, headers: extraHeaders = {}, contentType = "application/json",
} = {}) {
  if (typeof path !== "string" || !path.startsWith("/v1/")) {
    throw new Error("Buyer API path must begin with /v1/.");
  }
  const normalizedMethod = method.toUpperCase();
  const isWrite = !["GET", "HEAD"].includes(normalizedMethod);
  const hasBody = body !== undefined;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: normalizedMethod,
      credentials: "include",
      headers: {
        ...(hasBody ? { "Content-Type": contentType } : {}),
        ...(isWrite ? { "X-AeroRUL-Request": "1" } : {}),
        ...extraHeaders,
      },
      ...(hasBody ? {
        body: contentType.startsWith("application/json") ? JSON.stringify(body) : body,
      } : {}),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new BuyerApiError("Could not connect to AeroRUL.");
  }

  const json = await response.json().catch(() => null);
  if (!response.ok || json?.success !== true) {
    throw new BuyerApiError(
      json?.error?.message || json?.message || `Request failed (HTTP ${response.status}).`,
      response.status,
      json?.error?.code || "HTTP_ERROR"
    );
  }
  // Preserve full response envelope because some Buyer endpoints return
  // pagination/counts beside data; each feature service can select fields.
  return json;
}
