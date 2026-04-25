import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const userId = BigInt(String(formData.get("userId")));
    const code = String(formData.get("code") || "").trim();
    const lang = String(formData.get("lang") || "tr") === "en" ? "en" : "tr";

    await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        plan_type: "premium",
        premium_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?lang=${lang}&upgraded=1`, request.url),
      303
    );
  } catch (error) {
    console.error("Upgrade error:", error);

    return NextResponse.redirect(new URL("/upgrade?error=failed", request.url), 303);
  }
}