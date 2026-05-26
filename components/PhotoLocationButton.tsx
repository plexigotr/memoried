"use client";


import { cleanMemoryNote, shortLocationName } from "@/lib/memoryMapFormat";
import { useEffect, useRef, useState } from "react";

type Lang = "tr" | "en";

type LocationValue = {
  location_name: string;
  latitude: string;
  longitude: string;
};

type Props = {
  lang: Lang;
  code?: string;
  itemId?: string;
  initialLocationName?: string | null;
  initialLatitude?: number | string | null;
  initialLongitude?: number | string | null;
  onLocationSelected?: (value: LocationValue | null) => void;
};

type Prediction = any;

declare global {
  interface Window {
    google?: any;
    __memoriedGoogleMapsLoading?: Promise<void>;
  }
}

function getApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__memoriedGoogleMapsLoading) return window.__memoriedGoogleMapsLoading;

  const apiKey = getApiKey();
  if (!apiKey) return Promise.reject(new Error("Google Maps API key is missing."));

  window.__memoriedGoogleMapsLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-memoried-google-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps script could not be loaded.")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=tr`;
    script.async = true;
    script.defer = true;
    script.dataset.memoriedGoogleMaps = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps script could not be loaded."));
    document.head.appendChild(script);
  });

  return window.__memoriedGoogleMapsLoading;
}

export default function PhotoLocationButton({
  lang,
  code,
  itemId,
  initialLocationName,
  initialLatitude,
  initialLongitude,
  onLocationSelected,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(initialLocationName || "");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selected, setSelected] = useState<LocationValue | null>(() => {
    if (initialLocationName && initialLatitude && initialLongitude) {
      return {
        location_name: initialLocationName,
        latitude: String(initialLatitude),
        longitude: String(initialLongitude),
      };
    }
    return null;
  });
  const [isSaving, setIsSaving] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const serviceHostRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const autocompleteServiceRef = useRef<any | null>(null);
  const placesServiceRef = useRef<any | null>(null);
  const geocoderRef = useRef<any | null>(null);

  const t = {
    button: lang === "en" ? "Photo location" : "Fotoğraf konumu",
    add: lang === "en" ? "Add location" : "Konum ekle",
    change: lang === "en" ? "Change location" : "Konumu değiştir",
    title: lang === "en" ? "Photo location" : "Fotoğraf konumu",
    desc:
      lang === "en"
        ? "Search a place, choose from Google results or tap the map. Location is optional. Coordinates are not shown to users."
        : "Yer adı yazıp Google sonuçlarından seçebilir veya haritaya dokunabilirsin. Konum opsiyoneldir. Koordinatlar kullanıcıya gösterilmez.",
    placeholder: lang === "en" ? "Search place or address" : "Yer veya adres ara",
    useCurrent: lang === "en" ? "Find my current location" : "Şu anki konumumu bul",
    save: lang === "en" ? "Save this location" : "Bu konumu kaydet",
    remove: lang === "en" ? "Remove location" : "Konumu kaldır",
    close: lang === "en" ? "Close" : "Kapat",
    selected: lang === "en" ? "Selected location" : "Seçilen konum",
    noKey:
      lang === "en"
        ? "Google Maps key is missing or incorrect."
        : "Google Maps anahtarı eksik veya hatalı.",
    needSelect:
      lang === "en" ? "Please choose a location first." : "Lütfen önce bir konum seç.",
    currentFailed:
      lang === "en" ? "Could not get current location." : "Mevcut konum alınamadı.",
  };

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;
        setIsReady(true);
        setError("");

        const center = selected
          ? { lat: Number(selected.latitude), lng: Number(selected.longitude) }
          : { lat: 41.0082, lng: 28.9784 };

        if (mapRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = new window.google!.maps.Map(mapRef.current, {
            center,
            zoom: selected ? 15 : 6,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "greedy",
          });

          markerRef.current = new window.google!.maps.Marker({
            map: mapInstanceRef.current,
            position: selected ? center : undefined,
          });

          mapInstanceRef.current.addListener("click", (event: any) => {
            if (!event.latLng) return;
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            setMapLocation(lat, lng);
          });
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(center);
          mapInstanceRef.current.setZoom(selected ? 15 : 6);
          markerRef.current?.setPosition(selected ? center : null);
        }

        autocompleteServiceRef.current = new window.google!.maps.places.AutocompleteService();
        if (serviceHostRef.current) {
          placesServiceRef.current = new window.google!.maps.places.PlacesService(serviceHostRef.current);
        }
        geocoderRef.current = new window.google!.maps.Geocoder();
      })
      .catch(() => {
        if (!cancelled) setError(t.noKey);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isReady || query.trim().length < 2 || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "tr" },
        },
        (results: any[] | null) => setPredictions(results || [])
      );
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, isOpen, isReady]);

  function setMapLocation(lat: number, lng: number, name?: string) {
    const center = { lat, lng };
    mapInstanceRef.current?.setCenter(center);
    mapInstanceRef.current?.setZoom(16);
    markerRef.current?.setPosition(center);

    if (name) {
      setSelected({ location_name: name, latitude: String(lat), longitude: String(lng) });
      setQuery(name);
      return;
    }

    geocoderRef.current?.geocode({ location: center }, (results: any[] | null) => {
      const address = results?.[0]?.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSelected({ location_name: address, latitude: String(lat), longitude: String(lng) });
      setQuery(address);
    });
  }

  function selectPrediction(prediction: Prediction) {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["name", "formatted_address", "geometry"],
      },
      (place: any | null, status: any) => {
        if (status !== window.google?.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const name = place.formatted_address || place.name || prediction.description;
        setMapLocation(lat, lng, name);
        setPredictions([]);
      }
    );
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError(t.currentFailed);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        setError("");
        setMapLocation(position.coords.latitude, position.coords.longitude);
      },
      () => setError(t.currentFailed),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function saveLocation(value: LocationValue | null) {
    if (onLocationSelected) {
      onLocationSelected(value);
      setIsOpen(false);
      return;
    }

    if (!code || !itemId) return;

    setIsSaving(true);
    const formData = new FormData();
    formData.append("itemId", itemId);
    formData.append("location_name", value?.location_name || "");
    formData.append("latitude", value?.latitude || "");
    formData.append("longitude", value?.longitude || "");

    const response = await fetch(`/api/magnets/${code}/update-item-location`, {
      method: "POST",
      body: formData,
    });

    setIsSaving(false);

    if (response.ok) {
      window.location.reload();
    } else {
      setError(lang === "en" ? "Location could not be saved." : "Konum kaydedilemedi.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
      >
        {selected || initialLocationName ? `📍 ${t.change}` : `📍 ${t.add}`}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/55 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="border-b border-stone-200 p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{t.button}</p>
                  <h2 className="mt-1 text-2xl font-semibold text-stone-950">{t.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{t.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700"
                >
                  {t.close}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.placeholder}
                  className="w-full rounded-2xl border border-stone-300 px-5 py-4 text-base outline-none transition focus:border-stone-700"
                />

                {predictions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-72 overflow-y-auto rounded-3xl border border-stone-200 bg-white shadow-2xl">
                    {predictions.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        type="button"
                        onClick={() => selectPrediction(prediction)}
                        className="block w-full border-b border-stone-100 px-5 py-4 text-left text-sm text-stone-800 last:border-b-0 hover:bg-stone-50"
                      >
                        <span className="font-semibold">📍 {prediction.structured_formatting.main_text}</span>
                        <span className="mt-1 block truncate text-stone-500">{prediction.structured_formatting.secondary_text || prediction.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            </div>

            <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto]">
              <div ref={mapRef} className="min-h-[360px] w-full bg-stone-100 md:min-h-[480px]" />
              <div ref={serviceHostRef} className="hidden" />

              <div className="border-t border-stone-200 bg-white p-4 md:p-5">
                {selected ? (
                  <p className="mb-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
                    <span className="font-semibold">{t.selected}: </span>
                    {selected.location_name}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700"
                  >
                    📍 {t.useCurrent}
                  </button>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => saveLocation(null)}
                      className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-600"
                    >
                      {t.remove}
                    </button>
                    <button
                      type="button"
                      disabled={!selected || isSaving}
                      onClick={() => selected ? saveLocation(selected) : setError(t.needSelect)}
                      className="rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSaving ? "..." : t.save}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
