import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignAvailableMagnet } from "@/lib/orderFulfillment";
import {
  shopifyOrderData,
  type ShopifyOrderWebhook,
  verifyShopifyWebhook,
} from "@/lib/shopify";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256") || "";
  const secret = process.env.SHOPIFY_CLIENT_SECRET || "";

  if (!verifyShopifyWebhook(rawBody, hmac, secret)) {
    return new NextResponse("invalid webhook signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as ShopifyOrderWebhook;
    const data = shopifyOrderData(payload);

    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.upsert({
        where: { order_code: data.order_code },
        create: {
          ...data,
          fulfillment_status: data.status === "paid" ? "awaiting_magnet" : "waiting_payment",
        },
        update: data,
      });

      if (payload.fulfillment_status === "fulfilled") {
        await tx.orders.update({
          where: { id: order.id },
          data: { fulfillment_status: "shipped" },
        });
      } else if (data.status === "paid") {
        await assignAvailableMagnet(tx, order.id);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Shopify order webhook could not be processed", error);
    return new NextResponse("webhook could not be processed", { status: 500 });
  }
}
