"use strict";

// AeroRUL Admin authorization: identity and role come exclusively from the
// verified HttpOnly JWT session cookie resolved by require-auth.js.
const { requireAuth } = require("./require-auth");
const requireTrustedMutation = require("./require-trusted-mutation");

function requireAdmin(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.authUser?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ADMIN_REQUIRED",
          message: "An Administrator account is required.",
        },
      });
    }
    return requireTrustedMutation(req, res, next);
  });
}

module.exports = requireAdmin;

