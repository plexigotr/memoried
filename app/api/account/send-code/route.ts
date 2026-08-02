import { NextRequest, NextResponse } from "next/server";
import { allowRequest, requestIp } from "@/lib/rateLimit";
import { safeReturnPath } from "@/lib/safeRedirect";
import { twilioClient, verifyServiceSid } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const returnPath = safeReturnPath(String(formData.get("returnTo") || ""));

    if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
      return NextResponse.redirect(
        new URL("/account/login?error=no-phone", request.url),
        303
      );
    }

    const ip = requestIp(request.headers);
    const phoneAllowed = allowRequest(`sms:phone:${phoneNumber}`, 3, 15 * 60 * 1000);
    const ipAllowed = allowRequest(`sms:ip:${ip}`, 10, 60 * 60 * 1000);

    if (!phoneAllowed || !ipAllowed) {
      return NextResponse.redirect(
        new URL(
          `/account/login?error=rate-limited&returnTo=${encodeURIComponent(returnPath)}`,
          request.url
        ),
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
      new URL(
        `/account/verify?phone=${encodeURIComponent(phoneNumber)}&returnTo=${encodeURIComponent(returnPath)}`,
        request.url
      ),
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