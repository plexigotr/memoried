export type AnyMemoryItem = Record<string, any>;

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function hasRealLocation(item: AnyMemoryItem): boolean {
  const lat = toNumberOrNull(item.latitude ?? item.lat);
  const lng = toNumberOrNull(item.longitude ?? item.lng);

  if (lat === null || lng === null) return false;

  // Null Island / ocean-like fallback coordinates must not be used.
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;

  // Valid world coordinate range.
  if (lat < -85 || lat > 85) return false;
  if (lng < -180 || lng > 180) return false;

  return true;
}

export function getValidLocationItems<T extends AnyMemoryItem>(items: T[]): T[] {
  return items.filter(hasRealLocation);
}

export function getItemLatLng(item: AnyMemoryItem) {
  const lat = toNumberOrNull(item.latitude ?? item.lat);
  const lng = toNumberOrNull(item.longitude ?? item.lng);
  if (lat === null || lng === null) return null;
  if (!hasRealLocation(item)) return null;
  return { lat, lng };
}
