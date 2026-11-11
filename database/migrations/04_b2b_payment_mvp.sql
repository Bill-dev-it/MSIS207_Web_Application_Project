-- AeroRUL B2B Payment MVP: two explicitly recorded payment methods.
-- Scope: SIMULATION (immediately SUCCEEDED) and BANK_TRANSFER (PENDING,
-- confirmed/cancelled by an authorized ADMIN in a demo workflow).
-- IMPORTANT: Do not apply until the backend is updated in the same rollout.
-- No real banking integration or card data is handled by this migration.
-- Existing SIMULATION/SUCCEEDED rows remain valid.

BEGIN;

-- The old constraint enforces SIMULATION/SUCCEEDED only.
-- Drop legacy or previously applied payment method/status constraint.
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS chk_payments_simulation,
  DROP CONSTRAINT IF EXISTS chk_payments_b2b_mvp_method_status;

-- Require the backend to state method/status explicitly for each new payment.
-- A pending or cancelled transfer has no payment completion timestamp.
ALTER TABLE public.payments
  ALTER COLUMN payment_method DROP DEFAULT,
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN paid_at DROP DEFAULT,
  ALTER COLUMN paid_at DROP NOT NULL;

ALTER TABLE public.payments
  ADD CONSTRAINT chk_payments_b2b_mvp_method_status CHECK (
    (
      payment_method = 'SIMULATION'
      AND status = 'SUCCEEDED'
      AND paid_at IS NOT NULL
    )
    OR
    (
      payment_method = 'BANK_TRANSFER'
      AND (
        (status = 'PENDING' AND paid_at IS NULL)
        OR (status = 'SUCCEEDED' AND paid_at IS NOT NULL)
        OR (status = 'CANCELLED' AND paid_at IS NULL)
      )
    )
  );

COMMIT;

