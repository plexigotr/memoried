declare const google: any;

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

export function drawGoogleRoutePolyline(map: any, points: { lat: number; lng: number }[], previous?: any) {
  if (!map || typeof google === "undefined") return previous || null;

  if (previous) previous.setMap(null);
  if (points.length < 2) return null;

  const polyline = new google.maps.Polyline({
    path: points,
    geodesic: true,
    strokeColor: "#d8b37a",
    strokeOpacity: 0.95,
    strokeWeight: 3,
    icons: [
      {
        icon: {
          path: "M 0,-1 0,1",
          strokeOpacity: 1,
          scale: 3,
        },
        offset: "0",
        repeat: "18px",
      },
    ],
  });

  polyline.setMap(map);
  return polyline;
}

export function rotateDegrees(current?: number | string | null) {
  const value = Number(current || 0);
  return (value + 90) % 360;
}
