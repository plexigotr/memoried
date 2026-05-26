"use client";

import { useState } from "react";

export default function RotatePhotoButton({
  itemId,
  lang,
}: {
  itemId: string;
  lang: "tr" | "en";
}) {
  const [loading, setLoading] = useState(false);

  async function rotatePhoto() {
    try {
      setLoading(true);
      const response = await fetch(`/api/memory-items/${itemId}/rotate`, {
        method: "POST",
      });

      if (!response.ok) {
        alert(lang === "en" ? "Photo could not be rotated." : "Fotoğraf döndürülemedi.");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error("Rotate photo error:", error);
      alert(lang === "en" ? "Photo could not be rotated." : "Fotoğraf döndürülemedi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={rotatePhoto}
      disabled={loading}
      className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-100 disabled:opacity-60"
    >
      {loading
        ? lang === "en"
          ? "Rotating..."
          : "Döndürülüyor..."
        : lang === "en"
        ? "Rotate photo 90°"
        : "Fotoğrafı 90° döndür"}
    </button>
  );
}
