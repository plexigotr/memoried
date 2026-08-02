"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const markerIcon = new L.Icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Picker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}
function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMapEvents({});
  useEffect(() => { if (position) map.setView(position, 14, { animate: true }); }, [position, map]);
  return null;
}
export default function LeafletMiniMap({ position, onPick }: { position: [number, number] | null; onPick: (lat: number, lng: number) => void; }) {
  const center: [number, number] = position || [39.0, 35.0];
  return (
    <div className="leaflet-mini-map">
      <MapContainer center={center} zoom={position ? 14 : 5} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Picker onPick={onPick} />
        <Recenter position={position} />
        {position ? <Marker position={position} icon={markerIcon} /> : null}
      </MapContainer>
    </div>
  );
}
