"use client";

import { useState } from "react";

export default function VideoUploadForm({
  code,
  lang,
}: {
  code: string;
  lang: "tr" | "en";
}) {
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const ui = {
    title: lang === "en" ? "Add New Video" : "Yeni Video Ekle",
    videoTitle: lang === "en" ? "Video Title" : "Video Başlığı",
    placeholder:
      lang === "en" ? "e.g. Sunset Video" : "Örn. Gün Batımı Videosu",
    chooseVideo: lang === "en" ? "Choose video" : "Video seç",
    selected: lang === "en" ? "Selected video" : "Seçilen video",
    tooLong:
      lang === "en"
        ? "The video must be 1 minute or shorter."
        : "Video en fazla 1 dakika olmalı.",
    upload: lang === "en" ? "Upload Video" : "Videoyu Yükle",
    uploading: lang === "en" ? "Uploading video..." : "Video yükleniyor...",
    success:
      lang === "en"
        ? "Video uploaded successfully."
        : "Video başarıyla yüklendi.",
    error:
      lang === "en"
        ? "Something went wrong while uploading the video."
        : "Video yüklenirken bir sorun oluştu.",
    limit:
      lang === "en"
        ? "You have reached your video limit."
        : "Video limitine ulaştın.",
  };

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setMessage("");
    setVideoDuration(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setVideoDuration(video.duration);
    };

    video.src = URL.createObjectURL(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;

    if (videoDuration && videoDuration > 60) {
      setMessage(ui.tooLong);
      return;
    }

    try {
      setIsUploading(true);
      setMessage("");

      const createUrlResponse = await fetch(
        `/api/magnets/${code}/create-video-upload-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: selectedFile.name,
            contentType: selectedFile.type || "video/mp4",
          }),
        }
      );

      const createUrlData = await createUrlResponse.json();

      if (!createUrlResponse.ok) {
        if (createUrlData.error === "video-limit") {
          setMessage(ui.limit);
        } else {
          setMessage(ui.error);
        }

        return;
      }

      const uploadResponse = await fetch(createUrlData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": createUrlData.contentType,
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        setMessage(ui.error);
        return;
      }

      const completeResponse = await fetch(
        `/api/magnets/${code}/complete-video-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            filePath: createUrlData.filePath,
          }),
        }
      );

      if (!completeResponse.ok) {
        setMessage(ui.error);
        return;
      }

      window.location.href = `/m/${code}/edit?uploaded=video`;
    } catch (error) {
      console.error("Direct video upload error:", error);
      setMessage(ui.error);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-medium">{ui.title}</h2>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            {ui.videoTitle}
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
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
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </label>

        {selectedFile && videoDuration !== null && (
          <p className="text-sm text-stone-500">
            {ui.selected}: {Math.round(videoDuration)} sn
          </p>
        )}

        {videoDuration !== null && videoDuration > 60 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            {ui.tooLong}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || Boolean(videoDuration && videoDuration > 60)}
          className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isUploading ? ui.uploading : ui.upload}
        </button>
      </div>
    </section>
  );
}