import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSignedImageUrl, getSignedMediaUrl } from "@/lib/storage";
import MemoryExperience from "./MemoryExperience";

type MagnetPageProps = {
  params: Promise<{
    code: string;
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function MagnetPage({
  params,
  searchParams,
}: MagnetPageProps) {
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

  if (!magnet) {
    const currentLang = lang === "en" || lang === "tr" ? lang : "tr";

    const ui = {
      magnetNotFoundTitle:
        currentLang === "en" ? "Magnet not found" : "Magnet bulunamadı",
      magnetNotFoundText:
        currentLang === "en"
          ? "This magnet code does not appear to be registered in the system."
          : "Bu magnet kodu sistemde kayıtlı görünmüyor.",
      magnetInactiveTitle:
        currentLang === "en"
          ? "Your story begins here"
          : "Hikâyen burada başlıyor",
      magnetInactiveText:
        currentLang === "en"
          ? "Create a private memory page with photos, videos, notes and voice recordings."
          : "Fotoğraflar, videolar, notlar ve ses kayıtlarıyla sana özel bir anı sayfası oluştur.",
      magnetCode: currentLang === "en" ? "Magnet Code" : "Magnet Kodu",
      startSetup: currentLang === "en" ? "Start Setup" : "Kuruluma Başla",
      editContents:
        currentLang === "en" ? "Edit Contents" : "İçerikleri Düzenle",
      storyCreatedWith:
        currentLang === "en"
          ? "Created with Story Magnet"
          : "Story Magnet ile oluşturuldu",
      memoryReady: currentLang === "en" ? "Your memory is ready" : "Anın hazır",
      coverAlt: currentLang === "en" ? "Cover image" : "Kapak görseli",
    };

    return (
      <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
        <section className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
            Story Magnet
          </p>

          <h1 className="mb-4 text-3xl font-semibold md:text-5xl">
            {ui.magnetNotFoundTitle}
          </h1>

          <p className="max-w-lg text-base leading-7 text-stone-600 md:text-lg">
            {ui.magnetNotFoundText}
          </p>
        </section>
      </main>
    );
  }

  if (magnet) {
    await prisma.scan_logs.create({
      data: {
        magnet_id: magnet.id,
        scanned_at: new Date(),
      },
    });
  }

  if (!magnet.is_active) {
    const memory = magnet.memory;

    const currentLang =
      lang === "en" || lang === "tr"
        ? lang
        : memory?.selected_lang === "en"
        ? "en"
        : "tr";

    const ui = {
      magnetNotFoundTitle:
        currentLang === "en" ? "Magnet not found" : "Magnet bulunamadı",
      magnetNotFoundText:
        currentLang === "en"
          ? "This magnet code does not appear to be registered in the system."
          : "Bu magnet kodu sistemde kayıtlı görünmüyor.",
      magnetInactiveTitle:
        currentLang === "en"
          ? "This magnet has not been activated yet"
          : "Bu magnet henüz aktive edilmemiş",
      magnetInactiveText:
        currentLang === "en"
          ? "You can start the setup to turn this magnet into your personal story."
          : "Anılarını yüklemek ve bu magneti kişisel hikâyene dönüştürmek için kuruluma başlayabilirsin.",
      magnetCode: currentLang === "en" ? "Magnet Code" : "Magnet Kodu",
      startSetup: currentLang === "en" ? "Start Setup" : "Kuruluma Başla",
      editContents:
        currentLang === "en" ? "Edit Contents" : "İçerikleri Düzenle",
      storyCreatedWith:
        currentLang === "en"
          ? "Created with Story Magnet"
          : "Story Magnet ile oluşturuldu",
      memoryReady: currentLang === "en" ? "Your memory is ready" : "Anın hazır",
      coverAlt: currentLang === "en" ? "Cover image" : "Kapak görseli",
    };

    return (
      <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
        <section className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
            Story Magnet
          </p>

          <h1 className="mb-4 text-3xl font-semibold md:text-5xl">
            {ui.magnetInactiveTitle}
          </h1>

          <p className="mb-8 max-w-lg text-base leading-7 text-stone-600 md:text-lg">
            {ui.magnetInactiveText}
          </p>

          <div className="mb-8 rounded-2xl border border-stone-200 bg-white px-6 py-4 shadow-sm">
            <p className="text-sm text-stone-500">{ui.magnetCode}</p>
            <p className="mt-2 text-lg font-medium tracking-wide text-stone-900">
              {magnet.magnet_code}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/m/${magnet.magnet_code}/setup?lang=tr`}
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Türkçe
            </Link>

            <Link
              href={`/m/${magnet.magnet_code}/setup?lang=en`}
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              English
            </Link>
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

  const ui = {
    magnetNotFoundTitle:
      currentLang === "en" ? "Magnet not found" : "Magnet bulunamadı",
    magnetNotFoundText:
      currentLang === "en"
        ? "This magnet code does not appear to be registered in the system."
        : "Bu magnet kodu sistemde kayıtlı görünmüyor.",
    magnetInactiveTitle:
      currentLang === "en"
        ? "This magnet has not been activated yet"
        : "Bu magnet henüz aktive edilmemiş",
    magnetInactiveText:
      currentLang === "en"
        ? "You can start the setup to turn this magnet into your personal story."
        : "Anılarını yüklemek ve bu magneti kişisel hikâyene dönüştürmek için kuruluma başlayabilirsin.",
    magnetCode: currentLang === "en" ? "Magnet Code" : "Magnet Kodu",
    startSetup: currentLang === "en" ? "Start Setup" : "Kuruluma Başla",
    editContents: currentLang === "en" ? "Edit Contents" : "İçerikleri Düzenle",
    storyCreatedWith:
      currentLang === "en"
        ? "Created with Story Magnet"
        : "Story Magnet ile oluşturuldu",
    memoryReady: currentLang === "en" ? "Your memory is ready" : "Anın hazır",
    coverAlt: currentLang === "en" ? "Cover image" : "Kapak görseli",
  };

  const memoryTitle =
    currentLang === "en"
      ? memory?.title_en || memory?.title_tr || memory?.title
      : memory?.title_tr || memory?.title;

  const memorySubtitle =
    currentLang === "en"
      ? memory?.subtitle_en || memory?.subtitle_tr || memory?.subtitle
      : memory?.subtitle_tr || memory?.subtitle;

  const memoryLocation =
    currentLang === "en"
      ? memory?.location_text_en ||
        memory?.location_text_tr ||
        memory?.location_text
      : memory?.location_text_tr || memory?.location_text;

  let coverImageUrl: string | null = null;

  if (memory && memory.cover_image_path) {
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
          }

          return {
            ...item,
            signedUrl: null,
          };
        })
      )
    : [];

  const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  const experienceItems = itemsWithUrls.map((item) => ({
    id: item.id.toString(),
    item_type: item.item_type,
    title:
      currentLang === "en"
        ? item.title_en || item.title_tr || item.title
        : item.title_tr || item.title,
    content_text:
      currentLang === "en"
        ? item.content_text_en || item.content_text_tr || item.content_text
        : item.content_text_tr || item.content_text,
    signedUrl: item.signedUrl,
  }));

  return (
    <MemoryExperience
      code={magnet.magnet_code}
      currentLang={currentLang}
      title={memoryTitle || ui.memoryReady}
      subtitle={memorySubtitle || null}
      location={memoryLocation || null}
      coverImageUrl={coverImageUrl}
      coverPositionPercent={coverPositionPercent}
      items={experienceItems}
      shareUrl={`${appBaseUrl}/m/${magnet.magnet_code}?lang=${currentLang}`}
    />
  );
}