import { NextRequest, NextResponse } from "next/server";
import { twilioClient, verifyServiceSid } from "@/lib/twilio";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { allowRequest, requestIp } from "@/lib/rateLimit";
import { safeReturnPath } from "@/lib/safeRedirect";
import { normalizePhoneNumber } from "@/lib/phone";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const rawPhoneNumber = String(formData.get("phoneNumber") || "");
    const phoneNumber = normalizePhoneNumber(rawPhoneNumber);
    const code = String(formData.get("code") || "").trim();
    const returnPath = safeReturnPath(String(formData.get("returnTo") || ""));

    if (
      !phoneNumber ||
      !/^\+[1-9]\d{7,14}$/.test(phoneNumber) ||
      !/^\d{4,10}$/.test(code)
    ) {
      return NextResponse.redirect(
        new URL(`/account/verify?phone=${encodeURIComponent(phoneNumber || rawPhoneNumber)}&error=missing-data`, request.url),
        303
      );
    }
    const ip = requestIp(request.headers);
    if (!allowRequest(`verify:${ip}:${phoneNumber}`, 10, 15 * 60 * 1000)) {
      return NextResponse.redirect(
        new URL("/account/login?error=rate-limited", request.url),
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
        new URL(
          `/account/verify?phone=${encodeURIComponent(phoneNumber)}&error=invalid-code&returnTo=${encodeURIComponent(returnPath)}`,
          request.url
        ),
        303
      );
    }

    await prisma.users.upsert({
      where: { phone_number: phoneNumber },
      update: {},
      create: { phone_number: phoneNumber },
    });

    const response = NextResponse.redirect(
      new URL(returnPath, request.url),
      303
    );

    const maxAge = 60 * 60 * 24 * 30;
    response.cookies.set(
      "user_phone",
      createSessionToken("account", phoneNumber, maxAge),
      sessionCookieOptions(maxAge)
    );

    return response;
  } catch (error) {
    console.error("Account check code error:", error);

    return NextResponse.redirect(
      new URL("/account/login?error=check-failed", request.url),
      303
    );
  }
}