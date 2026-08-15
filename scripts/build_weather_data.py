import os
import json
import re
import math
import struct

def sat_vapor_press(t):
    return 610.78 * math.exp((17.27 * t) / (237.3 + t))

def calc_rh(dbt, dew):
    if dew > dbt:
        dew = dbt
    sat_dbt = sat_vapor_press(dbt)
    sat_dew = sat_vapor_press(dew)
    return max(0.0, min(100.0, (sat_dew / sat_dbt) * 100.0))

def clean_float(val_str, default=0.0):
    try:
        s = val_str.strip().replace('--', '-')
        return float(s)
    except:
        return default

def parse_epw(fpath, fname):
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    loc_parts = lines[0].split(',')
    city = loc_parts[1].strip() if len(loc_parts) > 1 and loc_parts[1].strip() else ''
    state = loc_parts[2].strip() if len(loc_parts) > 2 else ''
    country = loc_parts[3].strip() if len(loc_parts) > 3 else ''
    
    data_lines = [l for l in lines[8:] if l.strip()]
    dbt_list = []
    rh_list = []
    for l in data_lines[:8760]:
        fields = l.split(',')
        dbt = clean_float(fields[6])
        rh = clean_float(fields[8])
        if rh > 100 or rh < 0:
            dew = clean_float(fields[7])
            rh = calc_rh(dbt, dew)
        dbt_list.append(round(dbt, 1))
        rh_list.append(round(rh, 1))
    return city, state, country, dbt_list, rh_list

def parse_fwt(fpath, fname):
    with open(fpath, 'rb') as f:
        data = f.read()
    header_size = 1248
    record_size = 52
    dbt_list = []
    rh_list = []
    for i in range(8760):
        rec = data[header_size + i*record_size : header_size + (i+1)*record_size]
        month, day, hour, f3, f4, dbt, dew, f7, f8, f9, f10, f11, f12 = struct.unpack('<iii10f', rec)
        rh = calc_rh(dbt, dew)
        dbt_list.append(round(dbt, 1))
        rh_list.append(round(rh, 1))
    return dbt_list, rh_list

def clean_city_label(raw):
    s = raw.replace('_', ' ').replace('-', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def get_region_and_country(fname, country_code, state):
    fname_u = fname.upper()
    if fname_u.startswith('USA_') or 'TMY' in fname_u or 'CZ2010' in fname_u or 'CZ2022' in fname_u or 'CZ2025' in fname_u or country_code in ['USA', 'US']:
        return 'North America', 'United States', state or 'General'
    if fname_u.startswith('CAN_') or '_BC_' in fname_u or '_AB_' in fname_u or '_ON_' in fname_u or '_QC_' in fname_u or '_MB_' in fname_u or '_SK_' in fname_u or '_NS_' in fname_u or '_YT_' in fname_u or country_code in ['CAN', 'CA']:
        return 'North America', 'Canada', state or 'General'
    if fname_u.startswith('AUS_') or country_code in ['AUS', 'AU']:
        return 'Asia Pacific', 'Australia', state or 'General'
    if fname_u.startswith('NZL_') or country_code in ['NZL', 'NZ']:
        return 'Asia Pacific', 'New Zealand', state or 'General'
    if fname_u.startswith('IND_') or country_code in ['IND', 'IN']:
        return 'Asia Pacific', 'India', state or 'General'
    if fname_u.startswith('CHN_') or ('IWEC' in fname_u and any(k in fname for k in ['Beijing', 'Shanghai', 'Guangzhou', 'HongKong', 'Shenyang', 'Harbin', 'Nanjing'])):
        return 'Asia Pacific', 'China', state or 'General'
    if fname_u.startswith('FRA_') or any(k in fname for k in ['Lyon', 'Nantes', 'Paris', 'Marseille', 'Nancy']):
        return 'Europe', 'France', state or 'General'
    if 'EWY' in fname_u or any(k in fname for k in ['Kew', 'Heathrow', 'London', 'Birmingham', 'Glasgow', 'Edinburgh', 'Norwich', 'Sheffield', 'Dundee', 'Bristol', 'Aberdeen']):
        return 'Europe', 'United Kingdom', state or 'General'
    if 'IGDG' in fname_u or any(k in fname for k in ['Rome', 'Milan', 'Naples', 'Venice', 'Torino', 'Bari', 'Palermo', 'Messina', 'Pisa', 'Brindisi', 'Vicenza']):
        return 'Europe', 'Italy', state or 'General'
    if 'IWEC' in fname_u and any(k in fname for k in ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Palma', 'Santander']):
        return 'Europe', 'Spain', state or 'General'
    if 'IWEC' in fname_u and any(k in fname for k in ['Berlin', 'München']):
        return 'Europe', 'Germany', state or 'General'
    if 'IWEC' in fname_u and any(k in fname for k in ['Vienna', 'Graz', 'Innsbruck']):
        return 'Europe', 'Austria', state or 'General'
    if 'DOE2' in fname_u or any(k in fname for k in ['Durban', 'CapeTown', 'Johannesburg', 'Pretoria', 'Musina', 'Upington']):
        return 'Middle East & Africa', 'South Africa', state or 'General'
    if 'ASHRAE' in fname_u:
        return 'ASHRAE Standards', 'ASHRAE Climate Zones', 'Standard'
    return 'Other Regions', country_code or 'International', state or 'General'

def main():
    weather_dir = 'public/Weather'
    files = sorted(os.listdir(weather_dir))

    with open('src/lib/calc-engine/data/weather-data.json', 'r', encoding='utf-8') as f:
        existing_json = json.load(f)

    hourly_map = dict(existing_json['hourly'])
    city_epw_map = {}
    region_tree = {}

    def add_to_region(reg, ctry, st, city):
        st_clean = clean_city_label(st) if st else 'General'
        if reg not in region_tree:
            region_tree[reg] = {}
        if ctry not in region_tree[reg]:
            region_tree[reg][ctry] = {}
        if st_clean not in region_tree[reg][ctry]:
            region_tree[reg][ctry][st_clean] = []
        if city not in region_tree[reg][ctry][st_clean]:
            region_tree[reg][ctry][st_clean].append(city)

    # Retain existing 84 cities in region tree under 'Existing Regions'
    for city_key in existing_json['cities']:
        add_to_region('Existing Regions', 'Global Cities', 'Built-in', city_key)

    for f in files:
        fpath = os.path.join(weather_dir, f)
        if f.endswith('.epw'):
            city_extracted, state, country, dbt, rh = parse_epw(fpath, f)
            base_name = city_extracted if city_extracted else os.path.splitext(f)[0]
            label = clean_city_label(base_name)
            if label in hourly_map and label not in existing_json['cities']:
                label = f"{label} ({f})"
            hourly_map[label] = {'dbt': dbt, 'rh': rh}
            city_epw_map[label] = f
            reg, ctry, st = get_region_and_country(f, country, state)
            add_to_region(reg, ctry, st, label)
        elif f.endswith('.fwt'):
            dbt, rh = parse_fwt(fpath, f)
            base_name = os.path.splitext(f)[0]
            label = clean_city_label(base_name)
            if label in hourly_map and label not in existing_json['cities']:
                label = f"{label} ({f})"
            hourly_map[label] = {'dbt': dbt, 'rh': rh}
            city_epw_map[label] = f
            reg, ctry, st = get_region_and_country(f, '', '')
            add_to_region(reg, ctry, st, label)

    cities_final = list(hourly_map.keys())

    # Write weather-data.json
    with open('src/lib/calc-engine/data/weather-data.json', 'w', encoding='utf-8') as f:
        json.dump({'cities': cities_final, 'hourly': hourly_map}, f, separators=(',', ':'))

    # Write epw-files.ts
    epw_code = "/**\n * Mapping of city names to their corresponding weather (.epw / .fwt) file names.\n */\n"
    epw_code += f"export const CITY_EPW_MAP: Record<string, string> = {json.dumps(city_epw_map, indent=2)};\n\n"
    epw_code += """export function getEpwFilename(cityName: string): string {
  if (!cityName) return "";
  if (CITY_EPW_MAP[cityName]) return CITY_EPW_MAP[cityName];
  if (cityName.endsWith(".epw") || cityName.endsWith(".fwt")) return cityName;
  const sanitized = cityName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  return `${sanitized}_WEATHER.epw`;
}
"""
    with open('src/lib/location-data/epw-files.ts', 'w', encoding='utf-8') as f:
        f.write(epw_code)

    # Write regions.ts
    regions_code = "/**\n * Hierarchical region -> country -> province/state -> city mapping.\n */\n"
    regions_code += f"export const REGION_DATA: Record<string, Record<string, Record<string, string[]>>> = {json.dumps(region_tree, indent=2)};\n"
    with open('src/lib/location-data/regions.ts', 'w', encoding='utf-8') as f:
        f.write(regions_code)

    print(f"Successfully processed {len(files)} weather files into {len(cities_final)} total locations!")

if __name__ == '__main__':
    main()
