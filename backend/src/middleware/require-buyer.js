"use strict";

// AeroRUL Buyer authorization: the only trusted identity source is the
// authenticated HttpOnly JWT cookie, resolved by require-auth.js.
const { requireAuth } = require("./require-auth");
const requireTrustedMutation = require("./require-trusted-mutation");

function requireBuyer(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.authUser?.role !== "BUYER") {
      return res.status(403).json({
        success: false,
        error: { code: "BUYER_REQUIRED", message: "A Buyer account is required." },
      });
    }
    // Like Supplier, authenticated state-changing requests must pass CSRF rules.
    return requireTrustedMutation(req, res, next);
  });
}

module.exports = requireBuyer;
