import { safeReturnPath } from "@/lib/safeRedirect";
import PhoneNumberField from "@/components/PhoneNumberField";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
  }>;
};

export default async function AccountLoginPage({ searchParams }: LoginPageProps) {
  const { error, returnTo } = await searchParams;
  const returnPath = safeReturnPath(returnTo);

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
          Story Magnet
        </p>

        <h1 className="mb-4 text-3xl font-semibold">Hesabıma Giriş</h1>

        <p className="mb-8 text-base leading-7 text-stone-600">
          Kayıt olurken kullandığın telefon numarasıyla doğrulama kodu alarak hesabına giriş yapabilirsin.
        </p>

        {error === "user-not-found" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Bu telefon numarasıyla kayıtlı bir kullanıcı bulunamadı.
          </div>
        )}

        {error === "send-failed" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Doğrulama kodu gönderilemedi. Lütfen tekrar dene.
          </div>
        )}

        {error === "no-phone" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Lütfen geçerli bir telefon numarası gir.
          </div>
        )}

        {error === "rate-limited" && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Çok fazla kod istendi. Lütfen bir süre sonra tekrar dene.
          </div>
        )}

        <form action="/api/account/send-code" method="POST" className="space-y-5">
          <input type="hidden" name="returnTo" value={returnPath} />
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Telefon Numarası
            </label>
            <PhoneNumberField />
            <p className="mt-2 text-xs leading-5 text-stone-500">
              Başındaki 0 ve yazdığın boşluklar otomatik olarak temizlenir.
            </p>
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