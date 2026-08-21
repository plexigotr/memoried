import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
          Memoried Anı Uygulaması
        </p>

        <h1 className="mb-6 text-4xl font-semibold leading-tight md:text-6xl">
          Anılarını dokunarak
          <br />
          yeniden yaşa
        </h1>

        <p className="mb-10 max-w-xl text-base leading-7 text-stone-600 md:text-lg">
          Satın aldığın Memoried Stone ürününe ait fotoğraf, video, not ve ses
          kayıtlarını buradan yönetebilirsin.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/account/login"
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Anılarıma Giriş
          </Link>

          <a
            href="https://memoried.me/products/memoried-stone"
            className="rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Ürünü İncele
          </a>
        </div>
      </section>
    </main>
  );
}
