"use client";

import { useRef, useState } from "react";
import LocationPicker from "@/components/LocationPicker";

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
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

    setSelectedFiles(files.slice(0, remainingPhotos));
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);

      const baseFormData = new FormData(formRef.current || undefined);
      const locationName = String(baseFormData.get("locationName") || "");
      const latitude = String(baseFormData.get("latitude") || "");
      const longitude = String(baseFormData.get("longitude") || "");

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("imageFile", file);
        formData.append("locationName", locationName);
        formData.append("latitude", latitude);
        formData.append("longitude", longitude);

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
          : selectedFiles.length > 0
          ? lang === "en"
            ? `${selectedFiles.length} photo(s) selected`
            : `${selectedFiles.length} fotoğraf seçildi`
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

      {selectedFiles.length > 0 && (
        <form ref={formRef} className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            {lang === "en"
              ? "After choosing photos, you can optionally attach a location. Search a place, select it on the map, use your current location, or leave it empty."
              : "Fotoğraf seçildikten sonra istersen konum ekleyebilirsin. Yer arayabilir, haritadan seçebilir, mevcut konumu kaydedebilir veya boş bırakabilirsin."}
          </div>

          <LocationPicker lang={lang} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {lang === "en" ? "Upload photos" : "Fotoğrafları yükle"}
            </button>

            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              disabled={isUploading}
              className="rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-60"
            >
              {lang === "en" ? "Cancel" : "Vazgeç"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
