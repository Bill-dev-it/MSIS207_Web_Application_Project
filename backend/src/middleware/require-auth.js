"use strict";

const { getAuthenticatedUser, COOKIE_NAME } = require("../services/auth/session.service");

async function resolveAuthenticatedUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  return getAuthenticatedUser(token);
}

async function requireAuth(req, res, next) {
  try {
    const user = await resolveAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: {
        code: "AUTH_REQUIRED", message: "Login is required or the session has expired."
      } });
    }
    req.authUser = user;
    return next();
  } catch (error) {
    console.error("Authentication lookup failed:", error.code || "UNKNOWN");
    const unavailable = error.code === "AUTH_NOT_CONFIGURED";
    return res.status(unavailable ? 503 : 500).json({ success: false, error: {
      code: unavailable ? "AUTH_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
      message: "Authentication is temporarily unavailable."
    } });
  }
}

module.exports = { resolveAuthenticatedUser, requireAuth };
