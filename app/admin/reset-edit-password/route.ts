import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const magnetCode = String(formData.get("magnetCode") || "").trim();
    const newPassword = String(formData.get("newPassword") || "").trim();
    const newPasswordConfirm = String(
      formData.get("newPasswordConfirm") || ""
    ).trim();

    if (!magnetCode || !newPassword || !newPasswordConfirm) {
      return NextResponse.redirect(
        new URL(`/admin/${magnetCode}?error=password-reset-failed`, request.url),
        303
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.redirect(
        new URL(`/admin/${magnetCode}?error=password-reset-failed`, request.url),
        303
      );
    }

    if (newPassword !== newPasswordConfirm) {
      return NextResponse.redirect(
        new URL(`/admin/${magnetCode}?error=password-reset-failed`, request.url),
        303
      );
    }

    const magnet = await prisma.magnets.findUnique({
      where: {
        magnet_code: magnetCode,
      },
      include: {
        memory: true,
      },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.redirect(
        new URL(`/admin/${magnetCode}?error=password-reset-failed`, request.url),
        303
      );
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.memories.update({
      where: {
        id: magnet.memory.id,
      },
      data: {
        edit_password_hash: hash,
      },
    });

    return NextResponse.redirect(
      new URL(`/admin/${magnetCode}?success=password-reset`, request.url),
      303
    );
  } catch (error) {
    console.error("Reset edit password error:", error);

    return NextResponse.redirect(
      new URL("/admin?error=password-reset-failed", request.url),
      303
    );
  }
}