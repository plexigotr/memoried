export default function PhonePage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
          Story Magnet
        </p>

        <h1 className="mb-4 text-3xl font-semibold">Telefon numaranı doğrula</h1>

        <p className="mb-8 text-base leading-7 text-stone-600">
          Hesabını oluşturmak ve anılarını sonradan düzenleyebilmek için SMS doğrulaması yapacağız.
        </p>

        <form
          action="/api/auth/send-code"
          method="POST"
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Telefon Numarası
            </label>
            <input
              type="text"
              name="phoneNumber"
              placeholder="+905551112233"
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
              required
            />
          </div>

          <button
            type="submit"
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Doğrulama Kodu Gönder
          </button>
        </form>
      </section>
    </main>
  );
}