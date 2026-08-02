type CacheEntry<T> = { expiresAt: number; value: T };

export type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_INTERVAL_MS = 1_100;
let lastRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

function readCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeCache<T>(key: string, value: T) {
  if (cache.size >= 500) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

async function limitedFetch(url: URL) {
  const job = requestQueue.catch(() => undefined).then(async () => {
    const waitMs = Math.max(
      0,
      REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt)
    );
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    lastRequestAt = Date.now();
    return fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "tr,en;q=0.8",
        "User-Agent": "Memoried/1.0 (+https://memoried.me)",
      },
      signal: AbortSignal.timeout(8_000),
    });
  });

  requestQueue = job.then(
    () => undefined,
    () => undefined
  );
  return job;
}

function normalize(value: unknown): NominatimResult | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.display_name !== "string" ||
    typeof item.lat !== "string" ||
    typeof item.lon !== "string"
  ) {
    return null;
  }
  return {
    display_name: item.display_name,
    lat: item.lat,
    lon: item.lon,
  };
}

async function requestJson(url: URL) {
  const response = await limitedFetch(url);
  if (!response.ok) {
    throw new Error(`OpenStreetMap location service returned ${response.status}.`);
  }
  return response.json() as Promise<unknown>;
}

export async function searchLocations(query: string) {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  const key = `search:${normalizedQuery.toLocaleLowerCase("tr-TR")}`;
  const cached = readCache<NominatimResult[]>(key);
  if (cached) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "7");
  url.searchParams.set("q", normalizedQuery);

  const payload = await requestJson(url);
  const results = Array.isArray(payload)
    ? payload
        .map(normalize)
        .filter((item): item is NominatimResult => item !== null)
    : [];
  writeCache(key, results);
  return results;
}

export async function reverseLocation(latitude: number, longitude: number) {
  const key = `reverse:${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
  const cached = readCache<NominatimResult>(key);
  if (cached) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "16");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  const result = normalize(await requestJson(url));
  if (result) writeCache(key, result);
  return result;
}
