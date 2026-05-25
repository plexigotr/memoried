"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MapMemory = {
  id: string;
  title: string;
  note: string;
  imageUrl: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mapSrc(item: MapMemory | undefined) {
  const lat = item?.latitude ?? 41.0082;
  const lng = item?.longitude ?? 28.9784;
  const delta = 0.018;
  const left = clampNumber(lng - delta, -180, 180);
  const right = clampNumber(lng + delta, -180, 180);
  const bottom = clampNumber(lat - delta, -90, 90);
  const top = clampNumber(lat + delta, -90, 90);

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default function MemoryMapMode({
  items,
  lang,
}: {
  items: MapMemory[];
  lang: "tr" | "en";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const locatedItems = useMemo(
    () => items.filter((item) => item.latitude !== null && item.longitude !== null),
    [items]
  );

  const allItems = items.length > 0 ? items : [];
  const activeItem = allItems[activeIndex];
  const activeLocatedItem =
    activeItem?.latitude !== null && activeItem?.longitude !== null
      ? activeItem
      : locatedItems[0];

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      const cards = Array.from(scroller.querySelectorAll<HTMLElement>("[data-map-card]"));
      if (cards.length === 0) return;

      const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    };

    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  if (allItems.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-5 top-5 z-50 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/55 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:scale-[1.02] hover:bg-black/70 active:scale-95"
      >
        <span className="h-2 w-2 rounded-full bg-[#d8b889] shadow-[0_0_18px_rgba(216,184,137,0.9)]" />
        {lang === "en" ? "Map Mode" : "Harita Modu"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[100] bg-[#080706] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,184,137,0.22),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:auto,34px_34px]" />

          <div className="relative z-10 flex h-full flex-col md:grid md:grid-cols-[34%_66%]">
            <aside className="relative h-[34vh] overflow-hidden border-b border-white/10 bg-black md:h-full md:border-b-0 md:border-r">
              {activeLocatedItem ? (
                <iframe
                  key={`${activeLocatedItem.latitude}-${activeLocatedItem.longitude}`}
                  title="Memory map"
                  src={mapSrc(activeLocatedItem)}
                  className="h-full w-full scale-[1.03] border-0 grayscale-[.15] invert-[.88] hue-rotate-180 saturate-[.7]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-sm text-white/60">
                  {lang === "en"
                    ? "No location has been added to these photos yet."
                    : "Bu fotoğraflara henüz konum eklenmemiş."}
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35" />
              <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-white/15 bg-black/45 p-4 shadow-2xl backdrop-blur-xl">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d8b889]">
                  {lang === "en" ? "Active Memory" : "Aktif Anı"}
                </p>
                <h3 className="line-clamp-1 text-xl font-semibold">
                  {activeItem?.title || (lang === "en" ? "Untitled photo" : "İsimsiz fotoğraf")}
                </h3>
                <p className="mt-1 line-clamp-1 text-sm text-white/65">
                  {activeItem?.locationName ||
                    (lang === "en" ? "Location not added" : "Konum eklenmedi")}
                </p>
              </div>
            </aside>

            <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8 md:py-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d8b889]">
                    {lang === "en" ? "Memory Route" : "Anı Rotası"}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] md:text-4xl">
                    {lang === "en" ? "Browse by map" : "Haritadan keşfet"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur transition hover:bg-white/15"
                >
                  {lang === "en" ? "Close" : "Kapat"}
                </button>
              </div>

              <div
                ref={scrollerRef}
                className="memory-map-scroller flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-7 pt-2 md:gap-6 md:px-8 md:pb-10"
              >
                {allItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    data-map-card
                    onClick={() => {
                      setActiveIndex(index);
                      setSelectedIndex(index);
                    }}
                    className={`group relative h-full min-w-[78vw] snap-center overflow-hidden rounded-[2rem] border text-left shadow-[0_30px_90px_rgba(0,0,0,0.45)] transition md:min-w-[360px] lg:min-w-[420px] ${
                      activeIndex === index
                        ? "border-[#d8b889]/80 bg-white/10"
                        : "border-white/10 bg-white/[0.04] opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title || "Memory"}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/80 backdrop-blur">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#d8b889] backdrop-blur">
                          {item.latitude !== null ? (lang === "en" ? "Located" : "Konumlu") : (lang === "en" ? "No location" : "Konumsuz")}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 text-2xl font-semibold tracking-[-0.04em]">
                        {item.title || (lang === "en" ? "Photo memory" : "Fotoğraf anısı")}
                      </h3>
                      {item.note ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/70">
                          {item.note}
                        </p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {selectedIndex !== null ? (
            <div className="absolute inset-0 z-20 flex items-end bg-black/70 p-4 backdrop-blur-sm md:items-center md:justify-center">
              <article className="max-h-[92vh] w-full overflow-hidden rounded-[2rem] border border-white/15 bg-[#11100e] shadow-2xl md:max-w-3xl">
                <div className="max-h-[62vh] overflow-hidden bg-black">
                  <img
                    src={allItems[selectedIndex].imageUrl}
                    alt={allItems[selectedIndex].title || "Memory"}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="p-5 md:p-7">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d8b889]">
                        {allItems[selectedIndex].locationName ||
                          (lang === "en" ? "Location not added" : "Konum eklenmedi")}
                      </p>
                      <h3 className="text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
                        {allItems[selectedIndex].title ||
                          (lang === "en" ? "Photo memory" : "Fotoğraf anısı")}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedIndex(null)}
                      className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80"
                    >
                      {lang === "en" ? "Close" : "Kapat"}
                    </button>
                  </div>
                  {allItems[selectedIndex].note ? (
                    <p className="text-base leading-8 text-white/75">
                      {allItems[selectedIndex].note}
                    </p>
                  ) : null}
                </div>
              </article>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
