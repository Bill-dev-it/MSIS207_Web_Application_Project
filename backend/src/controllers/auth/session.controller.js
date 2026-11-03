"use strict";

const { authenticate, revokeSessions, COOKIE_NAME, SESSION_MS, cookieOptions } = require("../../services/auth/session.service");

function loginInput(body) {
  return !!body && typeof body === "object" && !Array.isArray(body) &&
    Object.keys(body).length === 2 &&
    typeof body.email === "string" && body.email.length <= 254 &&
    /^[^\s@,<>()]+@[^\s@,<>()]+\.[^\s@,<>()]+$/.test(body.email.trim()) &&
    typeof body.password === "string" && body.password.length > 0 &&
    body.password.length <= 128;
}

async function login(req, res) {
  if (!loginInput(req.body)) return res.status(400).json({ success: false, error: {
    code: "INVALID_INPUT", message: "A valid email and password are required."
  } });
  try {
    const result = await authenticate(req.body.email.trim().toLowerCase(), req.body.password);
    if (result.status === "INVALID_CREDENTIALS") {
      return res.status(401).json({ success: false, error: {
        code: "INVALID_CREDENTIALS", message: "Invalid email or password."
      } });
    }
    if (result.status === "ACCOUNT_DISABLED" || result.status === "EMAIL_NOT_VERIFIED") {
      return res.status(403).json({ success: false, error: {
        code: result.status, message: result.status === "EMAIL_NOT_VERIFIED"
          ? "Verify your email before logging in." : "This account is disabled."
      } });
    }
    res.cookie(COOKIE_NAME, result.token, { ...cookieOptions(), maxAge: SESSION_MS });
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ success: true, data: { user: result.user } });
  } catch (error) {
    console.error("Login failed:", error.code || "UNKNOWN");
    const unavailable = error.code === "AUTH_NOT_CONFIGURED";
    return res.status(unavailable ? 503 : 500).json({ success: false, error: {
      code: unavailable ? "AUTH_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
      message: "Login is temporarily unavailable."
    } });
  }
}

async function me(req, res) {
  res.set("Cache-Control", "no-store");
  return res.status(200).json({ success: true, data: { user: req.authUser } });
}

async function logout(req, res) {
  try {
    await revokeSessions(req.authUser.user_id);
    res.clearCookie(COOKIE_NAME, cookieOptions());
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ success: true, data: { logged_out: true } });
  } catch (error) {
    console.error("Logout failed:", error.code || "UNKNOWN");
    return res.status(500).json({ success: false, error: {
      code: "INTERNAL_SERVER_ERROR", message: "Logout could not be completed."
    } });
  }
}

module.exports = { login, me, logout, loginInput };
