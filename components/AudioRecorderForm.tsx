"use client";

import { useRef, useState } from "react";

function getSupportedAudioMimeType() {
  const types = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];

  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

function getExtensionFromMimeType(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("webm")) return "webm";
  return "webm";
}

export default function AudioRecorderForm({
  code,
  lang,
}: {
  code: string;
  lang: "tr" | "en";
}) {
  const ui = {
    title: lang === "en" ? "Record Audio Now" : "Anında Ses Kaydı Ekle",
    audioTitle: lang === "en" ? "Audio Title" : "Ses Başlığı",
    placeholder: lang === "en" ? "e.g. Sea Sound" : "Örn. Deniz Sesi",
    start: lang === "en" ? "Start Recording" : "Kaydı Başlat",
    stop: lang === "en" ? "Stop Recording" : "Kaydı Durdur",
    saving: lang === "en" ? "Saving..." : "Kaydediliyor...",
    upload: lang === "en" ? "Upload Recording" : "Ses Kaydını Yükle",
    preview: lang === "en" ? "Preview recording" : "Kaydı dinle",
    micError:
      lang === "en"
        ? "Microphone access could not be granted."
        : "Mikrofon erişimi alınamadı.",
    uploadError:
      lang === "en"
        ? "Something went wrong while uploading the audio recording."
        : "Ses kaydı yüklenirken bir sorun oluştu.",
    formatError:
      lang === "en"
        ? "This browser could not create a playable audio recording."
        : "Bu tarayıcı oynatılabilir bir ses kaydı oluşturamadı.",
  };

  const [title, setTitle] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      setMessage("");
      setAudioBlob(null);
      setAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      chunksRef.current = [];

      const supportedMimeType = getSupportedAudioMimeType();

      const mediaRecorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      setAudioMimeType(mediaRecorder.mimeType || supportedMimeType || "audio/webm");

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalMimeType =
          mediaRecorder.mimeType || supportedMimeType || "audio/webm";

        const blob = new Blob(chunksRef.current, {
          type: finalMimeType,
        });

        if (blob.size === 0) {
          setMessage(ui.formatError);
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(url);
        setAudioMimeType(finalMimeType);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording start error:", error);
      alert(ui.micError);
    }
  }

  function stopRecording() {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }

  async function uploadRecording() {
    if (!audioBlob) return;

    setIsUploading(true);
    setMessage("");

    try {
      const extension = getExtensionFromMimeType(audioMimeType);
      const formData = new FormData();

      formData.append("audioTitle", title);
      formData.append(
        "audioFile",
        new File([audioBlob], `recording.${extension}`, {
          type: audioMimeType || audioBlob.type || "audio/webm",
        })
      );

      const response = await fetch(`/api/magnets/${code}/upload-audio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setMessage(ui.uploadError);
        return;
      }

      window.location.href = `/m/${code}/edit?uploaded=audio`;
    } catch (error) {
      console.error("Audio upload error:", error);
      setMessage(ui.uploadError);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-medium">{ui.title}</h2>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          {ui.audioTitle}
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={ui.placeholder}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            {ui.start}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-full border border-red-300 px-6 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            {ui.stop}
          </button>
        )}
      </div>

      {audioUrl && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">{ui.preview}</p>

          <audio controls className="w-full" src={audioUrl} />

          <button
            type="button"
            onClick={uploadRecording}
            disabled={isUploading}
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? ui.saving : ui.upload}
          </button>
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}
    </section>
  );
}