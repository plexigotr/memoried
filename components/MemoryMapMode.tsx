"use client";

import { cleanMemoryNote, shortLocationName } from "@/lib/memoryMapFormat";
import { useEffect, useMemo, useRef, useState } from "react";

type MapItem = {
  id: string;
  type: "text" | "image" | "video" | "audio" | string;
  title: string;
  note: string;
  imageUrl: string | null;
  mediaUrl?: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=${lang === "en" ? "en" : "tr"}`;
    script.async = true;
    script.defer = true;
    script.dataset.memoriedGoogleMaps = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps could not load"));
    document.head.appendChild(script);
  });

  return window.__memoriedGoogleMapsLoading;
}

function hasLocation(item: MapItem) {
  return item.latitude !== null && item.longitude !== null && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude));
}

function itemPoint(item: MapItem) {
  return { lat: Number(item.latitude), lng: Number(item.longitude) };
}

function typeLabel(type: string, lang: "tr" | "en") {
  if (type === "image") return lang === "en" ? "Photo" : "Fotoğraf";
  if (type === "video") return lang === "en" ? "Video" : "Video";
  if (type === "audio") return lang === "en" ? "Voice" : "Ses";
  return lang === "en" ? "Note" : "Not";
}

export default function MemoryMapMode({ lang, items }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | HTMLDivElement | null>>([]);

  const visibleItems = useMemo(() => items.filter((item) => item.imageUrl || item.mediaUrl || item.note || item.title), [items]);
  const locatedItems = useMemo(() => visibleItems.filter(hasLocation), [visibleItems]);
  const activeItem = visibleItems[activeIndex] || visibleItems[0];

  function resetMapObjects() {
    markersRef.current.forEach((marker) => marker?.setMap?.(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }

  function drawRouteAndMarkers(map: any) {
    if (!map || !window.google?.maps) return;
    resetMapObjects();

    const points = locatedItems.map(itemPoint);
    if (points.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((point, index) => {
      bounds.extend(point);
      const marker = new window.google.maps.Marker({
        map,
        position: point,
        label: {
          text: String(index + 1),
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "700",
        },
      });
      markersRef.current.push(marker);
    });

    if (points.length > 1) {
      polylineRef.current = new window.google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: "#d8b37a",
        strokeOpacity: 0.96,
        strokeWeight: 4,
        icons: [
          {
            icon: {
              path: "M 0,-1 0,1",
              strokeOpacity: 0.95,
              scale: 3,
            },
            offset: "0",
            repeat: "20px",
          },
        ],
      });
      polylineRef.current.setMap(map);
    }

    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(14);
    } else {
      map.fitBounds(bounds, 70);
    }
  }

  function goToItem(index: number, behavior: ScrollBehavior = "smooth") {
    setActiveIndex(index);
    const item = visibleItems[index];

    cardRefs.current[index]?.scrollIntoView({ behavior, block: "center" });

    if (item && hasLocation(item) && mapInstanceRef.current) {
      const point = itemPoint(item);
      mapInstanceRef.current.panTo(point);
      mapInstanceRef.current.setZoom(14);
    }
  }

  useEffect(() => {
    if (!open) return;

    loadGoogleMaps()
      .then(() => {
        setError("");
        if (!mapRef.current || mapInstanceRef.current) return;

        const firstPoint = locatedItems[0] ? itemPoint(locatedItems[0]) : { lat: 41.0082, lng: 28.9784 };
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: firstPoint,
          zoom: locatedItems.length ? 8 : 5,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: [
            { elementType: "geometry", stylers: [{ saturation: -8 }, { lightness: 4 }] },
            { featureType: "poi", stylers: [{ visibility: "simplified" }] },
          ],
        });

        drawRouteAndMarkers(mapInstanceRef.current);
      })
      .catch(() => setError(lang === "en" ? "Map could not be loaded." : "Harita yüklenemedi."));
  }, [open, lang, locatedItems.length]);

  useEffect(() => {
    if (!open || !mapInstanceRef.current) return;
    drawRouteAndMarkers(mapInstanceRef.current);
  }, [open, locatedItems.length]);

  useEffect(() => {
    if (!open || !activeItem || !hasLocation(activeItem) || !mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(itemPoint(activeItem));
    mapInstanceRef.current.setZoom(14);
  }, [activeIndex, open]);

  function handleVerticalScroll() {
    const container = listRef.current;
    if (!container) return;

    const containerMiddle = container.getBoundingClientRect().top + container.clientHeight * 0.45;
    let nearestIndex = activeIndex;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const middle = rect.top + rect.height / 2;
      const distance = Math.abs(middle - containerMiddle);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex !== activeIndex) setActiveIndex(nearestIndex);
  }

  if (visibleItems.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/25 bg-black/65 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_55px_rgba(0,0,0,.34)] backdrop-blur-2xl transition hover:scale-105 active:scale-95"
      >
        <span className="mr-2">🗺️</span>
        {lang === "en" ? "Open Map Mode" : "Harita Modu"}
      </button>

      {open && (
        <div className="memory-map-mode fixed inset-0 z-[99998] overflow-hidden bg-[#0f0d0a] text-white">
          <div className="flex h-[100dvh] w-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0f0d0a]/95 px-5 py-4 backdrop-blur-xl">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em] text-[#d8b37a]/80">
                  {lang === "en" ? "Memory map" : "Anı haritası"}
                </p>
                <h2 className="mt-1 truncate text-xl font-semibold">
                  {activeItem?.locationName ? shortLocationName(activeItem.locationName) : lang === "en" ? "Memories" : "Anılar"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur-xl"
              >
                {lang === "en" ? "Gallery" : "Galeri Modu"}
              </button>
            </div>

            <div className="relative h-[34dvh] min-h-[230px] shrink-0 border-b border-white/10 bg-white/5">
              {locatedItems.length > 0 ? (
                <div ref={mapRef} className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/60">
                  {lang === "en"
                    ? "No locations added yet. You can add them from edit page."
                    : "Henüz konum eklenmemiş. Düzenleme sayfasından ekleyebilirsin."}
                </div>
              )}
              {error ? <div className="absolute left-4 top-4 rounded-2xl bg-red-500/90 px-4 py-2 text-sm">{error}</div> : null}
            </div>

            <div
              ref={listRef}
              onScroll={handleVerticalScroll}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-28 pt-5"
            >
              <div className="mx-auto flex max-w-xl flex-col gap-5">
                {visibleItems.map((item, index) => {
                  const isActive = index === activeIndex;
                  const cleanNote = cleanMemoryNote(item.note);
                  const rotation = Number(item.rotation || 0);

                  return (
                    <button
                      type="button"
                      key={item.id}
                      ref={(node) => {
                        cardRefs.current[index] = node;
                      }}
                      onClick={() => goToItem(index)}
                      className={`group w-full overflow-hidden rounded-[2rem] border text-left transition duration-300 ${
                        isActive
                          ? "border-[#d8b37a] bg-white/[0.08] shadow-[0_24px_80px_rgba(216,179,122,.16)]"
                          : "border-white/10 bg-white/[0.045]"
                      }`}
                    >
                      {item.imageUrl ? (
                        <div className="relative overflow-hidden bg-black/35">
                          <img
                            src={item.imageUrl}
                            alt={item.title || typeLabel(item.type, lang)}
                            className="block max-h-[58vh] w-full object-contain transition duration-300"
                            style={{ transform: `rotate(${rotation}deg)` }}
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                        </div>
                      ) : item.type === "video" && item.mediaUrl ? (
                        <video controls src={item.mediaUrl} className="block w-full bg-black" />
                      ) : item.type === "audio" && item.mediaUrl ? (
                        <div className="p-5">
                          <audio controls src={item.mediaUrl} className="w-full" />
                        </div>
                      ) : null}

                      <div className="p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-[#d8b37a]">
                            {String(index + 1).padStart(2, "0")} · {typeLabel(item.type, lang)}
                          </p>
                          {hasLocation(item) ? <span className="h-2 w-2 rounded-full bg-[#d8b37a] shadow-[0_0_16px_rgba(216,179,122,.9)]" /> : null}
                        </div>

                        <h3 className="text-2xl font-semibold leading-tight text-white">
                          {item.title || typeLabel(item.type, lang)}
                        </h3>

                        {item.locationName ? (
                          <p className="mt-2 text-sm text-white/55">{shortLocationName(item.locationName)}</p>
                        ) : null}

                        {cleanNote ? (
                          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/70">{cleanNote}</p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
