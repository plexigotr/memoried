type VerifyPageProps = {
  searchParams: Promise<{
    phone?: string;
  }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { phone } = await searchParams;

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
          Story Magnet
        </p>

        <h1 className="mb-4 text-3xl font-semibold">Kodu doğrula</h1>

        <p className="mb-8 text-base leading-7 text-stone-600">
          Telefonuna gelen 6 haneli kodu gir.
        </p>

        <form
          action="/api/auth/check-code"
          method="POST"
          className="space-y-5"
        >
          <input type="hidden" name="phoneNumber" value={phone || ""} />

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Doğrulama Kodu
            </label>
            <input
              type="text"
              name="code"
              placeholder="123456"
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
              required
            />
          </div>

          <button
            type="submit"
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Kodu Onayla
          </button>
        </form>
      </section>
    </main>
  );
}