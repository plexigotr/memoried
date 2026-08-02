export type RoutePoint = {
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export function getRoutePoints(items: RoutePoint[]) {
  return items
    .map((item) => {
      const lat = Number(item.latitude ?? item.lat);
      const lng = Number(item.longitude ?? item.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    })
    .filter(Boolean) as { lat: number; lng: number }[];
}

export function rotateDegrees(current?: number | string | null) {
  const value = Number(current || 0);
  return (value + 90) % 360;
}
