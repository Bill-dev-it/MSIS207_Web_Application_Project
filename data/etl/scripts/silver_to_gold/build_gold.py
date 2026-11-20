"""Build repeatable, explicitly custom demo seed data from cleaned references.

No report files or model predictions are generated. Gold CSV columns follow DBML.
"""
import argparse
import csv
import json
import random
import re
import sqlite3
from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
SCHEMA = ROOT / 'docs/database/database-schema.dbml'
SILVER = ROOT / 'data/etl/silver'
GOLD = ROOT / 'data/etl/gold'
STAMP = '2026-09-01 00:00:00'
SEED = 42
# Follow DBML foreign-key order so parent rows always exist before child rows.
TABLE_ORDER = [
    'companies', 'addresses', 'categories', 'engine_models', 'suppliers',
    'aircraft', 'engines', 'products', 'seller_listings', 'product_engine_compatibility',
]


def read(relative):
    # Silver files are small reference datasets, so loading each one into a
    # list keeps the generation code simple and deterministic.
    with (SILVER / relative).open(encoding='utf-8', newline='') as stream:
        return list(csv.DictReader(stream))


def schema():
    # Read the DBML instead of duplicating the database definition in Python.
    # This keeps Gold column names, types, keys, and checks aligned with the
    # application's declared schema.
    result = {}
    text = SCHEMA.read_text(encoding='utf-8-sig')
    for table_name, block in re.findall(r'^Table (\w+)\s*\{(.*?)^\}', text, re.M | re.S):
        columns = []
        for field_name, dtype, tail in re.findall(r'^  (\w+) (\w+(?:\([^\n)]*\))?)([^\n]*)$', block, re.M):
            ref_match = re.search(r'ref:\s*[>-]\s*(\w+)\.(\w+)', tail)
            columns.append({
                'name': field_name, 'type': dtype,
                'required': 'not null' in tail or '[pk' in tail,
                'unique': 'unique' in tail or '[pk' in tail,
                'ref': ref_match.groups() if ref_match else None,
            })

        unique = [(column['name'],) for column in columns if column['unique']]
        for fields_text in re.findall(r'^    \(([^)]+)\) \[(?:unique|pk)\]', block, re.M):
            unique.append(tuple(field_name.strip() for field_name in fields_text.split(',')))

        checks_block = re.search(r'^  checks \{(.*?)^  \}', block, re.M | re.S)
        checks = re.findall(r'`([^`]+)`', checks_block.group(1)) if checks_block else []
        result[table_name] = {'columns': columns, 'unique': unique, 'checks': checks}
    return result


def money(value):
    # Keep monetary values at the database scale (two decimal places) before
    # they are written to CSV.
    return str(Decimal(str(value)).quantize(Decimal('0.01')))


def create_engine_references(data):
    """Copy engine references from Silver and select demo aircraft examples."""
    sources = read('engines/engine_models.csv')
    code_to_model = {}

    for model_id, row in enumerate(sources, 1):
        for code in row['source_codes'].split('|'):
            code_to_model[code] = model_id
        data['engine_models'].append({
            'engine_model_id': model_id, 'manufacturer': row['manufacturer'],
            'model_name': row['model_name'], 'engine_family': '',
            'engine_type': 'FAA_TYPE_' + row['source_type_codes'].replace('|', '_') if row['source_type_codes'] else '',
        })

    model_by_id = {row['engine_model_id']: row for row in data['engine_models']}
    candidates = defaultdict(list)
    with (SILVER / 'aircraft/aircraft.csv').open(encoding='utf-8', newline='') as stream:
        for row in csv.DictReader(stream):
            model_id = code_to_model.get(row['source_engine_code'])
            if model_id and model_by_id[model_id]['model_name'].startswith('CFM56') and len(candidates[model_id]) < 2:
                candidates[model_id].append(row)

    selected = sorted(model_id for model_id, rows in candidates.items() if len(rows) == 2)[:12]
    if len(selected) != 12:
        raise ValueError('Need twelve CFM56 model references with at least two aircraft examples')
    return model_by_id, candidates, selected


def create_companies_and_suppliers(data):
    """Create demo companies, suppliers, and their address rows."""
    buyer_names = [
        'Demo Horizon Airlines', 'Demo Pacific Air', 'Demo Skyline MRO',
        'Demo Meridian Airlines', 'Demo Atlas MRO', 'Demo Coastal Air',
    ]
    for company_id, name in enumerate(buyer_names, 1):
        data['companies'].append({
            'company_id': company_id, 'company_name': name,
            'company_type': 'MRO' if 'MRO' in name else 'AIRLINE',
            'tax_id': '', 'country_code': 'VN', 'created_at': STAMP,
        })

    suppliers = read('suppliers/suppliers.csv')
    supplier_map = {}
    for supplier_id, row in enumerate(suppliers, 1):
        company_id = supplier_id + len(buyer_names)
        supplier_map[row['source_supplier_id']] = supplier_id
        data['companies'].append({
            'company_id': company_id, 'company_name': f'Demo Aero Supply {supplier_id:03d}',
            'company_type': 'SUPPLIER', 'tax_id': '', 'country_code': 'US', 'created_at': STAMP,
        })

        # Keep most demo suppliers approved while preserving PENDING and SUSPENDED workflow examples.
        if supplier_id <= len(suppliers) - 4:
            supplier_status = 'APPROVED'
        elif supplier_id <= len(suppliers) - 2:
            supplier_status = 'PENDING'
        else:
            supplier_status = 'SUSPENDED'

        data['suppliers'].append({
            'supplier_id': supplier_id, 'company_id': company_id,
            'store_name': f'Demo Aero Supply {supplier_id:03d}',
            'slug': f'demo-aero-supply-{supplier_id:03d}',
            'description': 'Custom supplier for the student marketplace demo.',
            'logo_object_key': '', 'status': supplier_status, 'created_at': STAMP,
        })

    platform_id = len(data['companies']) + 1
    data['companies'].append({
        'company_id': platform_id, 'company_name': 'Demo Aviation Marketplace',
        'company_type': 'PLATFORM', 'tax_id': '', 'country_code': 'VN', 'created_at': STAMP,
    })
    for company in data['companies']:
        company_id = company['company_id']
        data['addresses'].append({
            'address_id': company_id, 'company_id': company_id,
            'recipient_name': f'Demo Procurement Team {company_id}',
            'phone': '+1-202-555-0100', 'address_line': f'{company_id} Demo Commerce Street',
            'city': 'Demo City', 'region': 'Demo Region', 'postal_code': '00000',
            'country_code': company['country_code'],
        })
    return supplier_map


def create_aircraft_and_engines(data, rng, candidates, selected):
    """Create demo aircraft and one monitored engine for each aircraft."""
    for model_id in selected:
        for reference in candidates[model_id]:
            aircraft_id = len(data['aircraft']) + 1
            data['aircraft'].append({
                'aircraft_id': aircraft_id, 'company_id': 1 + (aircraft_id - 1) % 6,
                'registration_number': f'DEMO-{aircraft_id:04d}',
                'manufacturer': reference['manufacturer'], 'model': reference['model'],
                'aircraft_type': 'FAA_TYPE_' + reference['source_aircraft_type'],
                'year': reference['year'], 'status': 'ACTIVE', 'created_at': STAMP,
            })
            data['engines'].append({
                'engine_id': aircraft_id, 'aircraft_id': aircraft_id, 'engine_model_id': model_id,
                'engine_code': f'ENG-{aircraft_id:03d}',
                'serial_number': f'DEMO-ENGINE-{aircraft_id:05d}',
                'current_cycle': rng.randint(100, 1500), 'created_at': STAMP,
            })


def create_products(data, model_by_id, selected, supplier_map):
    """Create categories, component products, replacement engines, and offers."""
    parts = read('products/parts.csv')
    families = sorted({part['part_family'] for part in parts}) + ['Replacement Engines']
    category_ids = {family: category_id for category_id, family in enumerate(families, 1)}
    for family, category_id in category_ids.items():
        data['categories'].append({
            'category_id': category_id, 'category_name': family,
            'slug': re.sub(r'[^a-z0-9]+', '-', family.lower()).strip('-'),
            'description': f'Demo aviation catalog: {family}.',
        })

    names = {
        'Avionics': ['Navigation Interface', 'Communication Control Unit'],
        'Cabin': ['Cabin Air Filter', 'Cabin Control Panel'],
        'Electrical': ['Engine Ignition Lead', 'Engine Starter Relay'],
        'Engine': ['Engine Oil Filter', 'Fuel Nozzle Assembly', 'Compressor Service Module'],
        'Fasteners': ['Engine Mount Bolt Kit', 'Engine Housing Fastener Set'],
        'Hydraulics': ['Hydraulic Filter', 'Hydraulic Valve Assembly'],
        'LandingGear': ['Landing Gear Seal Kit', 'Landing Gear Sensor'],
        'Structure': ['Access Panel', 'Structural Bracket'],
    }
    offers = []
    for product_id, part in enumerate(parts, 1):
        family = part['part_family']
        item_name = names[family][(product_id - 1) % len(names[family])]
        if family in ('Engine', 'Electrical', 'Fasteners'):
            model_id = selected[(product_id - 1) % len(selected)]
        else:
            model_id = None

        specs = {
            'is_demo': True, 'source_part_id': part['source_part_id'],
            'source_part_family': family, 'source_unit_cost': part['unit_cost'],
            'source_supplier_id': part['source_supplier_id'], 'demo_engine_model_id': model_id,
            'source_is_repairable': part['is_repairable'] == 'True',
            'source_shelf_life_days': int(part['shelf_life_days']) if part['shelf_life_days'] else None,
        }
        data['products'].append({
            'product_id': product_id, 'category_id': category_ids[family],
            'product_name': f'{item_name} {product_id:03d}',
            'manufacturer': f'Demo Aero Components {1 + (product_id % 5)}',
            'part_number': f'DEMO-PART-{product_id:05d}',
            'product_type': 'MODULE' if ('Module' in item_name or 'Unit' in item_name) else 'COMPONENT',
            'description': 'Custom educational catalog item; technical identity and fitment are generated for the demo.',
            'technical_specs': json.dumps(specs, sort_keys=True),
            'is_active': True, 'created_at': STAMP,
        })
        if model_id:
            data['product_engine_compatibility'].append({
                'product_id': product_id, 'engine_model_id': model_id,
                'evidence_reference': 'CUSTOM_DEMO_SEED_42: assigned fitment for application testing',
                'is_demo': True,
            })

        marked_up_price = Decimal(part['unit_cost']) * Decimal('1.65')
        offers.append((product_id, supplier_map[part['source_supplier_id']], marked_up_price, int(part['lead_time_days'])))

    for model_id in selected:
        product_id = len(data['products']) + 1
        model = model_by_id[model_id]
        specs = {'is_demo': True, 'engine_model_id': model_id, 'reference_source': 'FAA ENGINE'}
        data['products'].append({
            'product_id': product_id, 'category_id': category_ids['Replacement Engines'],
            'product_name': f"{model['model_name']} Replacement Engine",
            'manufacturer': model['manufacturer'],
            'part_number': f'DEMO-ENGINE-MODEL-{model_id}',
            'product_type': 'ENGINE',
            'description': 'Custom demo replacement offer using an FAA model reference; not a real manufacturer part number or commercial offer.',
            'technical_specs': json.dumps(specs, sort_keys=True),
            'is_active': True, 'created_at': STAMP,
        })
        data['product_engine_compatibility'].append({
            'product_id': product_id, 'engine_model_id': model_id,
            'evidence_reference': 'CUSTOM_DEMO_SEED_42: same-model replacement scenario',
            'is_demo': True,
        })
        offers.append((
            product_id,
            1 + (product_id % len(supplier_map)),
            Decimal(1200000 + (product_id % 12) * 75000),
            14 + (product_id % 10),
        ))
    return offers, len(supplier_map)


def create_listings(data, offers, supplier_count, rng):
    """Create NEW, REFURBISHED, and USED listings for every offer."""
    condition_tiers = [(0, 'NEW', '1.00'), (7, 'REFURBISHED', '0.72'), (19, 'USED', '0.50')]
    for product_id, primary_supplier_id, base_price, lead_time_days in offers:
        for supplier_offset, condition, price_factor in condition_tiers:
            supplier_id = 1 + (primary_supplier_id - 1 + supplier_offset) % supplier_count
            listing_id = len(data['seller_listings']) + 1

            # Mix out-of-stock, low-stock, and normal inventory without altering RNG call order.
            if listing_id % 11 == 0:
                stock_quantity = 0
            elif listing_id % 7 == 0:
                stock_quantity = 1
            else:
                stock_quantity = rng.randint(3, 24)

            supplier_status = data['suppliers'][supplier_id - 1]['status']
            listing_status = 'ACTIVE' if supplier_status == 'APPROVED' else 'DRAFT'
            data['seller_listings'].append({
                'listing_id': listing_id, 'supplier_id': supplier_id, 'product_id': product_id,
                'seller_sku': f'DEMO-S{supplier_id:02d}-P{product_id:04d}',
                'condition': condition, 'price': money(base_price * Decimal(price_factor)),
                'stock_quantity': stock_quantity,
                'lead_time_days': max(2, lead_time_days - (supplier_offset % 10)),
                'status': listing_status, 'updated_at': STAMP,
            })


def generate():
    """Build all Gold rows in foreign-key order without writing files."""
    # Keep the RNG seed and call sequence fixed so repeated runs produce identical demo records.
    rng = random.Random(SEED)
    data = {table: [] for table in TABLE_ORDER}
    model_by_id, candidates, selected = create_engine_references(data)
    supplier_map = create_companies_and_suppliers(data)
    create_aircraft_and_engines(data, rng, candidates, selected)
    offers, supplier_count = create_products(data, model_by_id, selected, supplier_map)
    create_listings(data, offers, supplier_count, rng)
    return data


def _create_validation_table(connection, table, definition, available_tables):
    """Create a temporary SQLite table mirroring the DBML columns, uniques, FKs, and checks."""
    declarations = []
    for column in definition['columns']:
        kind = column['type']
        if kind in ('int', 'bigint', 'boolean'):
            sqlite_type = 'INTEGER'
        elif kind.startswith('decimal'):
            sqlite_type = 'NUMERIC'
        else:
            sqlite_type = 'TEXT'

        declaration = f'"{column["name"]}" {sqlite_type}' + (' NOT NULL' if column['required'] else '')
        if column['ref']:
            target, field = column['ref']
            if target not in available_tables:
                raise ValueError(f'{table} depends on unseeded table {target}')
            declaration += f' REFERENCES "{target}"("{field}")'
        declarations.append(declaration)

    for unique_fields in definition['unique']:
        quoted = ','.join(f'"{field}"' for field in unique_fields)
        declarations.append(f'UNIQUE ({quoted})')
    for check_expr in definition['checks']:
        declarations.append(f'CHECK ({check_expr})')

    connection.execute(f'CREATE TABLE "{table}" (' + ','.join(declarations) + ')')


def _validate_column_value(table, column, value):
    """Validate one cell against DBML type/length/precision rules before SQLite insertion."""
    if value == '' or value is None:
        if column['required']:
            raise ValueError(f'{table}.{column["name"]}: missing required value')
        return None

    kind = column['type']
    if kind.startswith(('varchar(', 'char(')):
        limit = int(re.search(r'\d+', kind).group())
        assert len(str(value)) <= limit, (table, column['name'], value)
    if kind in ('bigint', 'int'):
        assert str(int(value)) == str(value), (table, column['name'], value)
    if kind == 'boolean':
        assert value in (True, False, 'true', 'false'), (table, column['name'], value)
        return 1 if value is True or value == 'true' else 0
    if kind == 'json':
        json.loads(value)
    if kind.startswith('decimal('):
        precision, scale = map(int, re.findall(r'\d+', kind))
        decimal = Decimal(str(value))
        assert decimal.is_finite() and decimal == decimal.quantize(Decimal(10) ** -scale)
        assert abs(decimal) < Decimal(10) ** (precision - scale)
    if kind == 'timestamp':
        datetime.fromisoformat(value)
    return value


def _validate_demo_business_rules(data):
    """Verify domain invariants beyond single-table SQL constraints."""
    supplier_status = {row['supplier_id']: row['status'] for row in data['suppliers']}
    for offer in data['seller_listings']:
        assert offer['status'] != 'ACTIVE' or supplier_status[offer['supplier_id']] == 'APPROVED'

    fitment_models = {row['engine_model_id'] for row in data['product_engine_compatibility']}
    assert all(row['engine_model_id'] in fitment_models for row in data['engines'])

    replacement_ids = {row['product_id'] for row in data['products'] if row['product_type'] == 'ENGINE'}
    buyable_ids = {
        row['product_id']
        for row in data['seller_listings']
        if row['status'] == 'ACTIVE' and int(row['stock_quantity']) > 0
    }
    assert replacement_ids <= buyable_ids, 'Demo replacement flow lacks buyable products'
    assert all(row['is_demo'] is True or row['is_demo'] == 'true' for row in data['product_engine_compatibility'])


def validate(data, definitions):
    """Check all schema columns/unique/FK/CHECK constraints in an ephemeral DB.

    SQLite is used for local constraint checks, not as the application's DB.
    Additional checks validate exact Decimal/type/length and demo business rules.
    """
    # Validate foreign keys and constraints locally in memory before writing or importing into PostgreSQL.
    con = sqlite3.connect(':memory:')
    con.execute('PRAGMA foreign_keys=ON')
    try:
        for table in TABLE_ORDER:
            definition = definitions[table]
            columns = definition['columns']
            expected_columns = {column['name'] for column in columns}
            _create_validation_table(con, table, definition, data)

            for row in data[table]:
                # Catch generator/schema drift before attempting the insert.
                if set(row) != expected_columns:
                    raise ValueError(f'{table}: columns differ from DBML: {set(row) ^ expected_columns}')
                values = [_validate_column_value(table, column, row[column['name']]) for column in columns]
                placeholders = ','.join('?' for _ in columns)
                con.execute(f'INSERT INTO "{table}" VALUES ({placeholders})', values)

        assert not con.execute('PRAGMA foreign_key_check').fetchall()
        _validate_demo_business_rules(data)
    finally:
        con.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Validate existing gold outputs without writing')
    args = parser.parse_args()
    definitions = schema()

    if args.check:
        # --check never regenerates or overwrites files. It validates the Gold
        # CSVs currently on disk against the current DBML schema.
        data = {}
        for table in TABLE_ORDER:
            with (GOLD / f'{table}.csv').open(encoding='utf-8', newline='') as stream:
                reader = csv.DictReader(stream)
                assert reader.fieldnames == [c['name'] for c in definitions[table]['columns']]
                data[table] = list(reader)
    else:
        # Normal mode creates a fresh deterministic demo dataset in memory.
        data = generate()

    validate(data, definitions)

    if not args.check:
        # Only these managed seed files are replaced. Runtime CSVs, if any,
        # are untouched because the application owns those datasets.
        GOLD.mkdir(parents=True, exist_ok=True)
        for table in TABLE_ORDER:
            path = GOLD / f'{table}.csv'
            # Write to a temporary CSV first so a failed write does not leave partial Gold data.
            temporary = path.with_suffix('.csv.tmp')
            with temporary.open('w', encoding='utf-8', newline='') as stream:
                writer = csv.DictWriter(stream, fieldnames=[c['name'] for c in definitions[table]['columns']])
                writer.writeheader()
                for row in data[table]:
                    formatted = dict(row)
                    for key, value in formatted.items():
                        if isinstance(value, bool):
                            formatted[key] = 'true' if value else 'false'
                    writer.writerow(formatted)
            temporary.replace(path)

    for table in TABLE_ORDER:
        print(f'{table}: {len(data[table])} rows')
    print('PASS: schema columns/types/required/unique/FK/CHECK and demo purchase reachability. No PostgreSQL load performed.')


if __name__ == '__main__':
    main()
