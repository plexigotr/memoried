export type LocationItem = {
  id?: bigint | number | string;
  title?: string | null;
  name?: string | null;
  location_name?: string | null;
  locationName?: string | null;
  location?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  item_type?: string | null;
  url?: string | null;
  signedUrl?: string | null;
  file_url?: string | null;
  fileUrl?: string | null;
  note?: string | null;
  content_text?: string | null;
  audio_url?: string;
  audioUrl?: string;
};

export function shortLocationName(raw?: string | null): string {
  if (!raw) return "";
  const text = String(raw).trim();
  if (!text) return "";
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  const useful = parts.filter((p) => !/no:|sokak|cadde|mahallesi|mah\.|street|road|avenue|bölge|\d/.test(p.toLowerCase()));
  if (useful.length >= 2) return useful.slice(-2).join(", ");
  return parts.slice(-2).join(", ") || text;
}
export function displayMemoryName(item: LocationItem): string {
  const title = item?.title || item?.name;
  if (typeof title === "string" && title.trim()) return title.trim();
  return shortLocationName(item?.location_name || item?.locationName || item?.location || "");
}
export function hasValidLocation(item: LocationItem): boolean {
  const lat = Number(item?.latitude ?? item?.lat);
  const lng = Number(item?.longitude ?? item?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return lat >= -85 && lat <= 85 && lng >= -180 && lng <= 180;
}
export function getLatLng(item: LocationItem): [number, number] | null {
  if (!hasValidLocation(item)) return null;
  return [Number(item.latitude ?? item.lat), Number(item.longitude ?? item.lng)];
}
