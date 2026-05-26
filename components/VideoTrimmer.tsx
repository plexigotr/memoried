"use client";

import { useEffect, useRef, useState } from "react";
import { Range, getTrackBackground } from "react-range";

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
const MAX_CLIP_SECONDS = 60;

type Source =
  | { kind: "file"; file: File }
  | { kind: "url"; url: string };

type Props = {
  source: Source;
  code: string;
  title: string;
  itemId?: string;
  lang?: "tr" | "en";
  onDone: () => void;
  onCancel: () => void;
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function VideoTrimmer({ source, code, title, itemId, lang = "tr", onDone, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ffmpegRef = useRef<any>(null);
  const [videoSrc, setVideoSrc] = useState("");
  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [phase, setPhase] = useState<"ready" | "loading-ffmpeg" | "processing" | "uploading">("ready");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (source.kind === "file") {
      const url = URL.createObjectURL(source.file);
      setVideoSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoSrc(source.url);
    }
  }, []);

  function handleMeta() {
    const v = videoRef.current;
    if (!v || !isFinite(v.duration)) return;
    const dur = v.duration;
    setDuration(dur);
    setRange([0, Math.min(dur, MAX_CLIP_SECONDS)]);
  }

  function handleRangeChange(vals: number[]) {
    let [s, e] = vals as [number, number];
    if (e - s > MAX_CLIP_SECONDS) {
      const prev = range;
      if (s !== prev[0]) {
        e = s + MAX_CLIP_SECONDS;
      } else {
        s = e - MAX_CLIP_SECONDS;
      }
    }
    if (s < 0) s = 0;
    if (e > duration) e = duration;
    setRange([s, e]);
  }

  // Seek video when range thumbs change
  function handleRangeChangeEnd(vals: number[]) {
    const v = videoRef.current;
    if (v) v.currentTime = vals[0];
  }

  async function handleProcess() {
    setError("");
    setPhase("loading-ffmpeg");
    setProgress(0);

    if (!ffmpegRef.current) {
      try {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");
        const ff = new FFmpeg();
        ff.on("progress", ({ progress: p }: { progress: number }) =>
          setProgress(Math.round(p * 100))
        );
        await ff.load({
          coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpegRef.current = ff;
      } catch {
        setError(lang === "en" ? "Processor could not load. Refresh and try again." : "Video işleyici yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
        setPhase("ready");
        return;
      }
    }

    const ff = ffmpegRef.current;
    setPhase("processing");
    setProgress(0);

    const { fetchFile } = await import("@ffmpeg/util");

    let fileSize = 0;
    if (source.kind === "file") {
      fileSize = source.file.size;
      await ff.writeFile("input", await fetchFile(source.file));
    } else {
      const res = await fetch(source.url);
      const buf = await res.arrayBuffer();
      fileSize = buf.byteLength;
      await ff.writeFile("input", new Uint8Array(buf));
    }

    const [start, end] = range;
    const shouldCompress = fileSize > 30 * 1024 * 1024;

    const baseArgs = [
      "-i", "input",
      "-ss", start.toFixed(3),
      "-to", end.toFixed(3),
    ];

    const compressArgs = [
      "-vf", "scale=trunc(min(1280\\,iw)/2)*2:-2",
      "-c:v", "libx264", "-crf", "26", "-preset", "veryfast",
      "-c:a", "aac", "-b:a", "128k",
    ];

    const copyArgs = ["-c", "copy"];

    try {
      await ff.exec([...baseArgs, ...(shouldCompress ? compressArgs : copyArgs), "output.mp4"]);
    } catch {
      // copy failed (e.g. non-keyframe start) → re-encode
      await ff.exec([...baseArgs, ...compressArgs, "output.mp4"]);
    }

    const data = await ff.readFile("output.mp4");
    const blob = new Blob([(data as Uint8Array<ArrayBuffer>)], { type: "video/mp4" });

    setPhase("uploading");
    setProgress(0);

    const createRes = await fetch(`/api/magnets/${code}/create-video-upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: "video.mp4", contentType: "video/mp4" }),
    });

    if (!createRes.ok) {
      setError(lang === "en" ? "Upload URL failed." : "Upload URL alınamadı.");
      setPhase("ready");
      return;
    }

    const { uploadUrl, filePath } = await createRes.json();

    const upRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: blob,
    });

    if (!upRes.ok) {
      setError(lang === "en" ? "Upload failed." : "Yükleme başarısız.");
      setPhase("ready");
      return;
    }

    if (itemId) {
      // Existing video: replace file_path
      const repRes = await fetch(`/api/magnets/${code}/replace-video-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, filePath }),
      });
      if (!repRes.ok) {
        setError(lang === "en" ? "Update failed." : "Güncelleme başarısız.");
        setPhase("ready");
        return;
      }
    } else {
      // New video
      const completeRes = await fetch(`/api/magnets/${code}/complete-video-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, filePath }),
      });
      if (!completeRes.ok) {
        setError(lang === "en" ? "Save failed." : "Kayıt başarısız.");
        setPhase("ready");
        return;
      }
    }

    onDone();
  }

  const busy = phase !== "ready";
  const clipLen = range[1] - range[0];
  const fileSize = source.kind === "file" ? source.file.size : 0;
  const willCompress = fileSize > 30 * 1024 * 1024;

  const phaseLabel =
    phase === "loading-ffmpeg"
      ? (lang === "en" ? "Loading processor (one-time ~30 MB)…" : "İşleyici yükleniyor (ilk seferinde ~30 MB)…")
      : phase === "processing"
      ? (lang === "en" ? `Processing… ${progress}%` : `İşleniyor… %${progress}`)
      : lang === "en" ? "Uploading…" : "Yükleniyor…";

  return (
    <div className="vtrim">
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          className="vtrim__video"
          onLoadedMetadata={handleMeta}
          controls
          playsInline
        />
      )}

      {duration > 0 && (
        <div className="vtrim__controls">
          <div className="vtrim__times">
            <span>{fmt(range[0])}</span>
            <span className="vtrim__total">Toplam: {fmt(duration)}</span>
            <span>{fmt(range[1])}</span>
          </div>

          <Range
            step={0.1}
            min={0}
            max={duration}
            values={[range[0], range[1]]}
            onChange={handleRangeChange}
            onFinalChange={handleRangeChangeEnd}
            renderTrack={({ props, children }) => (
              <div
                onMouseDown={props.onMouseDown}
                onTouchStart={props.onTouchStart}
                className="vtrim__track-wrap"
                style={props.style}
              >
                <div
                  ref={props.ref}
                  className="vtrim__track"
                  style={{
                    background: getTrackBackground({
                      values: [range[0], range[1]],
                      colors: ["rgba(120,100,80,.18)", "#c8893d", "rgba(120,100,80,.18)"],
                      min: 0,
                      max: duration,
                    }),
                  }}
                >
                  {children}
                </div>
              </div>
            )}
            renderThumb={({ props, index }) => (
              <div {...props} key={props.key} className="vtrim__thumb">
                <span className="vtrim__thumb-label">
                  {index === 0 ? (lang === "en" ? "Start" : "Başla") : (lang === "en" ? "End" : "Bitir")}
                </span>
              </div>
            )}
          />

          <p className="vtrim__info">
            {lang === "en" ? `Selected: ${fmt(clipLen)}` : `Seçilen: ${fmt(clipLen)}`}
            {clipLen > MAX_CLIP_SECONDS && (
              <span className="vtrim__info-warn">
                {lang === "en" ? ` · Max ${MAX_CLIP_SECONDS}s` : ` · En fazla ${MAX_CLIP_SECONDS}sn`}
              </span>
            )}
            {willCompress && (
              <span className="vtrim__info-note">
                {lang === "en" ? " · Large file, will compress" : " · Büyük dosya, sıkıştırılacak"}
              </span>
            )}
          </p>
        </div>
      )}

      {error && <p className="vtrim__error">{error}</p>}

      {busy && (
        <div className="vtrim__progress-wrap">
          <p className="vtrim__progress-label">{phaseLabel}</p>
          <div className="vtrim__progress-bar">
            <div
              className="vtrim__progress-fill"
              style={{ width: phase === "loading-ffmpeg" ? "100%" : `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="vtrim__actions">
        <button
          type="button"
          onClick={handleProcess}
          disabled={busy || duration === 0 || clipLen > MAX_CLIP_SECONDS}
          className="vtrim__btn-primary"
        >
          {busy ? (lang === "en" ? "Processing…" : "İşleniyor…") : (lang === "en" ? "Trim & Upload" : "Kırp ve Yükle")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="vtrim__btn-cancel"
        >
          {lang === "en" ? "Cancel" : "İptal"}
        </button>
      </div>
    </div>
  );
}
