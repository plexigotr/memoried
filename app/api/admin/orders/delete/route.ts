import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    await prisma.orders.delete({
      where: {
        order_code: orderCode,
      },
    });

    return NextResponse.redirect(new URL("/admin?success=order-deleted", req.url), 303);
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.redirect(new URL("/admin?error=order-delete-failed", req.url), 303);
  }
}