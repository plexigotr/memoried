import { NextRequest, NextResponse } from "next/server";
import { twilioClient, verifyServiceSid } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();

    if (!phoneNumber) {
      return NextResponse.redirect(
        new URL(`/auth/phone?error=no-phone`, request.url),
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
      new URL(`/auth/verify?phone=${encodeURIComponent(phoneNumber)}`, request.url),
      303
    );
  } catch (error) {
    console.error("Send code error:", error);

    return NextResponse.redirect(
      new URL(`/auth/phone?error=send-failed`, request.url),
      303
    );
  }
}