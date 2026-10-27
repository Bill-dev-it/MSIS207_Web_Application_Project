const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { asyncHandler } = require("../middleware/error");
const { authenticate, startSession, endSession } = require("../middleware/auth");
const { unauthorized, validation } = require("../utils/errors");
const { stringParam } = require("../utils/validate");
const { toUserDto } = require("../utils/mapper");

const router = express.Router();

// Pre-computed hash so unknown e-mails cost the same as wrong passwords (no user enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = stringParam(req.body?.email, "email", { required: true, max: 254 }).toLowerCase();
    const password = req.body?.password;
    if (typeof password !== "string" || !password || password.length > 200) {
      throw validation("password is required", { field: "password" });
    }
    const { rows } = await pool.query(
      `SELECT u.user_id, u.company_id, u.full_name, u.email, u.role, u.password_hash, u.is_active,
              c.company_name
         FROM users u JOIN companies c ON c.company_id = u.company_id
        WHERE lower(u.email) = $1`,
      [email]
    );
    const user = rows[0];
    const ok = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
    if (!user || !ok || !user.is_active) throw unauthorized("Invalid email or password");

    await startSession(res, user);
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1,'LOGIN','user',$2)`,
      [user.user_id, String(user.user_id)]
    );
    res.json({ user: toUserDto(user) });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    await endSession(req, res);
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1,'LOGOUT','user',$2)`,
      [req.user.userId, String(req.user.userId)]
    );
    res.status(204).end();
  })
);

module.exports = router;
