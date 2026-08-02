import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));

  response.cookies.set("admin_access", "", sessionCookieOptions(0));

  return response;
}