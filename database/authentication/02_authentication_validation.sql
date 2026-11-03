-- AeroRUL / Authentication Batch 1 verification (READ-ONLY)
-- Must be run against the same database after migration.

SELECT current_database() AS database_name, current_schema() AS schema_name;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'users' AND column_name IN ('email_verified_at', 'auth_version'))
       OR table_name = 'account_tokens')
ORDER BY table_name, ordinal_position;

SELECT conrelid::regclass::text AS table_name,
       conname AS constraint_name,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN ('public.users'::regclass, 'public.account_tokens'::regclass)
ORDER BY table_name, constraint_name;

SELECT 'companies' AS table_name, COUNT(*) AS row_count FROM public.companies
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'suppliers', COUNT(*) FROM public.suppliers
UNION ALL
SELECT 'account_tokens', COUNT(*) FROM public.account_tokens
ORDER BY table_name;
