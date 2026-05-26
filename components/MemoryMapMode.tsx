"use client";

import { useMemo, useState } from "react";

type MemoryMapItem = {
  id: string;
  title: string | null;
  note: string | null;
  imageUrl: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  items: MemoryMapItem[];
};

function mapUrl(item: MemoryMapItem | null) {
  if (!item?.latitude || !item?.longitude) {
    return "https://maps.google.com/maps?q=Türkiye&z=5&output=embed";
  }

  return `https://maps.google.com/maps?q=${item.latitude},${item.longitude}&z=15&output=embed`;
}

export default function MemoryMapMode({ items }: Props) {
  const mappableItems = useMemo(
    () => items.filter((item) => item.latitude && item.longitude),
    [items]
  );

  const visibleItems = items.filter((item) => item.imageUrl);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(
    mappableItems[0]?.id || visibleItems[0]?.id || null
  );

  const activeItem =
    items.find((item) => item.id === activeId) || mappableItems[0] || visibleItems[0] || null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-20 top-5 z-[9999] rounded-full border border-white/25 bg-black/45 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-2xl backdrop-blur-xl transition hover:scale-[1.03] hover:bg-black/60 md:right-24"
      >
        Harita Modu
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[10000] bg-black/70 p-3 backdrop-blur-xl md:p-6">
          <div className="relative h-full overflow-hidden rounded-[2rem] border border-white/15 bg-[#11100f] shadow-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl"
            >
              Kapat
            </button>

            <div className="grid h-full grid-rows-[38%_1fr] md:grid-cols-[34%_1fr] md:grid-rows-1">
              <aside className="relative overflow-hidden border-b border-white/10 md:border-b-0 md:border-r">
                <iframe
                  key={`${activeItem?.id || "default"}-${activeItem?.latitude || ""}`}
                  src={mapUrl(activeItem)}
                  className="h-full w-full grayscale-[25%] contrast-110"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
                    Aktif Konum
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">
                    {activeItem?.locationName || "Konum seçilmemiş"}
                  </h3>
                  {!activeItem?.latitude || !activeItem?.longitude ? (
                    <p className="mt-1 text-xs text-white/60">
                      Bu fotoğrafa sonradan konum ekleyebilirsin.
                    </p>
                  ) : null}
                </div>
              </aside>

              <section className="flex h-full flex-col overflow-hidden p-5 text-white md:p-8">
                <div className="mb-5 max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                    Memory Map
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
                    Anıların haritada canlansın
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    Fotoğrafları yana kaydırdıkça seçili anının konumu haritada görünür. Konum eklemek zorunlu değildir.
                  </p>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                  <div className="flex h-full gap-5 pr-10">
                    {visibleItems.length > 0 ? (
                      visibleItems.map((item) => {
                        const isActive = activeItem?.id === item.id;

                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => setActiveId(item.id)}
                            className={`group relative h-full min-w-[230px] overflow-hidden rounded-[1.7rem] border text-left transition md:min-w-[300px] ${
                              isActive
                                ? "border-white/60 shadow-[0_0_60px_rgba(255,255,255,0.22)]"
                                : "border-white/10 opacity-75 hover:opacity-100"
                            }`}
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title || "Anı fotoğrafı"}
                                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                              />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-5">
                              <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-white/60">
                                {item.locationName || "Konum yok"}
                              </p>
                              {item.title ? (
                                <h3 className="text-xl font-semibold leading-tight text-white">
                                  {item.title}
                                </h3>
                              ) : null}
                              {item.note ? (
                                <p className="mt-2 line-clamp-3 text-sm leading-5 text-white/70">
                                  {item.note}
                                </p>
                              ) : null}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="flex h-full min-w-full items-center justify-center rounded-[1.7rem] border border-dashed border-white/20 text-center text-white/60">
                        Henüz harita modunda gösterilecek fotoğraf yok.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
