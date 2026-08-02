import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAccountPhone } from "@/lib/auth";

type AccountPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function MagnetConnectCard({ hasMemories = false }: { hasMemories?: boolean }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white p-6 shadow-sm md:p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
        {hasMemories ? "Yeni magnet" : "Başlangıç"}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-stone-900">
        {hasMemories ? "Yeni bir anı ekle" : "İlk anını oluştur"}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
        Magnetin üzerinde veya magnetle birlikte gelen kartta bulunan kodu gir.
        Seni anı oluşturma sayfasına götüreceğiz.
      </p>

      <form
        action="/api/account/connect-magnet"
        method="POST"
        className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row"
      >
        <input
          type="text"
          name="magnetCode"
          autoComplete="off"
          placeholder="Örn. MEM-000001"
          maxLength={100}
          required
          className="min-w-0 flex-1 rounded-2xl border border-stone-300 px-4 py-3 uppercase outline-none transition focus:border-stone-500"
        />
        <button className="rounded-2xl bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">
          Anı Oluştur
        </button>
      </form>

      <p className="mt-4 text-xs leading-5 text-stone-500">
        Henüz magnetin yoksa <Link href="/shop" className="underline underline-offset-4">mağazadan sipariş verebilirsin</Link>.
      </p>
    </div>
  );
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { error } = await searchParams;
  const finalPhone = await getAccountPhone();

  if (!finalPhone) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
        <section className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm text-center">
          <h1 className="mb-4 text-3xl font-semibold">Telefon numarası gerekli</h1>
          <p className="mb-6 text-stone-600">
            Hesabına ulaşmak için telefon numaranı girmen gerekiyor.
          </p>
          <Link
            href="/account/login"
            className="inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Giriş Sayfasına Dön
          </Link>
        </section>
      </main>
    );
  }

  const user = await prisma.users.findUnique({
    where: {
      phone_number: finalPhone,
    },
    include: {
      memories: {
        include: {
          magnet: true,
        },
        orderBy: {
          created_at: "desc",
        },
      },
    },
  });

  if (!user) {
    
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
        <section className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm text-center">
          <h1 className="mb-4 text-3xl font-semibold">Kullanıcı bulunamadı</h1>
          <p className="mb-6 text-stone-600">
            Bu telefon numarasıyla kayıtlı bir hesap görünmüyor.
          </p>
          <Link
            href="/account/login"
            className="inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Tekrar Dene
          </Link>
        </section>
      </main>
    );
  }

  const isPremium =
    user.plan_type === "premium" &&
    user.premium_until &&
    user.premium_until > new Date();

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-stone-500">
              Story Magnet Account
            </p>
            <h1 className="text-3xl font-semibold md:text-5xl">Anılarım</h1>
            <p className="mt-3 text-sm text-stone-500">{user.phone_number}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">
              Plan:{" "}
              <strong>
                {isPremium ? "Premium" : "Ücretsiz"}
              </strong>

              {isPremium && user.premium_until && (
                <p className="mt-2 text-xs text-stone-500">
                  Premium bitiş tarihi:{" "}
                  {new Date(user.premium_until).toLocaleDateString("tr-TR")}
                </p>
              )}
            </div>

            <form action="/api/account/logout" method="POST">
              <button className="rounded-full border border-stone-300 px-4 py-2 text-sm">
                Çıkış Yap
              </button>
            </form>
          </div>
        </div>

        {error === "invalid-magnet-code" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Lütfen magnet kodunu kartta yazdığı biçimde kontrol edip tekrar gir.
          </div>
        )}
        {error === "magnet-not-found" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Bu kodla eşleşen bir magnet bulunamadı. Koddaki harf ve rakamları kontrol et.
          </div>
        )}
        {error === "magnet-already-used" && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Bu magnet başka bir hesaba bağlanmış görünüyor. Yardım için bizimle iletişime geç.
          </div>
        )}
        {error === "account-not-found" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Hesap bilgisi bulunamadı. Lütfen çıkış yapıp tekrar giriş yap.
          </div>
        )}

        {user.memories.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2">
            {user.memories.map((memory) => (
              <article
                key={memory.id.toString()}
                className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <p className="mb-2 text-sm uppercase tracking-[0.2em] text-stone-500">
                  Magnet: {memory.magnet?.magnet_code || "-"}
                </p>

                <h2 className="mb-3 text-2xl font-medium text-stone-900">
                  {memory.title}
                </h2>

                {memory.subtitle ? (
                  <p className="mb-4 text-sm leading-7 text-stone-600">
                    {memory.subtitle}
                  </p>
                ) : null}

                {memory.location_text ? (
                  <p className="mb-6 text-sm uppercase tracking-[0.15em] text-stone-500">
                    {memory.location_text}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/m/${memory.magnet?.magnet_code}`}
                    className="rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                  >
                    Story Gör
                  </Link>

                  <Link
                    href={`/m/${memory.magnet?.magnet_code}/edit?lang=${
                      memory.selected_lang === "en" ? "en" : "tr"
                    }`}                    
                    className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Düzenle
                  </Link>
                </div>
              </article>
            ))}
            </div>
            <MagnetConnectCard hasMemories />
          </>
        ) : (
          <MagnetConnectCard />
        )}
      </section>
    </main>
  );
}