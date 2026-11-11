"use strict";

// RUL credentials must only be read on the Express backend.
function serviceConfig() {
  const token = process.env.RUL_SERVICE_TOKEN || "";
  const url = new URL(process.env.RUL_SERVICE_URL || "http://127.0.0.1:8000");
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);

  if (!/^[\x21-\x7e]{32,}$/.test(token) ||
      !["http:", "https:"].includes(url.protocol) ||
      (url.protocol === "http:" && !local) ||
      url.username || url.password || url.search || url.hash) {
    throw new Error("RUL health configuration is invalid");
  }

  return { url: new URL("/health", url), token };
}

async function getHealth() {
  const unavailable = { status: "unavailable", model_loaded: false };
  let settings;
  try {
    settings = serviceConfig();
  } catch {
    return unavailable;
  }

  try {
    const response = await fetch(settings.url, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(4000),
      headers: { "X-RUL-Service-Token": settings.token },
    });
    if (!response.ok || Number(response.headers.get("content-length") || "0") > 4096) {
      return unavailable;
    }

    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > 4096) return unavailable;

    const payload = JSON.parse(text);
    const healthy = payload?.success === true &&
      payload?.data?.status === "healthy" &&
      payload?.data?.model_loaded === true;

    return { status: healthy ? "healthy" : "unavailable", model_loaded: healthy };
  } catch {
    return unavailable;
  }
}

module.exports = { getHealth };

