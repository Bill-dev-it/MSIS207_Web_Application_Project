"use strict";

const router = require("express").Router();
const { rateLimit } = require("express-rate-limit");
const { register } = require("../../controllers/auth/register.controller");
const { verifyEmail, resendVerification } = require("../../controllers/auth/verify-email.controller");
const { login, me, logout } = require("../../controllers/auth/session.controller");
const { requireAuth } = require("../../middleware/require-auth");
const requireTrustedMutation = require("../../middleware/require-trusted-mutation");

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many registration attempts. Try later." }
  }
});

/**
 * @api {post} /api/v1/auth/register Register Buyer or Supplier company
 * @apiName RegisterAccount
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * @apiDescription Creates a new company/user (and PENDING supplier profile if needed), plus a SHA-256 digest of a fresh 24-hour verification token, in one transaction. Attempts to email the raw token after COMMIT. Missing SMTP configuration returns 503 without creating an account. If email delivery fails after COMMIT, the account still exists, stays unverified and can use resend-verification. Never accepts IDs or ADMIN role from client.
 * @apiSampleRequest off
 * @apiBody {String="BUYER","SUPPLIER"} account_type Public registration role.
 * @apiBody {String} full_name Full name (2–150 characters).
 * @apiBody {String} email Unique email address.
 * @apiBody {String} password Password (12–128 characters); never persisted in plaintext.
 * @apiBody {String} company_name New company's name (2–255 characters).
 * @apiBody {String="AIRLINE","MRO","MIXED","SUPPLIER"} [company_type] Required for BUYER (AIRLINE/MRO/MIXED), optional and must be SUPPLIER for suppliers.
 * @apiBody {String} country_code Two-letter country code.
 * @apiBody {String} [tax_id] Optional tax identifier (up to 100 chars).
 * @apiBody {String} [store_name] Required only for SUPPLIER.
 * @apiSuccess (201 Created) {Boolean} success true.
 * @apiSuccess (201 Created) {Object} data Newly created account summary; password hash not included.
 * @apiSuccess (201 Created) {String} data.role BUYER or SUPPLIER.
 * @apiSuccess (201 Created) {Boolean} data.email_verification_required Always true until verification.
 * @apiSuccess (201 Created) {Boolean} data.email_verification_sent True only when SMTP delivery was accepted without an error.
 * @apiError (400 Bad Request) INVALID_INPUT Invalid or unsupported registration fields.
 * @apiError (409 Conflict) ACCOUNT_CONFLICT Email or profile conflicts with existing data.
 * @apiError (429 Too Many Requests) RATE_LIMITED Too many registration attempts.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected failure.
 * @apiError (503 Service Unavailable) EMAIL_UNAVAILABLE SMTP is not configured.
 * @apiParamExample {json} Supplier request:
 *     { "account_type": "SUPPLIER", "full_name": "Demo Supplier", "email": "demo-supplier@example.test", "password": "example-long-password", "company_name": "Demo Supplier Ltd", "country_code": "VN", "store_name": "Demo Parts Shop" }
 * @apiSuccessExample {json} 201 Created:
 *     { "success": true, "data": { "user_id": "1", "company_id": "48", "supplier_id": "41", "full_name": "Demo Supplier", "email": "demo-supplier@example.test", "role": "SUPPLIER", "email_verification_required": true, "email_verification_sent": true } }
 */
router.post("/register", registerLimiter, register);

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many verification attempts. Try later." } }
});

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many email requests. Try later." } }
});

/**
 * @api {post} /api/v1/auth/verify-email Verify an email address
 * @apiName VerifyEmail
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * @apiDescription Consumes a 24-hour, single-use verification token. The link in the email opens the React /verify-email page; React POSTs the token. All outstanding email-verification links for that user are invalidated after success. This is not a JWT.
 * @apiSampleRequest off
 * @apiBody {String} token 64-character hexadecimal token from the verification link.
 * @apiSuccess (200 OK) {Boolean} success true.
 * @apiSuccess (200 OK) {Boolean} data.email_verified true.
 * @apiSuccessExample {json} Success:
 *     { "success": true, "data": { "email_verified": true } }
 * @apiError (400 Bad Request) INVALID_TOKEN Invalid, expired, used or unsupported token.
 * @apiError (429 Too Many Requests) RATE_LIMITED Request limit exceeded.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Database operation failed.
 */
router.post("/verify-email", verifyLimiter, verifyEmail);

/**
 * @api {post} /api/v1/auth/resend-verification Request a new verification email
 * @apiName ResendVerification
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * @apiDescription Sends a new link only for an existing active, unverified account. Uses IP and per-account throttling; always returns a generic success message for eligible/unknown/verified/throttled emails. SMTP may fail without confirming delivery. Do not use this response to infer account existence.
 * @apiSampleRequest off
 * @apiBody {String} email Account email address.
 * @apiSuccess (200 OK) {Boolean} success true.
 * @apiSuccess (200 OK) {String} data.message Generic response to prevent account enumeration.
 * @apiSuccessExample {json} Success:
 *     { "success": true, "data": { "message": "If the account is eligible, a verification email will be sent." } }
 * @apiError (400 Bad Request) INVALID_INPUT Invalid request body/email.
 * @apiError (429 Too Many Requests) RATE_LIMITED Request limit exceeded.
 * @apiError (503 Service Unavailable) EMAIL_UNAVAILABLE SMTP not configured.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected error.
 */
router.post("/resend-verification", resendLimiter, resendVerification);


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many login attempts. Try later." } }
});

/**
 * @api {post} /api/v1/auth/login Log in with email and password
 * @apiName Login
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * @apiDescription Checks Argon2id password hash and active, email-verified user; issues a 1-hour HS256 JWT in an HttpOnly SameSite=Lax cookie. No JWT is returned in JSON. Use a JSON request with X-AeroRUL-Request: 1 header; when Origin is provided, it must match PUBLIC_WEB_URL. This is the AeroRUL email-based equivalent of the lecturer's username/password POST example.
 * @apiSampleRequest off
 * @apiHeader {String} X-AeroRUL-Request Must be 1 on protected mutations.
 * @apiBody {String} email User email address.
 * @apiBody {String} password Account password.
 * @apiSuccess (200 OK) {Boolean} success true.
 * @apiSuccess (200 OK) {Object} data.user Limited public user fields (no password_hash/JWT).
 * @apiSuccessExample {json} Success:
 *     { "success": true, "data": { "user": { "user_id": "1", "company_id": "48", "full_name": "Demo Buyer", "email": "buyer@example.test", "role": "BUYER" } } }
 * @apiError (400 Bad Request) INVALID_INPUT Invalid body.
 * @apiError (401 Unauthorized) INVALID_CREDENTIALS Unknown email or wrong password.
 * @apiError (403 Forbidden) EMAIL_NOT_VERIFIED Email not yet verified, or ACCOUNT_DISABLED.
 * @apiError (403 Forbidden) UNTRUSTED_REQUEST Missing request header, or UNTRUSTED_ORIGIN.
 * @apiError (429 Too Many Requests) RATE_LIMITED Too many attempts.
 * @apiError (503 Service Unavailable) AUTH_UNAVAILABLE Missing AUTH_JWT_SECRET.
 */
router.post("/login", loginLimiter, requireTrustedMutation, login);

/**
 * @api {get} /api/v1/auth/me Get current signed-in user
 * @apiName CurrentUser
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * @apiDescription Reads the HttpOnly auth cookie; verifies JWT signature/expiry and rechecks user active/email-verified/auth_version in PostgreSQL. Requires the browser to include cookies. This endpoint does not change data.
 * @apiSuccess (200 OK) {Boolean} success true.
 * @apiSuccess (200 OK) {Object} data.user user_id, company_id, full_name, email, role only.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Invalid, missing or expired session.
 * @apiError (503 Service Unavailable) AUTH_UNAVAILABLE Authentication is not configured.
 */
router.get("/me", requireAuth, me);

/**
 * @api {post} /api/v1/auth/logout Sign out of AeroRUL
 * @apiName Logout
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * @apiDescription Requires a valid auth cookie and X-AeroRUL-Request: 1. Increments users.auth_version to revoke previously issued JWTs, then clears the cookie. Logging out on one device invalidates existing JWT sessions for that account.
 * @apiSampleRequest off
 * @apiHeader {String} X-AeroRUL-Request Must be 1.
 * @apiSuccess (200 OK) {Boolean} success true.
 * @apiSuccess (200 OK) {Boolean} data.logged_out true.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Invalid or missing session.
 * @apiError (403 Forbidden) UNTRUSTED_REQUEST Missing header, or UNTRUSTED_ORIGIN.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unable to revoke session.
 */
router.post("/logout", requireTrustedMutation, requireAuth, logout);

module.exports = router;
