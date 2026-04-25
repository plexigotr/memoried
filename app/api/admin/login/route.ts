import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(
      new URL("/admin/login?error=wrong-password", request.url),
      303
    );
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), 303);

  response.cookies.set("admin_access", "granted", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}