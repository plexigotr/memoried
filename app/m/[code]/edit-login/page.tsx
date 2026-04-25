import Link from "next/link";

type EditLoginPageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ lang?: string; error?: string }>;
};

export default async function EditLoginPage({
  params,
  searchParams,
}: EditLoginPageProps) {
  const { code } = await params;
  const { lang, error } = await searchParams;

  const currentLang = lang === "en" ? "en" : "tr";

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
          Story Magnet
        </p>

        <h1 className="mb-4 text-3xl font-semibold">
          {currentLang === "en" ? "Enter edit password" : "Düzenleme şifresini gir"}
        </h1>

        <p className="mb-8 text-base leading-7 text-stone-600">
          {currentLang === "en"
            ? "This password protects the memory editing page on this device."
            : "Bu şifre, bu cihazda anı düzenleme sayfasını korur."}
        </p>

        {error === "wrong-password" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {currentLang === "en"
              ? "Password is incorrect."
              : "Şifre hatalı."}
          </div>
        )}

        <form
          action={`/api/magnets/${code}/verify-edit-password`}
          method="POST"
          className="space-y-5"
        >
          <input type="hidden" name="lang" value={currentLang} />

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              {currentLang === "en" ? "Password" : "Şifre"}
            </label>
            <input
              type="password"
              name="password"
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
              required
            />
          </div>

          <button
            type="submit"
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            {currentLang === "en" ? "Continue" : "Devam Et"}
          </button>
        </form>

        <Link
          href={`/m/${code}?lang=${currentLang}`}
          className="mt-6 inline-block text-sm text-stone-500 underline"
        >
          {currentLang === "en" ? "Back to story" : "Story sayfasına dön"}
        </Link>
      </section>
    </main>
  );
}