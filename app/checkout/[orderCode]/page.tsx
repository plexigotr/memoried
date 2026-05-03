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

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { orderCode } = await params;
  const { payment, error } = await searchParams;

  const order = await prisma.orders.findUnique({
    where: { order_code: orderCode },
  });

  if (!order) notFound();

  const isPaid = order.status === "paid" || payment === "success";
  const errorMessage = getErrorMessage(error);

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-stone-500">
          Memoried
        </p>

        <h1 className="text-3xl font-semibold">
          {isPaid ? "Ödemen alındı" : "Sipariş oluşturuldu"}
        </h1>

        <p className="mt-4 text-sm text-stone-600">Sipariş kodun:</p>

        <p className="mt-2 rounded-2xl bg-stone-100 px-4 py-3 font-medium">
          {order.order_code}
        </p>

        <div className="mt-6 space-y-2 text-sm text-stone-700">
          <p><strong>Ürün:</strong> {order.product_name}</p>
          <p><strong>Yazı:</strong> {order.custom_text || order.variant_text || "-"}</p>
          <p><strong>Tutar:</strong> ₺{order.price.toString()}</p>
          <p><strong>Durum:</strong> {getStatusLabel(order.status)}</p>
        </div>

        {isPaid && (
          <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Harika, ödeme başarıyla tamamlandı.
          </p>
        )}

        {errorMessage && (
          <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {!isPaid && (
          <div className="mt-6">
            <PaymentButton orderCode={order.order_code} />

            <p className="mt-3 text-center text-xs text-stone-500">
              Butona bastığında güvenli iyzico ödeme sayfasına yönlendirileceksin.
            </p>
          </div>
        )}

        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
        >
          Yeni Sipariş Oluştur
        </Link>
      </section>
    </main>
  );
}