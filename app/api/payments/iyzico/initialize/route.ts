import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { iyzicoRequest } from "@/lib/iyzico";

type IyzicoInitializeResponse = {
  status: string;
  errorMessage?: string;
  paymentPageUrl?: string;
  token?: string;
};

function getBaseUrl() {
  return process.env.BASE_URL || "http://localhost:3000";
}

function splitName(fullName?: string | null) {
  const cleanName = fullName?.trim() || "Memoried Kullanıcısı";
  const parts = cleanName.split(" ");

  if (parts.length === 1) {
    return {
      name: parts[0],
      surname: "User",
    };
  }

  return {
    name: parts.slice(0, -1).join(" "),
    surname: parts[parts.length - 1],
  };
}

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const orderCode = formData.get("orderCode")?.toString();
    const userId = formData.get("userId")?.toString();
    const code = formData.get("code")?.toString();
    const lang = formData.get("lang")?.toString() === "en" ? "en" : "tr";

    const baseUrl = getBaseUrl();
    const ip = getClientIp(req);

    /**
     * SENARYO 1:
     * Magnet siparişi ödeme başlatma
     */
    if (orderCode) {
      const order = await prisma.orders.findUnique({
        where: {
          order_code: orderCode,
        },
      });

      if (!order) {
        return NextResponse.redirect(`${baseUrl}/shop?error=order-not-found`);
      }

      if (order.status === "paid") {
        return NextResponse.redirect(
          `${baseUrl}/checkout/${order.order_code}?payment=success`
        );
      }

      const buyerName = splitName(order.customer_name);
      const price = order.price.toString();

      const payload = {
        locale: "tr",
        conversationId: `order:${order.order_code}`,
        price,
        paidPrice: price,
        currency: order.currency || "TRY",
        basketId: order.order_code,
        paymentGroup: "PRODUCT",
        callbackUrl: `${baseUrl}/api/payments/iyzico/callback`,

        buyer: {
          id: `order-buyer-${order.id.toString()}`,
          name: buyerName.name,
          surname: buyerName.surname,
          gsmNumber: order.phone_number,
          email: order.email || "musteri@memoried.local",
          identityNumber: order.identity_number || "11111111111",
          registrationAddress: order.address,
          ip,
          city: order.city,
          country: "Turkey",
          zipCode: order.postal_code || "00000",
        },

        shippingAddress: {
          contactName: order.customer_name,
          city: order.city,
          country: "Turkey",
          address: order.address,
          zipCode: order.postal_code || "00000",
        },

        billingAddress: {
          contactName: order.customer_name,
          city: order.city,
          country: "Turkey",
          address: order.address,
          zipCode: order.postal_code || "00000",
        },

        basketItems: [
          {
            id: order.order_code,
            name: order.product_name,
            category1: "Story Magnet",
            category2: order.variant_text || "Magnet",
            itemType: "PHYSICAL",
            price,
          },
        ],
      };

      const result = await iyzicoRequest<IyzicoInitializeResponse>({
        uri: "/payment/iyzipos/checkoutform/initialize/auth/ecom",
        payload,
      });

      if (result.status !== "success" || !result.paymentPageUrl) {
        await prisma.orders.update({
          where: {
            order_code: order.order_code,
          },
          data: {
            status: "payment_failed",
          },
        });

        return NextResponse.redirect(
          `${baseUrl}/checkout/${order.order_code}?error=payment-init-failed`
        );
      }

      await prisma.orders.update({
        where: {
          order_code: order.order_code,
        },
        data: {
          status: "payment_started",
          iyzico_token: result.token || null,
        },
      });

      return NextResponse.json({
        paymentPageUrl: result.paymentPageUrl,
      });
    }

    /**
     * SENARYO 2:
     * Premium yükseltme ödeme başlatma
     */
    if (userId) {
      const user = await prisma.users.findUnique({
        where: {
          id: BigInt(userId),
        },
      });

      if (!user) {
        return NextResponse.redirect(
          `${baseUrl}/upgrade?error=user-not-found&lang=${lang}`
        );
      }

      const price = "149.90";

      const payload = {
        locale: lang === "en" ? "en" : "tr",
        conversationId: `premium:${user.id.toString()}:${code || ""}:${lang}`,
        price,
        paidPrice: price,
        currency: "TRY",
        basketId: `premium-${user.id.toString()}`,
        paymentGroup: "PRODUCT",
        callbackUrl: `${baseUrl}/api/payments/iyzico/callback`,

        buyer: {
          id: `user-${user.id.toString()}`,
          name: "Memoried",
          surname: "User",
          gsmNumber: user.phone_number,
          email: `user-${user.id.toString()}@memoried.local`,
          identityNumber: "11111111111",
          registrationAddress: "Turkey",
          ip,
          city: "Istanbul",
          country: "Turkey",
          zipCode: "34000",
        },

        shippingAddress: {
          contactName: "Memoried User",
          city: "Istanbul",
          country: "Turkey",
          address: "Digital Premium Upgrade",
          zipCode: "34000",
        },

        billingAddress: {
          contactName: "Memoried User",
          city: "Istanbul",
          country: "Turkey",
          address: "Digital Premium Upgrade",
          zipCode: "34000",
        },

        basketItems: [
          {
            id: `premium-${user.id.toString()}`,
            name: "Story Magnet Premium",
            category1: "Premium",
            category2: "Digital Upgrade",
            itemType: "VIRTUAL",
            price,
          },
        ],
      };

      const result = await iyzicoRequest<IyzicoInitializeResponse>({
        uri: "/payment/iyzipos/checkoutform/initialize/auth/ecom",
        payload,
      });

      if (result.status !== "success" || !result.paymentPageUrl) {
        return NextResponse.redirect(
          `${baseUrl}/upgrade?userId=${user.id.toString()}&code=${code || ""}&lang=${lang}&error=payment-init-failed`
        );
      }

      return NextResponse.json({
        paymentPageUrl: result.paymentPageUrl,
      });
    }

    return NextResponse.redirect(`${baseUrl}/shop?error=missing-payment-target`);
  } catch (error) {
    console.error("iyzico initialize error:", error);

    return NextResponse.redirect(
      `${getBaseUrl()}/shop?error=payment-init-failed`
    );
  }
}