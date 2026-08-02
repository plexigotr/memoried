"use client";

import { useEffect, useRef, useState } from "react";

type LightboxItem = { src: string; title: string };

export default function GalleryLightbox() {
  const [items, setItems] = useState<LightboxItem[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const touchStartX = useRef(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function collectItems(): LightboxItem[] {
      return Array.from(
        document.querySelectorAll<HTMLElement>("[data-lightbox-src]")
      )
        .map((el) => ({
          src: el.getAttribute("data-lightbox-src") || "",
          title: el.getAttribute("data-lightbox-title") || "",
        }))
        .filter((it) => it.src);
    }

    setItems(collectItems());

    function handleClick(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-lightbox-src]");
      if (!el) return;
      const fresh = collectItems();
      setItems(fresh);
      const src = el.getAttribute("data-lightbox-src") || "";
      const i = fresh.findIndex((it) => it.src === src);
      setIndex(i >= 0 ? i : 0);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (index === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight")
        setIndex((i) => (i === null ? null : Math.min(i + 1, items.length - 1)));
      if (e.key === "ArrowLeft")
        setIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, items.length]);

  if (index === null) return null;
  const item = items[index];
  if (!item) return null;

  return (
    <div
      ref={overlayRef}
      className="lightbox-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) setIndex(null);
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (dx < -50)
          setIndex((i) => (i === null ? null : Math.min(i + 1, items.length - 1)));
        if (dx > 50)
          setIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
      }}
    >
      <button className="lightbox-close" onClick={() => setIndex(null)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
          <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>

      <div className="lightbox-content">
        <img
          key={item.src}
          src={item.src}
          alt={item.title}
          className="lightbox-image"
          draggable={false}
        />
        {item.title && <p className="lightbox-caption">{item.title}</p>}
      </div>

      {index > 0 && (
        <button
          className="lightbox-nav lightbox-prev"
          onClick={() => setIndex((i) => (i ?? 1) - 1)}
        >
          ‹
        </button>
      )}
      {index < items.length - 1 && (
        <button
          className="lightbox-nav lightbox-next"
          onClick={() => setIndex((i) => (i ?? 0) + 1)}
        >
          ›
        </button>
      )}

      {items.length > 1 && (
        <div className="lightbox-dots">
          {items.map((_, i) => (
            <button
              key={i}
              className={`lightbox-dot${i === index ? " lightbox-dot--active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
