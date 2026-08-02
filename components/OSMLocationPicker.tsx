"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const LeafletMiniMap = dynamic(() => import("./LeafletMiniMap"), { ssr: false });

type OSMResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export type LocationValue = {
  location_name: string;
  latitude: string;
  longitude: string;
};

type Props = {
  code?: string;
  itemId?: string;
  lang?: "tr" | "en";
  initialLocationName?: string | null;
  initialLatitude?: string | number | null;
  initialLongitude?: string | number | null;
  inputPrefix?: string;
  onLocationSelected?: (value: LocationValue | null) => void;
};

const emptyLocation: LocationValue = {
  location_name: "",
  latitude: "",
  longitude: "",
};

export default function OSMLocationPicker({
  code,
  itemId,
  lang = "tr",
  initialLocationName,
  initialLatitude,
  initialLongitude,
  inputPrefix = "",
  onLocationSelected,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(initialLocationName || "");
  const [results, setResults] = useState<OSMResult[]>([]);
  const [selected, setSelected] = useState<LocationValue>({
    location_name: initialLocationName || "",
    latitude: initialLatitude ? String(initialLatitude) : "",
    longitude: initialLongitude ? String(initialLongitude) : "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const t =
    lang === "en"
      ? {
          add: "Add location",
          change: "Change location",
          close: "Close",
          current: "Use my current location",
          empty: "Location is optional.",
          permission: "Location permission could not be obtained.",
          remove: "Remove location",
          save: "Save this location",
          search: "Search location",
          searchPlaceholder: "Example: Rome, Eiffel Tower",
          searching: "Searching\u2026",
          title: "Search for a place or choose it on the map",
          uploadTitle: "Photo location",
        }
      : {
          add: "Konum ekle",
          change: "Konumu de\u011fi\u015ftir",
          close: "Kapat",
          current: "\u015eu anki konumumu kullan",
          empty: "Konum opsiyonel.",
          permission: "Konum izni al\u0131namad\u0131.",
          remove: "Konumu kald\u0131r",
          save: "Bu konumu kaydet",
          search: "Konum ara",
          searchPlaceholder: "\u00d6rnek: Roma, Ala\u00e7at\u0131, Eyfel Kulesi",
          searching: "Aran\u0131yor\u2026",
          title: "Yer ara veya haritadan se\u00e7",
          uploadTitle: "Foto\u011fraf konumu",
        };

  const selectedPosition = useMemo<[number, number] | null>(() => {
    const lat = Number(selected.latitude);
    const lng = Number(selected.longitude);

    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  }, [selected.latitude, selected.longitude]);

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const response = await fetch(
        `/api/location/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
      );
      const data = (await response.json()) as { display_name?: string };
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  async function searchLocation() {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 3) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `/api/location/search?q=${encodeURIComponent(cleanQuery)}`
      );
      const data = (await response.json()) as unknown;
      setResults(response.ok && Array.isArray(data) ? (data as OSMResult[]) : []);
    } catch {
      setResults([]);
      setError(lang === "en" ? "Search failed." : "Konum aranamad\u0131.");
    } finally {
      setLoading(false);
    }
  }

  function pick(result: OSMResult) {
    setSelected({
      location_name: result.display_name,
      latitude: result.lat,
      longitude: result.lon,
    });
    setQuery(result.display_name);
    setResults([]);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError(t.permission);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const name = await reverseGeocode(lat, lng);
        setSelected({
          location_name: name,
          latitude: String(lat),
          longitude: String(lng),
        });
        setQuery(name);
        setError("");
      },
      () => setError(t.permission),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function saveLocation() {
    const value =
      selected.location_name && selected.latitude && selected.longitude
        ? selected
        : null;

    if (onLocationSelected) {
      onLocationSelected(value);
    }

    if (code && itemId) {
      try {
        setSaving(true);
        const formData = new FormData();
        formData.append("itemId", itemId);
        formData.append("location_name", value?.location_name || "");
        formData.append("latitude", value?.latitude || "");
        formData.append("longitude", value?.longitude || "");

        const response = await fetch(
          `/api/magnets/${code}/update-item-location`,
          { method: "POST", body: formData }
        );

        if (!response.ok) {
          setError(lang === "en" ? "Location could not be saved." : "Konum kaydedilemedi.");
          return;
        }

        window.location.reload();
        return;
      } finally {
        setSaving(false);
      }
    }

    setOpen(false);
  }

  const prefix = inputPrefix ? `${inputPrefix}_` : "";

  return (
    <div className="osm-location-picker">
      <input
        type="hidden"
        name={`${prefix}location_name`}
        value={selected.location_name}
      />
      <input
        type="hidden"
        name={`${prefix}latitude`}
        value={selected.latitude}
      />
      <input
        type="hidden"
        name={`${prefix}longitude`}
        value={selected.longitude}
      />

      <button
        type="button"
        className="osm-open-button"
        onClick={() => setOpen(true)}
      >
        {selected.location_name ? t.change : t.add}
      </button>

      {selected.location_name ? (
        <p className="osm-selected-location">{selected.location_name}</p>
      ) : (
        <p className="osm-location-empty">{t.empty}</p>
      )}

      {open ? (
        <div className="osm-location-modal">
          <div className="osm-location-sheet">
            <div className="osm-location-head">
              <div>
                <span>{t.uploadTitle}</span>
                <h3>{t.title}</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                {t.close}
              </button>
            </div>

            <div className="osm-search-box">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void searchLocation();
                  }
                }}
                placeholder={t.searchPlaceholder}
                autoFocus
              />
              <button type="button" onClick={useCurrentLocation}>
                {t.current}
              </button>
            </div>

            <button
              type="button"
              className="osm-open-button"
              onClick={searchLocation}
              disabled={loading}
            >
              {loading ? t.searching : t.search}
            </button>

            {error ? <p className="osm-location-empty">{error}</p> : null}

            <div className="osm-results">
              {results.map((result) => (
                <button
                  key={`${result.lat}-${result.lon}-${result.display_name}`}
                  type="button"
                  onClick={() => pick(result)}
                >
                  <strong>{result.display_name.split(",")[0]}</strong>
                  <span>{result.display_name}</span>
                </button>
              ))}
            </div>

            <LeafletMiniMap
              position={selectedPosition}
              onPick={async (lat, lng) => {
                const name = await reverseGeocode(lat, lng);
                setSelected({
                  location_name: name,
                  latitude: String(lat),
                  longitude: String(lng),
                });
                setQuery(name);
              }}
            />

            <div className="osm-actions">
              <button
                type="button"
                className="osm-secondary"
                onClick={() => {
                  setSelected(emptyLocation);
                  setQuery("");
                  setResults([]);
                }}
              >
                {t.remove}
              </button>
              <button
                type="button"
                className="osm-primary"
                onClick={saveLocation}
                disabled={saving}
              >
                {saving ? "..." : t.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
