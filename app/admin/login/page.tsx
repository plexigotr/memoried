type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
          Story Magnet Admin
        </p>

        <h1 className="mb-4 text-3xl font-semibold">Admin Girişi</h1>

        {error === "wrong-password" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Admin şifresi hatalı.
          </div>
        )}

        <form action="/api/admin/login" method="POST" className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Şifre
            </label>
            <input
              type="password"
              name="password"
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-stone-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Giriş Yap
          </button>
        </form>
      </section>
    </main>
  );
}