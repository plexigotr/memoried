"use client";

import { useState } from "react";

type PickedLocation = {
  locationName: string;
  latitude: string;
  longitude: string;
  note: string;
};

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
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<PickedLocation>({
    locationName: "",
    latitude: "",
    longitude: "",
    note: "",
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);

    if (remainingPhotos <= 0) {
      alert(
        lang === "en"
          ? "You have reached your photo limit."
          : "Fotoğraf limitine ulaştın."
      );
      return;
    }

    if (selectedFiles.length > remainingPhotos) {
      alert(
        lang === "en"
          ? `You can upload ${remainingPhotos} more photo(s). Only the first ${remainingPhotos} will be uploaded.`
          : `${remainingPhotos} fotoğraf hakkın kaldı. Sadece ilk ${remainingPhotos} fotoğraf yüklenecek.`
      );
    }

    setFiles(selectedFiles.slice(0, remainingPhotos));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert(lang === "en" ? "Location is not supported." : "Konum desteklenmiyor.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
      },
      () => {
        alert(
          lang === "en"
            ? "Could not get your location. You can still upload without location."
            : "Konum alınamadı. Yine de konumsuz yükleyebilirsin."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function uploadSelectedFiles() {
    if (files.length === 0) return;

    try {
      setIsUploading(true);

      for (const file of files) {
        const formData = new FormData();
        formData.append("imageFile", file);
        formData.append("locationName", location.locationName);
        formData.append("latitude", location.latitude);
        formData.append("longitude", location.longitude);
        formData.append("note", location.note);
        formData.append("lang", lang);

        const response = await fetch(`/api/magnets/${code}/upload-image`, {
          method: "POST",
          body: formData,
          redirect: "follow",
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
    <div className="space-y-4">
      <label
        className={`block cursor-pointer rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-600 transition hover:bg-stone-50 ${
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
          : files.length > 0
          ? lang === "en"
            ? `${files.length} photo selected. Add location if you want.`
            : `${files.length} fotoğraf seçildi. İstersen konum ekle.`
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
          disabled={isUploading || remainingPhotos <= 0}
          onChange={handleFileChange}
        />
      </label>

      {files.length > 0 ? (
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">
                {lang === "en" ? "Optional location" : "Opsiyonel konum"}
              </p>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                {lang === "en"
                  ? "You can leave this empty. The photo will still be uploaded."
                  : "Boş bırakabilirsin. Fotoğraf yine yüklenecek."}
              </p>
            </div>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-stone-100"
            >
              {lang === "en" ? "Use my location" : "Konumumu Kullan"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              value={location.locationName}
              onChange={(event) => setLocation((prev) => ({ ...prev, locationName: event.target.value }))}
              placeholder={lang === "en" ? "Location name" : "Konum adı"}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-500 md:col-span-3"
            />
            <input
              type="text"
              inputMode="decimal"
              value={location.latitude}
              onChange={(event) => setLocation((prev) => ({ ...prev, latitude: event.target.value }))}
              placeholder="Latitude"
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-500"
            />
            <input
              type="text"
              inputMode="decimal"
              value={location.longitude}
              onChange={(event) => setLocation((prev) => ({ ...prev, longitude: event.target.value }))}
              placeholder="Longitude"
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-500"
            />
            <input
              type="text"
              value={location.note}
              onChange={(event) => setLocation((prev) => ({ ...prev, note: event.target.value }))}
              placeholder={lang === "en" ? "Short note" : "Kısa not"}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-500 md:col-span-3"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={isUploading}
              onClick={uploadSelectedFiles}
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {lang === "en" ? "Upload photos" : "Fotoğrafları Yükle"}
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => setLocation({ locationName: "", latitude: "", longitude: "", note: "" })}
              className="rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-white disabled:opacity-50"
            >
              {lang === "en" ? "Clear location" : "Konumu Temizle"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
