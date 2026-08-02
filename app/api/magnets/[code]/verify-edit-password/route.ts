import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const formData = await request.formData();
    const password = String(formData.get("password") || "").trim();
    const lang = String(formData.get("lang") || "tr") === "en" ? "en" : "tr";

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: { memory: true },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.redirect(
        new URL(`/m/${code}`, request.url),
        303
      );
    }

    const isValid = !magnet.memory.edit_password_hash || await bcrypt.compare(
      password,
      magnet.memory.edit_password_hash
    );

    if (!isValid) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit-login?lang=${lang}&error=wrong-password`, request.url),
        303
      );
    }

    const response = NextResponse.redirect(
      new URL(`/m/${code}/edit?lang=${lang}`, request.url),
      303
    );

    const maxAge = 60 * 60 * 24 * 30;
    response.cookies.set(
      `edit_access_${code}`,
      createSessionToken("edit", code, maxAge),
      sessionCookieOptions(maxAge)
    );

    return response;
  } catch (error) {
    console.error("Verify edit password error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit-login?error=failed`, request.url),
      303
    );
  }
}