"use strict";

const nodemailer = require("nodemailer");

function mailIsConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT &&
    process.env.SMTP_USER && process.env.SMTP_PASS &&
    process.env.SMTP_FROM && process.env.PUBLIC_WEB_URL
  );
}

function buildVerificationLink(token) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) {
    throw new Error("Invalid verification token format.");
  }
  const websiteUrl = new URL(process.env.PUBLIC_WEB_URL);
  if (!(["https:", "http:"].includes(websiteUrl.protocol)) || websiteUrl.username || websiteUrl.password) {
    throw new Error("PUBLIC_WEB_URL must be a regular HTTP(S) URL.");
  }
  if (websiteUrl.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(websiteUrl.hostname)) {
    throw new Error("Non-local PUBLIC_WEB_URL must use HTTPS.");
  }
  const link = new URL("/verify-email", websiteUrl);
  link.searchParams.set("token", token);
  return link.toString();
}

async function sendVerificationEmail(email, token) {
  if (!mailIsConfigured()) throw new Error("SMTP_NOT_CONFIGURED");
  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT_INVALID");
  }
  const link = buildVerificationLink(token);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your AeroRUL account",
    text: `Verify your AeroRUL email using this link (expires in 24 hours):\n${link}\n\nIf you did not register, ignore this email.`,
    html: `<p>Please verify your AeroRUL account.</p><p><a href="${link}">Verify email</a> (link expires in 24 hours).</p><p>If you did not register, ignore this email.</p>`
  });
}

module.exports = { mailIsConfigured, buildVerificationLink, sendVerificationEmail };
