const variants = ["HATIRLA.", "REMEMBER THIS.", "A MOMENT.", "ÖZEL METİN"];

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-stone-500">
              Memoried
            </p>

            <h1 className="text-4xl font-semibold md:text-6xl">
              NFC taş magnet ile anını dijitale taşı
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-stone-600">
              5x8 cm taş magnet. NFC özelliği sayesinde telefonunu yaklaştır,
              fotoğraf, video, ses ve notlardan oluşan kişisel anı sayfan açılsın.
            </p>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="aspect-[5/4] rounded-[1.5rem] bg-gradient-to-br from-stone-200 to-stone-100 p-6">
                <div className="flex h-full items-center justify-center rounded-3xl border border-stone-300 bg-stone-100 text-center shadow-inner">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
                      Memoried
                    </p>
                    <p className="mt-4 text-3xl font-semibold">HATIRLA.</p>
                    <p className="mt-4 text-xs text-stone-500">
                      5x8 cm • NFC taş magnet
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form
            action="/api/orders/create"
            method="POST"
            className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.25em] text-stone-400">
                Sipariş Formu
              </p>
              <h2 className="mt-2 text-3xl font-semibold">₺399,00</h2>
              <p className="mt-2 text-sm text-stone-500">
                NFC taş magnet + temel dijital anı sayfası dahildir.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Magnet Yazısı
                </label>
                <select
                  name="variantText"
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                  required
                >
                  {variants.map((variant) => (
                    <option key={variant} value={variant}>
                      {variant}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Özel Metin
                </label>
                <input
                  type="text"
                  name="customText"
                  maxLength={40}
                  placeholder="Örn. Alaçatı 2026"
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                />
                <p className="mt-2 text-xs text-stone-500">
                  Özel metin seçtiysen buraya yaz. Maksimum 40 karakter.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="+905..."
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Adres
                </label>
                <textarea
                  name="address"
                  rows={3}
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    İl
                  </label>
                  <input
                    type="text"
                    name="city"
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    İlçe
                  </label>
                  <input
                    type="text"
                    name="district"
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    Posta Kodu
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    TC No
                  </label>
                  <input
                    type="text"
                    name="identityNumber"
                    placeholder="Bireysel fatura için"
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    Vergi No
                  </label>
                  <input
                    type="text"
                    name="taxNumber"
                    placeholder="Kurumsal fatura için"
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-stone-900 px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Ödemeye Geç
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}