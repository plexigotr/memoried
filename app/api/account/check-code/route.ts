import { NextRequest, NextResponse } from "next/server";
import { twilioClient, verifyServiceSid } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const code = String(formData.get("code") || "").trim();

    if (!phoneNumber || !code) {
      return NextResponse.redirect(
        new URL(`/account/verify?phone=${encodeURIComponent(phoneNumber)}&error=missing-data`, request.url),
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
        new URL(`/account/verify?phone=${encodeURIComponent(phoneNumber)}&error=invalid-code`, request.url),
        303
      );
    }

    const response = NextResponse.redirect(
    new URL(`/account`, request.url),
    303
    );

    response.cookies.set("user_phone", phoneNumber, {
    httpOnly: true,
    path: "/",
    });

    return response;
  } catch (error) {
    console.error("Account check code error:", error);

    return NextResponse.redirect(
      new URL("/account/login?error=check-failed", request.url),
      303
    );
  }
}