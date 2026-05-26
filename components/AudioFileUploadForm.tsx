"use client";

import { useState } from "react";

export default function AudioFileUploadForm({
  code,
  lang,
}: {
  code: string;
  lang: "tr" | "en";
}) {
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const ui = {
    audioTitle: lang === "en" ? "Audio Title" : "Ses Başlığı",
    placeholder: lang === "en" ? "e.g. Sea Sound" : "Örn. Deniz Sesi",
    chooseFile: lang === "en" ? "Choose audio file" : "Ses dosyası seç",
    upload: lang === "en" ? "Upload Audio" : "Sesi Yükle",
    uploading: lang === "en" ? "Uploading…" : "Yükleniyor…",
    success: lang === "en" ? "Audio uploaded successfully." : "Ses başarıyla yüklendi.",
    error: lang === "en" ? "Upload failed. Please try again." : "Yükleme başarısız oldu. Tekrar dene.",
  };

  async function handleUpload() {
    if (!selectedFile) return;
    setIsUploading(true);
    setMessage("");
    setIsError(false);

    try {
      const urlRes = await fetch(`/api/magnets/${code}/create-audio-upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type || "audio/mpeg",
        }),
      });

      if (!urlRes.ok) {
        setMessage(ui.error);
        setIsError(true);
        return;
      }

      const { uploadUrl, filePath } = await urlRes.json();

      const upRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type || "audio/mpeg" },
        body: selectedFile,
      });

      if (!upRes.ok) {
        setMessage(ui.error);
        setIsError(true);
        return;
      }

      const completeRes = await fetch(`/api/magnets/${code}/complete-audio-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, filePath }),
      });

      if (!completeRes.ok) {
        setMessage(ui.error);
        setIsError(true);
        return;
      }

      window.location.href = `/m/${code}/edit?uploaded=audio`;
    } catch {
      setMessage(ui.error);
      setIsError(true);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          {ui.audioTitle}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={ui.placeholder}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
        />
      </div>

      <label className="block cursor-pointer rounded-2xl border border-dashed border-stone-300 px-4 py-5 text-center text-sm text-stone-600 transition hover:bg-stone-50">
        {selectedFile ? selectedFile.name : ui.chooseFile}
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          disabled={isUploading}
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
      </label>

      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isUploading ? ui.uploading : ui.upload}
      </button>
    </div>
  );
}
