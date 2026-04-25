type SuccessPageProps = {
  searchParams: Promise<{
    phone?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { phone } = await searchParams;

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
          Story Magnet
        </p>

        <h1 className="mb-4 text-3xl font-semibold">Doğrulama tamamlandı</h1>

        <p className="mb-6 text-base leading-7 text-stone-600">
          {phone ? `${phone} numarası başarıyla doğrulandı.` : "Telefon numarası başarıyla doğrulandı."}
        </p>

        <a
          href="/"
          className="inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Ana Sayfaya Dön
        </a>
      </section>
    </main>
  );
}