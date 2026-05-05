import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const orderCode = formData.get("orderCode")?.toString();

  if (!orderCode) {
    return NextResponse.json(
      { message: "Sipariş kodu eksik." },
      { status: 400 }
    );
  }

  const order = await prisma.orders.findUnique({
    where: {
      order_code: orderCode,
    },
  });

  if (!order) {
    return NextResponse.json(
      { message: "Sipariş bulunamadı." },
      { status: 404 }
    );
  }

  const packageType = order.package_type || "starter";

  const paymentUrl =
    packageType === "premium"
      ? process.env.SHOPIER_PREMIUM_URL
      : process.env.SHOPIER_STARTER_URL;

  if (!paymentUrl) {
    return NextResponse.json(
      { message: "Shopier ödeme linki tanımlı değil." },
      { status: 500 }
    );
  }

  await prisma.orders.update({
    where: {
      order_code: orderCode,
    },
    data: {
      status: "payment_started",
    },
  });

  return NextResponse.json({
    paymentUrl,
  });
}