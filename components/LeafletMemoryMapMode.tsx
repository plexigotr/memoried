"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { displayMemoryName, getLatLng, hasValidLocation, type LocationItem } from "@/lib/osmLocation";

const markerIcon = L.divIcon({ className: "memory-map-pin", html: '<span class="memory-map-pin-dot"></span>', iconSize: [22, 22], iconAnchor: [11, 11] });
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
  const route = useMemo(() => located.map((item) => getLatLng(item)).filter(Boolean) as [number, number][], [located]);
  const activeItem = located[activeIndex] || located[0];
  const activePosition = activeItem ? getLatLng(activeItem) : route[0] || null;
  const center = route[0] || [39, 35]; useEffect(() => { if (!open) return; const els = cardRefs.current.filter(Boolean); if (!els.length) return; const pick = () => { const vh = window.innerHeight; let bestLoc = -1, bestDist = Infinity; for (const el of els) { if (!el) continue; const r = el.getBoundingClientRect(); const loc = Number(el.getAttribute("data-loc")); if (loc >= 0) { const d = Math.abs(r.top + r.height / 2 - vh * 0.5); if (d < bestDist) { bestDist = d; bestLoc = loc; } } } if (bestLoc >= 0) setActiveIndex(bestLoc); }; const io = new IntersectionObserver(pick, { threshold: [0, 0.25, 0.5, 0.75, 1] }); els.forEach((el) => el && io.observe(el)); pick(); return () => io.disconnect(); }, [open, items]);
  function selectLocated(index: number) {
    setActiveIndex(index);
    const item = located[index];
    const originalIndex = items.findIndex((x) => x.id === item?.id);
    if (originalIndex >= 0) cardRefs.current[originalIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return (
    <>
      <button type="button" className="premium-map-button" aria-label="Harita Modu" title="Harita Modu" onClick={() => setOpen(true)}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg></button>
      {open ? (
        <div className="leaflet-memory-modal">
          <div className="leaflet-memory-header"><div><span>Anı Haritası</span><h2>{activeItem ? displayMemoryName(activeItem) : "Konumlu anılar"}</h2></div><button type="button" onClick={() => setOpen(false)}>Galeri Modu</button></div>
          <div className="leaflet-memory-map">
            <MapContainer center={center as [number, number]} zoom={route.length ? 7 : 5} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" subdomains="abcd" />
              {route.length > 1 ? <Polyline positions={route} pathOptions={{ color: "#d8a85f", weight: 4, opacity: 0.9 }} /> : null}
              {located.map((item, index) => {
                const pos = getLatLng(item);
                return pos ? <Marker key={item.id || index} position={pos} icon={markerIcon} eventHandlers={{ click: () => selectLocated(index) }} /> : null;
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
