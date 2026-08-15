import { REGION_DATA } from "@/lib/location-data/regions";

export interface FlatLocation {
  region: string;
  country: string;
  province: string;
  city: string;
}

let cache: FlatLocation[] | null = null;

/** Flattens the Region -> Country -> Province -> City[] hierarchy into a searchable
 * list of every known city, for the Location box's type-to-search autocomplete. */
export function getFlatLocations(): FlatLocation[] {
  if (cache) return cache;
  const out: FlatLocation[] = [];
  for (const [region, countries] of Object.entries(REGION_DATA)) {
    for (const [country, provinces] of Object.entries(countries)) {
      for (const [province, cities] of Object.entries(provinces)) {
        for (const city of cities) {
          out.push({ region, country, province, city });
        }
      }
    }
  }
  cache = out;
  return out;
}

export function searchLocations(query: string, limit = 8): FlatLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getFlatLocations()
    .filter((loc) => loc.city.toLowerCase().includes(q))
    .sort((a, b) => a.city.toLowerCase().indexOf(q) - b.city.toLowerCase().indexOf(q))
    .slice(0, limit);
}
