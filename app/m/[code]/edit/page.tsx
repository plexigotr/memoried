import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getSignedImageUrl } from "@/lib/storage";
import VideoUploadForm from "@/components/VideoUploadForm";
import VideoTrimButton from "@/components/VideoTrimButton";
import AudioRecorderForm from "@/components/AudioRecorderForm";
import AudioFileUploadForm from "@/components/AudioFileUploadForm";
import ImageUploadForm from "@/components/ImageUploadForm";
import ScrollPreserver from "@/components/ScrollPreserver";
import DragSort from "@/components/DragSort";
import { hasEditSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import OSMLocationPicker from '@/components/OSMLocationPicker';

type EditPageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{
    error?: string;
    upgraded?: string;
    lang?: string;
    uploaded?: string;
    updated?: string;
  }>;
};

export default async function EditPage({
  params,
  searchParams,
}: EditPageProps) {
  const { code } = await params;
  const { error, upgraded, lang, uploaded, updated } = await searchParams;




  const magnet = await prisma.magnets.findUnique({
    where: {
      magnet_code: code,
    },
    include: {
      user: true,
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

  if (!magnet || !magnet.memory) {
    notFound();
  }

  const memory = magnet.memory;
  const hasEditAccess = await hasEditSession(code);

  if (!hasEditAccess) {
    const editLang =
      lang === "en" || lang === "tr"
        ? lang
        : memory.selected_lang === "en"
        ? "en"
        : "tr";

    redirect(`/m/${code}/edit-login?lang=${editLang}`);
  }

  const currentLang =
    lang === "en" || lang === "tr"
      ? lang
      : memory.selected_lang === "en"
      ? "en"
      : "tr";

  const en = currentLang === "en";

  const ui = {
    editTitle: "Story Magnet Edit",
    backToStory: en ? "Back to Story" : "Story Sayfasına Dön",
    planLabel: en ? "Your Plan" : "Planın",
    freePlan: en ? "Free" : "Ücretsiz",
    premiumPlan: "Premium",
    freePlanText: en ? "10 photos, 1 video." : "10 fotoğraf, 1 video hakkın var.",
    premiumPlanText: en ? "30 photos, 10 videos." : "30 fotoğraf, 10 video hakkın var.",
    upgrade: en ? "Upgrade Plan 🚀" : "Paketi Yükselt 🚀",
    upgradedSuccess: en
      ? "Your plan has been upgraded. Premium limits are now active."
      : "Paketin yükseltildi. Artık premium limitlerin aktif.",
    addText: en ? "Add Text" : "Metin Ekle",
    addPhoto: en ? "Add Photo" : "Fotoğraf Ekle",
    addVideo: en ? "Add Video" : "Video Ekle",
    addAudio: en ? "Add Audio" : "Ses Ekle",
    currentItems: en ? "Story Flow" : "Story Akışı",
    imageAlt: en ? "Uploaded image" : "Yüklenen görsel",
    contentPreviewNotReady: en
      ? "Preview is not ready for this content type yet."
      : "Bu içerik türü için önizleme henüz hazır değil.",
    noContent: en ? "No content has been added yet." : "Henüz içerik eklenmemiş.",
    photos: en ? "Photos" : "Fotoğraflar",
    videos: en ? "Videos" : "Videolar",
    order: en ? "Order" : "Sıra",
    delete: en ? "Delete" : "Sil",
    moveUp: en ? "Move up" : "Yukarı taşı",
    moveDown: en ? "Move down" : "Aşağı taşı",
    save: en ? "Save" : "Kaydet",
    name: en ? "Name" : "Ad",
    caption: en ? "Caption" : "Açıklama",
    memoryDate: en ? "Memory date" : "Anı tarihi",
    memoryDateHint: en
      ? "Used to order the story as a timeline."
      : "Hikâyeyi zaman çizelgesine göre sıralamak için kullanılır.",
    advanced: en ? "Advanced options" : "Gelişmiş seçenekler",
    coverBadge: en ? "Cover" : "Kapak",
    setCover: en ? "Set as cover" : "Kapak yap",
    selectedCover: en ? "Selected cover" : "Seçili kapak",
    rotate: en ? "Rotate 90°" : "90° döndür",
    coverFraming: en ? "Cover framing" : "Kapak kadrajı",
    coverFramingHint: en ? "Move the focus up or down." : "Görünen alanı yukarı veya aşağı taşı.",
    top: en ? "Top" : "Üst",
    center: en ? "Center" : "Orta",
    bottom: en ? "Bottom" : "Alt",
    saveFraming: en ? "Save framing" : "Kadrajı kaydet",
    location: en ? "Location" : "Konum",
    memoryInfo: en ? "Story information" : "Story bilgileri",
    memoryInfoText: en
      ? "Update the title, location and short description shown on the story page."
      : "Story sayfasında görünen başlık, konum ve kısa açıklamayı düzenle.",
    memoryTitle: en ? "Memory Title" : "Anı Başlığı",
    memoryLocation: en ? "Location" : "Konum",
    memorySubtitle: en ? "Short Description" : "Kısa Açıklama",
    saveMemoryInfo: en ? "Save Details" : "Bilgileri Kaydet",
    saved: en ? "Saved." : "Kaydedildi.",
    memoryInfoUpdated: en ? "Memory details updated." : "Anı bilgileri güncellendi.",
    memoryTitleRequired: en ? "Memory title is required." : "Anı başlığı zorunlu.",
    videoLimit: en
      ? "You have reached the video limit. Upgrade your plan to add more videos."
      : "Video limitine ulaştın. Daha fazla video eklemek için paketi yükseltebilirsin.",
    videoTooLong: en
      ? "Your video is longer than 1 minute. Please choose a section up to 1 minute."
      : "Video 1 dakikadan uzun. En fazla 1 dakikalık bir bölüm seçebilirsin.",
    videoUploadFailed: en
      ? "Something went wrong while uploading the video."
      : "Video yüklenirken bir sorun oluştu.",
    invalidTrimRange: en
      ? "Invalid video range selected. Please try again."
      : "Geçersiz video aralığı seçildi. Lütfen tekrar dene.",
  };

  const imageCount = memory.memory_items.filter(
    (item) => item.item_type === "image"
  ).length;

  const videoCount = memory.memory_items.filter(
    (item) => item.item_type === "video"
  ).length;

  const isPremium =
    magnet.user?.plan_type === "premium" &&
    magnet.user?.premium_until &&
    magnet.user.premium_until > new Date();

  const imageLimit = isPremium ? 30 : 10;
  const videoLimit = isPremium ? 10 : 1;

  const itemsWithUrls = await Promise.all(
    memory.memory_items.map(async (item) => {
      if (
        (item.item_type === "image" ||
          item.item_type === "video" ||
          item.item_type === "audio") &&
        item.file_path
      ) {
        const signedUrl = await getSignedImageUrl(item.file_path);

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
  );

  const inputClass =
    "w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-stone-500";
  const labelClass = "mb-1 block text-xs font-medium text-stone-600";
  const primaryBtn =
    "rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90";
  const iconBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-300 text-stone-600 transition hover:bg-stone-100";

  const notice =
    updated === "item" || updated === "title" || updated === "date" || updated === "description"
      ? { tone: "green", text: ui.saved }
      : updated === "memory-info"
      ? { tone: "green", text: ui.memoryInfoUpdated }
      : uploaded === "success"
      ? { tone: "green", text: en ? "Photo uploaded." : "Fotoğraf yüklendi." }
      : upgraded === "1"
      ? { tone: "green", text: ui.upgradedSuccess }
      : error === "memory-title-required"
      ? { tone: "red", text: ui.memoryTitleRequired }
      : error === "video-limit"
      ? { tone: "amber", text: ui.videoLimit }
      : error === "video-too-long"
      ? { tone: "amber", text: ui.videoTooLong }
      : error === "video-upload-failed"
      ? { tone: "red", text: ui.videoUploadFailed }
      : error === "invalid-trim-range"
      ? { tone: "red", text: ui.invalidTrimRange }
      : error
      ? { tone: "red", text: en ? "Something went wrong." : "Bir sorun oluştu." }
      : null;

  const noticeTone: Record<string, string> = {
    green: "border-green-200 bg-green-50 text-green-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 text-stone-900 md:px-6 md:py-12">
      <section className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-stone-500">
              {ui.editTitle}
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl">{memory.title}</h1>
            {memory.location_text ? (
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-stone-500">
                {memory.location_text}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/m/${code}/edit?lang=tr`}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                currentLang === "tr"
                  ? "bg-stone-900 text-white"
                  : "border border-stone-300 text-stone-700"
              }`}
            >
              TR
            </Link>
            <Link
              href={`/m/${code}/edit?lang=en`}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                currentLang === "en"
                  ? "bg-stone-900 text-white"
                  : "border border-stone-300 text-stone-700"
              }`}
            >
              EN
            </Link>
            <Link
              href={`/m/${code}`}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              {ui.backToStory}
            </Link>
          </div>
        </div>

        {notice ? (
          <div className={`mb-6 rounded-2xl border p-4 text-sm ${noticeTone[notice.tone]}`}>
            {notice.text}
          </div>
        ) : null}

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-stone-400">
              {ui.planLabel}
            </p>
            <p className="text-xl font-semibold text-stone-900">
              {isPremium ? ui.premiumPlan : ui.freePlan}
            </p>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              {isPremium ? ui.premiumPlanText : ui.freePlanText}
            </p>
            {!isPremium && (
              <Link
                href={`/upgrade?userId=${magnet.user?.id.toString()}&code=${code}&lang=${currentLang}`}
                className="mt-3 inline-block rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition hover:opacity-90"
              >
                {ui.upgrade}
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-stone-400">
              {ui.photos}
            </p>
            <p className="text-xl font-semibold">
              <span className={imageCount >= imageLimit ? "text-red-600" : "text-stone-900"}>
                {imageCount}
              </span>
              <span className="text-stone-400"> / {imageLimit}</span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-stone-900"
                style={{ width: `${Math.min(100, (imageCount / imageLimit) * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-stone-400">
              {ui.videos}
            </p>
            <p className="text-xl font-semibold">
              <span className={videoCount >= videoLimit ? "text-red-600" : "text-stone-900"}>
                {videoCount}
              </span>
              <span className="text-stone-400"> / {videoLimit}</span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-stone-900"
                style={{ width: `${Math.min(100, (videoCount / videoLimit) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Story information */}
        <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-xl font-semibold text-stone-900">{ui.memoryInfo}</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">{ui.memoryInfoText}</p>

          <form
            action={`/api/magnets/${code}/update-memory-info`}
            method="POST"
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <input type="hidden" name="lang" value={currentLang} />
            <div>
              <label className={labelClass}>{ui.memoryTitle}</label>
              <input
                type="text"
                name="title"
                defaultValue={en ? memory.title_en || memory.title : memory.title_tr || memory.title}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{ui.memoryLocation}</label>
              <input
                type="text"
                name="location"
                defaultValue={
                  en
                    ? memory.location_text_en || memory.location_text || ""
                    : memory.location_text_tr || memory.location_text || ""
                }
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>{ui.memorySubtitle}</label>
              <textarea
                name="subtitle"
                rows={3}
                defaultValue={
                  en
                    ? memory.subtitle_en || memory.subtitle || ""
                    : memory.subtitle_tr || memory.subtitle || ""
                }
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className={primaryBtn}>
                {ui.saveMemoryInfo}
              </button>
            </div>
          </form>
        </section>

        {/* Add content */}
        <section className="mb-8">
          <h2 className="mb-1 text-xl font-semibold text-stone-900">
            {en ? "Build your memory" : "Anını oluştur"}
          </h2>
          <p className="mb-4 text-sm leading-6 text-stone-500">
            {en
              ? "Add text, photos, video and audio to shape your story."
              : "Story akışını oluşturmak için metin, fotoğraf, video ve ses ekleyebilirsin."}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-base font-medium">{ui.addText}</h3>
              <form
                action={`/api/magnets/${code}/add-text?lang=${currentLang}`}
                method="POST"
                className="space-y-3"
              >
                <input
                  type="text"
                  name="title"
                  placeholder={en ? "e.g. First Evening" : "Örn. İlk Akşam"}
                  className={inputClass}
                />
                <textarea
                  name="content"
                  rows={4}
                  placeholder={en ? "Write the text for your memory here" : "Anına ait metni buraya yaz"}
                  className={inputClass}
                  required
                />
                <button type="submit" className={primaryBtn}>
                  {ui.save}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-base font-medium">{ui.addPhoto}</h3>
              <ImageUploadForm
                code={code}
                lang={currentLang}
                remainingPhotos={Math.max(0, imageLimit - imageCount)}
              />
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-base font-medium">{ui.addVideo}</h3>
              <VideoUploadForm code={code} lang={currentLang} />
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-base font-medium">{ui.addAudio}</h3>
              <AudioRecorderForm code={code} lang={currentLang} />
              <AudioFileUploadForm code={code} lang={currentLang} />
            </div>
          </div>
        </section>

        {/* Story flow */}
        <section>
          <h2 className="mb-1 text-xl font-semibold text-stone-900">{ui.currentItems}</h2>
          <p className="mb-4 text-sm leading-6 text-stone-500">
            {en
              ? "Drag to reorder, edit each item, delete or choose the cover."
              : "Sürükleyerek sırala, içerikleri düzenle, sil veya kapak görselini seç."}
          </p>

          {itemsWithUrls.length > 0 ? (
            <div className="drag-sort-list grid gap-4">
              {itemsWithUrls.map((item) => {
                const isImage = item.item_type === "image";
                const isVideo = item.item_type === "video";
                const isCover = isImage && memory.cover_image_path === item.file_path;

                return (
                  <article
                    key={item.id.toString()}
                    data-item-id={item.id.toString()}
                    className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-5"
                  >
                    {/* Card header */}
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="drag-handle"
                          title={en ? "Drag to reorder" : "Sürükleyerek sırala"}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                            <path d="M7 4a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z" />
                          </svg>
                        </div>
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-stone-500">
                          {item.item_type}
                        </span>
                        {isCover ? (
                          <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white">
                            {ui.coverBadge}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <form action={`/api/magnets/${code}/move-item`} method="POST">
                          <input type="hidden" name="itemId" value={item.id.toString()} />
                          <input type="hidden" name="direction" value="up" />
                          <button type="submit" className={iconBtn} title={ui.moveUp} aria-label={ui.moveUp}>
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M10 15V5m0 0l-4 4m4-4l4 4" /></svg>
                          </button>
                        </form>
                        <form action={`/api/magnets/${code}/move-item`} method="POST">
                          <input type="hidden" name="itemId" value={item.id.toString()} />
                          <input type="hidden" name="direction" value="down" />
                          <button type="submit" className={iconBtn} title={ui.moveDown} aria-label={ui.moveDown}>
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M10 5v10m0 0l4-4m-4 4l-4-4" /></svg>
                          </button>
                        </form>
                        <form action={`/api/magnets/${code}/delete-item`} method="POST">
                          <input type="hidden" name="itemId" value={item.id.toString()} />
                          <button
                            type="submit"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-300 text-red-600 transition hover:bg-red-50"
                            title={ui.delete}
                            aria-label={ui.delete}
                          >
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h12M8 6V4h4v2m-6 0l.5 9a1 1 0 001 1h3a1 1 0 001-1L14 6" /></svg>
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Preview */}
                    {isImage && item.signedUrl ? (
                      <div className="mb-4 overflow-hidden rounded-2xl border border-stone-200">
                        <img
                          src={item.signedUrl}
                          alt={item.title || ui.imageAlt}
                          className="w-full"
                          style={{
                            transform: `rotate(${Number(item.rotation || 0)}deg)`,
                            transition: "transform .25s ease",
                          }}
                        />
                      </div>
                    ) : isVideo && item.signedUrl ? (
                      <video
                        controls
                        playsInline
                        className="mb-4 w-full rounded-2xl border border-stone-200"
                        src={item.signedUrl}
                      />
                    ) : item.item_type === "audio" && item.signedUrl ? (
                      <audio controls className="mb-4 w-full" src={item.signedUrl} />
                    ) : item.content_text ? (
                      <p className="mb-4 whitespace-pre-line rounded-2xl bg-stone-50 p-4 text-sm leading-7 text-stone-700">
                        {item.content_text}
                      </p>
                    ) : (
                      <p className="mb-4 text-sm text-stone-500">{ui.contentPreviewNotReady}</p>
                    )}

                    {/* Single edit form */}
                    <form
                      action={`/api/magnets/${code}/update-item-date`}
                      method="POST"
                      className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-4"
                    >
                      <input type="hidden" name="itemId" value={item.id.toString()} />

                      {isImage || item.item_type === "text" ? (
                        <div>
                          <label className={labelClass}>{ui.name}</label>
                          <input
                            name="title"
                            defaultValue={item.title || ""}
                            placeholder={en ? "e.g. Alaçatı sunset" : "Örn. Alaçatı gün batımı"}
                            className={inputClass}
                          />
                        </div>
                      ) : null}

                      {isImage || isVideo ? (
                        <div>
                          <label className={labelClass}>{ui.caption}</label>
                          <textarea
                            name="description"
                            rows={2}
                            defaultValue={item.content_text || ""}
                            placeholder={en ? "A short note shown in the story…" : "Story'de görünen kısa not…"}
                            className={inputClass}
                          />
                        </div>
                      ) : null}

                      <div>
                        <label className={labelClass}>{ui.memoryDate}</label>
                        <input
                          type="date"
                          name="memory_date"
                          defaultValue={
                            item.memory_date
                              ? new Date(item.memory_date).toISOString().slice(0, 10)
                              : ""
                          }
                          className={inputClass}
                        />
                        <p className="mt-1 text-[11px] text-stone-400">{ui.memoryDateHint}</p>
                      </div>

                      <button type="submit" className={primaryBtn}>
                        {ui.save}
                      </button>
                    </form>

                    {/* Advanced options */}
                    {isImage || isVideo ? (
                      <details className="group mt-3">
                        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" className="transition group-open:rotate-180"><path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" /></svg>
                          {ui.advanced}
                        </summary>

                        <div className="mt-3 space-y-3">
                          {isImage ? (
                            <div className="flex flex-wrap gap-2">
                              <form action={`/api/magnets/${code}/set-cover`} method="POST">
                                <input type="hidden" name="itemId" value={item.id.toString()} />
                                <button
                                  type="submit"
                                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                    isCover
                                      ? "bg-stone-900 text-white"
                                      : "border border-stone-300 text-stone-700 hover:bg-stone-100"
                                  }`}
                                >
                                  {isCover ? ui.selectedCover : ui.setCover}
                                </button>
                              </form>
                              <form action={`/api/magnets/${code}/rotate-item`} method="POST">
                                <input type="hidden" name="itemId" value={item.id.toString()} />
                                <button
                                  type="submit"
                                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                                >
                                  ↻ {ui.rotate}
                                </button>
                              </form>
                            </div>
                          ) : null}

                          {isCover ? (
                            <form
                              action={`/api/magnets/${code}/set-cover-position`}
                              method="POST"
                              className="rounded-2xl border border-stone-200 bg-white p-4"
                            >
                              <div className="mb-2 flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-medium text-stone-800">{ui.coverFraming}</p>
                                  <p className="text-xs text-stone-500">{ui.coverFramingHint}</p>
                                </div>
                                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
                                  {memory.cover_position_percent ?? 50}%
                                </span>
                              </div>
                              <input
                                type="range"
                                name="positionPercent"
                                min="0"
                                max="100"
                                step="1"
                                defaultValue={memory.cover_position_percent ?? 50}
                                className="w-full accent-stone-900"
                              />
                              <div className="mt-1 flex justify-between text-xs text-stone-400">
                                <span>{ui.top}</span>
                                <span>{ui.center}</span>
                                <span>{ui.bottom}</span>
                              </div>
                              <button type="submit" className="mt-3 rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition hover:opacity-90">
                                {ui.saveFraming}
                              </button>
                            </form>
                          ) : null}

                          <div className="rounded-2xl border border-stone-200 bg-white p-4">
                            <p className="mb-1 text-sm font-medium text-stone-800">{ui.location}</p>
                            <p className="mb-2 text-xs leading-5 text-stone-500">
                              {item.location_name
                                ? item.location_name
                                : en
                                ? "No location added yet."
                                : "Henüz konum eklenmedi."}
                            </p>
                            <OSMLocationPicker
                              code={code}
                              itemId={item.id.toString()}
                              lang={currentLang}
                              initialLocationName={item.location_name}
                              initialLatitude={item.latitude ? String(item.latitude) : null}
                              initialLongitude={item.longitude ? String(item.longitude) : null}
                            />
                          </div>
                        </div>
                      </details>
                    ) : null}

                    {isVideo && item.signedUrl ? (
                      <div className="mt-3">
                        <VideoTrimButton
                          videoUrl={item.signedUrl}
                          itemId={item.id.toString()}
                          code={code}
                          lang={currentLang}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center">
              <p className="text-sm text-stone-600">{ui.noContent}</p>
            </div>
          )}
        </section>
      </section>

      <ScrollPreserver />
      <DragSort code={code} />
    </main>
  );
}
