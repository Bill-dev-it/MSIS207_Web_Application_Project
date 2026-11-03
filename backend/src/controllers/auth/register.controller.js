"use strict";

const { validateRegister } = require("../../services/auth/register.validation");
const { registerAccount } = require("../../services/auth/register.service");
const { mailIsConfigured, sendVerificationEmail } = require("../../services/auth/verification-mail.service");

async function register(req, res) {
  const checked = validateRegister(req.body);
  if (!checked.ok) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_INPUT", message: checked.message }
    });
  }

  // Without SMTP, do not create an account that has no way to verify email.
  if (!mailIsConfigured()) {
    return res.status(503).json({
      success: false,
      error: { code: "EMAIL_UNAVAILABLE", message: "Registration email delivery is not configured." }
    });
  }

  try {
    const { account, verificationToken } = await registerAccount(checked.value);
    let emailSent = false;
    try {
      // Only send after COMMIT. A failed email must not be reported as a failed account creation.
      await sendVerificationEmail(account.email, verificationToken);
      emailSent = true;
    } catch {
      console.error("New account created, but verification email delivery failed.");
    }
    return res.status(201).json({
      success: true,
      data: { ...account, email_verification_sent: emailSent }
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        error: { code: "ACCOUNT_CONFLICT", message: "Email or company profile is already in use." }
      });
    }
    if (["23502", "23503", "23514", "22001", "22003"].includes(error.code)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "Registration values do not meet database requirements." }
      });
    }
    console.error("Account registration failed; error code:", error.code || "UNKNOWN");
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Registration could not be completed." }
    });
  }
}

module.exports = { register };
