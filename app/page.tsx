export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
          Story Magnet
        </p>

        <h1 className="mb-6 text-4xl font-semibold leading-tight md:text-6xl">
          Anılarını dokunarak
          <br />
          yeniden yaşa
        </h1>

        <p className="mb-10 max-w-xl text-base leading-7 text-stone-600 md:text-lg">
          Fotoğraflarını, videolarını, notlarını ve ses kayıtlarını tek bir
          hikâyede buluşturan premium NFC anı deneyimi.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">
          <a
            href="/shop"
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Başlayalım
          </a>         
          </button>

          <button className="rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100">
            Nasıl çalışır?
          </button>

          <a
            href="/account/login"
            className="rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100 text-center"
          >
            Hesabıma Giriş
          </a>
        </div>
      </section>
    </main>
  );
}
