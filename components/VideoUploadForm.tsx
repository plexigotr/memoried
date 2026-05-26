"use client";

import { useState } from "react";
import VideoTrimmer from "./VideoTrimmer";

export default function VideoUploadForm({
  code,
  lang,
}: {
  code: string;
  lang: "tr" | "en";
}) {
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<"form" | "trimming">("form");

  const ui = {
    title: lang === "en" ? "Add New Video" : "Yeni Video Ekle",
    videoTitle: lang === "en" ? "Video Title" : "Video Başlığı",
    placeholder: lang === "en" ? "e.g. Sunset Video" : "Örn. Gün Batımı Videosu",
    chooseVideo: lang === "en" ? "Choose video" : "Video seç",
    proceed: lang === "en" ? "Trim & Upload" : "Kırp ve Yükle",
  };

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  }

  function handleDone() {
    window.location.href = `/m/${code}/edit?uploaded=video`;
  }

  function handleCancel() {
    setStep("form");
  }

  if (step === "trimming" && selectedFile) {
    return (
      <VideoTrimmer
        source={{ kind: "file", file: selectedFile }}
        code={code}
        title={title}
        lang={lang}
        onDone={handleDone}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          {ui.videoTitle}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={ui.placeholder}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
        />
      </div>

      <label className="block cursor-pointer rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-600 transition hover:bg-stone-50">
        {selectedFile ? selectedFile.name : ui.chooseVideo}
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      <button
        type="button"
        onClick={() => setStep("trimming")}
        disabled={!selectedFile}
        className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {ui.proceed}
      </button>
    </div>
  );
}
