import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const formData = await request.formData();

    const percentRaw = Number(formData.get("positionPercent") || 50);

    const positionPercent = Math.min(
      100,
      Math.max(0, Number.isFinite(percentRaw) ? percentRaw : 50)
    );

    const magnet = await prisma.magnets.findUnique({
      where: {
        magnet_code: code,
      },
      include: {
        memory: true,
      },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.redirect(new URL(`/m/${code}`, request.url), 303);
    }

    await prisma.memories.update({
      where: {
        id: magnet.memory.id,
      },
      data: {
        cover_position_percent: Math.round(positionPercent),
      },
    });

    const lang = magnet.memory.selected_lang === "en" ? "en" : "tr";

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?lang=${lang}`, request.url),
      303
    );
  } catch (error) {
    console.error("Set cover position error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=cover-position-failed`, request.url),
      303
    );
  }
}