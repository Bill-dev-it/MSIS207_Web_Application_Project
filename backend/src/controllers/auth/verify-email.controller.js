"use strict";

const { verifyEmailToken, createResendToken } = require("../../services/auth/verification-token.service");
const { mailIsConfigured, sendVerificationEmail } = require("../../services/auth/verification-mail.service");

async function verifyEmail(req, res) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 1 || typeof body.token !== "string" ||
      !/^[0-9a-f]{64}$/.test(body.token)) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Verification link is invalid or expired." }
    });
  }
  try {
    const verified = await verifyEmailToken(body.token);
    if (!verified) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Verification link is invalid or expired." }
      });
    }
    return res.status(200).json({
      success: true, data: { email_verified: true }
    });
  } catch {
    console.error("Email verification failed.");
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Email verification could not be completed." }
    });
  }
}

async function resendVerification(req, res) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      typeof body.email !== "string" || body.email.length > 254 ||
      !/^[^\s@,<>()]+@[^\s@,<>()]+\.[^\s@,<>()]+$/.test(body.email.trim())) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_INPUT", message: "A valid email is required." }
    });
  }
  if (!mailIsConfigured()) {
    return res.status(503).json({
      success: false,
      error: { code: "EMAIL_UNAVAILABLE", message: "Email delivery is not configured." }
    });
  }
  try {
    const issue = await createResendToken(body.email.trim().toLowerCase());
    if (issue) {
      try {
        await sendVerificationEmail(issue.email, issue.token);
      } catch {
        console.error("Resend verification email delivery failed.");
      }
    }
    // Do not expose whether the account exists, is verified or is throttled.
    return res.status(200).json({
      success: true,
      data: { message: "If the account is eligible, a verification email will be sent." }
    });
  } catch {
    console.error("Resend verification processing failed.");
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Request could not be processed." }
    });
  }
}

module.exports = { verifyEmail, resendVerification };
