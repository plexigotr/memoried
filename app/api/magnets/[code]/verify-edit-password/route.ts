import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

    if (!magnet.memory.edit_password_hash) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?lang=${lang}`, request.url),
        303
      );
    }

    const isValid = await bcrypt.compare(
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

    response.cookies.set(`edit_access_${code}`, "granted", {
      httpOnly: true,
      path: `/m/${code}`,
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Verify edit password error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit-login?error=failed`, request.url),
      303
    );
  }
}