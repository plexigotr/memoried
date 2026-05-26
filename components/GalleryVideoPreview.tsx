"use client";

type Props = {
  src: string;
  lang: "tr" | "en";
};

export default function GalleryVideoPreview({ src, lang }: Props) {
  function handleClick(e: React.MouseEvent<HTMLVideoElement>) {
    const v = e.currentTarget;
    const wrap = v.closest(".gallery-video-preview") as HTMLElement | null;
    v.muted = false;
    v.loop = false;
    v.controls = true;
    v.play();
    wrap?.classList.add("gallery-video-preview--playing");
  }

  return (
    <div className="gallery-video-preview">
      <video
        src={src}
        className="w-full block"
        autoPlay
        muted
        loop
        playsInline
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
