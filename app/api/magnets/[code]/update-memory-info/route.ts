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

    const lang = String(formData.get("lang") || "tr") === "en" ? "en" : "tr";
    const title = String(formData.get("title") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const subtitle = String(formData.get("subtitle") || "").trim();

    if (!title) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?lang=${lang}&error=memory-title-required`, request.url),
        303
      );
    }

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
      data:
        lang === "en"
          ? {
              title,
              title_en: title,
              subtitle: subtitle || null,
              subtitle_en: subtitle || null,
              location_text: location || null,
              location_text_en: location || null,
              selected_lang: "en",
            }
          : {
              title,
              title_tr: title,
              subtitle: subtitle || null,
              subtitle_tr: subtitle || null,
              location_text: location || null,
              location_text_tr: location || null,
              selected_lang: "tr",
            },
    });

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?lang=${lang}&updated=memory-info`, request.url),
      303
    );
  } catch (error) {
    console.error("Update memory info error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=memory-info-failed`, request.url),
      303
    );
  }
}