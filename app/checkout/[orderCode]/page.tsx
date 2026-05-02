import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type CheckoutPageProps = {
  params: Promise<{
    orderCode: string;
  }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { orderCode } = await params;

  const order = await prisma.orders.findUnique({
    where: {
      order_code: orderCode,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-stone-500">
          Memoried
        </p>

        <h1 className="text-3xl font-semibold">Sipariş oluşturuldu</h1>

        <p className="mt-4 text-sm leading-6 text-stone-600">
          Sipariş kodun:
        </p>

        <p className="mt-2 rounded-2xl bg-stone-100 px-4 py-3 font-medium">
          {order.order_code}
        </p>

        <div className="mt-6 space-y-2 text-sm text-stone-700">
          <p>
            <strong>Ürün:</strong> {order.product_name}
          </p>
          <p>
            <strong>Yazı:</strong>{" "}
            {order.custom_text || order.variant_text || "-"}
          </p>
          <p>
            <strong>Tutar:</strong> ₺{order.price.toString()}
          </p>
          <p>
            <strong>Durum:</strong> {order.status}
          </p>
        </div>

        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Bir sonraki adımda bu sayfadaki ödeme butonunu iyzico ödeme sayfasına
          bağlayacağız.
        </p>

        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Yeni Sipariş Oluştur
        </Link>
      </section>
    </main>
  );
}