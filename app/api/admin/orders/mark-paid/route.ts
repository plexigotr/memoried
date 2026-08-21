import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignAvailableMagnet } from "@/lib/orderFulfillment";

export async function POST(req: NextRequest) {
  try {
    const hasAdminAccess = await hasAdminSession();

    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL("/admin/login", req.url), 303);
    }

    const formData = await req.formData();
    const orderCode = formData.get("orderCode")?.toString();

    if (!orderCode) {
      return NextResponse.redirect(new URL("/admin?error=order-missing", req.url), 303);
    }

    await prisma.$transaction(async (tx) => {
      const order = await tx.orders.update({
        where: { order_code: orderCode },
        data: { status: "paid" },
      });

      await assignAvailableMagnet(tx, order.id);
    });

    return NextResponse.redirect(new URL("/admin?success=order-paid", req.url), 303);
  } catch (error) {
    console.error("Mark paid error:", error);
    return NextResponse.redirect(new URL("/admin?error=order-paid-failed", req.url), 303);
  }
}
