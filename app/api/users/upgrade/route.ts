import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.redirect(
    new URL("/upgrade?error=payment-not-active", request.url),
    303
  );
}
