import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { iyzicoRequest } from "@/lib/iyzico";

type IyzicoCallbackResult = {
  status: string;
  paymentStatus?: string;
  conversationId?: string;
  paymentId?: string;
  errorMessage?: string;
};

function getBaseUrl() {
  return process.env.BASE_URL || process.env.APP_BASE_URL || "http://localhost:3000";
}

function getRedirectUrl(path: string) {
  return new URL(path, getBaseUrl());
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token")?.toString();

    if (!token) {
      return NextResponse.redirect(
        getRedirectUrl("/shop?error=payment-callback-invalid"),
        303
      );
    }

    const result = await iyzicoRequest<IyzicoCallbackResult>({
      uri: "/payment/iyzipos/checkoutform/auth/ecom/detail",
      payload: {
        locale: "tr",
        token,
      },
    });

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      return NextResponse.redirect(
        getRedirectUrl("/shop?error=payment-failed"),
        303
      );
    }

    const conversationId = result.conversationId || "";

    /**
     * SENARYO 1:
     * Magnet siparişi ödemesi
     *
     * initialize içinde conversationId şöyleydi:
     * order:ABC123
     */
    if (conversationId.startsWith("order:")) {
      const orderCode = conversationId.replace("order:", "");

      const order = await prisma.orders.findUnique({
        where: {
          order_code: orderCode,
        },
      });

      if (!order) {
        return NextResponse.redirect(
          getRedirectUrl("/shop?error=order-not-found"),
          303
        );
      }

      await prisma.orders.update({
        where: {
          order_code: orderCode,
        },
        data: {
          status: "paid",
          iyzico_payment_id: result.paymentId || null,
        },
      });

      return NextResponse.redirect(
        getRedirectUrl(`/checkout/${orderCode}?payment=success`),
        303
      );
    }

    /**
     * SENARYO 2:
     * Premium yükseltme ödemesi
     *
     * initialize içinde conversationId şöyleydi:
     * premium:USER_ID:MAGNET_CODE:LANG
     */
    if (conversationId.startsWith("premium:")) {
      const parts = conversationId.split(":");

      const userId = parts[1];
      const code = parts[2] || "";
      const lang = parts[3] || "tr";

      if (!userId) {
        return NextResponse.redirect(
          getRedirectUrl(`/upgrade?error=user-not-found&lang=${lang}`),
          303
        );
      }

      await prisma.users.update({
        where: {
          id: BigInt(userId),
        },
        data: {
          plan_type: "premium",
          premium_until: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ),
        },
      });

      if (code) {
        return NextResponse.redirect(
          getRedirectUrl(`/m/${code}/edit?lang=${lang}&upgraded=1`),
          303
        );
      }

      return NextResponse.redirect(
        getRedirectUrl(`/account?lang=${lang}&upgraded=1`),
        303
      );
    }

    return NextResponse.redirect(
      getRedirectUrl("/shop?error=payment-callback-invalid"),
      303
    );
  } catch (error) {
    console.error("iyzico callback error:", error);

    return NextResponse.redirect(
      getRedirectUrl("/shop?error=payment-callback-failed"),
      303
    );
  }
}