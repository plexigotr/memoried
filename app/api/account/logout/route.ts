import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);

  response.cookies.set("user_phone", "", sessionCookieOptions(0));

  return response;
}