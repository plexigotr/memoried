"use client";

import { useRef, useState } from "react";

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
    micError:
      lang === "en"
        ? "Microphone access could not be granted."
        : "Mikrofon erişimi alınamadı.",
    uploadError:
      lang === "en"
        ? "Something went wrong while uploading the audio recording."
        : "Ses kaydı yüklenirken bir sorun oluştu.",
  };

  const [title, setTitle] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(url);

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

    try {
      const formData = new FormData();
      formData.append("audioTitle", title);
      formData.append(
        "audioFile",
        new File([audioBlob], "recording.webm", { type: "audio/webm" })
      );

      const response = await fetch(`/api/magnets/${code}/upload-audio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        alert(ui.uploadError);
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error("Audio upload error:", error);
      alert("Ses kaydı yüklenirken bir sorun oluştu.");
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
          onChange={(e) => setTitle(e.target.value)}
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
          <audio controls className="w-full" src={audioUrl} />

          <button
            type="button"
            onClick={uploadRecording}
            disabled={isUploading}
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isUploading ? ui.saving : ui.upload}
          </button>
        </div>
      )}
    </section>
  );
}