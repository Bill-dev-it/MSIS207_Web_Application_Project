const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { unauthorized, forbidden } = require("../utils/errors");
const { asyncHandler } = require("./error");

const COOKIE_NAME = "aerorul_session";

const jwtSecret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_SECRET must be set (>= 16 chars)");
  return s;
};

const parseDurationMs = (v = "8h") => {
  const m = /^(\d+)([smhd])$/.exec(v);
  if (!m) return 8 * 3600 * 1000;
  return Number(m[1]) * { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2]];
};

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
  maxAge,
});

/** Creates a revocable session row and sets the httpOnly cookie. */
async function startSession(res, user) {
  const ttl = parseDurationMs(process.env.JWT_EXPIRES_IN);
  const sessionId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO auth_sessions (session_id, user_id, expires_at) VALUES ($1,$2,$3)`,
    [sessionId, user.user_id, new Date(Date.now() + ttl)]
  );
  const token = jwt.sign({ sid: sessionId, uid: user.user_id }, jwtSecret(), {
    expiresIn: Math.floor(ttl / 1000),
  });
  res.cookie(COOKIE_NAME, token, cookieOptions(ttl));
}

async function endSession(req, res) {
  if (req.session?.sid) {
    await pool.query(`UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_id=$1`, [
      req.session.sid,
    ]);
  }
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(0), maxAge: undefined });
}

/**
 * Verifies the cookie, then re-checks session + user in the DB on every request so
 * logout, deactivation and role changes take effect immediately.
 * Identity (userId / companyId / role) ALWAYS comes from here – never from client input.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret());
  } catch {
    throw unauthorized("Session expired or invalid");
  }
  const { rows } = await pool.query(
    `SELECT u.user_id, u.company_id, u.full_name, u.email, u.role, c.company_name
       FROM auth_sessions s
       JOIN users u ON u.user_id = s.user_id
       JOIN companies c ON c.company_id = u.company_id
      WHERE s.session_id = $1 AND s.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP
        AND u.is_active`,
    [payload.sid]
  );
  if (!rows.length) throw unauthorized("Session expired or invalid");
  const u = rows[0];
  req.session = { sid: payload.sid };
  req.user = {
    userId: Number(u.user_id),
    companyId: Number(u.company_id),
    companyName: u.company_name,
    fullName: u.full_name,
    email: u.email,
    role: u.role,
  };
  next();
});

const authorizeRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };

module.exports = { authenticate, authorizeRole, startSession, endSession, COOKIE_NAME };
