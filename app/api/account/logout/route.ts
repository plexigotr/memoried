import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.redirect(new URL("/", "http://localhost:3000"));

  response.cookies.set("user_phone", "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}