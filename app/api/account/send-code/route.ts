import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { twilioClient, verifyServiceSid } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();

    if (!phoneNumber) {
      return NextResponse.redirect(
        new URL("/account/login?error=no-phone", request.url),
        303
      );
    }

    const user = await prisma.users.findUnique({
      where: {
        phone_number: phoneNumber,
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/account/login?error=user-not-found", request.url),
        303
      );
    }

    await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    return NextResponse.redirect(
      new URL(`/account/verify?phone=${encodeURIComponent(phoneNumber)}`, request.url),
      303
    );
  } catch (error) {
    console.error("Account send code error:", error);

    return NextResponse.redirect(
      new URL("/account/login?error=send-failed", request.url),
      303
    );
  }
}