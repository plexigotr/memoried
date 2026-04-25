import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function padNumber(number: number) {
  return String(number).padStart(4, "0");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const prefix = String(formData.get("prefix") || "SM-ALC").trim();
    const count = Number(formData.get("count") || 1);
    const startNumber = Number(formData.get("startNumber") || 1);

    if (!prefix || count < 1 || count > 500) {
      return NextResponse.redirect(
        new URL("/admin?error=create-magnets-failed", request.url),
        303
      );
    }

    const magnetsToCreate = Array.from({ length: count }, (_, index) => {
      const number = startNumber + index;

      return {
        magnet_code: `${prefix}-${padNumber(number)}`,
        is_active: false,
      };
    });

    await prisma.magnets.createMany({
      data: magnetsToCreate,
      skipDuplicates: true,
    });

    return NextResponse.redirect(
      new URL("/admin?success=magnets-created", request.url),
      303
    );
  } catch (error) {
    console.error("Create magnets error:", error);

    return NextResponse.redirect(
      new URL("/admin?error=create-magnets-failed", request.url),
      303
    );
  }
}