# Authentication Database Setup

This folder contains the database changes needed for Authentication and a
script to check that those changes are present.

## What the setup adds

Run `01_authentication_setup.sql` after creating the original database with
`database/schema/01_schema.sql`. The setup is additive:

- It adds `email_verified_at` and `auth_version` to the existing `users` table.
- It creates `account_tokens` for one-time email-verification and
  password-reset tokens. The table stores token hashes, not the original
  secret tokens.
- It adds constraints and indexes to support safe token use and lookup.

It does not create user accounts or change existing company, user, or supplier
records.

## How to verify

After applying the setup to a fresh database, run
`02_authentication_validation.sql`. It reports the database and schema,
Authentication columns and table, constraints, and row counts. Confirm that
the new columns and `account_tokens` are present, and that setup did not add
account or token records.

## Important

The Authentication SQL has already been successfully applied to and verified
in the current local database. **Do not run `01_authentication_setup.sql`
again against that database.** Use these files only when preparing a separate,
fresh database.
