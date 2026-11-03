"use strict";

const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");

const COOKIE_NAME = "aerorul_session";
const SESSION_MS = 60 * 60 * 1000;
const JWT_ISSUER = "aerorul";
const JWT_AUDIENCE = "aerorul-web";
const MAX_ID = 9223372036854775807n;

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

function publicUser(user) {
  return {
    user_id: String(user.user_id),
    company_id: String(user.company_id),
    full_name: user.full_name,
    email: user.email,
    role: user.role
  };
}

function validId(id) {
  return typeof id === "string" && /^[1-9]\d*$/.test(id) && BigInt(id) <= MAX_ID;
}

function createSessionService({ db, passwordLib, tokenLib }) {
  async function authenticate(email, password) {
    const found = await db.query(
      `SELECT user_id, company_id, full_name, email, password_hash, role,
              is_active, email_verified_at, auth_version
       FROM public.users WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );
    const user = found.rows[0];
    if (!user) return { status: "INVALID_CREDENTIALS" };
    const match = await passwordLib.verify(user.password_hash, password);
    if (!match) return { status: "INVALID_CREDENTIALS" };
    if (!user.is_active) return { status: "ACCOUNT_DISABLED" };
    if (!user.email_verified_at) return { status: "EMAIL_NOT_VERIFIED" };
    const token = tokenLib.sign(
      { av: user.auth_version },
      jwtSecret(),
      { algorithm: "HS256", issuer: JWT_ISSUER, audience: JWT_AUDIENCE,
        subject: String(user.user_id), expiresIn: "1h" }
    );
    return { status: "OK", token, user: publicUser(user) };
  }

  async function getAuthenticatedUser(token) {
    if (typeof token !== "string" || token.length > 4096 || !token) return null;
    let decoded;
    try {
      decoded = tokenLib.verify(token, jwtSecret(), {
        algorithms: ["HS256"], issuer: JWT_ISSUER, audience: JWT_AUDIENCE
      });
    } catch (error) {
      if (error.code === "AUTH_NOT_CONFIGURED") throw error;
      return null;
    }
    if (!decoded || !validId(decoded.sub) || !Number.isInteger(decoded.av) || decoded.av < 0) return null;
    const found = await db.query(
      `SELECT user_id, company_id, full_name, email, role, is_active,
              email_verified_at, auth_version
       FROM public.users WHERE user_id = $1`,
      [decoded.sub]
    );
    const user = found.rows[0];
    if (!user || !user.is_active || !user.email_verified_at ||
        user.auth_version !== decoded.av) return null;
    return publicUser(user);
  }

  async function revokeSessions(userId) {
    // Invalidate this JWT and all earlier JWTs for the account.
    await db.query(
      `UPDATE public.users SET auth_version = auth_version + 1
       WHERE user_id = $1`,
      [userId]
    );
  }

  return { authenticate, getAuthenticatedUser, revokeSessions };
}

const sessionService = createSessionService({ db: pool, passwordLib: argon2, tokenLib: jwt });
module.exports = { ...sessionService, createSessionService, COOKIE_NAME, SESSION_MS, cookieOptions, publicUser };
