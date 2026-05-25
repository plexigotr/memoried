"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemoryItem = {
  id: string;
  item_type: string;
  title: string | null;
  content_text: string | null;
  signedUrl: string | null;
};

type MemoryExperienceProps = {
  code: string;
  currentLang: "tr" | "en";
  title: string;
  subtitle: string | null;
  location: string | null;
  coverImageUrl: string | null;
  coverPositionPercent: number;
  items: MemoryItem[];
  shareUrl: string;
};

const mapPoints = [
  { x: 20, y: 76 },
  { x: 34, y: 58 },
  { x: 47, y: 66 },
  { x: 57, y: 42 },
  { x: 69, y: 52 },
  { x: 78, y: 31 },
  { x: 88, y: 43 },
];

function safeText(value: string | null | undefined, fallback: string) {
  const clean = value?.trim();
  return clean && clean.length > 0 ? clean : fallback;
}

function getPreviewImage(item: MemoryItem, coverImageUrl: string | null) {
  if ((item.item_type === "image" || item.item_type === "video") && item.signedUrl) {
    return item.signedUrl;
  }
  return coverImageUrl;
}

export default function MemoryExperience({
  code,
  currentLang,
  title,
  subtitle,
  location,
  coverImageUrl,
  coverPositionPercent,
  items,
  shareUrl,
}: MemoryExperienceProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MemoryItem | null>(null);

  const visibleItems = useMemo(() => items.slice(0, 7), [items]);
  const activeItem = visibleItems[activeIndex] || null;
  const activePoint = mapPoints[activeIndex] || mapPoints[0];
  const points = mapPoints.slice(0, Math.max(visibleItems.length, 1));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 1350);
    return () => window.clearTimeout(timer);
  }, []);

  const ui = {
    storyMagnet: currentLang === "en" ? "Story Magnet" : "Story Magnet",
    memoryDetected: currentLang === "en" ? "Memory detected" : "Anı algılandı",
    tapToExplore: currentLang === "en" ? "Swipe memories below" : "Anıları aşağıdan kaydır",
    edit: currentLang === "en" ? "Edit" : "Düzenle",
    account: currentLang === "en" ? "My Account" : "Hesabım",
    whatsapp: currentLang === "en" ? "Share on WhatsApp" : "WhatsApp ile Paylaş",
    openStory: currentLang === "en" ? "Open story" : "Anıyı aç",
    journey: currentLang === "en" ? "Memory route" : "Anı rotası",
    voice: currentLang === "en" ? "Voice memory" : "Sesli anı",
    note: currentLang === "en" ? "Memory note" : "Anı notu",
    close: currentLang === "en" ? "Close" : "Kapat",
    createdWith: currentLang === "en" ? "Created with Story Magnet" : "Story Magnet ile oluşturuldu",
    noContent:
      currentLang === "en"
        ? "Your memory page is ready. Add photos, notes, videos or voice recordings to begin."
        : "Anı sayfan hazır. Başlamak için fotoğraf, not, video veya ses kaydı ekleyebilirsin.",
    addContent: currentLang === "en" ? "Start adding content" : "İçerik eklemeye başla",
  };

  if (visibleItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[85vh] max-w-xl flex-col justify-center text-center">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-white/45">{ui.storyMagnet}</p>
          <h1 className="mb-5 text-5xl font-semibold tracking-[-0.07em]">{title}</h1>
          {subtitle ? <p className="mb-8 text-base leading-8 text-white/65">{subtitle}</p> : null}
          <p className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-sm leading-7 text-white/65 backdrop-blur-2xl">
            {ui.noContent}
          </p>
          <Link href={`/m/${code}/edit?lang=${currentLang}`} className="mx-auto rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">
            {ui.addContent}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090b] text-white">
      {showIntro ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#08090b]">
          <div className="text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full border border-white/15 bg-white/[0.06] shadow-[0_0_80px_rgba(255,111,66,0.35)]">
              <div className="mx-auto mt-5 h-6 w-6 animate-ping rounded-full bg-[#ff7849]" />
            </div>
            <p className="mb-3 text-xs uppercase tracking-[0.45em] text-white/45">{ui.memoryDetected}</p>
            <h1 className="px-8 text-3xl font-semibold tracking-[-0.05em]">{title}</h1>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,120,73,0.18),transparent_35%),linear-gradient(180deg,#101217_0%,#08090b_65%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />

      <div className="fixed right-5 top-5 z-50">
        <details className="relative">
          <summary className="flex h-12 w-12 cursor-pointer list-none items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur-2xl">
            <span className="text-xl">•••</span>
          </summary>
          <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-3xl border border-white/10 bg-[#15161a]/90 text-sm text-white shadow-2xl backdrop-blur-2xl">
            <Link href={`/m/${code}/edit?lang=${currentLang}`} className="block px-5 py-4 transition hover:bg-white/10">{ui.edit}</Link>
            <Link href="/account" className="block border-t border-white/10 px-5 py-4 transition hover:bg-white/10">{ui.account}</Link>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer" className="block border-t border-white/10 px-5 py-4 transition hover:bg-white/10">{ui.whatsapp}</a>
          </div>
        </details>
      </div>

      <section className="relative z-10 min-h-screen">
        <div className="absolute inset-0">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full opacity-80">
            <defs>
              <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ff7849" stopOpacity="0.85" />
              </linearGradient>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d="M0 22 C18 18 18 35 38 29 C58 22 65 34 100 25 L100 0 L0 0 Z" fill="rgba(255,255,255,0.05)" />
            <path d="M0 88 C17 78 25 93 43 83 C61 72 79 88 100 73 L100 100 L0 100 Z" fill="rgba(255,255,255,0.04)" />
            <polyline points={polyline} fill="none" stroke="url(#routeGradient)" strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round" filter="url(#softGlow)" />
            {points.map((point, index) => {
              const isActive = index === activeIndex;
              return (
                <g key={`${point.x}-${point.y}`}>
                  <circle cx={point.x} cy={point.y} r={isActive ? 4.2 : 2.7} fill={isActive ? "rgba(255,120,73,0.24)" : "rgba(255,255,255,0.10)"} />
                  <circle cx={point.x} cy={point.y} r={isActive ? 1.35 : 0.9} fill={isActive ? "#ff7849" : "rgba(255,255,255,0.70)"} />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,11,0.08)_0%,rgba(8,9,11,0.35)_42%,rgba(8,9,11,0.94)_100%)]" />

        <div className="relative z-20 flex min-h-screen flex-col justify-between px-5 pb-7 pt-20 sm:px-8">
          <div className="max-w-xl">
            <p className="mb-4 text-xs uppercase tracking-[0.38em] text-white/45">{ui.journey}</p>
            <h1 className="max-w-[13ch] text-5xl font-semibold leading-[0.9] tracking-[-0.075em] sm:text-7xl">
              {title}
            </h1>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/70">
              {location ? <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-xl">📍 {location}</span> : null}
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-xl">{visibleItems.length} moment</span>
            </div>
          </div>

          <div>
            <div className="mb-5 rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] bg-white/10">
                  {getPreviewImage(activeItem, coverImageUrl) ? (
                    <img src={getPreviewImage(activeItem, coverImageUrl) || ""} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">✦</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs uppercase tracking-[0.24em] text-white/40">{activeIndex + 1} / {visibleItems.length}</p>
                  <h2 className="truncate text-xl font-semibold tracking-[-0.04em]">{safeText(activeItem?.title, title)}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/55">{safeText(activeItem?.content_text, subtitle || ui.tapToExplore)}</p>
                </div>
                <button onClick={() => activeItem && setSelectedItem(activeItem)} className="rounded-full bg-white px-4 py-3 text-xs font-semibold text-black">
                  {ui.openStory}
                </button>
              </div>
            </div>

            <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8">
              {visibleItems.map((item, index) => {
                const image = getPreviewImage(item, coverImageUrl);
                const isActive = index === activeIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-28 w-40 shrink-0 snap-start overflow-hidden rounded-[1.6rem] border text-left shadow-2xl transition ${isActive ? "scale-[1.02] border-[#ff7849]/80" : "border-white/10 opacity-80"}`}
                  >
                    {image ? <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="mb-1 text-[10px] text-white/55">Stop {index + 1}</p>
                      <p className="line-clamp-2 text-sm font-semibold leading-4 text-white">{safeText(item.title, title)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-16 sm:px-8">
        <div className="mx-auto max-w-2xl space-y-5">
          {visibleItems.map((item, index) => {
            const image = getPreviewImage(item, coverImageUrl);
            return (
              <article key={`list-${item.id}`} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                {item.item_type === "image" && item.signedUrl ? <img src={item.signedUrl} alt={safeText(item.title, title)} className="w-full object-cover" /> : null}
                {item.item_type === "video" && item.signedUrl ? <video controls playsInline src={item.signedUrl} className="w-full" /> : null}
                {item.item_type === "audio" && item.signedUrl ? (
                  <div className="p-6">
                    <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#ffb49b]">{ui.voice}</p>
                    <div className="mb-5 flex h-14 items-center gap-1 overflow-hidden rounded-2xl bg-white/[0.06] px-4">
                      {Array.from({ length: 34 }).map((_, i) => (
                        <span key={i} className="w-1 rounded-full bg-white/55" style={{ height: `${12 + ((i * 7) % 32)}px` }} />
                      ))}
                    </div>
                    <audio controls src={item.signedUrl} className="w-full" />
                  </div>
                ) : null}
                {item.item_type === "text" ? (
                  <div className="p-6">
                    <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#ffb49b]">{ui.note}</p>
                    <h2 className="mb-3 text-2xl font-semibold tracking-[-0.05em]">{safeText(item.title, title)}</h2>
                    {item.content_text ? <p className="text-base leading-8 text-white/70">{item.content_text}</p> : null}
                  </div>
                ) : item.item_type !== "audio" ? (
                  <div className="p-5">
                    <p className="mb-1 text-xs text-white/35">Stop {index + 1}</p>
                    <h2 className="text-xl font-semibold tracking-[-0.04em]">{safeText(item.title, title)}</h2>
                    {item.content_text ? <p className="mt-2 text-sm leading-6 text-white/60">{item.content_text}</p> : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        <p className="pb-6 pt-12 text-center text-[10px] uppercase tracking-[0.35em] text-white/30">{ui.createdWith}</p>
      </section>

      {selectedItem ? (
        <div className="fixed inset-0 z-[90] bg-black/80 p-4 backdrop-blur-xl" onClick={() => setSelectedItem(null)}>
          <div className="mx-auto flex h-full max-w-md flex-col justify-end" onClick={(e) => e.stopPropagation()}>
            <div className="max-h-[88vh] overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#111217] shadow-2xl">
              <div className="max-h-[88vh] overflow-y-auto">
                {selectedItem.item_type === "image" && selectedItem.signedUrl ? <img src={selectedItem.signedUrl} alt="" className="w-full" /> : null}
                {selectedItem.item_type === "video" && selectedItem.signedUrl ? <video controls autoPlay playsInline src={selectedItem.signedUrl} className="w-full" /> : null}
                <div className="p-6">
                  <p className="mb-2 text-xs uppercase tracking-[0.35em] text-[#ffb49b]">{ui.storyMagnet}</p>
                  <h2 className="mb-3 text-3xl font-semibold tracking-[-0.06em]">{safeText(selectedItem.title, title)}</h2>
                  {selectedItem.content_text ? <p className="mb-5 text-base leading-8 text-white/70">{selectedItem.content_text}</p> : null}
                  {selectedItem.item_type === "audio" && selectedItem.signedUrl ? <audio controls autoPlay src={selectedItem.signedUrl} className="w-full" /> : null}
                  <button onClick={() => setSelectedItem(null)} className="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">{ui.close}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
