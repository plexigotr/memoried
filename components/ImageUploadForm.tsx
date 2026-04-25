"use client";

import { useState } from "react";

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

      window.location.href = `/m/${code}/edit?uploaded=success`;
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
  );
}