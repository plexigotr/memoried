"use client";
import "leaflet/dist/leaflet.css";
import { useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { displayMemoryName, getLatLng, hasValidLocation, type LocationItem } from "@/lib/osmLocation";

const markerIcon = new L.Icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
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
  const center = route[0] || [39, 35];
  function selectLocated(index: number) {
    setActiveIndex(index);
    const item = located[index];
    const originalIndex = items.findIndex((x) => x.id === item?.id);
    if (originalIndex >= 0) cardRefs.current[originalIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return (
    <>
      <button type="button" className="premium-map-button" onClick={() => setOpen(true)}>🗺️ Harita Modu</button>
      {open ? (
        <div className="leaflet-memory-modal">
          <div className="leaflet-memory-header"><div><span>Anı Haritası</span><h2>{activeItem ? displayMemoryName(activeItem) : "Konumlu anılar"}</h2></div><button type="button" onClick={() => setOpen(false)}>Galeri Modu</button></div>
          <div className="leaflet-memory-map">
            <MapContainer center={center as [number, number]} zoom={route.length ? 7 : 5} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
                <div key={item.id || index} ref={(el) => { cardRefs.current[index] = el; }} className="leaflet-memory-card" onClick={() => { if (locatedIndex >= 0) setActiveIndex(locatedIndex); }}>
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
