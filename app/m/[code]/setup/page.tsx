import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import bcrypt from "bcryptjs";


type SetupPageProps = {
  params: Promise<{
    code: string;
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
};

async function activateMagnet(code: string, formData: FormData) {
  "use server";

  const selectedLang = String(formData.get("lang") || "tr").trim() === "en" ? "en" : "tr";

  const title = String(formData.get("title") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();

  const editPassword = String(formData.get("editPassword") || "").trim();
  const editPasswordConfirm = String(formData.get("editPasswordConfirm") || "").trim();

  if (!editPassword || editPassword.length < 4) {
    throw new Error("Düzenleme şifresi en az 4 karakter olmalı.");
  }

  if (editPassword !== editPasswordConfirm) {
    throw new Error("Şifreler eşleşmiyor.");
  }

  const editPasswordHash = await bcrypt.hash(editPassword, 10);  

  if (!title) {
    throw new Error("Anı başlığı zorunlu.");
  }

  const magnet = await prisma.magnets.findUnique({
    where: {
      magnet_code: code,
    },
  });

  if (!magnet) {
    throw new Error("Magnet bulunamadı.");
  }

  const demoUser = await prisma.users.findUnique({
    where: {
      phone_number: "+905073641591",
    },
  });

  if (!demoUser) {
    throw new Error("Demo kullanıcı bulunamadı.");
  }

  await prisma.memories.create({
    data: {
      user_id: demoUser.id,
      magnet_id: magnet.id,
      title: title,
      subtitle: subtitle || null,
      location_text: location || null,
      title_tr: selectedLang === "tr" ? title : null,
      title_en: selectedLang === "en" ? title : null,
      subtitle_tr: selectedLang === "tr" ? subtitle || null : null,
      subtitle_en: selectedLang === "en" ? subtitle || null : null,
      location_text_tr: selectedLang === "tr" ? location || null : null,
      location_text_en: selectedLang === "en" ? location || null : null,
      selected_lang: selectedLang,
      edit_password_hash: editPasswordHash,
      status: "published",
    },
  });

  await prisma.magnets.update({
    where: {
      id: magnet.id,
    },
    data: {
      user_id: demoUser.id,
      is_active: true,
      first_activated_at: new Date(),
    },
  });

  redirect(`/m/${code}?lang=${selectedLang}`);
}

export default async function SetupPage({
  params,
  searchParams,
}: SetupPageProps) {
  const { code } = await params;
  const { lang } = await searchParams;

  const currentLang = lang === "en" ? "en" : "tr";
  const ui = {
    setupTitle: currentLang === "en" ? "Magnet setup" : "Magnet kurulumu",
    setupText:
      currentLang === "en"
        ? "You can activate this magnet by creating your first memory."
        : "İlk anını oluşturarak bu magneti aktive edebilirsin.",
    magnetCode: currentLang === "en" ? "Magnet Code" : "Magnet Kodu",
    activate: currentLang === "en" ? "Activate Magnet" : "Magneti Aktive Et",
    title: currentLang === "en" ? "Memory Title" : "Anı Başlığı",
    location: currentLang === "en" ? "Location" : "Konum",
    subtitle: currentLang === "en" ? "Short Description" : "Kısa Açıklama",
  };  

  const magnet = await prisma.magnets.findUnique({
    where: {
      magnet_code: code,
    },
  });

  if (!magnet) {
    notFound();
  }

  if (magnet.is_active) {
    redirect(`/m/${code}`);
  }

  const activateMagnetWithCode = activateMagnet.bind(null, code);

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-2xl">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
          Story Magnet
        </p>

        <h1 className="mb-4 text-3xl font-semibold md:text-5xl">
          {ui.setupTitle}
        </h1>

        <p className="mb-10 max-w-xl text-base leading-7 text-stone-600 md:text-lg">
          {ui.setupText}
        </p>

        <div className="mb-8 rounded-2xl border border-stone-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-stone-500">{ui.magnetCode}</p>
          <p className="mt-2 text-lg font-medium tracking-wide text-stone-900">
            {magnet.magnet_code}
          </p>
        </div>

        <form
          action={activateMagnetWithCode}
          className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
        >

        <input type="hidden" name="lang" value={currentLang} />

        <p className="text-sm font-medium text-stone-700">
          {currentLang === "en"
            ? "Choose the language for this memory"
            : "Bu anının dilini seç"}
        </p>        

        <div className="flex gap-3">
          <Link
            href={`/m/${code}/setup?lang=tr`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              currentLang === "tr"
                ? "bg-stone-900 text-white"
                : "border border-stone-300 text-stone-700"
            }`}
          >
            Türkçe
          </Link>

          <Link
            href={`/m/${code}/setup?lang=en`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              currentLang === "en"
                ? "bg-stone-900 text-white"
                : "border border-stone-300 text-stone-700"
            }`}
          >
            English
          </Link>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            {currentLang === "en" ? "Edit Password" : "Düzenleme Şifresi"}
          </label>
          <input
            type="password"
            name="editPassword"
            placeholder={currentLang === "en" ? "Set a password" : "Bir şifre belirle"}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            {currentLang === "en" ? "Confirm Password" : "Şifreyi Tekrar Gir"}
          </label>
          <input
            type="password"
            name="editPasswordConfirm"
            placeholder={currentLang === "en" ? "Confirm password" : "Şifreyi tekrar yaz"}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
            required
          />
        </div>        

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            {currentLang === "tr" ? "Anı Başlığı" : "Memory Title"}
          </label>
          <input
            type="text"
            name="title"
            placeholder={
              currentLang === "tr"
                ? "Örn. Alaçatı Yazı 2026"
                : "e.g. Alacati Summer 2026"
            }
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            {currentLang === "tr" ? "Konum" : "Location"}
          </label>
          <input
            type="text"
            name="location"
            placeholder={currentLang === "tr" ? "Örn. Alaçatı" : "e.g. Alacati"}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            {currentLang === "tr" ? "Kısa Açıklama" : "Short Description"}
          </label>
          <textarea
            name="subtitle"
            placeholder={
              currentLang === "tr"
                ? "Bu anıya kısa bir giriş yazabilirsin"
                : "You can write a short intro for this memory"
            }
            rows={4}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
          />
        </div>         

          <button
            type="submit"
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            {ui.activate}
          </button>
        </form>
      </section>
    </main>
  );
}