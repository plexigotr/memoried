import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const formData = await request.formData();
    const itemIdRaw = String(formData.get("itemId") || "").trim();
    const description = String(formData.get("description") || "").trim();

    if (!itemIdRaw) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=missing-item`, request.url),
        303
      );
    }

    const itemId = BigInt(itemIdRaw);

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: { memory: true },
    });

    if (!magnet?.memory) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-memory`, request.url),
        303
      );
    }

    await prisma.memory_items.updateMany({
      where: {
        id: itemId,
        memory_id: magnet.memory.id,
      },
      data: {
        content_text: description || null,
        content_text_tr: description || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?updated=description`, request.url),
      303
    );
  } catch (error) {
    console.error("Update item description error:", error);
    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=description-update-failed`, request.url),
      303
    );
  }
}
