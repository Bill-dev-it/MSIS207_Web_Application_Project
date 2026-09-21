"""Build repeatable, explicitly custom demo seed data from cleaned references.

No report files or model predictions are generated. Gold CSV columns follow DBML.
"""
import argparse
import csv
import json
import random
import re
from collections import Counter, defaultdict
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = ROOT / 'docs/database/database-schema.dbml'
SILVER = ROOT / 'data/silver'
GOLD = ROOT / 'data/gold'
STAMP = '2026-09-01 00:00:00'
SEED = 42
# This order follows the foreign-key dependency order in the DBML schema.
# Parent rows must exist before child rows are validated or imported.
TABLE_ORDER = ['companies','addresses','categories','engine_models','suppliers','aircraft','engines','products','seller_listings','product_engine_compatibility']


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
    for name, block in re.findall(r'^Table (\w+)\s*\{(.*?)^\}', text, re.M | re.S):
        columns = []
        for field, dtype, tail in re.findall(r'^  (\w+) (\w+(?:\([^\n)]*\))?)([^\n]*)$', block, re.M):
            ref = re.search(r'ref:\s*[>-]\s*(\w+)\.(\w+)', tail)
            columns.append({'name': field, 'type': dtype, 'required': 'not null' in tail or '[pk' in tail,
                            'unique': 'unique' in tail or '[pk' in tail,
                            'ref': ref.groups() if ref else None})
        unique = [(c['name'],) for c in columns if c['unique']]
        unique += [tuple(x.strip() for x in fields.split(',')) for fields in re.findall(r'^    \(([^)]+)\) \[(?:unique|pk)\]', block, re.M)]
        checks_block = re.search(r'^  checks \{(.*?)^  \}', block, re.M | re.S)
        checks = re.findall(r'`([^`]+)`', checks_block.group(1)) if checks_block else []
        result[name] = {'columns': columns, 'unique': unique, 'checks': checks}
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
            'engine_model_id': model_id,
            'manufacturer': row['manufacturer'],
            'model_name': row['model_name'],
            'engine_family': '',
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
    buyer_names = ['Demo Horizon Airlines','Demo Pacific Air','Demo Skyline MRO','Demo Meridian Airlines','Demo Atlas MRO','Demo Coastal Air']
    for company_id, name in enumerate(buyer_names, 1):
        data['companies'].append({'company_id':company_id,'company_name':name,'company_type':'MRO' if 'MRO' in name else 'AIRLINE','tax_id':'','country_code':'VN','created_at':STAMP})

    suppliers = read('suppliers/suppliers.csv')
    supplier_map = {}
    for supplier_id, row in enumerate(suppliers, 1):
        company_id = supplier_id + len(buyer_names)
        supplier_map[row['source_supplier_id']] = supplier_id
        data['companies'].append({'company_id':company_id,'company_name':f'Demo Aero Supply {supplier_id:03d}','company_type':'SUPPLIER','tax_id':'','country_code':'US','created_at':STAMP})
        status = 'APPROVED' if supplier_id <= len(suppliers)-4 else ('PENDING' if supplier_id <= len(suppliers)-2 else 'SUSPENDED')
        data['suppliers'].append({'supplier_id':supplier_id,'company_id':company_id,'store_name':f'Demo Aero Supply {supplier_id:03d}', 'slug':f'demo-aero-supply-{supplier_id:03d}',
                                  'description':'Custom supplier for the student marketplace demo.','logo_object_key':'','status':status,'created_at':STAMP})

    platform_id = len(data['companies']) + 1
    data['companies'].append({'company_id':platform_id,'company_name':'Demo Aviation Marketplace','company_type':'PLATFORM','tax_id':'','country_code':'VN','created_at':STAMP})
    for company in data['companies']:
        company_id = company['company_id']
        data['addresses'].append({'address_id':company_id,'company_id':company_id,'recipient_name':f'Demo Procurement Team {company_id}', 'phone':'+1-202-555-0100',
                                  'address_line':f'{company_id} Demo Commerce Street','city':'Demo City','region':'Demo Region','postal_code':'00000','country_code':company['country_code']})
    return suppliers, supplier_map


def create_aircraft_and_engines(data, rng, candidates, selected):
    """Create demo aircraft and one monitored engine for each aircraft."""
    for model_id in selected:
        for reference in candidates[model_id]:
            aircraft_id = len(data['aircraft']) + 1
            data['aircraft'].append({'aircraft_id':aircraft_id,'company_id':1+(aircraft_id-1)%6,'registration_number':f'DEMO-{aircraft_id:04d}',
                                     'manufacturer':reference['manufacturer'],'model':reference['model'],
                                     'aircraft_type':'FAA_TYPE_'+reference['source_aircraft_type'], 'year':reference['year'],'status':'ACTIVE','created_at':STAMP})
            data['engines'].append({'engine_id':aircraft_id,'aircraft_id':aircraft_id,'engine_model_id':model_id,'engine_code':f'ENG-{aircraft_id:03d}',
                                    'serial_number':f'DEMO-ENGINE-{aircraft_id:05d}','current_cycle':rng.randint(100,1500),'created_at':STAMP})


def create_products(data, model_by_id, selected, supplier_map):
    """Create categories, component products, replacement engines, and offers."""
    parts = read('products/parts.csv')
    families = sorted({part['part_family'] for part in parts}) + ['Replacement Engines']
    category_ids = {family: category_id for category_id, family in enumerate(families, 1)}
    for family, category_id in category_ids.items():
        data['categories'].append({'category_id':category_id,'category_name':family,'slug':re.sub(r'[^a-z0-9]+','-',family.lower()).strip('-'),'description':f'Demo aviation catalog: {family}.'})

    names = {'Avionics':['Navigation Interface','Communication Control Unit'], 'Cabin':['Cabin Air Filter','Cabin Control Panel'],
             'Electrical':['Engine Ignition Lead','Engine Starter Relay'], 'Engine':['Engine Oil Filter','Fuel Nozzle Assembly','Compressor Service Module'],
             'Fasteners':['Engine Mount Bolt Kit','Engine Housing Fastener Set'], 'Hydraulics':['Hydraulic Filter','Hydraulic Valve Assembly'],
             'LandingGear':['Landing Gear Seal Kit','Landing Gear Sensor'], 'Structure':['Access Panel','Structural Bracket']}
    offers = []
    for product_id, part in enumerate(parts, 1):
        family = part['part_family']
        item_name = names[family][(product_id-1) % len(names[family])]
        model_id = selected[(product_id-1) % len(selected)] if family in ('Engine','Electrical','Fasteners') else None
        specs = {'is_demo':True,'source_part_id':part['source_part_id'],'source_part_family':family,
                 'source_unit_cost':part['unit_cost'],'source_supplier_id':part['source_supplier_id'],
                 'demo_engine_model_id':model_id,'source_is_repairable':part['is_repairable']=='True',
                 'source_shelf_life_days':int(part['shelf_life_days']) if part['shelf_life_days'] else None}
        data['products'].append({'product_id':product_id,'category_id':category_ids[family], 'product_name':f'{item_name} {product_id:03d}',
                                 'manufacturer':f'Demo Aero Components {1+(product_id%5)}','part_number':f'DEMO-PART-{product_id:05d}',
                                 'product_type':'MODULE' if 'Module' in item_name or 'Unit' in item_name else 'COMPONENT',
                                 'description':'Custom educational catalog item; technical identity and fitment are generated for the demo.',
                                 'technical_specs':json.dumps(specs,sort_keys=True),'is_active':True,'created_at':STAMP})
        if model_id:
            data['product_engine_compatibility'].append({'product_id':product_id,'engine_model_id':model_id,'evidence_reference':'CUSTOM_DEMO_SEED_42: assigned fitment for application testing','is_demo':True})
        offers.append((product_id, supplier_map[part['source_supplier_id']], Decimal(part['unit_cost'])*Decimal('1.65'), int(part['lead_time_days'])))

    for model_id in selected:
        product_id = len(data['products']) + 1
        model = model_by_id[model_id]
        data['products'].append({'product_id':product_id,'category_id':category_ids['Replacement Engines'],'product_name':f"{model['model_name']} Replacement Engine",
                                 'manufacturer':model['manufacturer'],'part_number':f'DEMO-ENGINE-MODEL-{model_id}', 'product_type':'ENGINE',
                                 'description':'Custom demo replacement offer using an FAA model reference; not a real manufacturer part number or commercial offer.',
                                 'technical_specs':json.dumps({'is_demo':True,'engine_model_id':model_id,'reference_source':'FAA ENGINE'},sort_keys=True),
                                 'is_active':True,'created_at':STAMP})
        data['product_engine_compatibility'].append({'product_id':product_id,'engine_model_id':model_id,'evidence_reference':'CUSTOM_DEMO_SEED_42: same-model replacement scenario','is_demo':True})
        offers.append((product_id,1+(product_id%len(supplier_map)),Decimal(1200000+(product_id%12)*75000),14+(product_id%10)))
    return offers, len(supplier_map)


def create_listings(data, offers, supplier_count, rng):
    """Create NEW, REFURBISHED, and USED listings for every offer."""
    for product_id, primary, base, lead in offers:
        for offset, condition, factor in [(0,'NEW','1.00'),(7,'REFURBISHED','0.72'),(19,'USED','0.50')]:
            supplier_id = 1 + (primary - 1 + offset) % supplier_count
            listing_id = len(data['seller_listings']) + 1
            quantity = 0 if listing_id % 11 == 0 else (1 if listing_id % 7 == 0 else rng.randint(3,24))
            data['seller_listings'].append({'listing_id':listing_id,'supplier_id':supplier_id,'product_id':product_id,'seller_sku':f'DEMO-S{supplier_id:02d}-P{product_id:04d}',
                                            'condition':condition,'price':money(base*Decimal(factor)),'stock_quantity':quantity,
                                            'lead_time_days':max(2,lead-(offset%10)), 'status':'ACTIVE' if data['suppliers'][supplier_id-1]['status']=='APPROVED' else 'DRAFT','updated_at':STAMP})


def generate():
    """Build all Gold rows in foreign-key order without writing files."""
    rng = random.Random(SEED)
    data = {table: [] for table in TABLE_ORDER}
    model_by_id, candidates, selected = create_engine_references(data)
    suppliers, supplier_map = create_companies_and_suppliers(data)
    create_aircraft_and_engines(data, rng, candidates, selected)
    offers, supplier_count = create_products(data, model_by_id, selected, supplier_map)
    create_listings(data, offers, supplier_count, rng)
    return data


def validate(data, definitions):
    """Check all schema columns/unique/FK/CHECK constraints in an ephemeral DB.

    SQLite is used for local constraint checks, not as the application's DB.
    Additional checks validate exact Decimal/type/length and demo business rules.
    """
    # SQLite is used only as an in-memory constraint checker. The application
    # database remains PostgreSQL and is not contacted by this script.
    import sqlite3
    con = sqlite3.connect(':memory:')
    con.execute('PRAGMA foreign_keys=ON')
    for table in TABLE_ORDER:
        definition = definitions[table]
        columns = definition['columns']
        expected = {c['name'] for c in columns}
        declarations = []
        for c in columns:
            kind = c['type']
            sqltype = 'INTEGER' if kind in ('int','bigint','boolean') else ('NUMERIC' if kind.startswith('decimal') else 'TEXT')
            declaration = f'"{c["name"]}" {sqltype}' + (' NOT NULL' if c['required'] else '')
            if c['ref']:
                target,field = c['ref']
                if target not in data:
                    raise ValueError(f'{table} depends on unseeded table {target}')
                declaration += f' REFERENCES "{target}"("{field}")'
            declarations.append(declaration)
        declarations += ['UNIQUE ('+','.join('"'+c+'"' for c in fields)+')' for fields in definition['unique']]
        declarations += ['CHECK ('+expr+')' for expr in definition['checks']]
        con.execute(f'CREATE TABLE "{table}" ('+','.join(declarations)+')')
        for row in data[table]:
            # Catch generator/schema drift before attempting the insert.
            if set(row)!=expected:
                raise ValueError(f'{table}: columns differ from DBML: {set(row)^expected}')
            values = []
            for c in columns:
                value = row[c['name']]
                if value == '' or value is None:
                    if c['required']:
                        raise ValueError(f'{table}.{c["name"]}: missing required value')
                    values.append(None)
                    continue
                kind = c['type']
                # Validate values according to the DBML type before SQLite
                # receives them, especially JSON, decimal, and timestamp data.
                if kind.startswith(('varchar(', 'char(')):
                    limit = int(re.search(r'\d+',kind).group())
                    assert len(str(value))<=limit, (table,c['name'],value)
                if kind in ('bigint','int'):
                    assert str(int(value))==str(value), (table,c['name'],value)
                if kind=='boolean':
                    assert value in (True,False,'true','false'), (table,c['name'],value)
                    value = 1 if value is True or value=='true' else 0
                if kind=='json': json.loads(value)
                if kind.startswith('decimal('):
                    precision,scale=map(int,re.findall(r'\d+',kind))
                    decimal=Decimal(str(value))
                    assert decimal.is_finite() and decimal==decimal.quantize(Decimal(10)**-scale)
                    assert abs(decimal)<Decimal(10)**(precision-scale)
                if kind=='timestamp':
                    from datetime import datetime
                    datetime.fromisoformat(value)
                values.append(value)
            con.execute(f'INSERT INTO "{table}" VALUES ('+','.join('?' for _ in columns)+')',values)
    assert not con.execute('PRAGMA foreign_key_check').fetchall()

    # These are business rules that are more specific than ordinary SQL
    # constraints and therefore are checked explicitly in Python.
    supplier_status={r['supplier_id']:r['status'] for r in data['suppliers']}
    for offer in data['seller_listings']:
        assert offer['status']!='ACTIVE' or supplier_status[offer['supplier_id']]=='APPROVED'
    fitment={r['engine_model_id'] for r in data['product_engine_compatibility']}
    assert all(r['engine_model_id'] in fitment for r in data['engines'])
    replacement_ids={r['product_id'] for r in data['products'] if r['product_type']=='ENGINE'}
    buyable={r['product_id'] for r in data['seller_listings'] if r['status']=='ACTIVE' and int(r['stock_quantity'])>0}
    assert replacement_ids<=buyable, 'Demo replacement flow lacks buyable products'
    assert all(r['is_demo'] is True or r['is_demo']=='true' for r in data['product_engine_compatibility'])
    con.close()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true',help='Validate existing gold outputs without writing')
    args=parser.parse_args()
    definitions=schema()
    if args.check:
        # --check never regenerates or overwrites files. It validates the Gold
        # CSVs currently on disk against the current DBML schema.
        data={}
        for table in TABLE_ORDER:
            with (GOLD/f'{table}.csv').open(encoding='utf-8',newline='') as stream:
                reader=csv.DictReader(stream)
                assert reader.fieldnames==[c['name'] for c in definitions[table]['columns']]
                data[table]=list(reader)
    else:
        # Normal mode creates a fresh deterministic demo dataset in memory.
        data=generate()
    validate(data,definitions)
    if not args.check:
        # Only these managed seed files are replaced. Runtime CSVs, if any,
        # are untouched because the application owns those datasets.
        GOLD.mkdir(parents=True,exist_ok=True)
        for table in TABLE_ORDER:
            path=GOLD/f'{table}.csv'
            # Use a temporary file so a failed write does not leave a partial
            # Gold CSV behind.
            temporary=path.with_suffix('.csv.tmp')
            with temporary.open('w',encoding='utf-8',newline='') as stream:
                writer=csv.DictWriter(stream,fieldnames=[c['name'] for c in definitions[table]['columns']])
                writer.writeheader()
                for row in data[table]:
                    writer.writerow({k:('true' if v else 'false') if isinstance(v,bool) else v for k,v in row.items()})
            temporary.replace(path)
    for table in TABLE_ORDER:
        print(f'{table}: {len(data[table])} rows')
    print('PASS: schema columns/types/required/unique/FK/CHECK and demo purchase reachability. No PostgreSQL load performed.')


if __name__=='__main__':
    main()
