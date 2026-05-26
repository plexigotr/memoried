"use client";


import { getValidLocationItems, getItemLatLng, hasRealLocation } from "@/lib/memoryMapSafe";
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
  // Null Island (0,0) = Atlas Okyanusu — geçersiz konum
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return null;
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

function markerSvg(index: number, active: boolean) {
  const fill = active ? "#d8a45f" : "#2d2520";
  const stroke = active ? "#ffffff" : "#d8a45f";
  const text = String(index + 1);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="54" height="68" viewBox="0 0 54 68">
      <filter id="shadow" x="-40%" y="-30%" width="180%" height="180%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.34"/>
      </filter>
      <path filter="url(#shadow)" d="M27 3C14.3 3 4 13.2 4 25.7c0 17.1 23 38.8 23 38.8s23-21.7 23-38.8C50 13.2 39.7 3 27 3Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="27" cy="25" r="12.5" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
      <text x="27" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="800" fill="#ffffff">${text}</text>
    </svg>
  `)}`;
}

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#e9e1d3" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b5a4a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f6efe4" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c6b49b" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#e5dccb" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#f8f3ea" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#d7c8b4" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f2e4d1" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#aec4c6" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#607d83" }] },
];

export default function MemoryMapMode({ lang, items }: Props) {
  const validLocationItems = getValidLocationItems((items || []) as any[]);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const routeLineRef = useRef<any[]>([]);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const timelineItems = useMemo(() => items.filter((item) => item.itemType !== "image" || item.imageUrl), [items]);
  const locatedItems = useMemo(() => timelineItems.filter((item) => itemPoint(item)), [timelineItems]);
  const activeItem = timelineItems[activeIndex] || timelineItems[0];

  const locatedTimelineIndexes = useMemo(
    () => locatedItems.map((located) => timelineItems.findIndex((item) => item.id === located.id)),
    [locatedItems, timelineItems]
  );

  function updateMarkerIcons(nextActiveIndex: number) {
    markersRef.current.forEach((marker, markerIndex) => {
      const timelineIndex = locatedTimelineIndexes[markerIndex];
      const active = timelineIndex === nextActiveIndex;
      marker.setIcon({
        url: markerSvg(markerIndex, active),
        scaledSize: new window.google.maps.Size(active ? 48 : 40, active ? 60 : 50),
        anchor: new window.google.maps.Point(active ? 24 : 20, active ? 58 : 48),
      });
      marker.setZIndex(active ? 999 : 10 + markerIndex);
    });
  }

  function flyTo(targetPoint: { lat: number; lng: number }, targetZoom = 14) {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    const currentZoom = map.getZoom() ?? 10;
    const currentCenter = map.getCenter();

    // Şehirlerin üzerinden geçer gibi — çok yakın zoom seviyesinde uçuş
    let flyZoom: number;
    if (currentCenter) {
      const dLat = Math.abs(currentCenter.lat() - targetPoint.lat);
      const dLng = Math.abs(currentCenter.lng() - targetPoint.lng);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist > 5)        flyZoom = 8;  // Bölge — şehirler görünür
      else if (dist > 1.5) flyZoom = 9;  // Şehir alanı
      else if (dist > 0.5) flyZoom = 10; // Şehir
      else if (dist > 0.1) flyZoom = 11; // Mahalle
      else                 flyZoom = Math.max(currentZoom - 1, 12);
    } else {
      flyZoom = 8;
    }
    flyZoom = Math.min(flyZoom, targetZoom - 1);

    // 1. Zoom out
    map.setZoom(flyZoom);
    // 2. Hedef konuma pan
    window.setTimeout(() => { map.panTo(targetPoint); }, 350);
    // 3. Zoom in
    window.setTimeout(() => { map.setZoom(targetZoom); }, 820);
  }

  function focusItem(index: number, shouldScroll = true, zoom = 14) {
    const item = timelineItems[index];
    if (!item) return;

    setActiveIndex(index);
    updateMarkerIcons(index);

    if (shouldScroll) {
      window.setTimeout(() => {
        cardRefs.current[item.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 40);
    }

    const point = itemPoint(item);
    if (point && mapInstanceRef.current) {
      flyTo(point, zoom);
    }
  }

  function fitRoute() {
    if (!mapInstanceRef.current || locatedItems.length === 0 || !window.google?.maps) return;
    const points = locatedItems.map((item) => itemPoint(item)).filter(Boolean) as { lat: number; lng: number }[];
    if (points.length === 0) return;
    if (points.length === 1) {
      mapInstanceRef.current.setCenter(points[0]);
      mapInstanceRef.current.setZoom(13);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    mapInstanceRef.current.fitBounds(bounds, 58);
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousWidth = document.body.style.width;
    document.body.style.overflow = "hidden";
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.width = previousWidth;
    };
  }, [open]);

  useEffect(() => {
    if (!open || locatedItems.length === 0) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        setError("");

        const points = locatedItems.map((item) => itemPoint(item)).filter(Boolean) as { lat: number; lng: number }[];
        const firstPoint = points[0];
        if (!firstPoint) return;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: firstPoint,
            zoom: 8,
            mapTypeId: "roadmap",
            disableDefaultUI: true,
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: false,
            gestureHandling: "greedy",
            styles: mapStyles,
          });
        }

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
        routeLineRef.current.forEach((line) => line.setMap(null));
        routeLineRef.current = [];

        if (points.length >= 2) {
          const shadowLine = new window.google.maps.Polyline({
            path: points,
            geodesic: true,
            strokeColor: "#ffffff",
            strokeOpacity: 0.76,
            strokeWeight: 9,
            zIndex: 1,
          });
          const goldLine = new window.google.maps.Polyline({
            path: points,
            geodesic: true,
            strokeColor: "#c8893d",
            strokeOpacity: 1,
            strokeWeight: 4,
            zIndex: 2,
            icons: [
              {
                icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2.2, strokeColor: "#7b4d1f", strokeWeight: 1.4, fillColor: "#d8a45f", fillOpacity: 1 },
                offset: "12px",
                repeat: "120px",
              },
            ],
          });
          shadowLine.setMap(mapInstanceRef.current);
          goldLine.setMap(mapInstanceRef.current);
          routeLineRef.current = [shadowLine, goldLine];
        }

        locatedItems.forEach((item, markerIndex) => {
          const point = itemPoint(item);
          if (!point) return;
          const timelineIndex = timelineItems.findIndex((candidate) => candidate.id === item.id);
          const marker = new window.google.maps.Marker({
            map: mapInstanceRef.current,
            position: point,
            title: getDisplayName(item, lang),
            icon: {
              url: markerSvg(markerIndex, timelineIndex === activeIndex),
              scaledSize: new window.google.maps.Size(timelineIndex === activeIndex ? 48 : 40, timelineIndex === activeIndex ? 60 : 50),
              anchor: new window.google.maps.Point(timelineIndex === activeIndex ? 24 : 20, timelineIndex === activeIndex ? 58 : 48),
            },
            zIndex: timelineIndex === activeIndex ? 999 : 10 + markerIndex,
          });
          marker.addListener("click", () => focusItem(timelineIndex, true, 15));
          markersRef.current.push(marker);
        });

        window.setTimeout(() => fitRoute(), 180);
      })
      .catch(() => setError(lang === "en" ? "Map could not be loaded." : "Harita yüklenemedi."));

    return () => {
      cancelled = true;
    };
  }, [open, locatedItems, timelineItems, lang]);

  useEffect(() => {
    if (!open || !mapInstanceRef.current || !activeItem) return;
    updateMarkerIcons(activeIndex);
    const point = itemPoint(activeItem);
    if (point) flyTo(point, 14);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, activeItem, open]);

  function handleTimelineScroll() {
    const container = timelineRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const center = containerRect.top + containerRect.height / 2;

    let nearestIndex = activeIndex;
    let nearestDistance = Number.POSITIVE_INFINITY;

    timelineItems.forEach((item, index) => {
      const node = cardRefs.current[item.id];
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex !== activeIndex) {
      setActiveIndex(nearestIndex);
    }
  }

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
            <div className="memoried-map-actions">
              <button type="button" onClick={fitRoute} className="memoried-map-route-button">
                {lang === "en" ? "Show route" : "Rotayı göster"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="memoried-map-close">
                {lang === "en" ? "Gallery" : "Galeri"}
              </button>
            </div>
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

            {/* Pin preview — aktif öğe fotoğrafsa harita üzerinde mini önizleme */}
            {activeItem?.itemType === "image" && activeItem?.imageUrl && itemPoint(activeItem) ? (
              <div key={activeItem.id} className="memoried-pin-preview">
                <img src={activeItem.imageUrl} alt={getDisplayName(activeItem, lang)} />
              </div>
            ) : null}
          </div>

          {/* Rota ilerleme çubuğu */}
          <div className="memoried-map-progress">
            <div
              className="memoried-map-progress-fill"
              style={{ width: `${((activeIndex + 1) / timelineItems.length) * 100}%` }}
            />
            <span className="memoried-map-progress-label">
              {activeIndex + 1} / {timelineItems.length}
            </span>
          </div>

          <div ref={timelineRef} className="memoried-map-timeline" onScroll={handleTimelineScroll}>
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
                  onClick={() => focusItem(index, false, 14)}
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
                      {/* Sadece başlık — sol alt overlay */}
                      {title ? (
                        <div className="memoried-map-image-caption">
                          <span className="memoried-map-caption-title">{title}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : item.itemType === "video" && item.mediaUrl ? (
                    <div
                      className="memoried-map-video-preview"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <video
                        src={item.mediaUrl}
                        className="memoried-map-media"
                        autoPlay
                        muted
                        loop
                        playsInline
                        onClick={(e) => {
                          const v = e.currentTarget;
                          const wrap = v.closest(".memoried-map-video-preview") as HTMLElement | null;
                          v.muted = false;
                          v.loop = false;
                          v.controls = true;
                          v.play();
                          wrap?.classList.add("memoried-map-video-preview--playing");
                        }}
                      />
                      <div className="memoried-map-video-tap-hint" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        {lang === "en" ? "Tap for sound" : "Sesi aç"}
                      </div>
                    </div>
                  ) : item.itemType === "audio" && item.mediaUrl ? (
                    <div className="memoried-map-audio-card">
                      <span>🎧</span>
                      <audio controls src={item.mediaUrl} className="w-full" />
                    </div>
                  ) : (
                    <div className="memoried-map-text-card">{note || title}</div>
                  )}

                  {/* Fotoğraflar için metin kutusu gizle (overlay'de gösteriliyor) */}
                  {item.itemType !== "image" ? (
                    <div className="memoried-map-card-copy">
                      <p className="memoried-map-card-type">
                        {item.itemType === "audio"
                          ? lang === "en" ? "Voice" : "Ses"
                          : item.itemType === "video"
                          ? "Video"
                          : item.itemType === "text"
                          ? lang === "en" ? "Note" : "Not"
                          : lang === "en" ? "Photo" : "Fotoğraf"}
                      </p>
                      <h3>{title}</h3>
                      {note && item.itemType !== "text" ? <p className="memoried-map-card-note">{note}</p> : null}
                    </div>
                  ) : !itemPoint(item) ? (
                    <div className="memoried-map-card-copy">
                      <p className="memoried-map-no-location">{lang === "en" ? "No location yet" : "Konum yok"}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
