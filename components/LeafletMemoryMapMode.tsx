"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { displayMemoryName, getLatLng, hasValidLocation, shortLocationName, type LocationItem } from "@/lib/osmLocation";

function makeIcon(active: boolean) {
  return L.divIcon({
    className: `memory-map-pin${active ? " memory-map-pin--active" : ""}`,
    html: '<span class="memory-map-pin-dot"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function haversine(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function MapController({ active }: { active: [number, number] | null }) {
  const map = useMap();
  if (active) setTimeout(() => map.flyTo(active, 12, { duration: 0.8 }), 0);
  return null;
}

export default function LeafletMemoryMapMode({ items }: { items: LocationItem[] }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const located = useMemo(() => (items || []).filter(hasValidLocation), [items]);
  const route = useMemo(
    () => located.map((item) => getLatLng(item)).filter(Boolean) as [number, number][],
    [located]
  );
  const totalKm = useMemo(() => {
    let d = 0;
    for (let i = 1; i < route.length; i++) d += haversine(route[i - 1], route[i]);
    return d;
  }, [route]);
  const activeItem = located[activeIndex] || located[0];
  const activePosition = activeItem ? getLatLng(activeItem) : route[0] || null;
  const center = route[0] || [39, 35];
  const traveled = route.slice(0, Math.max(1, activeIndex + 1));
  useEffect(() => {
    if (!open) return;
    const els = cardRefs.current.filter(Boolean);
    if (!els.length) return;
    const pick = () => {
      const vh = window.innerHeight;
      let bestLoc = -1;
      let bestDist = Infinity;
      for (const el of els) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const loc = Number(el.getAttribute("data-loc"));
        if (loc >= 0) {
          const d = Math.abs(r.top + r.height / 2 - vh * 0.5);
          if (d < bestDist) {
            bestDist = d;
            bestLoc = loc;
          }
        }
      }
      if (bestLoc >= 0) setActiveIndex(bestLoc);
    };
    const io = new IntersectionObserver(pick, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    els.forEach((el) => el && io.observe(el));
    pick();
    return () => io.disconnect();
  }, [open, items]);
  function selectLocated(index: number) {
    setActiveIndex(index);
    const item = located[index];
    const originalIndex = items.findIndex((x) => x.id === item?.id);
    if (originalIndex >= 0) cardRefs.current[originalIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return (
    <>
      <button type="button" className="premium-map-button" aria-label="Harita Modu" title="Harita Modu" onClick={() => setOpen(true)}><img src="/world-map.png" alt="" /></button>
      {open ? (
        <div className="leaflet-memory-modal">
          <div className="leaflet-memory-header"><div><span>Anı Haritası</span><h2>{activeItem ? displayMemoryName(activeItem) : "Konumlu anılar"}</h2></div><button type="button" onClick={() => setOpen(false)}>Galeri Modu</button></div>
          <div className="leaflet-memory-map">
            {located.length > 1 ? (
              <div className="leaflet-memory-journey">
                {located.length} yer{totalKm >= 1 ? ` · ~${Math.round(totalKm)} km` : ""}
              </div>
            ) : null}
            <MapContainer center={center as [number, number]} zoom={route.length ? 7 : 5} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" subdomains="abcd" />
              {route.length > 1 ? <Polyline positions={route} pathOptions={{ color: "#d8a85f", weight: 2, opacity: 0.28, dashArray: "1 9" }} /> : null}
              {traveled.length > 1 ? <Polyline positions={traveled} pathOptions={{ color: "#d8a85f", weight: 4, opacity: 0.95 }} /> : null}
              {located.map((item, index) => {
                const pos = getLatLng(item);
                const src = item.url || item.file_url || item.signedUrl || item.fileUrl;
                return pos ? (
                  <Marker key={item.id || index} position={pos} icon={makeIcon(index === activeIndex)} eventHandlers={{ click: () => selectLocated(index) }}>
                    <Popup className="memory-map-popup">
                      {src ? <img src={src} alt="" /> : null}
                      <strong>{displayMemoryName(item) || "Anı"}</strong>
                      {item.location_name ? <span>{shortLocationName(item.location_name)}</span> : null}
                    </Popup>
                  </Marker>
                ) : null;
              })}
              <MapController active={activePosition} />
            </MapContainer>
          </div>
          <div className="leaflet-memory-list">
            {(items || []).map((item, index) => {
              const pos = getLatLng(item);
              const locatedIndex = located.findIndex((x) => x.id === item.id);
              const src = item.url || item.file_url || item.signedUrl || item.fileUrl;
              return (
                <div key={item.id || index} ref={(el) => { cardRefs.current[index] = el; }} className="leaflet-memory-card" data-loc={locatedIndex} onClick={() => { if (locatedIndex >= 0) setActiveIndex(locatedIndex); }}>
                  {src ? <img src={src} alt={displayMemoryName(item) || "Anı"} /> : null}
                  <div className="leaflet-memory-card-info"><span>{String(index + 1).padStart(2, "0")}</span><strong>{displayMemoryName(item) || "İsimsiz fotoğraf"}</strong>{!pos ? <em>Konum belirtilmemiş</em> : null}{item.note && typeof item.note === "string" ? <p>{item.note}</p> : null}{item.audio_url || item.audioUrl ? <audio controls src={item.audio_url || item.audioUrl} /> : null}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}
