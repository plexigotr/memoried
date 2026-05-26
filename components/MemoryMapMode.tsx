"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cleanMemoryNote, shortLocationName } from "@/lib/memoryMapFormat";

type MemoryKind = "image" | "text" | "video" | "audio" | string;

type MapItem = {
  id: string;
  itemType?: MemoryKind;
  title?: string | null;
  note?: string | null;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  locationName?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  rotation?: number | null;
};

type Props = {
  lang: "tr" | "en";
  items: MapItem[];
};

declare global {
  interface Window {
    google?: any;
    __memoriedGoogleMapsLoading?: Promise<void>;
  }
}

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__memoriedGoogleMapsLoading) return window.__memoriedGoogleMapsLoading;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  if (!apiKey) return Promise.reject(new Error("Google Maps API key missing"));

  window.__memoriedGoogleMapsLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-memoried-google-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps could not load")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=tr`;
    script.async = true;
    script.defer = true;
    script.dataset.memoriedGoogleMaps = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps could not load"));
    document.head.appendChild(script);
  });

  return window.__memoriedGoogleMapsLoading;
}

function toNumber(value: number | string | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function itemPoint(item: MapItem) {
  const lat = toNumber(item.latitude);
  const lng = toNumber(item.longitude);
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

function getDisplayName(item: MapItem, lang: "tr" | "en") {
  const title = String(item.title || "").trim();
  if (title) return title;
  const loc = shortLocationName(item.locationName || "");
  if (loc) return loc;
  if (item.itemType === "text") return lang === "en" ? "Memory note" : "Anı notu";
  if (item.itemType === "audio") return lang === "en" ? "Voice memory" : "Ses anısı";
  if (item.itemType === "video") return lang === "en" ? "Video memory" : "Video anısı";
  return lang === "en" ? "Untitled photo" : "İsimsiz fotoğraf";
}

function buildMarkerIcon(active = false) {
  const size = active ? 42 : 32;
  return {
    path: "M12 2C8.1 2 5 5.1 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z",
    fillColor: active ? "#d8b37a" : "#7b6b59",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: active ? 2.5 : 1.5,
    scale: size / 24,
    anchor: new window.google.maps.Point(12, 22),
  };
}

export default function MemoryMapMode({ lang, items }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const timelineItems = useMemo(() => items.filter((item) => item.itemType !== "image" || item.imageUrl), [items]);
  const locatedItems = useMemo(() => timelineItems.filter((item) => itemPoint(item)), [timelineItems]);
  const activeItem = timelineItems[activeIndex] || timelineItems[0];

  function focusItem(index: number, shouldScroll = true) {
    const item = timelineItems[index];
    if (!item) return;
    setActiveIndex(index);

    if (shouldScroll) {
      setTimeout(() => {
        cardRefs.current[item.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 40);
    }

    const point = itemPoint(item);
    if (point && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(point);
      mapInstanceRef.current.setZoom(11);
    }
  }

  useEffect(() => {
    if (!open || locatedItems.length === 0) return;

    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        setError("");

        const points = locatedItems.map((item) => itemPoint(item)).filter(Boolean) as { lat: number; lng: number }[];
        const firstPoint = itemPoint(activeItem) || points[0];

        if (!firstPoint) return;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: firstPoint,
            zoom: 5,
            mapTypeId: "roadmap",
            disableDefaultUI: true,
            zoomControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: false,
            gestureHandling: "greedy",
            styles: [
              { elementType: "geometry", stylers: [{ color: "#ebe6dc" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#6b5d4d" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#f7f1e7" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#b9cbd0" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
              { featureType: "poi", stylers: [{ visibility: "off" }] },
              { featureType: "transit", stylers: [{ visibility: "off" }] },
            ],
          });
        }

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        if (points.length >= 2) {
          polylineRef.current = new window.google.maps.Polyline({
            path: points,
            geodesic: true,
            strokeColor: "#d8b37a",
            strokeOpacity: 0.95,
            strokeWeight: 4,
            icons: [
              {
                icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
                offset: "0",
                repeat: "18px",
              },
            ],
          });
          polylineRef.current.setMap(mapInstanceRef.current);
        }

        locatedItems.forEach((item) => {
          const point = itemPoint(item);
          if (!point) return;
          const timelineIndex = timelineItems.findIndex((candidate) => candidate.id === item.id);
          const marker = new window.google.maps.Marker({
            map: mapInstanceRef.current,
            position: point,
            title: getDisplayName(item, lang),
            icon: buildMarkerIcon(timelineIndex === activeIndex),
            zIndex: timelineIndex === activeIndex ? 10 : 1,
          });
          marker.addListener("click", () => focusItem(timelineIndex, true));
          markersRef.current.push(marker);
        });

        const bounds = new window.google.maps.LatLngBounds();
        points.forEach((point) => bounds.extend(point));
        if (points.length > 1) {
          mapInstanceRef.current.fitBounds(bounds, 52);
        } else {
          mapInstanceRef.current.setCenter(points[0]);
          mapInstanceRef.current.setZoom(11);
        }
      })
      .catch(() => setError(lang === "en" ? "Map could not be loaded." : "Harita yüklenemedi."));

    return () => {
      cancelled = true;
    };
  }, [open, locatedItems, timelineItems, activeIndex, activeItem, lang]);

  useEffect(() => {
    if (!open || !mapInstanceRef.current || !activeItem) return;
    const point = itemPoint(activeItem);
    if (point) {
      mapInstanceRef.current.panTo(point);
      mapInstanceRef.current.setZoom(11);
    }
    markersRef.current.forEach((marker, index) => {
      const markerItem = locatedItems[index];
      const timelineIndex = timelineItems.findIndex((candidate) => candidate.id === markerItem?.id);
      marker.setIcon(buildMarkerIcon(timelineIndex === activeIndex));
      marker.setZIndex(timelineIndex === activeIndex ? 10 : 1);
    });
  }, [activeIndex, activeItem, locatedItems, open, timelineItems]);

  if (timelineItems.length === 0) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="memoried-map-launch-button">
        <span className="text-lg">🗺️</span>
        <span>{lang === "en" ? "Map Mode" : "Harita Modu"}</span>
      </button>

      {open && (
        <div className="memoried-map-modal">
          <div className="memoried-map-topbar">
            <div className="min-w-0">
              <p className="memoried-map-eyebrow">{lang === "en" ? "Memory route" : "Anı rotası"}</p>
              <h2 className="memoried-map-heading">{getDisplayName(activeItem, lang)}</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="memoried-map-close">
              {lang === "en" ? "Gallery" : "Galeri"}
            </button>
          </div>

          <div className="memoried-map-canvas-wrap">
            {locatedItems.length > 0 ? (
              <div ref={mapRef} className="memoried-map-canvas" />
            ) : (
              <div className="memoried-map-empty">
                {lang === "en" ? "No located photos yet." : "Henüz konum eklenmiş fotoğraf yok."}
              </div>
            )}
            {error ? <div className="memoried-map-error">{error}</div> : null}
          </div>

          <div className="memoried-map-timeline">
            {timelineItems.map((item, index) => {
              const title = getDisplayName(item, lang);
              const note = cleanMemoryNote(item.note || "");
              const isActive = index === activeIndex;
              const rotation = Number(item.rotation || 0);

              return (
                <div
                  key={item.id}
                  ref={(node) => {
                    cardRefs.current[item.id] = node;
                  }}
                  className={`memoried-map-story-card ${isActive ? "is-active" : ""}`}
                  onClick={() => focusItem(index, false)}
                >
                  <div className="memoried-map-card-index">{String(index + 1).padStart(2, "0")}</div>

                  {item.itemType === "image" && item.imageUrl ? (
                    <div className="memoried-map-image-frame">
                      <img
                        src={item.imageUrl}
                        alt={title}
                        className="memoried-map-image"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      />
                    </div>
                  ) : item.itemType === "video" && item.mediaUrl ? (
                    <video controls src={item.mediaUrl} className="memoried-map-media" />
                  ) : item.itemType === "audio" && item.mediaUrl ? (
                    <div className="memoried-map-audio-card">
                      <span>🎧</span>
                      <audio controls src={item.mediaUrl} className="w-full" />
                    </div>
                  ) : (
                    <div className="memoried-map-text-card">{note || title}</div>
                  )}

                  <div className="memoried-map-card-copy">
                    <p className="memoried-map-card-type">
                      {item.itemType === "audio"
                        ? lang === "en"
                          ? "Voice"
                          : "Ses"
                        : item.itemType === "video"
                        ? "Video"
                        : item.itemType === "text"
                        ? lang === "en"
                          ? "Note"
                          : "Not"
                        : lang === "en"
                        ? "Photo"
                        : "Fotoğraf"}
                    </p>
                    <h3>{title}</h3>
                    {note && item.itemType !== "text" ? <p className="memoried-map-card-note">{note}</p> : null}
                    {!itemPoint(item) && item.itemType === "image" ? (
                      <p className="memoried-map-no-location">{lang === "en" ? "No location yet" : "Konum yok"}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
