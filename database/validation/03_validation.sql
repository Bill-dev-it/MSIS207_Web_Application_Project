-- =========================================================
-- DATABASE SCHEMA VALIDATION
-- =========================================================

-- 1. Validate table count
SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public';


-- 2. List all application tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- 3. Validate foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.constraint_schema = kcu.constraint_schema
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.constraint_schema = ccu.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. Validate PK / UNIQUE / CHECK constraints
SELECT
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND constraint_type IN (
      'PRIMARY KEY',
      'UNIQUE',
      'CHECK'
  )
ORDER BY table_name, constraint_type, constraint_name;

-- 5. Validate indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;