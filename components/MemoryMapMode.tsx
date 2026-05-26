"use client";

import { cleanMemoryNote, shortLocationName } from "@/lib/memoryMapFormat";
import { useEffect, useMemo, useRef, useState } from "react";

type MapItem = {
  id: string;
  type?: string;
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=${document.documentElement.lang || "tr"}`;
    script.async = true;
    script.defer = true;
    script.dataset.memoriedGoogleMaps = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps could not load"));
    document.head.appendChild(script);
  });

  return window.__memoriedGoogleMapsLoading;
}

function hasLocation(item?: MapItem | null) {
  return !!item && item.latitude !== null && item.longitude !== null && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude));
}

function pointOf(item: MapItem) {
  return { lat: Number(item.latitude), lng: Number(item.longitude) };
}

export default function MemoryMapMode({ lang, items }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const [rotations, setRotations] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach((item) => {
      initial[item.id] = Number(item.rotation || 0);
    });
    return initial;
  });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any | null>(null);
  const didFitRef = useRef(false);

  const visibleItems = useMemo(
    () => items.filter((item) => item.imageUrl || item.type === "text" || item.type === "audio" || item.type === "video"),
    [items]
  );

  const locatedItems = useMemo(() => visibleItems.filter(hasLocation), [visibleItems]);
  const activeItem = visibleItems[activeIndex] || visibleItems[0];
  const activeLocationTitle = hasLocation(activeItem)
    ? shortLocationName(activeItem.locationName || "")
    : locatedItems[0]
    ? shortLocationName(locatedItems[0].locationName || "")
    : lang === "en"
    ? "Memory map"
    : "Anı haritası";

  useEffect(() => {
    if (visibleItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const raw = best?.target?.getAttribute("data-map-card-index");
        const next = Number(raw);

        if (Number.isFinite(next) && next >= 0 && next < visibleItems.length) {
          setActiveIndex(next);
        }
      },
      {
        threshold: [0.35, 0.55, 0.75],
        rootMargin: "-16% 0px -42% 0px",
      }
    );

    Object.values(cardRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [visibleItems.length]);

  useEffect(() => {
    if (locatedItems.length === 0) return;

    loadGoogleMaps()
      .then(() => {
        setError("");

        const firstCenter = hasLocation(activeItem) ? pointOf(activeItem) : pointOf(locatedItems[0]);

        if (mapRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: firstCenter,
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "greedy",
            clickableIcons: false,
            styles: [
              { elementType: "geometry", stylers: [{ color: "#ebe3d7" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#5d5144" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#f7f1e7" }] },
              { featureType: "poi", stylers: [{ visibility: "simplified" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#d7e5e8" }] },
            ],
          });
        }

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        locatedItems.forEach((item, index) => {
          const originalIndex = visibleItems.findIndex((memory) => memory.id === item.id);
          const marker = new window.google.maps.Marker({
            map: mapInstanceRef.current,
            position: pointOf(item),
            title: shortLocationName(item.locationName || item.title || ""),
            label: {
              text: String(index + 1),
              color: "#1f160d",
              fontWeight: "800",
              fontSize: "12px",
            },
          });

          marker.addListener("click", () => {
            if (originalIndex >= 0) {
              setActiveIndex(originalIndex);
              cardRefs.current[item.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });

          markersRef.current.push(marker);
        });

        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        const routePath = locatedItems.map(pointOf);
        if (routePath.length >= 2) {
          polylineRef.current = new window.google.maps.Polyline({
            path: routePath,
            geodesic: true,
            strokeColor: "#d6ad72",
            strokeOpacity: 0.95,
            strokeWeight: 4,
            icons: [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  scale: 3,
                },
                offset: "0",
                repeat: "20px",
              },
            ],
          });
          polylineRef.current.setMap(mapInstanceRef.current);
        }

        if (!didFitRef.current && routePath.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          routePath.forEach((point) => bounds.extend(point));
          mapInstanceRef.current.fitBounds(bounds, 70);
          didFitRef.current = true;
        }
      })
      .catch(() => setError(lang === "en" ? "Map could not be loaded." : "Harita yüklenemedi."));
  }, [locatedItems, visibleItems, activeItem, lang]);

  useEffect(() => {
    if (!mapInstanceRef.current || !hasLocation(activeItem)) return;
    mapInstanceRef.current.panTo(pointOf(activeItem));
    mapInstanceRef.current.setZoom(14);
  }, [activeItem]);

  async function rotatePhoto(item: MapItem) {
    const current = rotations[item.id] ?? Number(item.rotation || 0);
    const next = (current + 90) % 360;

    setRotations((previous) => ({ ...previous, [item.id]: next }));

    try {
      const response = await fetch(`/api/memory-items/${item.id}/rotate`, { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        if (typeof data.rotation === "number") {
          setRotations((previous) => ({ ...previous, [item.id]: data.rotation }));
        }
      }
    } catch {
      // Görsel kullanıcı tarafında dönmüş kalır; kalıcı kaydedilemezse sayfa yenilenince eski haline döner.
    }
  }

  function jumpTo(index: number) {
    const item = visibleItems[index];
    if (!item) return;

    setActiveIndex(index);
    cardRefs.current[item.id]?.scrollIntoView({ behavior: "smooth", block: "center" });

    if (hasLocation(item) && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(pointOf(item));
      mapInstanceRef.current.setZoom(14);
    }
  }

  if (visibleItems.length === 0) return null;

  return (
    <section id="map-mode" className="memoried-map-mode-root">
      <div className="memoried-map-topbar">
        <div>
          <p>{lang === "en" ? "Memory route" : "Anı rotası"}</p>
          <h2>{activeLocationTitle}</h2>
        </div>

        <a href="#gallery-mode" className="memoried-gallery-mode-button">
          {lang === "en" ? "Gallery Mode" : "Galeri Modu"}
        </a>
      </div>

      <div className="memoried-map-canvas-wrap">
        {locatedItems.length > 0 ? (
          <div ref={mapRef} className="memoried-map-canvas" />
        ) : (
          <div className="memoried-map-empty">
            {lang === "en"
              ? "No locations have been added yet. Photos can still be viewed below."
              : "Henüz konum eklenmemiş. Fotoğraflar aşağıda görüntülenebilir."}
          </div>
        )}

        {error ? <div className="memoried-map-error">{error}</div> : null}
      </div>

      <div className="memoried-active-memory">
        <p>{lang === "en" ? "Selected memory" : "Seçili anı"}</p>
        <h3>{activeItem?.title || (lang === "en" ? "Untitled memory" : "İsimsiz anı")}</h3>
        {cleanMemoryNote(activeItem?.note) ? <span>{cleanMemoryNote(activeItem?.note)}</span> : null}
        {hasLocation(activeItem) ? <small>{shortLocationName(activeItem.locationName || "")}</small> : null}
      </div>

      <div className="memoried-map-vertical-feed">
        {visibleItems.map((item, index) => {
          const isActive = index === activeIndex;
          const rotation = rotations[item.id] ?? Number(item.rotation || 0);
          const note = cleanMemoryNote(item.note);

          return (
            <article
              key={item.id}
              ref={(node) => {
                cardRefs.current[item.id] = node;
              }}
              data-map-card-index={index}
              className={`memoried-map-card ${isActive ? "is-active" : ""}`}
              onClick={() => jumpTo(index)}
            >
              <div className="memoried-map-card-head">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{item.title || (lang === "en" ? "Memory" : "Anı")}</strong>
                  <small>
                    {hasLocation(item)
                      ? shortLocationName(item.locationName || "")
                      : lang === "en"
                      ? "No location"
                      : "Konum yok"}
                  </small>
                </div>
              </div>

              {item.imageUrl ? (
                <div className="memoried-map-photo-box">
                  <img
                    src={item.imageUrl}
                    alt={item.title || "memory"}
                    className="memoried-map-photo"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />

                  <button
                    type="button"
                    className="memoried-rotate-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      rotatePhoto(item);
                    }}
                  >
                    ↻ {lang === "en" ? "Rotate" : "Döndür"}
                  </button>
                </div>
              ) : null}

              {item.type === "audio" && item.mediaUrl ? (
                <div className="memoried-audio-card">
                  <span>{lang === "en" ? "Voice memory" : "Sesli anı"}</span>
                  <audio controls src={item.mediaUrl} />
                </div>
              ) : null}

              {item.type === "video" && item.mediaUrl ? (
                <video controls src={item.mediaUrl} className="memoried-map-video" />
              ) : null}

              {note ? <p className="memoried-map-note">{note}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
