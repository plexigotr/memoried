import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSignedImageUrl, getSignedMediaUrl } from "@/lib/storage";
import MemoryPremiumExperience from "./MemoryPremiumExperience";

type MagnetPageProps = {
  params: Promise<{
    code: string;
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function MagnetPage({ params, searchParams }: MagnetPageProps) {
  const { code } = await params;
  const { lang } = await searchParams;

  const magnet = await prisma.magnets.findUnique({
    where: { magnet_code: code },
    include: {
      memory: {
        include: {
          memory_items: {
            where: { is_visible: true },
            orderBy: { sort_order: "asc" },
          },
        },
      },
    },
  });

  const firstLang = lang === "en" || lang === "tr" ? lang : "tr";

  if (!magnet) {
    return (
      <main className="min-h-screen bg-[#090807] px-6 py-12 text-white">
        <section className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/45">Memoried</p>
          <h1 className="mb-4 text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
            {firstLang === "en" ? "Magnet not found" : "Magnet bulunamadı"}
          </h1>
          <p className="max-w-lg text-base leading-7 text-white/60 md:text-lg">
            {firstLang === "en"
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
    const currentLang =
      lang === "en" || lang === "tr"
        ? lang
        : magnet.memory?.selected_lang === "en"
        ? "en"
        : "tr";

    return (
      <main className="min-h-screen bg-[#090807] px-6 py-12 text-white">
        <section className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-[#f4b36b]">Memoried</p>
          <h1 className="mb-4 text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
            {currentLang === "en" ? "This magnet has not been activated yet" : "Bu magnet henüz aktive edilmemiş"}
          </h1>
          <p className="mb-8 max-w-lg text-base leading-7 text-white/60 md:text-lg">
            {currentLang === "en"
              ? "You can start the setup to turn this magnet into your personal story."
              : "Anılarını yüklemek ve bu magneti kişisel hikâyene dönüştürmek için kuruluma başlayabilirsin."}
          </p>
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.06] px-6 py-4 shadow-2xl backdrop-blur-xl">
            <p className="text-sm text-white/45">{currentLang === "en" ? "Magnet Code" : "Magnet Kodu"}</p>
            <p className="mt-2 text-lg font-medium tracking-wide text-white">{magnet.magnet_code}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={`/m/${magnet.magnet_code}/setup?lang=tr`} className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#15110d] transition hover:opacity-90">Türkçe</Link>
            <Link href={`/m/${magnet.magnet_code}/setup?lang=en`} className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/15">English</Link>
          </div>
        </section>
      </main>
    );
  }

  const memory = magnet.memory;

  const currentLang =
    lang === "en" || lang === "tr"
      ? lang
      : memory?.selected_lang === "en"
      ? "en"
      : "tr";

  const memoryTitle =
    currentLang === "en"
      ? memory?.title_en || memory?.title_tr || memory?.title || ""
      : memory?.title_tr || memory?.title || "";

  const memorySubtitle =
    currentLang === "en"
      ? memory?.subtitle_en || memory?.subtitle_tr || memory?.subtitle || ""
      : memory?.subtitle_tr || memory?.subtitle || "";

  const memoryLocation =
    currentLang === "en"
      ? memory?.location_text_en || memory?.location_text_tr || memory?.location_text || ""
      : memory?.location_text_tr || memory?.location_text || "";

  let coverImageUrl: string | null = null;

  if (memory?.cover_image_path) {
    try {
      let actualCoverPath = memory.cover_image_path;

      if (actualCoverPath.startsWith("http")) {
        const marker = `${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/`;
        const index = actualCoverPath.indexOf(marker);
        if (index !== -1) actualCoverPath = actualCoverPath.substring(index + marker.length);
      }

      coverImageUrl = await getSignedImageUrl(actualCoverPath);
    } catch (err) {
      console.error("Cover image error:", err);
      coverImageUrl = null;
    }
  }

  const itemsWithUrls = memory
    ? await Promise.all(
        memory.memory_items.map(async (item) => {
          let signedUrl: string | null = null;

          if ((item.item_type === "image" || item.item_type === "video" || item.item_type === "audio") && item.file_path) {
            try {
              let actualPath = item.file_path;

              if (actualPath.startsWith("http")) {
                const marker = `${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/`;
                const index = actualPath.indexOf(marker);
                if (index !== -1) actualPath = actualPath.substring(index + marker.length);
              }

              signedUrl = await getSignedMediaUrl(actualPath);
            } catch (err) {
              console.error("Media url error:", err);
              signedUrl = null;
            }
          }

          const itemTitle =
            currentLang === "en"
              ? item.title_en || item.title_tr || item.title || ""
              : item.title_tr || item.title || "";

          const itemContent =
            currentLang === "en"
              ? item.content_text_en || item.content_text_tr || item.content_text || ""
              : item.content_text_tr || item.content_text || "";

          return {
            id: item.id.toString(),
            type: item.item_type,
            title: itemTitle,
            content: itemContent,
            url: signedUrl,
          };
        })
      )
    : [];

  const baseUrl = process.env.APP_BASE_URL || process.env.BASE_URL || "https://memoried.me";

  return (
    <MemoryPremiumExperience
      code={magnet.magnet_code}
      currentLang={currentLang}
      title={memoryTitle}
      subtitle={memorySubtitle}
      location={memoryLocation}
      coverImageUrl={coverImageUrl}
      coverPositionPercent={memory?.cover_position_percent ?? 50}
      items={itemsWithUrls}
      shareUrl={`${baseUrl}/m/${magnet.magnet_code}?lang=${currentLang}`}
    />
  );
}
