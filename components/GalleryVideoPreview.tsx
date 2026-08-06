"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  lang: "tr" | "en";
};

export default function GalleryVideoPreview({ src, lang }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const engagedRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            if (!engagedRef.current) {
              v.play().catch(() => {});
            }
          } else {
            v.pause();
          }
        });
      },
      { threshold: [0, 0.6] }
    );

    observer.observe(v);
    return () => observer.disconnect();
  }, []);

  function handleClick() {
    const v = videoRef.current;
    if (!v) return;
    const wrap = v.closest(".gallery-video-preview") as HTMLElement | null;
    engagedRef.current = true;
    v.muted = false;
    v.loop = false;
    v.controls = true;
    v.play().catch(() => {});
    wrap?.classList.add("gallery-video-preview--playing");
  }

  return (
    <div className="gallery-video-preview">
      <video
        ref={videoRef}
        src={src}
        className="w-full block"
        muted
        loop
        playsInline
        preload="metadata"
        onClick={handleClick}
      />
      <div className="gallery-video-tap-hint" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M8 5v14l11-7z" />
        </svg>
        {lang === "en" ? "Tap for sound" : "Sesi aç"}
      </div>
    </div>
  );
}
