import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const res = formData.get("res")?.toString();
    const hash = formData.get("hash")?.toString();

    if (!res || !hash) {
      return new NextResponse("missing parameter", { status: 400 });
    }

    const username = process.env.SHOPIER_OSB_USERNAME;
    const key = process.env.SHOPIER_OSB_KEY;

    if (!username || !key) {
      return new NextResponse("missing config", { status: 500 });
    }

    const expectedHash = crypto
      .createHmac("sha256", key)
      .update(res + username)
      .digest("hex");

    if (expectedHash !== hash) {
      return new NextResponse("invalid hash", { status: 403 });
    }

    const json = Buffer.from(res, "base64").toString("utf8");
    const data = JSON.parse(json);

    const orderCode = data.orderid;

    if (!orderCode) {
      return new NextResponse("missing orderid", { status: 400 });
    }

    const order = await prisma.orders.findUnique({
      where: {
        order_code: orderCode,
      },
    });

    if (!order) {
      return new NextResponse("order not found", { status: 404 });
    }

    if (order.status !== "paid") {
      await prisma.orders.update({
        where: {
          order_code: orderCode,
        },
        data: {
          status: "paid",
        },
      });
    }

    return new NextResponse("success", { status: 200 });
  } catch (error) {
    console.error("Shopier callback error:", error);
    return new NextResponse("callback error", { status: 500 });
  }
}