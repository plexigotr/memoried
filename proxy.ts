import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

export function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/");
  const encodedCode = segments[3] || "";
  const action = segments[4] || "";

  if (action === "verify-edit-password") {
    return NextResponse.next();
  }

  let code: string;
  try {
    code = decodeURIComponent(encodedCode);
  } catch {
    return NextResponse.json({ error: "invalid-magnet-code" }, { status: 400 });
  }

  try {
    const token = request.cookies.get(`edit_access_${code}`)?.value;
    const session = verifySessionToken(token, "edit", code);

    if (!session) {
      return NextResponse.json({ error: "edit-login-required" }, { status: 401 });
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Edit API proxy error:", error);
    return NextResponse.json(
      { error: "session-configuration-error" },
      { status: 503 }
    );
  }
}

export const config = {
  matcher: "/api/magnets/:path*",
};
