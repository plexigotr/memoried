import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { twilioClient, verifyServiceSid } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const code = String(formData.get("code") || "").trim();

    if (!phoneNumber || !code) {
      return NextResponse.redirect(
        new URL(`/auth/verify?phone=${encodeURIComponent(phoneNumber)}&error=missing-data`, request.url),
        303
      );
    }

    const result = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code,
      });

    if (result.status !== "approved") {
      return NextResponse.redirect(
        new URL(`/auth/verify?phone=${encodeURIComponent(phoneNumber)}&error=invalid-code`, request.url),
        303
      );
    }

    await prisma.users.upsert({
      where: {
        phone_number: phoneNumber,
      },
      update: {},
      create: {
        phone_number: phoneNumber,
        language: "tr",
      },
    });

    return NextResponse.redirect(
      new URL(`/auth/success?phone=${encodeURIComponent(phoneNumber)}`, request.url),
      303
    );
  } catch (error) {
    console.error("Check code error:", error);

    const url = new URL(`/auth/verify`, request.url);
    return NextResponse.redirect(url, 303);
  }
}