"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_CSS_ID = "leaflet-css";
const LEAFLET_SCRIPT_ID = "leaflet-js";

function loadLeaflet() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.L) return resolve();

    if (!document.getElementById(LEAFLET_CSS_ID)) {
      const link = document.createElement("link");
      link.id = LEAFLET_CSS_ID;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(LEAFLET_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Leaflet could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet could not be loaded."));
    document.body.appendChild(script);
  });
}

export default function ImageUploadForm({
  code,
  lang,
  remainingPhotos,
}: {
  code: string;
  lang: "tr" | "en";
  remainingPhotos: number;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [note, setNote] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then(() => {
        if (cancelled || !window.L || !mapElementRef.current || mapRef.current) return;

        const defaultLat = latitude ? Number(latitude) : 41.0082;
        const defaultLng = longitude ? Number(longitude) : 28.9784;
        const map = window.L.map(mapElementRef.current, {
          zoomControl: true,
          attributionControl: false,
        }).setView([defaultLat, defaultLng], latitude && longitude ? 14 : 5);

        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);

        map.on("click", (event: any) => {
          const nextLat = Number(event.latlng.lat).toFixed(6);
          const nextLng = Number(event.latlng.lng).toFixed(6);
          setLatitude(nextLat);
          setLongitude(nextLng);
        });

        mapRef.current = map;
        setMapReady(true);
      })
      .catch(() => setMapReady(false));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !window.L || !mapRef.current) return;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (!markerRef.current) {
      markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 13), {
      animate: true,
    });
  }, [latitude, longitude, mapReady]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert(lang === "en" ? "Location is not supported on this device." : "Bu cihazda konum desteği yok.");
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        alert(lang === "en" ? "Location permission was not granted." : "Konum izni verilmedi.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (remainingPhotos <= 0) {
      alert(
        lang === "en"
          ? "You have reached your photo limit."
          : "Fotoğraf limitine ulaştın."
      );
      return;
    }

    if (files.length > remainingPhotos) {
      alert(
        lang === "en"
          ? `You can upload ${remainingPhotos} more photo(s). Only the first ${remainingPhotos} will be uploaded.`
          : `${remainingPhotos} fotoğraf hakkın kaldı. Sadece ilk ${remainingPhotos} fotoğraf yüklenecek.`
      );
    }

    if (files.length === 0) return;

    try {
      setIsUploading(true);

      for (const file of files.slice(0, remainingPhotos)) {
        const formData = new FormData();
        formData.append("imageFile", file);
        formData.append("locationName", locationName.trim());
        formData.append("latitude", latitude.trim());
        formData.append("longitude", longitude.trim());
        formData.append("note", note.trim());

        const response = await fetch(`/api/magnets/${code}/upload-image`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          alert(
            lang === "en"
              ? "Some photos could not be uploaded."
              : "Bazı fotoğraflar yüklenemedi."
          );
          return;
        }
      }

      window.location.href = `/m/${code}/edit?uploaded=success&lang=${lang}`;
    } catch (error) {
      console.error("Image upload error:", error);
      alert(
        lang === "en"
          ? "Something went wrong while uploading the photos."
          : "Fotoğraflar yüklenirken bir sorun oluştu."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {lang === "en" ? "Memory location" : "Anı konumu"}
            </p>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              {lang === "en"
                ? "Tap the map, use your location or enter coordinates manually. This powers the real memory map."
                : "Haritaya dokun, konumunu kullan veya koordinatı elle gir. Story sayfasındaki gerçek harita bununla çalışır."}
            </p>
          </div>

          <button
            type="button"
            onClick={useMyLocation}
            disabled={geoLoading || isUploading}
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {geoLoading
              ? lang === "en"
                ? "Finding..."
                : "Bulunuyor..."
              : lang === "en"
              ? "Use my location"
              : "Konumumu Kullan"}
          </button>
        </div>

        <div className="mb-4 overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white">
          <div ref={mapElementRef} className="h-64 w-full" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="text"
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
            placeholder={lang === "en" ? "Location name, e.g. Skopje" : "Konum adı, örn. Üsküp"}
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500 md:col-span-3"
          />

          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            placeholder={lang === "en" ? "Latitude" : "Enlem"}
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />

          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            placeholder={lang === "en" ? "Longitude" : "Boylam"}
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />

          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={lang === "en" ? "Short note" : "Kısa not"}
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />
        </div>
      </div>

      <label
        className={`block cursor-pointer rounded-[1.5rem] border border-dashed border-stone-300 px-4 py-7 text-center text-sm text-stone-600 transition hover:bg-stone-50 ${
          isUploading ? "animate-pulse opacity-70" : ""
        }`}
      >
        {isUploading
          ? lang === "en"
            ? "Uploading photos, please wait..."
            : "Fotoğraflar yükleniyor, lütfen bekle..."
          : remainingPhotos <= 0
          ? lang === "en"
            ? "Photo limit reached"
            : "Fotoğraf limiti doldu"
          : lang === "en"
          ? `Choose photos (${remainingPhotos} left)`
          : `Fotoğrafları seç (${remainingPhotos} hak kaldı)`}

        {isUploading && (
          <div className="mt-3 flex justify-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:300ms]" />
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
