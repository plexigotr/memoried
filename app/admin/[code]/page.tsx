import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";


type AdminMagnetDetailPageProps = {
  params: Promise<{
    code: string;
  }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function AdminMagnetDetailPage({
  params,
  searchParams,
}: AdminMagnetDetailPageProps) {
  const { code } = await params;
  const { success, error } = await searchParams;

  const cookieStore = await cookies();
  const hasAdminAccess = cookieStore.get("admin_access")?.value === "granted";

  if (!hasAdminAccess) {
    redirect("/admin/login");
  }  

  const magnet = await prisma.magnets.findUnique({
    where: {
      magnet_code: code,
    },
    include: {
      user: true,
      memory: {
        include: {
          memory_items: {
            orderBy: {
              sort_order: "asc",
            },
          },
        },
      },
      scan_logs: {
        orderBy: {
          scanned_at: "desc",
        },
        take: 20,
      },
    },
  });

  if (!magnet) {
    notFound();
  }

  const items = magnet.memory?.memory_items || [];

  const imageCount = items.filter((item) => item.item_type === "image").length;
  const videoCount = items.filter((item) => item.item_type === "video").length;
  const audioCount = items.filter((item) => item.item_type === "audio").length;
  const textCount = items.filter((item) => item.item_type === "text").length;

  const isPremium =
  magnet.user?.plan_type === "premium" &&
  magnet.user?.premium_until &&
  magnet.user.premium_until > new Date();

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-block text-sm text-stone-500 underline"
            >
              ← Admin paneline dön
            </Link>

            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-stone-500">
              Story Magnet Admin
            </p>

            <h1 className="text-3xl font-semibold md:text-5xl">
              {magnet.magnet_code}
            </h1>

            <p className="mt-3 text-sm text-stone-500">
              Magnet detayları ve destek işlemleri
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/m/${magnet.magnet_code}`}
              className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              Story Gör
            </Link>

            {magnet.memory ? (
              <Link
                href={`/m/${magnet.magnet_code}/edit?lang=${
                  magnet.memory.selected_lang === "en" ? "en" : "tr"
                }`}
                className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Düzenle
              </Link>
            ) : null}
          </div>
        </div>

        {success === "password-reset" && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Düzenleme şifresi başarıyla değiştirildi.
          </div>
        )}

        {error === "password-reset-failed" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Şifre değiştirilirken bir sorun oluştu.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-medium">Magnet Bilgileri</h2>

            <div className="space-y-3 text-sm text-stone-700">
              <p>
                <span className="text-stone-500">Kod:</span>{" "}
                <strong>{magnet.magnet_code}</strong>
              </p>

              <p>
                <span className="text-stone-500">Durum:</span>{" "}
                {magnet.is_active ? "Aktif" : "Pasif"}
              </p>

              <p>
                <span className="text-stone-500">İlk aktivasyon:</span>{" "}
                {magnet.first_activated_at
                  ? new Date(magnet.first_activated_at).toLocaleString("tr-TR")
                  : "-"}
              </p>

              <p>
                <span className="text-stone-500">Oluşturulma:</span>{" "}
                {new Date(magnet.created_at).toLocaleString("tr-TR")}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-medium">Kullanıcı</h2>

            <div className="space-y-3 text-sm text-stone-700">
              <p>
                <span className="text-stone-500">Telefon:</span>{" "}
                {magnet.user?.phone_number || "-"}
              </p>

              <p>
                <span className="text-stone-500">Plan:</span>{" "}
                {isPremium ? "Premium" : magnet.user ? "Ücretsiz" : "-"}
              </p>

              {magnet.user?.premium_until ? (
                <p>
                  <span className="text-stone-500">Premium bitiş:</span>{" "}
                  {new Date(magnet.user.premium_until).toLocaleDateString("tr-TR")}
                </p>
              ) : null}

              <p>
                <span className="text-stone-500">Dil:</span>{" "}
                {magnet.memory?.selected_lang === "en" ? "English" : "Türkçe"}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-medium">İçerik Sayıları</h2>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-stone-500">Fotoğraf</p>
                <p className="mt-1 text-2xl font-semibold">{imageCount}</p>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-stone-500">Video</p>
                <p className="mt-1 text-2xl font-semibold">{videoCount}</p>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-stone-500">Ses</p>
                <p className="mt-1 text-2xl font-semibold">{audioCount}</p>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-stone-500">Metin</p>
                <p className="mt-1 text-2xl font-semibold">{textCount}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-medium">Anı Bilgileri</h2>

            {magnet.memory ? (
              <div className="space-y-3 text-sm text-stone-700">
                <p>
                  <span className="text-stone-500">Başlık:</span>{" "}
                  {magnet.memory.title || "-"}
                </p>

                <p>
                  <span className="text-stone-500">TR Başlık:</span>{" "}
                  {magnet.memory.title_tr || "-"}
                </p>

                <p>
                  <span className="text-stone-500">EN Başlık:</span>{" "}
                  {magnet.memory.title_en || "-"}
                </p>

                <p>
                  <span className="text-stone-500">Konum:</span>{" "}
                  {magnet.memory.location_text || "-"}
                </p>

                <p>
                  <span className="text-stone-500">Düzenleme şifresi:</span>{" "}
                  {magnet.memory.edit_password_hash ? "Belirlenmiş" : "Yok"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-stone-600">
                Bu magnet için henüz anı oluşturulmamış.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-medium">Düzenleme Şifresini Sıfırla</h2>

            {magnet.memory ? (
              <form
                action="/api/admin/reset-edit-password"
                method="POST"
                className="space-y-5"
              >
                <input
                  type="hidden"
                  name="magnetCode"
                  value={magnet.magnet_code}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    Yeni Şifre
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    Yeni Şifre Tekrar
                  </label>
                  <input
                    type="password"
                    name="newPasswordConfirm"
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Şifreyi Güncelle
                </button>
              </form>
            ) : (
              <p className="text-sm text-stone-600">
                Şifre değiştirmek için önce magnetin aktive edilmesi gerekir.
              </p>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-medium">Son Okutulmalar</h2>

          {magnet.scan_logs.length > 0 ? (
            <div className="space-y-2">
              {magnet.scan_logs.map((scan) => (
                <div
                  key={scan.id.toString()}
                  className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700"
                >
                  {new Date(scan.scanned_at).toLocaleString("tr-TR")}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-600">
              Henüz okutulma kaydı yok.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}