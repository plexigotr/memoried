"use client";

import { useState } from "react";

export default function PaymentButton({ orderCode }: { orderCode: string }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    const res = await fetch("/api/payments/iyzico/initialize", {
      method: "POST",
      body: new URLSearchParams({
        orderCode,
      }),
    });

    const data = await res.json();

    if (data.paymentPageUrl) {
      window.location.href = data.paymentPageUrl;
    } else {
      alert("Ödeme başlatılamadı");
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
    >
      {loading ? "Yönlendiriliyor..." : "İyzico ile Güvenli Ödeme Yap"}
    </button>
  );
}