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

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="fixed right-5 top-5 z-50">
        <details className="relative">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/30 bg-black/30 text-white shadow-lg backdrop-blur-md transition hover:bg-black/40 transition hover:scale-105 active:scale-95">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0"
              />
            </svg>
          </summary>

          <div className="absolute right-0 mt-3 w-44 overflow-hidden rounded-2xl border border-stone-200 bg-white text-sm text-stone-800 shadow-xl">
     
            
            <Link
              href={`/m/${magnet.magnet_code}/edit?lang=${currentLang}`}
              className="block px-4 py-3 transition hover:bg-stone-50"
            >
              {currentLang === "en" ? "Edit" : "Düzenle"}
            </Link>

            <Link
              href="/account"
              className="block border-t border-stone-100 px-4 py-3 transition hover:bg-stone-50"
            >
              {currentLang === "en" ? "My Account" : "Hesabım"}
            </Link>

            
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `${memoryTitle || "Story Magnet"} - ${process.env.APP_BASE_URL || "http://localhost:3000"}/m/${magnet.magnet_code}?lang=${currentLang}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 transition hover:bg-stone-50"
          >
            {currentLang === "en" ? "Share on WhatsApp" : "WhatsApp ile Paylaş"}
          </a>      

          </div>
        </details>
      </div>


      <section className="border-b border-stone-200">
        {coverImageUrl ? (
          <div className="relative h-[320px] w-full overflow-hidden md:h-[460px]">
          <img
            src={coverImageUrl}
            alt={memoryTitle || ui.coverAlt}
            className="h-full w-full object-cover"
            style={{
              objectPosition: `center ${coverPositionPercent}%`,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
            <div className="absolute inset-0 flex items-end justify-center px-6 pb-10">
              <div className="max-w-3xl text-center text-white">
                <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/80">
                  Story Magnet
                </p>

                <h1 className="mb-4 text-4xl font-semibold drop-shadow-lg md:text-6xl">
                  {memoryTitle || ui.memoryReady}
                </h1>

                {memorySubtitle ? (
                  <p className="mx-auto mb-6 max-w-2xl text-base leading-7 text-white/90 drop-shadow-md md:text-lg">
                    {memorySubtitle}
                  </p>
                ) : null}

                {memoryLocation ? (
                  <p className="text-sm uppercase tracking-[0.2em] text-white/80 drop-shadow-md">
                    {memoryLocation}
                  </p>
                ) : null}

    
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
                Story Magnet
              </p>

              <h1 className="mb-4 text-4xl font-semibold md:text-6xl">
                {memoryTitle || ui.memoryReady}
              </h1>

              {memorySubtitle ? (
                <p className="mx-auto mb-6 max-w-2xl text-base leading-7 text-stone-600 md:text-lg">
                  {memorySubtitle}
                </p>
              ) : null}

              {memoryLocation ? (
                <p className="mb-8 text-sm uppercase tracking-[0.2em] text-stone-500">
                  {memoryLocation}
                </p>
              ) : null}


            </div>
          </div>
        )}
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {itemsWithUrls.length > 0 ? (
            itemsWithUrls.map((item) => {
              const itemTitle =
                currentLang === "en"
                  ? item.title_en || item.title_tr || item.title
                  : item.title_tr || item.title;

              const itemContent =
                currentLang === "en"
                  ? item.content_text_en ||
                    item.content_text_tr ||
                    item.content_text
                  : item.content_text_tr || item.content_text;

              if (item.item_type === "text") {
                return (
                  <article
                    key={item.id.toString()}
                    className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
                  >
                    {itemTitle ? (
                      <h2 className="mb-3 text-xl font-medium text-stone-900">
                        {itemTitle}
                      </h2>
                    ) : null}

                    {itemContent ? (
                      <p className="text-base leading-8 text-stone-700">
                        {itemContent}
                      </p>
                    ) : null}
                  </article>
                );
              }

              if (item.item_type === "image" && item.signedUrl) {
                return (
                  <article
                    key={item.id.toString()}
                    className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
                  >
                    <img
                      src={item.signedUrl}
                      alt={itemTitle || (currentLang === "en" ? "Memory image" : "Anı görseli")}
                      className="w-full object-cover"
                    />

                    {itemTitle ? (
                      <div className="p-5">
                        <h2 className="text-lg font-medium text-stone-900">
                          {itemTitle}
                        </h2>
                      </div>
                    ) : null}
                  </article>
                );
              }

              if (item.item_type === "video" && item.signedUrl) {
                return (
                  <article
                    key={item.id.toString()}
                    className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
                  >
                  <div className="overflow-hidden rounded-2xl">
                    <video
                      controls
                      src={item.url}
                      poster={`${item.url}#t=2`}
                      className="w-full"
                    />
                  </div>
                    {itemTitle ? (
                      <div className="p-5">
                        <h2 className="text-lg font-medium text-stone-900">
                          {itemTitle}
                        </h2>
                      </div>
                    ) : null}
                  </article>
                );
              }

              if (item.item_type === "audio" && item.signedUrl) {
                return (
                  <article
                    key={item.id.toString()}
                    className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
                  >
                    {itemTitle ? (
                      <h2 className="mb-4 text-lg font-medium text-stone-900">
                        {itemTitle}
                      </h2>
                    ) : null}

                    <audio controls className="w-full" src={item.signedUrl} />
                  </article>
                );
              }

              return (
                <article
                  key={item.id.toString()}
                  className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm text-stone-500">
                    {currentLang === "en"
                      ? "This content type is not available yet."
                      : "Bu içerik türü henüz gösterime açılmadı."}
                  </p>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center">
              <p className="text-base text-stone-600">
                {currentLang === "en"
                  ? "Your memory page is ready. Add your first photo, note, video or voice recording to begin."
                  : "Anı sayfan hazır. Başlamak için ilk fotoğrafını, notunu, videonu veya ses kaydını ekleyebilirsin."}
              </p>

              <Link
                href={`/m/${magnet.magnet_code}/edit?lang=${currentLang}`}
                className="mt-6 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {currentLang === "en" ? "Start adding content" : "Başlayalım"}
              </Link>

            </div>
          )}
        </div>
      </section>

      <p className="mt-20 text-center text-xs text-stone-400">
        {ui.storyCreatedWith}
      </p>
    </main>
  );
}