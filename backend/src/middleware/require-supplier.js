"use strict";

const pool = require("../config/db");
const { resolveAuthenticatedUser } = require("./require-auth");
const requireTrustedMutation = require("./require-trusted-mutation");

async function requireSupplier(req, res, next) {
  try {
    const user = await resolveAuthenticatedUser(req);
    if (!user) return res.status(401).json({ success: false, error: {
      code: "AUTH_REQUIRED", message: "Supplier login is required."
    } });
    if (user.role !== "SUPPLIER") {
      return res.status(403).json({ success: false, error: {
        code: "FORBIDDEN", message: "Supplier role is required."
      } });
    }
    // IDs must be taken from verified user.company_id, NEVER req.body/query/headers.
    const found = await pool.query(
      `SELECT supplier_id FROM public.suppliers
       WHERE company_id = $1 AND status = 'APPROVED'`,
      [user.company_id]
    );
    if (!found.rows.length) return res.status(403).json({ success: false, error: {
      code: "SUPPLIER_NOT_APPROVED", message: "Supplier account is not approved."
    } });
    req.authUser = user;
    req.supplierId = String(found.rows[0].supplier_id);
    return requireTrustedMutation(req, res, next);
  } catch (error) {
    console.error("Supplier authentication failed:", error.code || "UNKNOWN");
    const unavailable = error.code === "AUTH_NOT_CONFIGURED";
    return res.status(unavailable ? 503 : 500).json({ success: false, error: {
      code: unavailable ? "AUTH_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
      message: "Unable to verify supplier access."
    } });
  }
}

module.exports = requireSupplier;
