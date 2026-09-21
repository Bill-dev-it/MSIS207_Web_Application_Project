"""Clean selected reference datasets. Originals stay untouched; print counts only."""
import csv
import json
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BRONZE = ROOT / 'data/bronze'
SILVER = ROOT / 'data/silver'


def read(relative):
    # Bronze is read-only: this helper never changes the original source file.
    # utf-8-sig also handles CSV files that contain a UTF-8 byte-order mark.
    with (BRONZE / relative).open(encoding='utf-8-sig', newline='') as stream:
        for raw in csv.DictReader(stream):
            # DictReader stores extra values under the None key. That means the
            # row has more fields than the header and should not enter Silver.
            if None in raw:
                raise ValueError(f'Malformed row in {relative}')

            # Strip whitespace at the boundary so every downstream step works
            # with the same representation of IDs, names, and numeric values.
            yield {k.strip(): (v or '').strip() for k, v in raw.items() if k and k.strip()}


def write(relative, columns, rows):
    # Create the destination folder lazily because some Silver subfolders may
    # not exist in a fresh checkout.
    path = SILVER / relative
    path.parent.mkdir(parents=True, exist_ok=True)

    # Write to a temporary file first. The existing output is replaced only
    # after the complete CSV has been written successfully.
    temporary = path.with_suffix('.csv.tmp')
    count = 0
    with temporary.open('w', encoding='utf-8', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=columns, extrasaction='raise')
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
            count += 1
    temporary.replace(path)
    print(f'{path.relative_to(ROOT)}: {count} rows', flush=True)
    return count


def number(value, integer=False):
    # Convert source text to a safe non-negative number. Returning None lets
    # the caller represent an invalid or missing source value as NULL/empty.
    if not value or value.casefold() in ('none', 'nan', 'null', 'n/a'):
        return None
    try:
        result = Decimal(value)
    except InvalidOperation:
        return None
    if not result.is_finite() or result < 0 or (integer and result != result.to_integral_value()):
        return None
    return int(result) if integer else str(result.quantize(Decimal('0.01')))


def clean_engine_models(stats):
    """Clean ENGINE.txt and write one row per manufacturer/model."""
    grouped = defaultdict(list)

    # ENGINE.txt can contain several records for the same manufacturer/model.
    # Grouping creates one Silver engine model while preserving all source rows.
    for row in read('faa/faa_registry/ENGINE.txt'):
        stats['engine_input'] += 1
        if row['MFR'].upper() in ('', 'NONE') or row['MODEL'].upper() in ('', 'NONE'):
            stats['engine_placeholder_removed'] += 1
            continue
        grouped[(row['MFR'], row['MODEL'])].append(row)
    models = []
    for (manufacturer, model), group in sorted(grouped.items()):
        # Keep every source code/type code so the cleaned record remains
        # traceable to the original FAA reference data.
        codes = sorted({row['CODE'] for row in group})
        types = sorted({row['TYPE'] for row in group if row['TYPE']})
        stats['engine_duplicate_identity_merged'] += len(group) - 1
        stats['engine_multitype_groups'] += len(types) > 1
        models.append({'source_codes': '|'.join(codes), 'manufacturer': manufacturer,
                       'model_name': model, 'source_type_codes': '|'.join(types),
                       'source': 'faa/faa_registry/ENGINE.txt'})
    write('engines/engine_models.csv', ['source_codes','manufacturer','model_name','source_type_codes','source'], models)


def clean_aircraft(stats):
    """Join MASTER.txt with ACFTREF.txt and write valid aircraft rows."""
    # ACFTREF is a lookup table: its CODE is referenced by MASTER's
    # MFR MDL CODE. This join enriches each aircraft with its model details.
    aircraft_models = {row['CODE']: row for row in read('faa/faa_registry/ACFTREF.txt')}
    if not aircraft_models:
        raise ValueError('Empty aircraft-model reference')
    seen = set()
    def aircraft_rows():
        for row in read('faa/faa_registry/MASTER.txt'):
            stats['aircraft_input'] += 1
            model = aircraft_models.get(row['MFR MDL CODE'])
            registration = row['N-NUMBER']

            # An aircraft without an identity or a valid reference model cannot
            # be used reliably by the application, so it is removed.
            if not registration or not model or not model['MFR'] or not model['MODEL']:
                stats['aircraft_invalid_removed'] += 1
                continue
            if registration in seen:
                stats['aircraft_duplicate_removed'] += 1
                continue
            seen.add(registration)
            year = number(row['YEAR MFR'], integer=True)
            if year is not None and not 1900 <= year <= 2026:
                # The project uses 2026 as its snapshot year. Keep the aircraft
                # but clear an implausible manufacturing year.
                year = None
                stats['aircraft_invalid_year_to_null'] += 1
            yield {'source_registration': 'N' + registration, 'manufacturer': model['MFR'],
                   'model': model['MODEL'], 'source_aircraft_type': model['TYPE-ACFT'],
                   'year': year, 'source_engine_code': row['ENG MFR MDL'],
                   'source': 'faa/faa_registry/MASTER.txt + ACFTREF.txt'}
    write('aircraft/aircraft.csv', ['source_registration','manufacturer','model','source_aircraft_type','year','source_engine_code','source'], aircraft_rows())


def clean_parts(stats):
    """Clean parts_master.csv and return the valid parts for supplier counts."""
    parts, seen = [], set()
    # Parts become the cleaned product reference data used by Gold generation.
    for row in read('aviation_parts/parts_master/parts_master.csv'):
        stats['parts_input'] += 1
        cost = number(row['unit_cost'])
        lead = number(row['lead_time_days'], integer=True)
        # A part must have an identity, family, cost, and lead time. Without
        # these values it cannot become a usable marketplace product.
        if not row['part_id'] or not row['part_family'] or cost is None or lead is None:
            stats['parts_invalid_removed'] += 1
            continue
        if row['part_id'] in seen:
            stats['parts_duplicate_removed'] += 1
            continue
        seen.add(row['part_id'])
        parts.append({'source_part_id': row['part_id'], 'part_family': row['part_family'],
                      'unit_cost': cost, 'lead_time_days': lead, 'source_supplier_id': row['supplier_id_primary'],
                      'criticality_class': row['criticality_class'], 'is_repairable': row['is_repairable'].lower() == 'yes',
                      'shelf_life_days': number(row['shelf_life_days'], integer=True),
                      'source': 'aviation_parts/parts_master/parts_master.csv'})
    write('products/parts.csv', ['source_part_id','part_family','unit_cost','lead_time_days','source_supplier_id','criticality_class','is_repairable','shelf_life_days','source'], sorted(parts, key=lambda r:r['source_part_id']))
    return parts


def write_supplier_summary(parts):
    """Write the compact supplier summary derived from valid parts."""
    # Silver keeps only supplier IDs that are actually referenced by valid
    # parts. It is a compact reference list, not yet a full company table.
    counts = Counter(row['source_supplier_id'] for row in parts if row['source_supplier_id'])
    write('suppliers/suppliers.csv', ['source_supplier_id','parts_count','source'],
          ({'source_supplier_id': key,'parts_count': count,'source': 'aviation_parts/parts_master/parts_master.csv'} for key,count in sorted(counts.items())))


def main():
    stats = Counter()
    clean_engine_models(stats)
    clean_aircraft(stats)
    parts = clean_parts(stats)
    write_supplier_summary(parts)
    print('Cleaning counters:', json.dumps(stats, sort_keys=True), flush=True)


if __name__ == '__main__':
    main()
