"use strict";

// CSRF mitigation for cookie-authenticated JSON APIs. An HTML form cannot
// send this custom header; browsers will preflight cross-origin JavaScript.
// Never enable wildcard credentialed CORS alongside this approach.
function requireTrustedMutation(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  if (req.get("x-aerorul-request") !== "1") {
    return res.status(403).json({ success: false, error: {
      code: "UNTRUSTED_REQUEST", message: "Required request header is missing."
    } });
  }
  const origin = req.get("origin");
  if (origin) {
    let allowed;
    try {
      allowed = new URL(process.env.PUBLIC_WEB_URL || "").origin;
    } catch {
      allowed = null;
    }
    if (!allowed || origin !== allowed) {
      return res.status(403).json({ success: false, error: {
        code: "UNTRUSTED_ORIGIN", message: "Request origin is not permitted."
      } });
    }
  }
  if (req.get("sec-fetch-site") === "cross-site") {
    return res.status(403).json({ success: false, error: {
      code: "UNTRUSTED_ORIGIN", message: "Cross-site requests are not permitted."
    } });
  }
  return next();
}

module.exports = requireTrustedMutation;
