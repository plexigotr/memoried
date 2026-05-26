"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
    __memoriedGoogleMapsLoading?: Promise<void>;
  }
}

type LocationPickerProps = {
  lang: "tr" | "en";
  defaultLocationName?: string | null;
  defaultLatitude?: number | null;
  defaultLongitude?: number | null;
  locationNameField?: string;
  latitudeField?: string;
  longitudeField?: string;
};

function loadGoogleMaps() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing"));
  }

  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__memoriedGoogleMapsLoading) return window.__memoriedGoogleMapsLoading;

  window.__memoriedGoogleMapsLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-memoried-google-maps="true"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps failed")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=tr&region=TR`;
    script.async = true;
    script.defer = true;
    script.dataset.memoriedGoogleMaps = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed"));
    document.head.appendChild(script);
  });

  return window.__memoriedGoogleMapsLoading;
}

export default function LocationPicker({
  lang,
  defaultLocationName = "",
  defaultLatitude = null,
  defaultLongitude = null,
  locationNameField = "locationName",
  latitudeField = "latitude",
  longitudeField = "longitude",
}: LocationPickerProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [locationName, setLocationName] = useState(defaultLocationName || "");
  const [latitude, setLatitude] = useState<number | null>(defaultLatitude);
  const [longitude, setLongitude] = useState<number | null>(defaultLongitude);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const hasLocation = latitude !== null && longitude !== null;

  function setSelectedLocation(lat: number, lng: number, name?: string) {
    setLatitude(lat);
    setLongitude(lng);
    if (name) setLocationName(name);

    const google = window.google;
    const position = { lat, lng };

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(position);
      mapInstanceRef.current.setZoom(15);
    }

    if (google?.maps && mapInstanceRef.current) {
      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          animation: google.maps.Animation.DROP,
        });
      } else {
        markerRef.current.setPosition(position);
      }
    }
  }

  function reverseGeocode(lat: number, lng: number) {
    const google = window.google;
    if (!google?.maps?.Geocoder) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      if (status === "OK" && results?.[0]?.formatted_address) {
        setLocationName(results[0].formatted_address);
      }
    });
  }

  useEffect(() => {
    let mounted = true;

    loadGoogleMaps()
      .then(() => {
        if (!mounted || !mapRef.current) return;

        const google = window.google;
        const start = hasLocation
          ? { lat: latitude, lng: longitude }
          : { lat: 41.0082, lng: 28.9784 };

        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: start,
          zoom: hasLocation ? 14 : 5,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#f5f1ea" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#6b6258" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1ea" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#d8cec0" }] },
          ],
        });

        if (hasLocation && latitude !== null && longitude !== null) {
          setSelectedLocation(latitude, longitude, locationName || undefined);
        }

        mapInstanceRef.current.addListener("click", (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          setSelectedLocation(lat, lng);
          reverseGeocode(lat, lng);
        });

        if (searchInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ["formatted_address", "geometry", "name"],
          });

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const loc = place?.geometry?.location;
            if (!loc) return;

            const lat = loc.lat();
            const lng = loc.lng();
            const name = place.formatted_address || place.name || searchInputRef.current?.value || "";
            setSelectedLocation(lat, lng, name);
          });
        }

        setMapsReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        setMapsError(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert(lang === "en" ? "Your browser does not support location." : "Tarayıcın konum özelliğini desteklemiyor.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSelectedLocation(lat, lng, lang === "en" ? "Current location" : "Mevcut konum");
        reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert(lang === "en" ? "Location permission was not granted." : "Konum izni verilmedi.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function clearLocation() {
    setLocationName("");
    setLatitude(null);
    setLongitude(null);
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = null;
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
      <input type="hidden" name={locationNameField} value={locationName} />
      <input type="hidden" name={latitudeField} value={latitude ?? ""} />
      <input type="hidden" name={longitudeField} value={longitude ?? ""} />

      <div className="mb-3">
        <p className="text-sm font-semibold text-stone-900">
          {lang === "en" ? "Location (optional)" : "Konum (isteğe bağlı)"}
        </p>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          {lang === "en"
            ? "Search a place, select it on the map, or save your current location. Coordinates are stored silently."
            : "Yer adı yazıp Google sonuçlarından seçebilir, haritadan dokunabilir veya mevcut konumunu kaydedebilirsin. Koordinatlar kullanıcıya gösterilmez."}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          ref={searchInputRef}
          type="text"
          defaultValue={locationName || ""}
          onChange={(event) => setLocationName(event.target.value)}
          placeholder={lang === "en" ? "Search place, city or business" : "Yer, şehir veya işletme ara"}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
        />

        <button
          type="button"
          onClick={useCurrentLocation}
          className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          disabled={isLocating}
        >
          {isLocating
            ? lang === "en"
              ? "Finding..."
              : "Bulunuyor..."
            : lang === "en"
            ? "Use current location"
            : "Mevcut konumu kaydet"}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
        {mapsError ? (
          <div className="p-4 text-sm leading-6 text-amber-700">
            {lang === "en"
              ? "Google Maps key is missing or invalid. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Vercel to enable place search."
              : "Google Maps anahtarı eksik veya hatalı. Yer arama için Vercel Environment Variables alanına NEXT_PUBLIC_GOOGLE_MAPS_API_KEY eklemelisin."}
          </div>
        ) : (
          <div ref={mapRef} className="h-64 w-full" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-stone-500">
          {hasLocation
            ? lang === "en"
              ? `Selected: ${locationName || "Location selected"}`
              : `Seçildi: ${locationName || "Konum seçildi"}`
            : lang === "en"
            ? "No location selected. You can leave it empty."
            : "Konum seçilmedi. Boş bırakabilirsin."}
        </p>

        {hasLocation || locationName ? (
          <button
            type="button"
            onClick={clearLocation}
            className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-100"
          >
            {lang === "en" ? "Clear" : "Temizle"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
