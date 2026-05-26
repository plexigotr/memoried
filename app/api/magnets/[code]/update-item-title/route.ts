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
    const title = String(formData.get("title") || "").trim();

    if (!itemIdRaw) {
      return NextResponse.redirect(new URL(`/m/${code}/edit?error=missing-item`, request.url), 303);
    }

    const itemId = BigInt(itemIdRaw);

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: { memory: true },
    });

    if (!magnet?.memory) {
      return NextResponse.redirect(new URL(`/m/${code}/edit?error=no-memory`, request.url), 303);
    }

    await prisma.memory_items.updateMany({
      where: {
        id: itemId,
        memory_id: magnet.memory.id,
        item_type: "image",
      },
      data: {
        title: title || null,
        title_tr: title || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.redirect(new URL(`/m/${code}/edit?updated=title`, request.url), 303);
  } catch (error) {
    console.error("Update item title error:", error);
    return NextResponse.redirect(new URL(`/m/${code}/edit?error=title-update-failed`, request.url), 303);
  }
}
