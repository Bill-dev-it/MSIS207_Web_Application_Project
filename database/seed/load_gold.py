"""Safely bootstrap Gold CSV files into an empty PostgreSQL application schema.

Requires: pip install 'psycopg[binary]>=3.1'
Connection: DATABASE_URL environment variable (never hardcode credentials).
Run from any working directory: python database/seed/load_gold.py
"""
import csv
import os
import re
import sys
from pathlib import Path

try:
    import psycopg
    from psycopg import sql
except ImportError:
    sys.exit("Missing dependency. Install: pip install 'psycopg[binary]>=3.1'")

ROOT = Path(__file__).resolve().parents[2]
GOLD = ROOT / 'data' / 'etl' / 'gold'
TABLES = (
    'companies', 'addresses', 'categories', 'engine_models', 'suppliers',
    'aircraft', 'engines', 'products', 'seller_listings',
    'product_engine_compatibility',
)
EXPECTED_SCHEMA = 'public'


def csv_inventory():
    inventory = {}
    for table in TABLES:
        path = GOLD / f'{table}.csv'
        if not path.is_file():
            raise ValueError(f'Missing Gold CSV: {path}')
        with path.open('r', encoding='utf-8-sig', newline='') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            if not header or len(header) != len(set(header)) or not all(re.fullmatch(r'[a-z][a-z0-9_]*', c) for c in header):
                raise ValueError(f'Invalid CSV header: {path}')
            count = 0
            for line, row in enumerate(reader, 2):
                if len(row) != len(header):
                    raise ValueError(f'{path}:{line}: expected {len(header)} columns, got {len(row)}')
                count += 1
            if count == 0:
                raise ValueError(f'Empty Gold CSV: {path}')
            inventory[table] = (path, header, count)
    return inventory


def main():
    url = os.environ.get('DATABASE_URL')
    if not url:
        sys.exit('DATABASE_URL is required. Point it to a NEW, isolated development database.')
    inventory = csv_inventory()
    print('Gold CSV validation passed:')
    for table, (_, _, count) in inventory.items():
        print(f'  {table}: {count} rows')
    print('Connecting to PostgreSQL; will refuse any non-empty application schema.')

    # A single transaction protects the entire seed operation, including sequence updates.
    with psycopg.connect(url, autocommit=False) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute('SELECT pg_advisory_xact_lock(%s)', (83012026,))
                cur.execute('SELECT current_database(), current_schema()')
                database, schema = cur.fetchone()
                if schema != EXPECTED_SCHEMA:
                    raise RuntimeError(f'Expected search_path to resolve to public; got {schema!r}')
                # Refuse a schema with any existing rows, including runtime tables.
                cur.execute('''
                    SELECT tablename FROM pg_catalog.pg_tables
                    WHERE schemaname = %s ORDER BY tablename
                ''', (schema,))
                all_tables = [row[0] for row in cur.fetchall()]
                missing = sorted(set(TABLES) - set(all_tables))
                if missing:
                    raise RuntimeError(f'Schema missing required tables: {missing}. Run 01_schema.sql first.')
                for table in all_tables:
                    cur.execute(sql.SQL('SELECT EXISTS (SELECT 1 FROM {}.{})').format(
                        sql.Identifier(schema), sql.Identifier(table)))
                    if cur.fetchone()[0]:
                        raise RuntimeError(f'Refusing to seed: {schema}.{table} already contains data. No changes made.')
                print(f'Confirmed empty schema in database {database!r}. Loading...')

                for table, (path, header, expected_count) in inventory.items():
                    cur.execute('''
                        SELECT column_name FROM information_schema.columns
                        WHERE table_schema = %s AND table_name = %s
                        ORDER BY ordinal_position
                    ''', (schema, table))
                    actual_columns = [row[0] for row in cur.fetchall()]
                    if header != actual_columns:
                        raise RuntimeError(f'{table}: CSV header differs from SQL schema.\nCSV: {header}\nSQL: {actual_columns}')
                    # COPY interprets empty CSV fields as SQL NULL, including optional columns.
                    stmt = sql.SQL('COPY {}.{} ({}) FROM STDIN WITH (FORMAT CSV, HEADER TRUE, NULL \'\')').format(
                        sql.Identifier(schema), sql.Identifier(table),
                        sql.SQL(', ').join(map(sql.Identifier, header)))
                    with path.open('r', encoding='utf-8-sig', newline='') as source:
                        with cur.copy(stmt) as copy:
                            while chunk := source.read(1024 * 1024):
                                copy.write(chunk)
                    cur.execute(sql.SQL('SELECT count(*) FROM {}.{}').format(
                        sql.Identifier(schema), sql.Identifier(table)))
                    actual_count = cur.fetchone()[0]
                    if actual_count != expected_count:
                        raise RuntimeError(f'{table}: expected {expected_count} rows; found {actual_count}')
                    print(f'  Loaded {table}: {actual_count}')

                # Explicit Gold IDs do not advance PostgreSQL identity sequences.
                for table in TABLES:
                    cur.execute('''
                        SELECT column_name FROM information_schema.columns
                        WHERE table_schema=%s AND table_name=%s AND is_identity='YES'
                    ''', (schema, table))
                    for (column,) in cur.fetchall():
                        cur.execute('SELECT pg_get_serial_sequence(%s, %s)', (f'{schema}.{table}', column))
                        sequence = cur.fetchone()[0]
                        if not sequence:
                            raise RuntimeError(f'Identity sequence not found: {table}.{column}')
                        cur.execute(sql.SQL('SELECT max({}) FROM {}.{}').format(
                            sql.Identifier(column), sql.Identifier(schema), sql.Identifier(table)))
                        maximum = cur.fetchone()[0]
                        if maximum is not None:
                            # ALTER SEQUENCE RESTART is transactional (unlike setval).
                            cur.execute(sql.SQL('ALTER SEQUENCE {} RESTART WITH {}').format(
                                sql.Identifier(*sequence.split('.')),
                                sql.Literal(maximum + 1)))
    print('SUCCESS: All Gold tables seeded in one committed transaction.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, psycopg.Error, RuntimeError) as exc:
        sys.exit(f'FAILED (transaction rolled back): {exc}')
