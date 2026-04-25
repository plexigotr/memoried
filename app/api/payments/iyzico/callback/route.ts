import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { iyzicoRequest } from "@/lib/iyzico";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userIdRaw = url.searchParams.get("userId");
    const code = url.searchParams.get("code") || "ABC123";

    const formData = await request.formData();
    const token = String(formData.get("token") || "").trim();

    if (!userIdRaw || !token) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=payment-callback-invalid`, request.url),
        303
      );
    }

    const userId = BigInt(userIdRaw);

    const result = await iyzicoRequest<{
      status: string;
      paymentStatus?: string;
      errorMessage?: string;
    }>({
      uri: "/payment/iyzipos/checkoutform/auth/ecom/detail",
      payload: {
        locale: "tr",
        conversationId: `upgrade-${userId.toString()}`,
        token,
      },
    });

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      await prisma.users.update({
        where: { id: userId },
        data: {
          plan_type: "premium",
        },
      });

      return NextResponse.redirect(
        new URL(`/m/${code}/edit?upgraded=1`, request.url),
        303
      );
    }

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=payment-failed`, request.url),
      303
    );
  } catch (error) {
    console.error("iyzico callback error:", error);

    return NextResponse.redirect(
      new URL(`/m/ABC123/edit?error=payment-callback-failed`, request.url),
      303
    );
  }
}