export interface CityHourlyWeather {
  dbt: number[]; // dry-bulb temperature, degC, index 0..8759 = hour 0..8759 of year
  rh: number[]; // relative humidity, %, same indexing
}

interface WeatherDataFile {
  cities: string[];
  hourly: Record<string, CityHourlyWeather>;
}

let cachedData: WeatherDataFile | null = null;

function getWeatherData(): WeatherDataFile {
  if (!cachedData) {
    cachedData = require("./data/weather-data.json") as WeatherDataFile;
  }
  return cachedData;
}

export const CITIES: readonly string[] = new Proxy([], {
  get(target, prop, receiver) {
    const cities = getWeatherData().cities;
    return Reflect.get(cities, prop, receiver);
  },
}) as unknown as readonly string[];

export function getCityWeather(city: string): CityHourlyWeather {
  const data = getWeatherData();
  const weather = data.hourly[city];
  if (!weather) {
    throw new Error(`Unknown city: ${city}`);
  }
  return weather;
}
