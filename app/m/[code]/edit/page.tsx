import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getSignedImageUrl } from "@/lib/storage";
import VideoUploadForm from "@/components/VideoUploadForm";
import AudioRecorderForm from "@/components/AudioRecorderForm";
import ImageUploadForm from "@/components/ImageUploadForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
  const cookieStore = await cookies();
  const hasEditAccess =
    cookieStore.get(`edit_access_${code}`)?.value === "granted";

  if (memory.edit_password_hash && !hasEditAccess) {
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

  const ui = {
    editTitle: currentLang === "en" ? "Story Magnet Edit" : "Story Magnet Edit",
    backToStory: currentLang === "en" ? "Back to Story" : "Story Sayfasına Dön",
    planLabel: currentLang === "en" ? "Your Plan" : "Planın",
    freePlan: currentLang === "en" ? "Free" : "Ücretsiz",
    premiumPlan: "Premium",
    freePlanText:
      currentLang === "en"
        ? "You can upload 10 photos and 1 video."
        : "10 fotoğraf, 1 video hakkın var.",
    premiumPlanText:
      currentLang === "en"
        ? "You can upload 30 photos and 10 videos."
        : "30 fotoğraf, 10 video hakkın var.",
    upgrade:
      currentLang === "en" ? "Upgrade Plan 🚀" : "Paketi Yükselt 🚀",
    upgradedSuccess:
      currentLang === "en"
        ? "Your plan has been upgraded successfully. Your premium limits are now active."
        : "Paketin başarıyla yükseltildi. Artık premium limitlerin aktif.",
    coverSelected:
      currentLang === "en"
        ? "Cover image selected."
        : "Kapak görseli seçildi.",
    noCoverSelected:
      currentLang === "en"
        ? "No cover image selected yet."
        : "Henüz kapak görseli seçilmedi.",
    addText: currentLang === "en" ? "Add New Text" : "Yeni Metin Ekle",
    addPhoto: currentLang === "en" ? "Add New Photo" : "Yeni Fotoğraf Ekle",
    addVideo: currentLang === "en" ? "Add New Video" : "Yeni Video Ekle",
    addAudio: currentLang === "en" ? "Add New Audio" : "Yeni Ses Ekle",
    currentItems:
      currentLang === "en" ? "Current Contents" : "Mevcut İçerikler",
    photoTitle:
      currentLang === "en" ? "Photo Title" : "Fotoğraf Başlığı",
    photoFile:
      currentLang === "en" ? "Photo File" : "Fotoğraf Dosyası",
    uploadPhoto:
      currentLang === "en" ? "Upload Photo" : "Fotoğrafı Yükle",
    audioTitle:
      currentLang === "en" ? "Audio Title" : "Ses Başlığı",
    audioFile:
      currentLang === "en" ? "Audio File" : "Ses Dosyası",
    uploadAudio:
      currentLang === "en" ? "Upload Audio" : "Sesi Yükle",
    makeCover:
      currentLang === "en" ? "Use as Cover" : "Bu Görseli Kapak Yap",
    moveUp: currentLang === "en" ? "Move Up" : "Yukarı Taşı",
    moveDown: currentLang === "en" ? "Move Down" : "Aşağı Taşı",
    delete: currentLang === "en" ? "Delete" : "Sil",

    videoLimit:
      currentLang === "en"
        ? "You have reached the video limit. Upgrade your plan to add more videos."
        : "Video limitine ulaştın. Daha fazla video eklemek için paketi yükseltebilirsin.",
    videoTooLong:
      currentLang === "en"
        ? "Your video is longer than 1 minute. Please choose a section up to 1 minute."
        : "Video 1 dakikadan uzun. En fazla 1 dakikalık bir bölüm seçebilirsin.",
    videoUploadFailed:
      currentLang === "en"
        ? "Something went wrong while uploading the video."
        : "Video yüklenirken bir sorun oluştu.",
    invalidTrimRange:
      currentLang === "en"
        ? "Invalid video range selected. Please try again."
        : "Geçersiz video aralığı seçildi. Lütfen tekrar dene.",
    order: currentLang === "en" ? "Order" : "Sıra",
    imageAlt: currentLang === "en" ? "Uploaded image" : "Yüklenen görsel",
    contentPreviewNotReady:
      currentLang === "en"
        ? "Preview is not ready for this content type yet."
        : "Bu içerik türü için önizleme henüz hazır değil.",
    noContent:
      currentLang === "en"
        ? "No content has been added yet."
        : "Henüz içerik eklenmemiş.",    
    photos: currentLang === "en" ? "Photos" : "Fotoğraflar",
    videos: currentLang === "en" ? "Videos" : "Videolar",

    memoryInfo:
      currentLang === "en" ? "Memory Details" : "Anı Bilgileri",
    memoryInfoText:
      currentLang === "en"
        ? "Update the title, location and short description shown on the story page."
        : "Story sayfasında görünen başlık, konum ve kısa açıklamayı düzenle.",
    memoryTitle:
      currentLang === "en" ? "Memory Title" : "Anı Başlığı",
    memoryLocation:
      currentLang === "en" ? "Location" : "Konum",
    memorySubtitle:
      currentLang === "en" ? "Short Description" : "Kısa Açıklama",
    saveMemoryInfo:
      currentLang === "en" ? "Save Details" : "Bilgileri Kaydet",
    memoryInfoUpdated:
      currentLang === "en"
        ? "Memory details updated successfully."
        : "Anı bilgileri başarıyla güncellendi.",
    memoryTitleRequired:
      currentLang === "en"
        ? "Memory title is required."
        : "Anı başlığı zorunlu.",    

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
        let actualPath = item.file_path;

        if (actualPath.startsWith("http")) {
          const marker = `${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/`;
          const index = actualPath.indexOf(marker);

          if (index !== -1) {
            actualPath = actualPath.substring(index + marker.length);
          }
        }

        const signedUrl = await getSignedImageUrl(actualPath);

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

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-stone-500">
              {ui.editTitle}
            </p>
            <h1 className="text-3xl font-semibold md:text-5xl">
              {memory.title}
            </h1>

            <div className="mt-4 flex gap-3">
              <Link
                href={`/m/${code}/edit?lang=tr`}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  currentLang === "tr"
                    ? "bg-stone-900 text-white"
                    : "border border-stone-300 text-stone-700"
                }`}
              >
                Türkçe
              </Link>

              <Link
                href={`/m/${code}/edit?lang=en`}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  currentLang === "en"
                    ? "bg-stone-900 text-white"
                    : "border border-stone-300 text-stone-700"
                }`}
              >
                English
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-stone-400">
                  {ui.planLabel}
                </p>
                <p className="text-2xl font-semibold text-stone-900">
                  {isPremium ? ui.premiumPlan : ui.freePlan}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  {isPremium ? ui.premiumPlanText : ui.freePlanText}
                </p>

                {isPremium && magnet.user?.premium_until && (
                  <p className="mt-3 rounded-2xl bg-stone-50 px-3 py-2 text-xs text-stone-500">
                    {currentLang === "en"
                      ? `Premium valid until: ${new Date(
                          magnet.user.premium_until
                        ).toLocaleDateString("en-US")}`
                      : `Premium bitiş tarihi: ${new Date(
                          magnet.user.premium_until
                        ).toLocaleDateString("tr-TR")}`}
                  </p>
                )}

                {!isPremium && (
                  <Link
                    href={`/upgrade?userId=${magnet.user?.id.toString()}&code=${code}&lang=${currentLang}`}
                    className="mt-4 inline-block rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    {ui.upgrade}
                  </Link>
                )}               

              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-stone-400">
                  {ui.photos}
                </p>
                <p className="text-2xl font-semibold text-stone-900">
                  <span className={imageCount >= imageLimit ? "text-red-600" : ""}>
                    {imageCount}
                  </span>
                  <span className="text-stone-400"> / {imageLimit}</span>
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-stone-900"
                    style={{
                      width: `${Math.min(100, (imageCount / imageLimit) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-stone-400">
                  {ui.videos}
                </p>
                <p className="text-2xl font-semibold text-stone-900">
                  <span className={videoCount >= videoLimit ? "text-red-600" : ""}>
                    {videoCount}
                  </span>
                  <span className="text-stone-400"> / {videoLimit}</span>
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-stone-900"
                    style={{
                      width: `${Math.min(100, (videoCount / videoLimit) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

         

            {uploaded === "success" && (
              <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {currentLang === "en"
                  ? "Photo uploaded successfully."
                  : "Fotoğraf başarıyla yüklendi."}
              </div>
            )}    


            {updated === "memory-info" && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {ui.memoryInfoUpdated}
              </div>
            )}

            {error === "memory-title-required" && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {ui.memoryTitleRequired}
              </div>
            )}

            {error === "memory-info-failed" && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {currentLang === "en"
                  ? "Something went wrong while updating memory details."
                  : "Anı bilgileri güncellenirken bir sorun oluştu."}
              </div>
            )}                 

            {upgraded === "1" && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {ui.upgradedSuccess}
              </div>
            )}

            {error === "video-limit" && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {ui.videoLimit}
              </div>
            )}

            {error === "video-too-long" && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {ui.videoTooLong}
              </div>
            )}

            {error === "video-upload-failed" && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {ui.videoUploadFailed}
              </div>
            )}

            {error === "invalid-trim-range" && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {ui.invalidTrimRange}
              </div>
            )}

            {memory.location_text ? (
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-stone-500">
                {memory.location_text}
              </p>
            ) : null}

            {memory.cover_image_path ? (
              <p className="mt-3 text-sm text-stone-500">
                {ui.coverSelected}
              </p>
            ) : (
              <p className="mt-3 text-sm text-stone-400">
                {ui.noCoverSelected}
              </p>
            )}
          </div>

          <Link
            href={`/m/${code}`}
            className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            {ui.backToStory}
          </Link>
        </div>

        <section className="mb-8 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
              {ui.memoryInfo}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900">
              {currentLang === "en" ? "Story information" : "Story bilgileri"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              {ui.memoryInfoText}
            </p>
          </div>

          <form
            action={`/api/magnets/${code}/update-memory-info`}
            method="POST"
            className="grid gap-5 md:grid-cols-2"
          >
            <input type="hidden" name="lang" value={currentLang} />

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                {ui.memoryTitle}
              </label>
              <input
                type="text"
                name="title"
                defaultValue={
                  currentLang === "en"
                    ? memory.title_en || memory.title
                    : memory.title_tr || memory.title
                }
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                {ui.memoryLocation}
              </label>
              <input
                type="text"
                name="location"
                defaultValue={
                  currentLang === "en"
                    ? memory.location_text_en || memory.location_text || ""
                    : memory.location_text_tr || memory.location_text || ""
                }
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-stone-700">
                {ui.memorySubtitle}
              </label>
              <textarea
                name="subtitle"
                rows={4}
                defaultValue={
                  currentLang === "en"
                    ? memory.subtitle_en || memory.subtitle || ""
                    : memory.subtitle_tr || memory.subtitle || ""
                }
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {ui.saveMemoryInfo}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-stone-100/60 p-4 shadow-sm md:p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
              {currentLang === "en" ? "Add Content" : "İçerik Ekle"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900">
              {currentLang === "en"
                ? "Build your memory"
                : "Anını oluştur"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              {currentLang === "en"
                ? "Add text, photos, video and audio to shape your story."
                : "Story akışını oluşturmak için metin, fotoğraf, video ve ses ekleyebilirsin."}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-medium">{ui.addText}</h2>

              <form
                action={`/api/magnets/${code}/add-text?lang=${currentLang}`}
                method="POST"
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    {currentLang === "tr" ? "Başlık" : "Title"}
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder={
                      currentLang === "tr"
                        ? "Örn. İlk Akşam"
                        : "e.g. First Evening"
                    }
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    {currentLang === "tr" ? "Metin" : "Text"}
                  </label>
                  <textarea
                    name="content"
                    rows={6}
                    placeholder={
                      currentLang === "tr"
                        ? "Anına ait metni buraya yaz"
                        : "Write the text for your memory here"
                    }
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {currentLang === "tr" ? "Metni Kaydet" : "Save Text"}
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-medium">{ui.addPhoto}</h2>
              <ImageUploadForm
                code={code}
                lang={currentLang}
                remainingPhotos={Math.max(0, imageLimit - imageCount)}
              />
            </section>
            
            <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-medium">{ui.addVideo}</h2>

              <VideoUploadForm code={code} lang={currentLang} />
            </section>
          </div>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-medium">{ui.addAudio}</h2>

            <AudioRecorderForm code={code} lang={currentLang} />

            <form
              action={`/api/magnets/${code}/upload-audio`}
              method="POST"
              encType="multipart/form-data"
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  {ui.audioTitle}
                </label>
                <input
                  type="text"
                  name="audioTitle"
                  placeholder={
                    currentLang === "en"
                      ? "e.g. Sea Sound"
                      : "Örn. Deniz Sesi"
                  }
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  {ui.audioFile}
                </label>
                <label className="block cursor-pointer rounded-2xl border border-dashed border-stone-300 px-4 py-5 text-center text-sm text-stone-600 transition hover:bg-stone-50">
                  {currentLang === "en" ? "Choose audio file" : "Ses dosyası seç"}
                  <input
                    type="file"
                    name="audioFile"
                    accept="audio/*"
                    className="hidden"
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {ui.uploadAudio}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                  {currentLang === "en" ? "Story Flow" : "Story Akışı"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-900">
                  {ui.currentItems}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  {currentLang === "en"
                    ? "Arrange, delete or choose the cover image for your story."
                    : "Story sıralamasını düzenle, içerikleri sil veya kapak görselini seç."}
                </p>
              </div>
            </div>

            {itemsWithUrls.length > 0 ? (
              <div className="grid gap-5">
                {itemsWithUrls.map((item) => (
                  <article
                    key={item.id.toString()}
                    className="rounded-3xl border border-stone-200 bg-stone-50/70 p-4 shadow-sm transition hover:bg-stone-50 md:p-5"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                        {item.item_type}
                      </p>
                    <p className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-500 shadow-sm">
                      {ui.order}: {item.sort_order}
                    </p>
                    </div>

                    {item.title ? (
                      <h3 className="mb-2 text-lg font-medium text-stone-900">
                        {item.title}
                      </h3>
                    ) : null}

                  {item.item_type === "image" && item.signedUrl ? (
                    <div className="space-y-4">
                      <div
                        className={`relative overflow-hidden rounded-2xl border-2 transition hover:scale-[1.01] ${
                          memory.cover_image_path === item.file_path
                            ? "border-stone-900 shadow-md"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={item.signedUrl}
                          alt={item.title || ui.imageAlt}
                          className="w-full rounded-2xl"
                        />

                        {memory.cover_image_path === item.file_path && (
                          <span className="absolute left-3 top-3 rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white shadow">
                            {currentLang === "en" ? "Cover" : "Kapak"}
                          </span>
                        )}
                      </div>

                      <form action={`/api/magnets/${code}/set-cover`} method="POST">
                        <input type="hidden" name="itemId" value={item.id.toString()} />

                        <button
                          type="submit"
                          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                            memory.cover_image_path === item.file_path
                              ? "bg-stone-900 text-white"
                              : "border border-stone-300 text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {memory.cover_image_path === item.file_path
                            ? currentLang === "en"
                              ? "Selected Cover"
                              : "Seçili Kapak"
                            : currentLang === "en"
                            ? "Set as Cover"
                            : "Kapak Yap"}
                        </button>
                      </form>

                      {memory.cover_image_path === item.file_path && (
                        <form
                          action={`/api/magnets/${code}/set-cover-position`}
                          method="POST"
                          className="rounded-2xl border border-stone-200 bg-white p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-stone-800">
                                {currentLang === "en" ? "Cover framing" : "Kapak kadrajı"}
                              </p>
                              <p className="text-xs text-stone-500">
                                {currentLang === "en"
                                  ? "Move the focus up or down."
                                  : "Görünen alanı yukarı veya aşağı taşı."}
                              </p>
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

                          <div className="mt-2 flex justify-between text-xs text-stone-400">
                            <span>{currentLang === "en" ? "Top" : "Üst"}</span>
                            <span>{currentLang === "en" ? "Center" : "Orta"}</span>
                            <span>{currentLang === "en" ? "Bottom" : "Alt"}</span>
                          </div>

                          <button
                            type="submit"
                            className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition hover:opacity-90"
                          >
                            {currentLang === "en" ? "Save framing" : "Kadrajı Kaydet"}
                          </button>
                        </form>
                      )}
                    </div>
                  ) : item.item_type === "video" && item.signedUrl ? (                   

                      <video
                        controls
                        playsInline
                        className="w-full rounded-2xl border border-stone-200"
                        src={item.signedUrl}
                      />
                    ) : item.item_type === "audio" && item.signedUrl ? (
                      <audio
                        controls
                        className="w-full"
                        src={item.signedUrl}
                      />
                    ) : item.content_text ? (
                      <p className="text-sm leading-7 text-stone-700">
                        {item.content_text}
                      </p>
                    ) : (
                      <p className="text-sm text-stone-500">
                        {ui.contentPreviewNotReady}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <form
                        action={`/api/magnets/${code}/move-item`}
                        method="POST"
                      >
                        <input
                          type="hidden"
                          name="itemId"
                          value={item.id.toString()}
                        />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                        >
                          {ui.moveUp}
                        </button>
                      </form>

                      <form
                        action={`/api/magnets/${code}/move-item`}
                        method="POST"
                      >
                        <input
                          type="hidden"
                          name="itemId"
                          value={item.id.toString()}
                        />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                        >
                          {ui.moveDown}
                        </button>
                      </form>

                      <form
                        action={`/api/magnets/${code}/delete-item`}
                        method="POST"
                      >
                        <input
                          type="hidden"
                          name="itemId"
                          value={item.id.toString()}
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          {ui.delete}
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center">
                <p className="text-sm text-stone-600">
                  {ui.noContent}
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </section>
  </main>
  );
}