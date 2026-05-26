"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MapItem = {
  id: string;
  title: string;
  note: string;
  imageUrl: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
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

export default function MemoryMapMode({ lang, items }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const locatedItems = useMemo(
    () => items.filter((item) => item.imageUrl && item.latitude !== null && item.longitude !== null),
    [items]
  );

  const visibleItems = locatedItems.length > 0 ? locatedItems : items.filter((item) => item.imageUrl);
  const activeItem = visibleItems[activeIndex] || visibleItems[0];

  useEffect(() => {
    if (!open || !activeItem?.latitude || !activeItem?.longitude) return;

    loadGoogleMaps()
      .then(() => {
        setError("");
        const center = { lat: Number(activeItem.latitude), lng: Number(activeItem.longitude) };

        if (mapRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "greedy",
          });
          markerRef.current = new window.google.maps.Marker({ map: mapInstanceRef.current, position: center });
        } else {
          mapInstanceRef.current?.panTo(center);
          mapInstanceRef.current?.setZoom(14);
          markerRef.current?.setPosition(center);
        }
      })
      .catch(() => setError(lang === "en" ? "Map could not be loaded." : "Harita yüklenemedi."));
  }, [open, activeItem, lang]);

  if (visibleItems.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 top-20 z-50 rounded-full border border-white/25 bg-black/55 px-4 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl transition hover:scale-105 active:scale-95"
      >
        🗺️ {lang === "en" ? "Map Mode" : "Harita Modu"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[99998] bg-[#0f0d0a] text-white">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                  {lang === "en" ? "Memory map" : "Anı haritası"}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {activeItem?.locationName || (lang === "en" ? "Photos" : "Fotoğraflar")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80"
              >
                {lang === "en" ? "Close" : "Kapat"}
              </button>
            </div>

            <div className="h-[33vh] min-h-[220px] border-b border-white/10 bg-white/5">
              {activeItem?.latitude && activeItem?.longitude ? (
                <div ref={mapRef} className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/60">
                  {lang === "en"
                    ? "This photo has no location yet. You can add it from edit page."
                    : "Bu fotoğrafa henüz konum eklenmemiş. Düzenleme sayfasından ekleyebilirsin."}
                </div>
              )}
              {error && <div className="absolute left-4 top-20 rounded-2xl bg-red-500/90 px-4 py-2 text-sm">{error}</div>}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {activeItem ? (
                <div className="px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.26em] text-[#d8b98a]">
                    {lang === "en" ? "Selected memory" : "Seçili anı"}
                  </p>
                  <h3 className="mt-1 line-clamp-1 text-2xl font-semibold">{activeItem.title || (lang === "en" ? "Untitled photo" : "İsimsiz fotoğraf")}</h3>
                  {activeItem.note ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/65">{activeItem.note}</p> : null}
                </div>
              ) : null}

              <div
                ref={scrollRef}
                className="flex h-[calc(100%-110px)] snap-x gap-4 overflow-x-auto px-5 pb-8"
                onScroll={(event) => {
                  const container = event.currentTarget;
                  const cardWidth = 190;
                  const index = Math.round(container.scrollLeft / cardWidth);
                  if (index >= 0 && index < visibleItems.length) setActiveIndex(index);
                }}
              >
                {visibleItems.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-full min-h-[330px] w-[176px] shrink-0 snap-center overflow-hidden rounded-[2rem] border text-left transition md:w-[230px] ${
                      index === activeIndex ? "border-[#d8b98a] scale-[1.02]" : "border-white/10 opacity-75"
                    }`}
                  >
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /> : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[#d8b98a]">{String(index + 1).padStart(2, "0")}</p>
                      <p className="line-clamp-2 text-sm font-semibold text-white">{item.title || (lang === "en" ? "Photo" : "Fotoğraf")}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-white/55">{item.locationName || (lang === "en" ? "No location" : "Konum yok")}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
