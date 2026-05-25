import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSignedImageUrl, getSignedMediaUrl } from "@/lib/storage";

type MagnetPageProps = {
  params: Promise<{
    code: string;
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
};

const trDate = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const enDate = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function safeText(value?: string | null) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function splitLocation(location?: string | null) {
  const text = safeText(location);
  if (!text) return [];

  return text
    .split(/[,•|\/]+/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 7);
}

function premiumEmptyState(currentLang: "tr" | "en", code: string) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#120f0b] text-[#f8efe3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,196,124,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_32%)]" />
      <section className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.48em] text-[#d7b98b]">
          Memoried
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] md:text-7xl">
          {currentLang === "en" ? "This story is ready to begin" : "Bu hikâye başlamaya hazır"}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-[#e9dcc8]/75 md:text-lg">
          {currentLang === "en"
            ? "Add your first photo, note, video or voice memory to turn this page into a cinematic memory experience."
            : "İlk fotoğrafını, notunu, videonu veya ses kaydını ekleyerek bu sayfayı sinematik bir anı deneyimine dönüştürebilirsin."}
        </p>
        <Link
          href={`/m/${code}/edit?lang=${currentLang}`}
          className="mt-10 rounded-full border border-[#e8cfaa]/30 bg-[#f8efe3] px-7 py-4 text-sm font-semibold text-[#15110c] shadow-[0_24px_80px_rgba(236,198,143,0.18)] transition hover:-translate-y-0.5 hover:bg-white"
        >
          {currentLang === "en" ? "Start adding memories" : "Anıları Eklemeye Başla"}
        </Link>
      </section>
    </main>
  );
}

export default async function MagnetPage({ params, searchParams }: MagnetPageProps) {
  const { code } = await params;
  const { lang } = await searchParams;

  const magnet = await prisma.magnets.findUnique({
    where: {
      magnet_code: code,
    },
    include: {
      memory: {
        include: {
          memory_items: {
            where: {
              is_visible: true,
            },
            orderBy: {
              sort_order: "asc",
            },
          },
        },
      },
    },
  });

  const fallbackLang: "tr" | "en" = lang === "en" ? "en" : "tr";

  if (!magnet) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#120f0b] text-[#f8efe3]">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(246,196,124,0.16),transparent_40%)]" />
        <section className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.48em] text-[#d7b98b]">
            Memoried
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
            {fallbackLang === "en" ? "Magnet not found" : "Magnet bulunamadı"}
          </h1>
          <p className="mt-5 text-base leading-8 text-[#e9dcc8]/70">
            {fallbackLang === "en"
              ? "This magnet code does not appear to be registered in the system."
              : "Bu magnet kodu sistemde kayıtlı görünmüyor."}
          </p>
        </section>
      </main>
    );
  }

  await prisma.scan_logs.create({
    data: {
      magnet_id: magnet.id,
      scanned_at: new Date(),
    },
  });

  if (!magnet.is_active) {
    const currentLang: "tr" | "en" = lang === "en" ? "en" : "tr";

    return (
      <main className="min-h-screen overflow-hidden bg-[#120f0b] text-[#f8efe3]">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(246,196,124,0.22),transparent_34%),radial-gradient(circle_at_80%_85%,rgba(255,255,255,0.08),transparent_34%)]" />
        <section className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.48em] text-[#d7b98b]">
            Memoried
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] md:text-7xl">
            {currentLang === "en"
              ? "This magnet has not been activated yet"
              : "Bu magnet henüz aktive edilmemiş"}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#e9dcc8]/75 md:text-lg">
            {currentLang === "en"
              ? "Choose a language and start creating a private story with photos, videos, notes and voice memories."
              : "Dil seçerek fotoğraflar, videolar, notlar ve ses kayıtlarıyla sana özel hikâyeyi oluşturmaya başlayabilirsin."}
          </p>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] px-6 py-4 text-sm text-[#e9dcc8]/70 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <span className="block text-[10px] uppercase tracking-[0.35em] text-[#d7b98b]/80">
              {currentLang === "en" ? "Magnet Code" : "Magnet Kodu"}
            </span>
            <span className="mt-2 block text-lg font-semibold tracking-[0.18em] text-[#f8efe3]">
              {magnet.magnet_code}
            </span>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/m/${magnet.magnet_code}/setup?lang=tr`}
              className="rounded-full bg-[#f8efe3] px-7 py-4 text-sm font-semibold text-[#15110c] transition hover:-translate-y-0.5 hover:bg-white"
            >
              Türkçe Başla
            </Link>
            <Link
              href={`/m/${magnet.magnet_code}/setup?lang=en`}
              className="rounded-full border border-white/15 bg-white/[0.06] px-7 py-4 text-sm font-semibold text-[#f8efe3] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Start in English
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const memory = magnet.memory;

  const currentLang: "tr" | "en" =
    lang === "en" || lang === "tr"
      ? lang
      : memory?.selected_lang === "en"
      ? "en"
      : "tr";

  const ui = {
    edit: currentLang === "en" ? "Edit story" : "Hikâyeyi Düzenle",
    account: currentLang === "en" ? "My Account" : "Hesabım",
    share: currentLang === "en" ? "Share on WhatsApp" : "WhatsApp ile Paylaş",
    storyCreatedWith:
      currentLang === "en" ? "Created with Memoried" : "Memoried ile oluşturuldu",
    memoryReady: currentLang === "en" ? "Your memory is ready" : "Anın hazır",
    coverAlt: currentLang === "en" ? "Cover image" : "Kapak görseli",
    opening: currentLang === "en" ? "A story worth keeping" : "Saklanmaya değer bir hikâye",
    timeline: currentLang === "en" ? "Memory Timeline" : "Anı Zaman Çizgisi",
    timelineText:
      currentLang === "en"
        ? "Every moment is placed like a scene in a quiet film."
        : "Her anı, sakin bir filmin sahnesi gibi yerini alıyor.",
    mapTitle: currentLang === "en" ? "Memory Map" : "Anı Haritası",
    mapText:
      currentLang === "en"
        ? "The places, moments and feelings that shaped this story."
        : "Bu hikâyeyi oluşturan yerler, anlar ve hisler.",
    image: currentLang === "en" ? "Photo Memory" : "Fotoğraf Anısı",
    video: currentLang === "en" ? "Video Memory" : "Video Anısı",
    audio: currentLang === "en" ? "Voice Memory" : "Sesli Anı",
    note: currentLang === "en" ? "Written Memory" : "Yazılı Anı",
    finalTitle:
      currentLang === "en"
        ? "Some memories are not just remembered. They are kept alive."
        : "Bazı anılar sadece hatırlanmaz. Yaşatılır.",
    finalText:
      currentLang === "en"
        ? "This page was created to keep the feeling of this story close, every time it is opened."
        : "Bu sayfa, her açıldığında bu hikâyenin hissini yeniden yaşatmak için oluşturuldu.",
  };

  const memoryTitle =
    currentLang === "en"
      ? safeText(memory?.title_en) || safeText(memory?.title_tr) || safeText(memory?.title)
      : safeText(memory?.title_tr) || safeText(memory?.title);

  const memorySubtitle =
    currentLang === "en"
      ? safeText(memory?.subtitle_en) || safeText(memory?.subtitle_tr) || safeText(memory?.subtitle)
      : safeText(memory?.subtitle_tr) || safeText(memory?.subtitle);

  const memoryLocation =
    currentLang === "en"
      ? safeText(memory?.location_text_en) || safeText(memory?.location_text_tr) || safeText(memory?.location_text)
      : safeText(memory?.location_text_tr) || safeText(memory?.location_text);

  const formattedDate = memory?.memory_date
    ? currentLang === "en"
      ? enDate.format(memory.memory_date)
      : trDate.format(memory.memory_date)
    : null;

  let coverImageUrl: string | null = null;

  if (memory?.cover_image_path) {
    try {
      let actualCoverPath = memory.cover_image_path;

      if (actualCoverPath.startsWith("http")) {
        const marker = `${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/`;
        const index = actualCoverPath.indexOf(marker);

        if (index !== -1) {
          actualCoverPath = actualCoverPath.substring(index + marker.length);
        }
      }

      coverImageUrl = await getSignedImageUrl(actualCoverPath);
    } catch (err) {
      console.error("Cover image error:", err);
      coverImageUrl = null;
    }
  }

  const coverPositionPercent = memory?.cover_position_percent ?? 50;

  const itemsWithUrls = memory
    ? await Promise.all(
        memory.memory_items.map(async (item) => {
          if (
            (item.item_type === "image" ||
              item.item_type === "video" ||
              item.item_type === "audio") &&
            item.file_path
          ) {
            try {
              let actualPath = item.file_path;

              if (actualPath.startsWith("http")) {
                const marker = `${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/`;
                const index = actualPath.indexOf(marker);

                if (index !== -1) {
                  actualPath = actualPath.substring(index + marker.length);
                }
              }

              const signedUrl = await getSignedMediaUrl(actualPath);

              return {
                ...item,
                signedUrl,
              };
            } catch (err) {
              console.error("Memory media error:", err);
              return {
                ...item,
                signedUrl: null,
              };
            }
          }

          return {
            ...item,
            signedUrl: null,
          };
        })
      )
    : [];

  if (!memory || itemsWithUrls.length === 0) {
    return premiumEmptyState(currentLang, magnet.magnet_code);
  }

  const locations = splitLocation(memoryLocation);
  const visibleMarkers = locations.length > 0 ? locations : [memoryLocation || (currentLang === "en" ? "Memory Place" : "Anı Noktası")];
  const heroImage = coverImageUrl || itemsWithUrls.find((item) => item.item_type === "image" && item.signedUrl)?.signedUrl || null;
  const totalPhotos = itemsWithUrls.filter((item) => item.item_type === "image").length;
  const totalVideos = itemsWithUrls.filter((item) => item.item_type === "video").length;
  const totalAudios = itemsWithUrls.filter((item) => item.item_type === "audio").length;

  return (
    <main className="memory-premium-page min-h-screen overflow-hidden bg-[#120f0b] text-[#f8efe3]">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_8%,rgba(235,184,111,0.18),transparent_31%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_29%),linear-gradient(180deg,#120f0b_0%,#17120d_45%,#0d0b09_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="fixed right-4 top-4 z-50 md:right-6 md:top-6">
        <details className="group relative">
          <summary className="flex h-12 w-12 cursor-pointer list-none items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-[#f8efe3] shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:scale-105 hover:bg-white/[0.12] [&::-webkit-details-marker]:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d7b98b] shadow-[0_0_0_5px_rgba(215,185,139,0.13)]" />
          </summary>

          <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#1b1510]/92 p-2 text-sm text-[#f8efe3] shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <Link
              href={`/m/${magnet.magnet_code}/edit?lang=${currentLang}`}
              className="block rounded-2xl px-4 py-3 transition hover:bg-white/10"
            >
              {ui.edit}
            </Link>
            <Link
              href="/account"
              className="block rounded-2xl px-4 py-3 transition hover:bg-white/10"
            >
              {ui.account}
            </Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${memoryTitle || "Memoried"} - ${process.env.APP_BASE_URL || "http://localhost:3000"}/m/${magnet.magnet_code}?lang=${currentLang}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl px-4 py-3 transition hover:bg-white/10"
            >
              {ui.share}
            </a>
          </div>
        </details>
      </div>

      <section className="relative z-10 min-h-screen">
        <div className="absolute inset-0">
          {heroImage ? (
            <img
              src={heroImage}
              alt={memoryTitle || ui.coverAlt}
              className="memory-hero-image h-full w-full object-cover opacity-90"
              style={{ objectPosition: `center ${coverPositionPercent}%` }}
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(215,185,139,0.22),transparent_40%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#120f0b]/58 to-[#120f0b]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.58)_72%)]" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-5 pb-10 pt-28 md:px-8 md:pb-16">
          <div className="max-w-4xl">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#ead6b7] backdrop-blur-2xl">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d7b98b]" />
              {ui.opening}
            </div>

            <h1 className="max-w-5xl text-[clamp(3rem,11vw,8.5rem)] font-semibold leading-[0.86] tracking-[-0.085em] text-[#fff8ed] drop-shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
              {memoryTitle || ui.memoryReady}
            </h1>

            {memorySubtitle ? (
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#f8efe3]/78 md:text-2xl md:leading-10">
                {memorySubtitle}
              </p>
            ) : null}

            <div className="mt-9 flex flex-wrap gap-3 text-sm text-[#f8efe3]/80">
              {memoryLocation ? (
                <span className="rounded-full border border-white/14 bg-white/[0.07] px-4 py-2 backdrop-blur-2xl">
                  {memoryLocation}
                </span>
              ) : null}
              {formattedDate ? (
                <span className="rounded-full border border-white/14 bg-white/[0.07] px-4 py-2 backdrop-blur-2xl">
                  {formattedDate}
                </span>
              ) : null}
              <span className="rounded-full border border-white/14 bg-white/[0.07] px-4 py-2 backdrop-blur-2xl">
                {itemsWithUrls.length} {currentLang === "en" ? "memories" : "anı"}
              </span>
            </div>
          </div>

          <div className="mt-14 grid gap-3 border-t border-white/12 pt-5 text-[#f8efe3]/72 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-semibold tracking-[-0.05em] text-[#fff8ed]">{totalPhotos}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-[#d7b98b]/80">{currentLang === "en" ? "Photos" : "Fotoğraf"}</p>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-[-0.05em] text-[#fff8ed]">{totalVideos}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-[#d7b98b]/80">{currentLang === "en" ? "Videos" : "Video"}</p>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-[-0.05em] text-[#fff8ed]">{totalAudios}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-[#d7b98b]/80">{currentLang === "en" ? "Voices" : "Ses"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 grid gap-8 md:grid-cols-[0.82fr_1.18fr] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.42em] text-[#d7b98b]">
                {ui.timeline}
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.055em] text-[#fff8ed] md:text-6xl">
                {currentLang === "en" ? "Scenes from the story" : "Hikâyeden sahneler"}
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#e9dcc8]/67 md:text-lg">
              {ui.timelineText}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="relative space-y-9 md:space-y-14">
              <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-[#d7b98b]/35 to-transparent md:block" />

              {itemsWithUrls.map((item, index) => {
                const itemTitle =
                  currentLang === "en"
                    ? safeText(item.title_en) || safeText(item.title_tr) || safeText(item.title)
                    : safeText(item.title_tr) || safeText(item.title);

                const itemContent =
                  currentLang === "en"
                    ? safeText(item.content_text_en) || safeText(item.content_text_tr) || safeText(item.content_text)
                    : safeText(item.content_text_tr) || safeText(item.content_text);

                const label =
                  item.item_type === "image"
                    ? ui.image
                    : item.item_type === "video"
                    ? ui.video
                    : item.item_type === "audio"
                    ? ui.audio
                    : ui.note;

                return (
                  <article key={item.id.toString()} className="group relative md:pl-12">
                    <div className="absolute left-[11px] top-8 hidden h-3 w-3 rounded-full bg-[#d7b98b] shadow-[0_0_0_8px_rgba(215,185,139,0.1),0_0_35px_rgba(215,185,139,0.45)] md:block" />

                    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.065] shadow-[0_30px_110px_rgba(0,0,0,0.30)] backdrop-blur-2xl transition duration-500 group-hover:-translate-y-1 group-hover:bg-white/[0.085] md:rounded-[2.6rem]">
                      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-7">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#d7b98b]">
                            {label}
                          </p>
                          <p className="mt-1 text-xs text-[#e9dcc8]/48">
                            {currentLang === "en" ? "Scene" : "Sahne"} {String(index + 1).padStart(2, "0")}
                          </p>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#d7b98b]/25 to-transparent" />
                      </div>

                      {item.item_type === "image" && item.signedUrl ? (
                        <div className="p-3 md:p-4">
                          <img
                            src={item.signedUrl}
                            alt={itemTitle || (currentLang === "en" ? "Memory image" : "Anı görseli")}
                            className="max-h-[720px] w-full rounded-[1.55rem] object-cover shadow-[0_20px_70px_rgba(0,0,0,0.25)] md:rounded-[2rem]"
                          />
                        </div>
                      ) : null}

                      {item.item_type === "video" && item.signedUrl ? (
                        <div className="p-3 md:p-4">
                          <div className="overflow-hidden rounded-[1.55rem] bg-black shadow-[0_20px_70px_rgba(0,0,0,0.35)] md:rounded-[2rem]">
                            <video controls playsInline preload="metadata" src={item.signedUrl} className="w-full" />
                          </div>
                        </div>
                      ) : null}

                      {item.item_type === "audio" && item.signedUrl ? (
                        <div className="p-5 md:p-7">
                          <div className="mb-6 flex h-20 items-end gap-1.5 rounded-[1.5rem] border border-white/10 bg-black/18 px-5 py-4">
                            {Array.from({ length: 32 }).map((_, barIndex) => (
                              <span
                                key={barIndex}
                                className="flex-1 rounded-full bg-gradient-to-t from-[#8b6b3f] to-[#f1d6a9] opacity-80"
                                style={{ height: `${22 + ((barIndex * 17 + index * 11) % 58)}%` }}
                              />
                            ))}
                          </div>
                          <audio controls className="w-full accent-[#d7b98b]" src={item.signedUrl} />
                        </div>
                      ) : null}

                      {(item.item_type === "text" || itemContent || itemTitle) ? (
                        <div className="px-6 pb-7 pt-3 md:px-8 md:pb-9">
                          {itemTitle ? (
                            <h3 className="text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#fff8ed] md:text-3xl">
                              {itemTitle}
                            </h3>
                          ) : null}

                          {itemContent ? (
                            <p className="mt-4 whitespace-pre-line text-base leading-8 text-[#e9dcc8]/72 md:text-lg md:leading-9">
                              {itemContent}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="overflow-hidden rounded-[2.3rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_30px_110px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
                <div className="mb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#d7b98b]">
                    {ui.mapTitle}
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#fff8ed]">
                    {currentLang === "en" ? "Places that hold the story" : "Hikâyeyi taşıyan yerler"}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#e9dcc8]/60">
                    {ui.mapText}
                  </p>
                </div>

                <div className="relative h-[420px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#15110d]">
                  <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(215,185,139,.13)_1px,transparent_1px),linear-gradient(90deg,rgba(215,185,139,.13)_1px,transparent_1px)] [background-size:38px_38px]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(215,185,139,.28),transparent_18%),radial-gradient(circle_at_74%_62%,rgba(255,255,255,.12),transparent_20%),radial-gradient(circle_at_42%_82%,rgba(215,185,139,.18),transparent_17%)]" />
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 380 420" fill="none" aria-hidden="true">
                    <path d="M58 334 C105 270 92 205 154 174 C222 139 216 76 313 68" stroke="rgba(215,185,139,0.45)" strokeWidth="2" strokeDasharray="8 10" />
                    <path d="M70 92 C130 126 172 86 224 122 C280 160 250 230 326 270" stroke="rgba(255,255,255,0.16)" strokeWidth="1.4" strokeDasharray="5 9" />
                  </svg>

                  {visibleMarkers.map((place, index) => {
                    const positions = [
                      "left-[16%] top-[72%]",
                      "left-[38%] top-[42%]",
                      "left-[72%] top-[16%]",
                      "left-[77%] top-[61%]",
                      "left-[26%] top-[22%]",
                      "left-[55%] top-[77%]",
                      "left-[58%] top-[31%]",
                    ];

                    return (
                      <div key={`${place}-${index}`} className={`absolute ${positions[index % positions.length]}`}>
                        <div className="relative -translate-x-1/2 -translate-y-1/2">
                          <span className="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-[#d7b98b]/30" />
                          <span className="relative block h-5 w-5 rounded-full border border-[#fff8ed]/80 bg-[#d7b98b] shadow-[0_0_32px_rgba(215,185,139,0.55)]" />
                          <span className="absolute left-6 top-1/2 max-w-[135px] -translate-y-1/2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-medium text-[#fff8ed] backdrop-blur-xl">
                            {place}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 space-y-2">
                  {visibleMarkers.map((place, index) => (
                    <div key={`list-${place}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.045] px-4 py-3 text-sm text-[#e9dcc8]/75">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d7b98b]/12 text-xs font-semibold text-[#d7b98b]">
                        {index + 1}
                      </span>
                      <span>{place}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-20 md:px-8 md:pb-28">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.065] p-8 text-center shadow-[0_35px_130px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:rounded-[3.4rem] md:p-14">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-[#d7b98b]">
            Memoried
          </p>
          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[0.96] tracking-[-0.06em] text-[#fff8ed] md:text-6xl">
            {ui.finalTitle}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#e9dcc8]/68 md:text-lg">
            {ui.finalText}
          </p>
          <div className="mx-auto mt-10 h-px max-w-sm bg-gradient-to-r from-transparent via-[#d7b98b]/45 to-transparent" />
          <p className="mt-8 text-[10px] uppercase tracking-[0.35em] text-[#e9dcc8]/40">
            {ui.storyCreatedWith}
          </p>
        </div>
      </section>
    </main>
  );
}
