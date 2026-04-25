import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CopyButton from "@/components/CopyButton";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { error, success } = await searchParams;

  const cookieStore = await cookies();
  const hasAdminAccess = cookieStore.get("admin_access")?.value === "granted";

  if (!hasAdminAccess) {
    redirect("/admin/login");
  }  

    const magnets = await prisma.magnets.findMany({
    include: {
        user: true,
        memory: true,
        scan_logs: {
        orderBy: {
            scanned_at: "desc",
        },
        },
    },
    orderBy: {
        created_at: "desc",
    },
    });

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-stone-500">
            Story Magnet Admin
          </p>
          <h1 className="text-3xl font-semibold md:text-5xl">
            Magnet Yönetimi
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Toplam magnet: {magnets.length}
          </p>

          {success === "magnet-reset" && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              Magnet başarıyla sıfırlandı.
            </div>
          )}

          {error === "reset-failed" && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Magnet sıfırlanırken bir sorun oluştu.
            </div>
          )}

          {success === "magnets-created" && (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              Magnet kodları başarıyla oluşturuldu.
            </div>
          )}

          {error === "create-magnets-failed" && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Magnet kodları oluşturulurken bir sorun oluştu.
            </div>
          )}

          {error === "magnet-not-found" && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Magnet bulunamadı.
            </div>
          )}

          <a
            href="/api/admin/export-magnets"
            className="inline-block rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Excel Export
          </a>

        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="inline-block rounded-full border border-red-300 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Çıkış Yap
          </button>
        </form>          

        </div>

        <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-medium">Toplu Magnet Oluştur</h2>

          <form
            action="/api/admin/create-magnets"
            method="POST"
            className="grid gap-4 md:grid-cols-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Prefix
              </label>
              <input
                type="text"
                name="prefix"
                defaultValue="SM-TF"
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Başlangıç No
              </label>
              <input
                type="number"
                name="startNumber"
                defaultValue={1}
                min={1}
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Adet
              </label>
              <input
                type="number"
                name="count"
                defaultValue={10}
                min={1}
                max={500}
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Oluştur
              </button>
            </div>
          </form>
        </section>

        {magnets.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-100 text-stone-700">
                  <tr>
                    <th className="px-4 py-4 font-medium">Magnet Kodu</th>
                    <th className="px-4 py-3">NFC URL</th>
                    <th className="px-4 py-4 font-medium">Durum</th>
                    <th className="px-4 py-4 font-medium">Telefon</th>
                    <th className="px-4 py-4 font-medium">Plan</th>
                    <th className="px-4 py-4 font-medium">Anı Başlığı</th>
                    <th className="px-4 py-4 font-medium">Okutulma</th>
                    <th className="px-4 py-4 font-medium">Son Okutma</th>
                    <th className="px-4 py-4 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {magnets.map((magnet) => (
                    <tr
                      key={magnet.id.toString()}
                      className="border-t border-stone-200"
                    >
                      <td className="px-4 py-4 font-medium text-stone-900">
                        {magnet.magnet_code}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="max-w-[220px] truncate text-xs text-stone-600">
                            {(process.env.APP_BASE_URL || "http://localhost:3000") +
                              `/m/${magnet.magnet_code}`}
                          </span>

                          <CopyButton
                            text={
                              (process.env.APP_BASE_URL || "http://localhost:3000") +
                              `/m/${magnet.magnet_code}`
                            }
                          />
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {magnet.is_active ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                            Pasif
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-stone-700">
                        {magnet.user?.phone_number || "-"}
                      </td>

                      <td className="px-4 py-4 text-stone-700">
                        {magnet.user?.plan_type === "premium"
                          ? "Premium"
                          : magnet.user
                          ? "Ücretsiz"
                          : "-"}
                      </td>

                      <td className="px-4 py-4 text-stone-700">
                        {magnet.memory?.title || "-"}
                      </td>

                        <td className="px-4 py-4 text-stone-700">
                        {magnet.scan_logs.length}
                        </td>

                        <td className="px-4 py-4 text-stone-700">
                        {magnet.scan_logs[0]
                            ? new Date(magnet.scan_logs[0].scanned_at).toLocaleString("tr-TR")
                            : "-"}
                        </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/m/${magnet.magnet_code}`}
                            className="rounded-full border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
                          >
                            Story Gör
                          </Link>

                          <Link
                            href={`/admin/${magnet.magnet_code}`}
                            className="rounded-full border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
                          >
                            Detay
                          </Link>

                          <Link
                          href={`/m/${magnet.magnet_code}/edit?lang=${
                            magnet.memory?.selected_lang === "en" ? "en" : "tr"
                          }`}
                            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition hover:opacity-90"
                          >
                            Düzenle
                          </Link>

                          <form action="/api/admin/reset-magnet" method="POST">
                            <input
                              type="hidden"
                              name="magnetCode"
                              value={magnet.magnet_code}
                            />
                            <button
                              type="submit"
                              className="rounded-full border border-red-300 px-4 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Sıfırla
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="text-stone-600">Henüz magnet kaydı bulunmuyor.</p>
          </div>
        )}
      </section>
    </main>
  );
}