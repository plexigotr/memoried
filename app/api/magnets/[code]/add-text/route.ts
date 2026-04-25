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
    const url = new URL(request.url);
    const currentLang = url.searchParams.get("lang") === "en" ? "en" : "tr";

    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();

    if (!content) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-content`, request.url),
        303
      );
    }

    const magnet = await prisma.magnets.findUnique({
      where: {
        magnet_code: code,
      },
      include: {
        memory: {
          include: {
            memory_items: {
              orderBy: {
                sort_order: "desc",
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-memory`, request.url),
        303
      );
    }

    const lastSortOrder = magnet.memory.memory_items[0]?.sort_order ?? 0;

    await prisma.memory_items.create({
      data: {
        memory_id: magnet.memory.id,
        item_type: "text",
        title: title || null,
        content_text: content,
        title_tr: currentLang === "tr" ? title || null : null,
        title_en: currentLang === "en" ? title || null : null,
        content_text_tr: currentLang === "tr" ? content : null,
        content_text_en: currentLang === "en" ? content : null,
        sort_order: lastSortOrder + 1,
        is_visible: true,
      },
    });

    return NextResponse.redirect(new URL(`/m/${code}/edit`, request.url), 303);
  } catch (error) {
    console.error("Add text error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=text-failed`, request.url),
      303
    );
  }
}