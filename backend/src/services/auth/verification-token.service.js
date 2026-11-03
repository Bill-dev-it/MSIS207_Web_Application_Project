"use strict";

const { randomBytes, createHash } = require("node:crypto");
const pool = require("../../config/db");

const TOKEN_PURPOSE = "EMAIL_VERIFY";

function hashToken(rawToken) {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

function validToken(rawToken) {
  return typeof rawToken === "string" && /^[0-9a-f]{64}$/.test(rawToken);
}

// Called inside the SAME transaction as the new company and user.
// The raw token is never written to PostgreSQL.
async function createEmailVerificationToken(client, userId) {
  const token = randomBytes(32).toString("hex");
  await client.query(
    `INSERT INTO public.account_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, 'EMAIL_VERIFY', $2, NOW() + INTERVAL '24 hours')`,
    [userId, hashToken(token)]
  );
  return token;
}

async function verifyEmailToken(token) {
  if (!validToken(token)) return false;

  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    const found = await client.query(
      `SELECT t.user_id
       FROM public.account_tokens AS t
       JOIN public.users AS u ON u.user_id = t.user_id
       WHERE t.token_hash = $1 AND t.purpose = 'EMAIL_VERIFY'
         AND t.consumed_at IS NULL AND t.expires_at > NOW()
         AND u.email_verified_at IS NULL AND u.is_active = TRUE
       FOR UPDATE OF t, u`,
      [hashToken(token)]
    );
    if (found.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionOpen = false;
      return false;
    }

    const userId = found.rows[0].user_id;
    await client.query(
      `UPDATE public.users
       SET email_verified_at = NOW()
       WHERE user_id = $1 AND email_verified_at IS NULL`,
      [userId]
    );
    // Consuming ALL outstanding email links ensures they cannot be replayed.
    await client.query(
      `UPDATE public.account_tokens SET consumed_at = NOW()
       WHERE user_id = $1 AND purpose = 'EMAIL_VERIFY' AND consumed_at IS NULL`,
      [userId]
    );
    await client.query("COMMIT");
    transactionOpen = false;
    return true;
  } catch (error) {
    if (transactionOpen) {
      try { await client.query("ROLLBACK"); }
      catch { console.error("Email verification transaction rollback failed."); }
    }
    throw error;
  } finally {
    client.release();
  }
}

// Public endpoint: always give a generic response, including for unknown emails.
// SQL row lock prevents two concurrent resends to the same user from bypassing throttling.
async function createResendToken(email) {
  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    const found = await client.query(
      `SELECT user_id, email
       FROM public.users
       WHERE LOWER(email) = $1 AND is_active = TRUE AND email_verified_at IS NULL
       FOR UPDATE`,
      [email]
    );
    if (found.rows.length === 0) {
      await client.query("COMMIT");
      transactionOpen = false;
      return null;
    }
    const user = found.rows[0];
    const recent = await client.query(
      `SELECT COUNT(*)::integer AS count,
              COALESCE(BOOL_OR(created_at > NOW() - INTERVAL '60 seconds'), FALSE) AS too_soon
       FROM public.account_tokens
       WHERE user_id = $1 AND purpose = 'EMAIL_VERIFY'
         AND created_at > NOW() - INTERVAL '24 hours'`,
      [user.user_id]
    );
    const info = recent.rows[0];
    // Bounded per-account issuance even when many client IPs are involved.
    const issuedToday = Number(info?.count || 0);
    if (issuedToday >= 10 || info?.too_soon === true) {
      await client.query("COMMIT");
      transactionOpen = false;
      return null;
    }
    const token = await createEmailVerificationToken(client, user.user_id);
    await client.query("COMMIT");
    transactionOpen = false;
    return { email: user.email, token };
  } catch (error) {
    if (transactionOpen) {
      try { await client.query("ROLLBACK"); }
      catch { console.error("Resend verification transaction rollback failed."); }
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  hashToken,
  validToken,
  createEmailVerificationToken,
  verifyEmailToken,
  createResendToken
};
