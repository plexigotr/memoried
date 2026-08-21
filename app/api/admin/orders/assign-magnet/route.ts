import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { assignAvailableMagnet } from "@/lib/orderFulfillment";
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

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({ where: { order_code: orderCode } });
      if (!order || order.status !== "paid") throw new Error("Paid order not found");
      return assignAvailableMagnet(tx, order.id);
    });

    const outcome = "magnet_id" in result && result.magnet_id ? "magnet-assigned" : "no-magnet";
    return NextResponse.redirect(new URL(`/admin?success=${outcome}`, request.url), 303);
  } catch (error) {
    console.error("Assign magnet error:", error);
    return NextResponse.redirect(new URL("/admin?error=magnet-assign-failed", request.url), 303);
  }
}
