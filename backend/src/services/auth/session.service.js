"use strict";

const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");

const COOKIE_NAME = "aerorul_session";
const SESSION_MS = 60 * 60 * 1000;

function jwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    const error = new Error("JWT configuration missing or too short");
    error.code = "AUTH_NOT_CONFIGURED";
    throw error;
  }
  return secret;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  };
}

// Only send non-sensitive account details to React.
function publicUser(user) {
  return {
    user_id: String(user.user_id),
    company_id: String(user.company_id),
    full_name: user.full_name,
    email: user.email,
    role: user.role
  };
}

// 1. Check email/password, then issue a 1-hour JWT containing user ID only.
async function authenticate(email, password) {
  const { rows } = await pool.query(
    `SELECT user_id, company_id, full_name, email, password_hash,
            role, is_active, email_verified_at
     FROM public.users WHERE LOWER(email) = $1 LIMIT 1`,
    [email]
  );
  const user = rows[0];
  if (!user || !(await argon2.verify(user.password_hash, password))) {
    return { status: "INVALID_CREDENTIALS" };
  }
  if (!user.is_active) return { status: "ACCOUNT_DISABLED" };
  if (!user.email_verified_at) return { status: "EMAIL_NOT_VERIFIED" };

  const token = jwt.sign(
    { sub: String(user.user_id) },
    jwtSecret(),
    { algorithm: "HS256", expiresIn: "1h" }
  );
  return { status: "OK", token, user: publicUser(user) };
}

// 2. Verify the JWT, then read current user/role/company from PostgreSQL.
async function getAuthenticatedUser(token) {
  if (typeof token !== "string" || !token || token.length > 4096) return null;

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret(), { algorithms: ["HS256"] });
  } catch (error) {
    if (error.code === "AUTH_NOT_CONFIGURED") throw error;
    return null;
  }
  if (typeof payload?.sub !== "string" || !/^[1-9]\d*$/.test(payload.sub)) return null;

  const { rows } = await pool.query(
    `SELECT user_id, company_id, full_name, email, role,
            is_active, email_verified_at
     FROM public.users WHERE user_id = $1`,
    [payload.sub]
  );
  const user = rows[0];
  if (!user || !user.is_active || !user.email_verified_at) return null;
  return publicUser(user);
}

module.exports = {
  authenticate, getAuthenticatedUser,
  COOKIE_NAME, SESSION_MS, cookieOptions, publicUser
};
