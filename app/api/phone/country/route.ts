import { NextRequest, NextResponse } from "next/server";
import { isSupportedCountry, type CountryCode } from "libphonenumber-js";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/phone";

export async function GET(request: NextRequest) {
  const candidate = (
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-vercel-ip-country") ||
    ""
  ).toUpperCase();
  const country: CountryCode = isSupportedCountry(candidate)
    ? candidate
    : DEFAULT_PHONE_COUNTRY;

  return NextResponse.json(
    { country },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
