import Link from "next/link";

type UpgradePageProps = {
  searchParams: Promise<{
    userId?: string;
    code?: string;
    lang?: string;
  }>;
};

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const { userId, code, lang } = await searchParams;
  const currentLang = lang === "en" ? "en" : "tr";

  const ui = {
    eyebrow: currentLang === "en" ? "Story Magnet Premium" : "Story Magnet Premium",
    title:
      currentLang === "en"
        ? "Give your memory more space"
        : "Anına daha fazla alan aç",
    subtitle:
      currentLang === "en"
        ? "Upgrade your magnet to add more photos and videos."
        : "Daha fazla fotoğraf ve video eklemek için magnet paketini yükselt.",
    free: currentLang === "en" ? "Free" : "Ücretsiz",
    premium: "Premium",
    currentPlan: currentLang === "en" ? "Current plan" : "Mevcut plan",
    choosePremium: currentLang === "en" ? "Upgrade to Premium" : "Premium’a Yükselt",
    back: currentLang === "en" ? "Back to edit" : "Düzenlemeye dön",
    note:
      currentLang === "en"
        ? "Payment integration will be connected when the project goes live."
        : "Ödeme entegrasyonu canlıya çıkınca bağlanacak.",
  };

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-stone-500">
            {ui.eyebrow}
          </p>
          <h1 className="text-4xl font-semibold md:text-6xl">{ui.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-stone-600">
            {ui.subtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm">
            <p className="mb-2 text-sm uppercase tracking-[0.25em] text-stone-400">
              {ui.currentPlan}
            </p>
            <h2 className="text-3xl font-semibold">{ui.free}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              {currentLang === "en"
                ? "For simple memories and basic usage."
                : "Basit anılar ve temel kullanım için."}
            </p>

            <ul className="mt-6 space-y-3 text-sm text-stone-700">
              <li>✓ {currentLang === "en" ? "10 photos" : "10 fotoğraf"}</li>
              <li>✓ {currentLang === "en" ? "1 video" : "1 video"}</li>
              <li>✓ {currentLang === "en" ? "Unlimited text" : "Sınırsız metin"}</li>
              <li>✓ {currentLang === "en" ? "Audio memories" : "Sesli anılar"}</li>
            </ul>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-stone-900 bg-stone-900 p-7 text-white shadow-xl">
            <div className="absolute right-6 top-6 rounded-full bg-white/10 px-3 py-1 text-xs">
              {currentLang === "en" ? "Recommended" : "Önerilen"}
            </div>

            <p className="mb-2 text-sm uppercase tracking-[0.25em] text-white/50">
              {ui.premium}
            </p>
            <h2 className="text-3xl font-semibold">
            ₺149,90{" "}
            <span className="text-base font-normal text-white/60">
                {currentLang === "en" ? "/ Year" : "/ Yıllık"}
            </span>
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {currentLang === "en"
                ? "More space for richer stories."
                : "Daha zengin anılar için daha fazla alan."}
            </p>

            <ul className="mt-6 space-y-3 text-sm text-white/90">
              <li>✓ {currentLang === "en" ? "30 photos" : "30 fotoğraf"}</li>
              <li>✓ {currentLang === "en" ? "10 videos" : "10 video"}</li>
              <li>✓ {currentLang === "en" ? "Unlimited text" : "Sınırsız metin"}</li>
              <li>✓ {currentLang === "en" ? "Audio memories" : "Sesli anılar"}</li>
              <li>✓ {currentLang === "en" ? "Premium story experience" : "Premium story deneyimi"}</li>
            </ul>

            <form action="/api/users/upgrade" method="POST" className="mt-8">
              <input type="hidden" name="userId" value={userId || ""} />
              <input type="hidden" name="code" value={code || ""} />
              <input type="hidden" name="lang" value={currentLang} />

              <button
                type="submit"
                className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:opacity-90"
              >
                {ui.choosePremium}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-white/50">{ui.note}</p>
          </article>
        </div>

        {code ? (
          <div className="mt-8 text-center">
            <Link
              href={`/m/${code}/edit?lang=${currentLang}`}
              className="text-sm text-stone-500 underline"
            >
              {ui.back}
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}