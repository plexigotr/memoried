import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.redirect(new URL("/admin/login", request.url), 303);
    }

    const formData = await request.formData();
    const orderCode = String(formData.get("orderCode") || "").trim();

    if (!orderCode) {
      return NextResponse.redirect(new URL("/admin?error=order-missing", request.url), 303);
    }

    const order = await prisma.orders.findUnique({ where: { order_code: orderCode } });
    if (!order?.magnet_id || order.status !== "paid") {
      return NextResponse.redirect(new URL("/admin?error=order-not-ready", request.url), 303);
    }

    await prisma.orders.update({
      where: { id: order.id },
      data: {
        fulfillment_status: "ready_to_ship",
        ready_at: new Date(),
      },
    });

    return NextResponse.redirect(new URL("/admin?success=order-ready", request.url), 303);
  } catch (error) {
    console.error("Mark order ready error:", error);
    return NextResponse.redirect(new URL("/admin?error=order-ready-failed", request.url), 303);
  }
}
