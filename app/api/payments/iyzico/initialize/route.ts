import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { iyzicoRequest } from "@/lib/iyzico";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = BigInt(String(formData.get("userId")));
    const code = String(formData.get("code") || "").trim();

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=user-not-found`, request.url),
        303
      );
    }

    const callbackUrl = `${process.env.APP_BASE_URL}/api/payments/iyzico/callback?userId=${user.id.toString()}&code=${code}`;

    const conversationId = `upgrade-${user.id.toString()}-${Date.now()}`;

    const payload = {
      locale: "tr",
      conversationId,
      price: "149.90",
      paidPrice: "149.90",
      currency: "TRY",
      basketId: `premium-upgrade-${user.id.toString()}`,
      paymentGroup: "PRODUCT",
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: user.id.toString(),
        name: "Story",
        surname: "Magnet",
        gsmNumber: user.phone_number,
        email: "dummy@example.com",
        identityNumber: "11111111111",
        lastLoginDate: "2025-01-01 12:00:00",
        registrationDate: "2025-01-01 12:00:00",
        registrationAddress: "Alaçatı",
        ip: "127.0.0.1",
        city: "Izmir",
        country: "Turkey",
        zipCode: "35930",
      },
      shippingAddress: {
        contactName: "Story Magnet",
        city: "Izmir",
        country: "Turkey",
        address: "Alaçatı",
        zipCode: "35930",
      },
      billingAddress: {
        contactName: "Story Magnet",
        city: "Izmir",
        country: "Turkey",
        address: "Alaçatı",
        zipCode: "35930",
      },
      basketItems: [
        {
          id: `premium-${user.id.toString()}`,
          name: "Premium Paket Yükseltme",
          category1: "Digital",
          itemType: "VIRTUAL",
          price: "149.90",
        },
      ],
    };

    const result = await iyzicoRequest<{
      status: string;
      paymentPageUrl?: string;
      token?: string;
      errorMessage?: string;
    }>({
      uri: "/payment/iyzipos/checkoutform/initialize/auth/ecom",
      payload,
    });

    if (result.status !== "success" || !result.paymentPageUrl) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=payment-init-failed`, request.url),
        303
      );
    }

    return NextResponse.redirect(result.paymentPageUrl, 303);
  } catch (error) {
    console.error("iyzico initialize error:", error);

    return NextResponse.redirect(
      new URL(`/m/ABC123/edit?error=payment-init-failed`, request.url),
      303
    );
  }
}