"use client";

import { useRef, useState } from "react";
import { Range } from "react-range";

const MAX_DURATION = 60;

export default function VideoUploadForm({
  code,
  lang,
}: {
  code: string;
  lang: "tr" | "en";
}) {

  const ui = {
    title: lang === "en" ? "Add New Video" : "Yeni Video Ekle",
    videoTitle: lang === "en" ? "Video Title" : "Video Başlığı",
    placeholder:
      lang === "en" ? "e.g. Sunset Video" : "Örn. Gün Batımı Videosu",
    start: lang === "en" ? "Start" : "Başlangıç",
    end: lang === "en" ? "End" : "Bitiş",
    longVideo:
      lang === "en"
        ? "Your video is longer than 1 minute. You can choose the part you want to upload."
        : "Videon 1 dakikadan uzun. Yüklemek istediğin bölümü seçebilirsin.",
    uploading: lang === "en" ? "Uploading video..." : "Video yükleniyor...",
    upload: lang === "en" ? "Upload Video" : "Videoyu Yükle",
    uploadError:
      lang === "en"
        ? "Something went wrong while uploading the video. Please try again."
        : "Video yüklenirken bir hata oluştu. Lütfen tekrar dene.",
  };

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [range, setRange] = useState<[number, number]>([0, 60]);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    setVideoFile(file);
    setVideoUrl(url);
  }

  function handleLoadedMetadata() {
    if (!videoRef.current) return;

    const d = videoRef.current.duration;
    setDuration(d);

    if (d <= MAX_DURATION) {
      setRange([0, d]);
    } else {
      setRange([0, MAX_DURATION]);
    }
  }

  function handleRangeChange(values: number[]) {
    let [start, end] = values;

    if (end - start > MAX_DURATION) {
      end = start + MAX_DURATION;
    }

    setRange([start, end]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!videoFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("videoFile", videoFile);
      formData.append("videoTitle", title);
      formData.append("trimStart", String(range[0]));
      formData.append("trimEnd", String(range[1]));

      const response = await fetch(`/api/magnets/${code}/upload-video`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Video upload failed:", text);
        alert(ui.uploadError);
        return;
      }

      window.location.reload();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-medium">{ui.title}</h2>

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

      <label className="block cursor-pointer rounded-2xl border border-dashed border-stone-300 px-4 py-5 text-center text-sm text-stone-600 transition hover:bg-stone-50">
        {lang === "en" ? "Choose video" : "Video seç"}
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {videoUrl && (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full rounded-2xl border"
          />

          <div className="space-y-3">
            <p className="text-sm text-stone-600">
              {ui.start}: {range[0].toFixed(1)} sn — {ui.end}:{" "}
              {range[1].toFixed(1)} sn
            </p>

            {duration > MAX_DURATION && (
              <p className="text-sm text-amber-700">
                {ui.longVideo}
              </p>
            )}

            <Range
              step={0.1}
              min={0}
              max={duration || 60}
              values={range}
              onChange={handleRangeChange}
              renderTrack={({ props, children }) => (
                <div
                  {...props}
                  className="h-2 w-full rounded bg-stone-200"
                >
                  {children}
                </div>
              )}
              renderThumb={({ props }) => {
                const { key, ...restProps } = props;

                return (
                  <div
                    key={key}
                    {...restProps}
                    className="h-4 w-4 rounded-full bg-black"
                  />
                );
              }}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              disabled={isUploading}
              className="rounded-full bg-stone-900 px-6 py-3 text-white disabled:opacity-50"
            >
              {isUploading ? ui.uploading : ui.upload}
            </button>
          </form>
        </>
      )}
    </section>
  );
}