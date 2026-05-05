"use client";

import { useState } from "react";

export default function PaymentButton({ orderCode }: { orderCode: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);

    try {
      const res = await fetch("/api/payments/shopier/initialize", {
        method: "POST",
        body: new URLSearchParams({
          orderCode,
        }),
      });

      const data = await res.json();

      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      alert(data.message || "Ödeme başlatılamadı.");
    } catch (error) {
      console.error("Shopier payment error:", error);
      alert("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      className="w-full rounded-full bg-stone-950 px-6 py-4 text-center text-sm font-semibold tracking-[0.08em] text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-60"
    >
      {loading ? "Yönlendiriliyor..." : "Satın Al"}
    </button>
  );
}