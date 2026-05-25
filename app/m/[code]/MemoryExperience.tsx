"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type MemoryItem = {
  id: string;
  type: string;
  title: string;
  content: string;
  url: string | null;
};

type Props = {
  code: string;
  currentLang: "tr" | "en";
  title: string;
  subtitle: string;
  location: string;
  coverImageUrl: string | null;
  coverPositionPercent: number;
  items: MemoryItem[];
  shareUrl: string;
};

const tr = {
  detected: "Memory detected",
  openStory: "Hikâyeyi Aç",
  edit: "Düzenle",
  account: "Hesabım",
  share: "Paylaş",
  journey: "Memory Map",
  moments: "Moments",
  voice: "Sesli Anı",
  empty: "Anı sayfan hazır. İlk fotoğrafını, notunu, videonu veya ses kaydını ekleyerek başlayabilirsin.",
  start: "Başlayalım",
  close: "Kapat",
  created: "Created with Memoried",
};

const en = {
  detected: "Memory detected",
  openStory: "Open Story",
  edit: "Edit",
  account: "My Account",
  share: "Share",
  journey: "Memory Map",
  moments: "Moments",
  voice: "Voice Memory",
  empty: "Your memory page is ready. Add your first photo, note, video or voice recording to begin.",
  start: "Start adding content",
  close: "Close",
  created: "Created with Memoried",
};

const points = [
  { x: 18, y: 58 },
  { x: 32, y: 42 },
  { x: 47, y: 52 },
  { x: 57, y: 35 },
  { x: 68, y: 48 },
  { x: 78, y: 30 },
  { x: 86, y: 43 },
];

function isMedia(item: MemoryItem) {
  return item.type === "image" || item.type === "video" || item.type === "audio";
}

function itemLabel(item: MemoryItem, index: number, lang: "tr" | "en") {
  if (item.title) return item.title;
  if (item.type === "image") return lang === "en" ? `Photo ${index + 1}` : `Fotoğraf ${index + 1}`;
  if (item.type === "video") return lang === "en" ? `Video ${index + 1}` : `Video ${index + 1}`;
  if (item.type === "audio") return lang === "en" ? `Voice ${index + 1}` : `Ses ${index + 1}`;
  return lang === "en" ? `Memory ${index + 1}` : `Anı ${index + 1}`;
}

export default function MemoryPremiumExperience({
  code,
  currentLang,
  title,
  subtitle,
  location,
  coverImageUrl,
  coverPositionPercent,
  items,
  shareUrl,
}: Props) {
  const ui = currentLang === "en" ? en : tr;
  const [activeIndex, setActiveIndex] = useState(0);
  const [openItem, setOpenItem] = useState<MemoryItem | null>(null);

  const shownItems = useMemo(() => items.slice(0, 7), [items]);
  const activeItem = shownItems[activeIndex] || shownItems[0];
  const activePoint = points[activeIndex] || points[0];

  const heroImage = coverImageUrl || shownItems.find((item) => item.type === "image" && item.url)?.url || null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090807] text-[#fff8ed]">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_0%,rgba(214,148,77,0.22),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.10),transparent_28%),linear-gradient(180deg,#120f0c_0%,#090807_45%,#0d0b09_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="fixed right-4 top-4 z-50">
        <details className="relative">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur-2xl transition hover:bg-white/15">
            <span className="text-lg leading-none">⋯</span>
          </summary>
          <div className="absolute right-0 mt-3 w-48 overflow-hidden rounded-3xl border border-white/10 bg-[#15110d]/90 text-sm text-white shadow-2xl backdrop-blur-2xl">
            <Link href={`/m/${code}/edit?lang=${currentLang}`} className="block px-5 py-4 transition hover:bg-white/10">{ui.edit}</Link>
            <Link href="/account" className="block border-t border-white/10 px-5 py-4 transition hover:bg-white/10">{ui.account}</Link>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${title || "Memoried"} - ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer" className="block border-t border-white/10 px-5 py-4 transition hover:bg-white/10">{ui.share}</a>
          </div>
        </details>
      </div>

      <section className="relative z-10 min-h-[100svh] px-4 pb-8 pt-4 sm:px-6">
        <div className="relative mx-auto flex min-h-[calc(100svh-32px)] max-w-5xl flex-col overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/[0.04] shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="absolute inset-0">
            {heroImage ? (
              <img
                src={heroImage}
                alt={title || "Memoried"}
                className="h-full w-full object-cover opacity-90"
                style={{ objectPosition: `center ${coverPositionPercent}%` }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090807] via-[#090807]/45 to-black/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.48)_72%)]" />
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-between p-5 sm:p-8 md:p-10">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/80 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-[#f4b36b] shadow-[0_0_18px_rgba(244,179,107,.9)]" />
                {ui.detected}
              </div>
              {location ? <div className="hidden rounded-full border border-white/15 bg-black/20 px-4 py-2 text-xs text-white/75 backdrop-blur-xl sm:block">{location}</div> : null}
            </div>

            <div className="max-w-3xl pb-3 pt-24 sm:pt-32">
              <p className="mb-4 text-xs uppercase tracking-[0.34em] text-[#f4b36b]">Memoried</p>
              <h1 className="text-5xl font-semibold leading-[0.9] tracking-[-0.07em] text-white drop-shadow-2xl sm:text-7xl md:text-8xl">
                {title || (currentLang === "en" ? "Your Memory" : "Anın Hazır")}
              </h1>
              {subtitle ? <p className="mt-6 max-w-2xl text-base leading-7 text-white/82 sm:text-lg">{subtitle}</p> : null}
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#moments" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#15110d] shadow-xl transition hover:scale-[1.02]">{ui.openStory}</a>
                <Link href={`/m/${code}/edit?lang=${currentLang}`} className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/15">{ui.edit}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-10 sm:px-6" id="moments">
        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#15110d] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(244,179,107,.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_40%)]" />
            <div className="relative z-10 mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#f4b36b]">{ui.journey}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{location || title}</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">{shownItems.length}/7</div>
            </div>

            <div className="relative z-10 h-[310px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#221c16]">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-80">
                <defs>
                  <linearGradient id="line" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f4b36b" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f4b36b" stopOpacity="0.85" />
                  </linearGradient>
                </defs>
                <path d="M5 72 C18 38, 36 80, 48 48 S70 62, 95 25" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="18" strokeLinecap="round" />
                <path d="M2 28 C28 10, 35 42, 58 22 S76 38, 96 10" fill="none" stroke="rgba(255,255,255,.045)" strokeWidth="13" strokeLinecap="round" />
                {shownItems.length > 1 ? (
                  <polyline points={shownItems.map((_, i) => `${points[i].x},${points[i].y}`).join(" ")} fill="none" stroke="url(#line)" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="2 2" />
                ) : null}
              </svg>

              {shownItems.map((item, index) => {
                const point = points[index];
                const active = index === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    aria-label={itemLabel(item, index, currentLang)}
                  >
                    <span className={`block rounded-full transition ${active ? "h-7 w-7 bg-[#f4b36b]/20" : "h-5 w-5 bg-white/10"}`}>
                      <span className={`m-auto block rounded-full bg-[#f4b36b] shadow-[0_0_24px_rgba(244,179,107,.9)] transition ${active ? "h-3.5 w-3.5 translate-y-[6.5px]" : "h-2.5 w-2.5 translate-y-[5px]"}`} />
                    </span>
                  </button>
                );
              })}

              {activeItem ? (
                <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-2xl">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Moment {activeIndex + 1}</p>
                  <h3 className="mt-1 line-clamp-1 text-lg font-semibold tracking-[-0.03em]">{itemLabel(activeItem, activeIndex, currentLang)}</h3>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between px-1">
              <h2 className="text-2xl font-semibold tracking-[-0.05em]">{ui.moments}</h2>
              <span className="text-xs text-white/45">Swipe</span>
            </div>

            {shownItems.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible">
                {shownItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      setOpenItem(item);
                    }}
                    className={`group flex min-w-[78%] gap-4 rounded-[1.5rem] border p-3 text-left transition sm:min-w-[48%] lg:min-w-0 ${index === activeIndex ? "border-[#f4b36b]/45 bg-[#f4b36b]/10" : "border-white/10 bg-white/[0.045] hover:bg-white/[0.08]"}`}
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[1.15rem] bg-white/10">
                      {item.type === "image" && item.url ? <img src={item.url} alt="" className="h-full w-full object-cover" /> : null}
                      {item.type === "video" && item.url ? <video src={item.url} className="h-full w-full object-cover" muted playsInline /> : null}
                      {item.type === "audio" ? <div className="flex h-full w-full items-center justify-center text-2xl">♪</div> : null}
                      {item.type === "text" ? <div className="flex h-full w-full items-center justify-center text-2xl">“”</div> : null}
                    </div>
                    <div className="min-w-0 py-1">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#f4b36b]/80">#{index + 1}</p>
                      <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-5 tracking-[-0.03em]">{itemLabel(item, index, currentLang)}</h3>
                      {item.content ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/55">{item.content}</p> : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/15 p-6 text-center text-white/70">
                <p className="leading-7">{ui.empty}</p>
                <Link href={`/m/${code}/edit?lang=${currentLang}`} className="mt-5 inline-block rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#15110d]">{ui.start}</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-5xl columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3">
          {items.map((item, index) => (
            <article key={item.id} className="break-inside-avoid overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.055] p-3 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              {item.type === "image" && item.url ? <img src={item.url} alt={itemLabel(item, index, currentLang)} className="w-full rounded-[1.35rem] object-cover" /> : null}
              {item.type === "video" && item.url ? <video controls src={item.url} className="w-full rounded-[1.35rem]" /> : null}
              {item.type === "audio" && item.url ? (
                <div className="rounded-[1.35rem] bg-[#17120e] p-5">
                  <p className="mb-4 text-xs uppercase tracking-[0.28em] text-[#f4b36b]">{ui.voice}</p>
                  <audio controls src={item.url} className="w-full" />
                </div>
              ) : null}
              {(item.title || item.content || item.type === "text") ? (
                <div className="p-4">
                  <h3 className="text-lg font-semibold tracking-[-0.04em]">{itemLabel(item, index, currentLang)}</h3>
                  {item.content ? <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/62">{item.content}</p> : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <p className="relative z-10 pb-10 text-center text-[10px] uppercase tracking-[0.35em] text-white/30">{ui.created}</p>

      {openItem ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl" onClick={() => setOpenItem(null)}>
          <div className="max-h-[90svh] w-full max-w-3xl overflow-auto rounded-[2rem] border border-white/10 bg-[#110d0a] p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex justify-end">
              <button type="button" onClick={() => setOpenItem(null)} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80">{ui.close}</button>
            </div>
            {openItem.type === "image" && openItem.url ? <img src={openItem.url} alt={openItem.title} className="max-h-[70svh] w-full rounded-[1.5rem] object-contain" /> : null}
            {openItem.type === "video" && openItem.url ? <video controls autoPlay src={openItem.url} className="w-full rounded-[1.5rem]" /> : null}
            {openItem.type === "audio" && openItem.url ? <audio controls autoPlay src={openItem.url} className="mt-4 w-full" /> : null}
            <div className="p-4">
              {openItem.title ? <h3 className="text-2xl font-semibold tracking-[-0.05em]">{openItem.title}</h3> : null}
              {openItem.content ? <p className="mt-3 whitespace-pre-line text-base leading-8 text-white/65">{openItem.content}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
