"use strict";

const { randomUUID } = require("node:crypto");
const argon2 = require("argon2");
const pool = require("../../config/db");
const { createEmailVerificationToken } = require("./verification-token.service");

function makeSlug(name) {
  const prefix = name.toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 80).replace(/-$/g, "") || "supplier";
  return `${prefix}-${randomUUID().slice(0, 12)}`;
}

async function registerAccount(input) {
  // Hash outside the transaction to avoid holding database locks during Argon2id.
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });

  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;

    // Use a single transaction: never leave an orphaned Company/User/Supplier.
    const companyResult = await client.query(
      `INSERT INTO public.companies
        (company_name, company_type, tax_id, country_code)
       VALUES ($1, $2, $3, $4)
       RETURNING company_id`,
      [input.companyName, input.companyType, input.taxId, input.countryCode]
    );
    const companyId = companyResult.rows[0].company_id;

    const userResult = await client.query(
      `INSERT INTO public.users
        (company_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, email, full_name, role`,
      [companyId, input.fullName, input.email, passwordHash, input.accountType]
    );
    const user = userResult.rows[0];

    let supplierId = null;
    if (input.accountType === "SUPPLIER") {
      const supplierResult = await client.query(
        `INSERT INTO public.suppliers
          (company_id, store_name, slug, status)
         VALUES ($1, $2, $3, 'PENDING')
         RETURNING supplier_id`,
        [companyId, input.storeName, makeSlug(input.storeName)]
      );
      supplierId = supplierResult.rows[0].supplier_id;
    }

    // The email token and account must commit or roll back together.
    const verificationToken = await createEmailVerificationToken(client, user.user_id);

    await client.query("COMMIT");
    transactionOpen = false;
    return {
      account: {
      user_id: user.user_id,
      company_id: companyId,
      supplier_id: supplierId,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      email_verification_required: true
      },
      // Internal only: the controller passes this to SMTP, never to the HTTP response.
      verificationToken
    };
  } catch (error) {
    if (transactionOpen) {
      try { await client.query("ROLLBACK"); }
      catch (rollbackError) { console.error("Registration rollback failed:", rollbackError); }
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { registerAccount };
