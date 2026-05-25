"use client";

import { useEffect, useMemo, useState } from "react";

type JourneyItem = {
  id: string;
  title: string;
  type: string;
  previewUrl?: string | null;
};

type MemoryJourneyMapProps = {
  items: JourneyItem[];
  currentLang: "tr" | "en";
  locationText?: string | null;
};

const fallbackPlacesTr = [
  "İlk An",
  "Gizli Durak",
  "Güzel Gün",
  "Unutulmaz Yer",
  "Küçük Bir Hatıra",
  "Kalpte Kalan",
  "Son Durak",
];

const fallbackPlacesEn = [
  "First Moment",
  "Hidden Stop",
  "Beautiful Day",
  "Unforgettable Place",
  "Little Memory",
  "Kept in Heart",
  "Final Stop",
];

function itemIcon(type: string) {
  if (type === "image") return "✦";
  if (type === "video") return "▶";
  if (type === "audio") return "♪";
  return "•";
}

export default function MemoryJourneyMap({
  items,
  currentLang,
  locationText,
}: MemoryJourneyMapProps) {
  const visibleItems = useMemo(() => items.slice(0, 7), [items]);
  const [activeId, setActiveId] = useState(visibleItems[0]?.id ?? "");

  useEffect(() => {
    if (!visibleItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveId(visible.target.id.replace("memory-item-", ""));
        }
      },
      {
        root: null,
        threshold: [0.28, 0.45, 0.7],
        rootMargin: "-18% 0px -45% 0px",
      }
    );

    visibleItems.forEach((item) => {
      const element = document.getElementById(`memory-item-${item.id}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [visibleItems]);

  if (visibleItems.length < 2) return null;

  const activeIndex = Math.max(
    0,
    visibleItems.findIndex((item) => item.id === activeId)
  );
  const activeItem = visibleItems[activeIndex] ?? visibleItems[0];
  const fallbackPlaces = currentLang === "en" ? fallbackPlacesEn : fallbackPlacesTr;
  const progress =
    visibleItems.length <= 1
      ? 0
      : Math.round((activeIndex / (visibleItems.length - 1)) * 100);

  const copy = {
    eyebrow: currentLang === "en" ? "Memory Route" : "Anı Rotası",
    title:
      currentLang === "en"
        ? "Every moment has a place"
        : "Her anının bir yeri var",
    description:
      currentLang === "en"
        ? "As you move through the story, the highlighted pin follows the active memory. Later, real coordinates can be connected to these stops."
        : "Hikâyede aşağı indikçe aktif pin değişir ve anının durağı öne çıkar. İstersen sonraki adımda bu duraklara gerçek konum eklenebilir.",
    active: currentLang === "en" ? "Active memory" : "Aktif anı",
    tap: currentLang === "en" ? "Tap a pin to jump" : "Pine dokun, anıya git",
    stop: currentLang === "en" ? "Stop" : "Durak",
  };

  return (
    <section className="relative px-5 py-12 sm:px-6 md:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-stone-900/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/65 p-4 shadow-[0_35px_120px_rgba(87,61,34,0.18)] backdrop-blur-2xl md:rounded-[3rem] md:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between rounded-[1.75rem] border border-white/70 bg-[#20170f] p-6 text-white shadow-inner md:rounded-[2.4rem] md:p-8">
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-amber-100/70">
                {copy.eyebrow}
              </p>
              <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.05em] md:text-5xl">
                {copy.title}
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/68 md:text-base">
                {copy.description}
              </p>
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-100/60">
                {copy.active}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/12 text-lg ring-1 ring-white/15">
                  {activeItem.previewUrl ? (
                    <img
                      src={activeItem.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    itemIcon(activeItem.type)
                  )}
                </div>
                <div>
                  <p className="line-clamp-1 text-base font-medium text-white">
                    {activeItem.title || `${copy.stop} ${activeIndex + 1}`}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {locationText || fallbackPlaces[activeIndex] || fallbackPlaces[0]}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[460px] overflow-hidden rounded-[1.75rem] border border-stone-900/5 bg-[#e9dfd1] p-5 md:rounded-[2.4rem] md:p-7">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute inset-x-0 top-[18%] h-px bg-stone-900/10" />
              <div className="absolute inset-x-0 top-[38%] h-px bg-stone-900/10" />
              <div className="absolute inset-x-0 top-[58%] h-px bg-stone-900/10" />
              <div className="absolute inset-x-0 top-[78%] h-px bg-stone-900/10" />
              <div className="absolute inset-y-0 left-[20%] w-px bg-stone-900/10" />
              <div className="absolute inset-y-0 left-[40%] w-px bg-stone-900/10" />
              <div className="absolute inset-y-0 left-[60%] w-px bg-stone-900/10" />
              <div className="absolute inset-y-0 left-[80%] w-px bg-stone-900/10" />
            </div>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.78),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(120,78,37,0.14),transparent_35%)]" />

            <svg
              viewBox="0 0 720 440"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M70 330 C155 238 230 380 305 250 C386 110 470 275 550 145 C608 50 654 93 675 76"
                fill="none"
                stroke="rgba(68,45,25,0.18)"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d="M70 330 C155 238 230 380 305 250 C386 110 470 275 550 145 C608 50 654 93 675 76"
                fill="none"
                stroke="rgba(68,45,25,0.58)"
                strokeWidth="3"
                strokeDasharray="9 13"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute left-5 top-5 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-medium text-stone-700 shadow-sm backdrop-blur-xl">
              {copy.tap}
            </div>

            <div className="absolute bottom-5 left-5 right-5 z-10">
              <div className="rounded-full border border-white/70 bg-white/75 p-1 shadow-lg backdrop-blur-xl">
                <div className="h-2 rounded-full bg-stone-200">
                  <div
                    className="h-2 rounded-full bg-stone-900 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {visibleItems.map((item, index) => {
              const coords = [
                [12, 72],
                [28, 48],
                [42, 72],
                [52, 39],
                [66, 55],
                [77, 28],
                [90, 18],
              ][index] || [50, 50];
              const isActive = item.id === activeItem.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveId(item.id);
                    document
                      .getElementById(`memory-item-${item.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 text-left outline-none"
                  style={{ left: `${coords[0]}%`, top: `${coords[1]}%` }}
                  aria-label={item.title || `${copy.stop} ${index + 1}`}
                >
                  <span
                    className={`absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full transition duration-500 ${
                      isActive ? "bg-amber-500/20 blur-md" : "bg-stone-900/0"
                    }`}
                  />
                  <span
                    className={`relative flex h-11 w-11 items-center justify-center rounded-full border shadow-xl transition duration-500 ${
                      isActive
                        ? "scale-125 border-white bg-stone-950 text-white shadow-stone-900/30"
                        : "border-white/80 bg-white/90 text-stone-800 hover:scale-110"
                    }`}
                  >
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">{itemIcon(item.type)}</span>
                    )}
                  </span>
                  <span
                    className={`pointer-events-none absolute left-1/2 top-12 w-max max-w-[155px] -translate-x-1/2 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-center text-[11px] font-medium leading-snug text-stone-800 shadow-lg backdrop-blur-xl transition duration-300 ${
                      isActive
                        ? "translate-y-0 opacity-100"
                        : "translate-y-1 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {item.title || `${copy.stop} ${index + 1}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
