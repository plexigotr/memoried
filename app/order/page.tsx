"use client";

import { useState } from "react";
import { FormEvent } from "react";

export default function OrderPage() {
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("starter");

  const selectedPrice =
    selectedPackage === "premium" ? "₺1249,90" : "₺749,90";

  const selectedPackageName =
    selectedPackage === "premium" ? "Premium Paket" : "Başlangıç Paketi";

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
        const orderRes = await fetch("/api/orders/create", {
        method: "POST",
        body: formData,
        headers: {
            Accept: "application/json",
        },
        });

        const orderData = await orderRes.json().catch(() => null);

        if (!orderRes.ok || !orderData?.orderCode) {
        alert(orderData?.message || "Sipariş oluşturulamadı. Lütfen tekrar dene.");
        return;
        }

        const paymentRes = await fetch("/api/payments/shopier/initialize", {
        method: "POST",
        body: new URLSearchParams({
            orderCode: orderData.orderCode,
        }),
        });

        const paymentData = await paymentRes.json().catch(() => null);

        if (paymentRes.ok && paymentData?.paymentUrl) {
        window.location.href = paymentData.paymentUrl;
        return;
        }

        alert(paymentData?.message || "Ödeme başlatılamadı. Lütfen tekrar dene.");
    } catch (error) {
        console.error("Order/payment submit error:", error);
        alert("Bağlantı hatası oluştu. Lütfen tekrar dene.");
    } finally {
        setLoading(false);
    }
    }
  return (
    <main className="min-h-screen bg-[#f7f2eb] px-6 py-10 text-stone-900">
      <section className="mx-auto max-w-md">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.45em] text-stone-400">
            Memoried
          </p>

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
            Siparişini oluştur.
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-stone-600">
            Doğal taş anı magnetin için bilgilerini gir. Sonraki adımda ödeme
            sayfasına geçeceksin.
          </p>
        </div>
        <form
        onSubmit={handleSubmit}
        className="mt-10 rounded-[2.5rem] border border-white/70 bg-white/75 p-6 shadow-[0_40px_100px_rgba(120,90,60,0.16)] backdrop-blur-xl"
        >
        <input type="hidden" name="customerName" value="Shopier Müşterisi" />
        <input type="hidden" name="email" value="" />
        <input type="hidden" name="address" value="Shopier üzerinden alınacak" />
        <input type="hidden" name="city" value="Shopier" />
        <input type="hidden" name="district" value="Shopier" />

        <input type="hidden" name="variantText" value="Doğal Taş" />
        <input type="hidden" name="packageType" value={selectedPackage} />

         
            <div>
              <label className="text-xs uppercase tracking-[0.25em] text-stone-400">
                Telefon numarası
              </label>
              <input
                name="phoneNumber"
                required
                placeholder="05XX XXX XX XX"
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.25em] text-stone-400">
                Magnet üzerindeki yazı
              </label>
              <input
                name="customText"
                placeholder="HATIRLA."
                className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400"
              />
            </div>

  

            <label className="mt-6 flex cursor-pointer items-center gap-4 rounded-3xl border border-stone-200 bg-white/70 p-5 transition hover:bg-white">
            <input
                type="checkbox"
                name="giftPackage"
                value="yes"
                className="h-5 w-5 accent-stone-950"
            />

            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efe7dc] text-2xl">
                🎁
            </span>

            <span>
                <span className="block text-sm font-semibold text-stone-800">
                Hediye Paketi İstiyorum
                </span>
                <span className="mt-1 block text-xs text-stone-500">
                Ücretsiz olarak hediye paketiyle hazırlansın
                </span>
            </span>
            </label>          

            <div className="mt-7 space-y-4">
            <div className="text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
                Paketini Seç
                </p>
                <p className="mt-2 text-sm text-stone-500">
                Anılarını nasıl saklamak istediğini seç.
                </p>
            </div>

            <button
                type="button"
                onClick={() => setSelectedPackage("starter")}
                className={`w-full rounded-[2rem] border p-5 text-left transition ${
                selectedPackage === "starter"
                    ? "border-stone-950 bg-white shadow-xl"
                    : "border-stone-200 bg-white/50 hover:bg-white"
                }`}
            >
                <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
                    Starter
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">Başlangıç Paketi</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-500">
                    İlk anı hikâyeni oluşturmak için ideal.
                    </p>
                </div>

                <p className="text-2xl font-semibold tracking-tight">₺749,90</p>
                </div>

                <div className="mt-5 space-y-2 text-sm text-stone-600">
                <p>10 fotoğraf</p>
                <p>1 kısa video</p>
                <p>Sınırsız metin</p>
                <p>Sınırsız ses kaydı</p>
                </div>
            </button>

            <button
                type="button"
                onClick={() => setSelectedPackage("premium")}
                className={`relative w-full rounded-[2rem] border p-5 text-left transition ${
                selectedPackage === "premium"
                    ? "border-stone-950 bg-white shadow-xl"
                    : "border-stone-200 bg-white/50 hover:bg-white"
                }`}
            >

                <div className="flex items-start justify-between gap-4 pr-20">
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
                    Premium
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">Premium Paket</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-500">
                    Daha geniş hikâyeler ve daha fazla anı için.
                    </p>
                </div>

                <p className="text-2xl font-semibold tracking-tight">₺1249,90</p>
                </div>

                <div className="mt-5 space-y-2 text-sm text-stone-600">
                <p>50 fotoğraf</p>
                <p>10 kısa video</p>
                <p>Sınırsız metin</p>
                <p>Sınırsız ses kaydı</p>
                </div>
            </button>

            <div className="rounded-[2rem] bg-[#efe7dc] p-5">
                <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">{selectedPackageName}</span>
                <span className="text-2xl font-semibold">{selectedPrice}</span>
                </div>
            </div>
            </div>





          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-full bg-stone-950 px-6 py-4 text-sm font-semibold tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-60"
          >
            {loading ? "Shopier’e yönlendiriliyor..." : "Satın Al"}
          </button>
        </form>
      </section>
    </main>
  );
}