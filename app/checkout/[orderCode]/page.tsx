import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PaymentButton from "./PaymentButton";

type CheckoutPageProps = {
  params: Promise<{ orderCode: string }>;
  searchParams: Promise<{ payment?: string; error?: string }>;
};

function getStatusLabel(status: string) {
  if (status === "paid") return "Ödendi";
  if (status === "payment_started") return "Ödeme başlatıldı";
  if (status === "payment_failed") return "Ödeme başarısız";
  return "Ödeme bekliyor";
}

function getErrorMessage(error?: string) {
  if (!error) return null;

  const messages: Record<string, string> = {
    "payment-init-failed": "Ödeme başlatılamadı. Lütfen tekrar dene.",
    "payment-failed": "Ödeme tamamlanamadı. Kart bilgilerini kontrol edip tekrar deneyebilirsin.",
    "payment-callback-invalid": "Ödeme sonucu doğrulanamadı.",
    "payment-callback-failed": "Ödeme sonucu kontrol edilirken hata oluştu.",
  };

  return messages[error] || "Ödeme sırasında bir hata oluştu.";
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { orderCode } = await params;
  const { payment, error } = await searchParams;

  const order = await prisma.orders.findUnique({
    where: { order_code: orderCode },
  });

  if (!order) notFound();

  const isPaid = order.status === "paid" || payment === "success";
  const errorMessage = getErrorMessage(error);

  return (
    <main className="min-h-screen bg-[#f7f2eb] px-6 py-10 text-stone-900">
      <section className="mx-auto max-w-md">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.45em] text-stone-400">
            Memoried
          </p>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em]">
            {isPaid ? "Ödemen alındı." : "Siparişini tamamla."}
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-stone-600">
            {isPaid
              ? "Memoried anı objen hazırlanmak üzere sıraya alındı."
              : "Anılarını fiziksel bir objeye dönüştürmek için son adım."}
          </p>
        </div>

        <div className="mt-10 rounded-[2.75rem] border border-white/70 bg-white/75 p-5 shadow-[0_40px_100px_rgba(120,90,60,0.18)] backdrop-blur-xl">
          <div className="rounded-[3rem] bg-[#efe7dc] p-3">
            <img
              src="/magnet.png"
              alt="Memoried Doğal Taş Anı Magneti"
              className="h-[320px] w-full rounded-[2.25rem] object-cover drop-shadow-xl"
            />
          </div>

          <div className="px-2 pb-2 pt-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                  Order Summary
                </p>

                <h2 className="mt-2 text-2xl font-semibold leading-tight">
                  {order.product_name}
                </h2>
              </div>

              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-6 border-b border-stone-200 pb-3">
                <span className="text-stone-500">Sipariş kodu</span>
                <span className="text-right font-medium text-stone-900">
                  {order.order_code}
                </span>
              </div>

              <div className="flex justify-between gap-6 border-b border-stone-200 pb-3">
                <span className="text-stone-500">Kişisel yazı</span>
                <span className="text-right font-medium text-stone-900">
                  {order.custom_text || order.variant_text || "-"}
                </span>
              </div>

              <div className="flex justify-between gap-6 border-b border-stone-200 pb-3">
                <span className="text-stone-500">Tutar</span>
                <span className="text-right text-xl font-semibold text-stone-900">
                  ₺{order.price.toString()}
                </span>
              </div>
            </div>

            {isPaid && (
              <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
                Harika. Ödemen başarıyla tamamlandı.
              </div>
            )}

            {errorMessage && (
              <div className="mt-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {errorMessage}
              </div>
            )}

            {!isPaid && (
              <div className="mt-7">
                <PaymentButton orderCode={order.order_code} />

                <p className="mt-4 text-center text-[11px] leading-5 text-stone-400">
                  Güvenli ödeme • NFC destekli • Kişisel anı sayfası dahil
                </p>
              </div>
            )}

            <Link
              href="/shop"
              className="mt-5 block text-center text-xs uppercase tracking-[0.25em] text-stone-400 transition hover:text-stone-700"
            >
              Mağazaya dön
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}