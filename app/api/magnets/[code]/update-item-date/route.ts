import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ code: string }>;
};

type ItemUpdateData = {
  updated_at: Date;
  title?: string | null;
  title_tr?: string | null;
  content_text?: string | null;
  content_text_tr?: string | null;
  memory_date?: Date | null;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const formData = await request.formData();
    const itemIdRaw = String(formData.get("itemId") || "").trim();

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

    const data: ItemUpdateData = { updated_at: new Date() };

    if (formData.has("title")) {
      const title = String(formData.get("title") || "").trim();
      data.title = title || null;
      data.title_tr = title || null;
    }

    if (formData.has("description")) {
      const description = String(formData.get("description") || "").trim();
      data.content_text = description || null;
      data.content_text_tr = description || null;
    }

    if (formData.has("memory_date")) {
      const memoryDateRaw = String(formData.get("memory_date") || "").trim();
      let memoryDate: Date | null = null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(memoryDateRaw)) {
        const parsed = new Date(`${memoryDateRaw}T00:00:00.000Z`);
        if (!Number.isNaN(parsed.getTime())) {
          memoryDate = parsed;
        }
      }
      data.memory_date = memoryDate;
    }

    await prisma.memory_items.updateMany({
      where: {
        id: itemId,
        memory_id: magnet.memory.id,
      },
      data,
    });

    return NextResponse.redirect(new URL(`/m/${code}/edit?updated=item`, request.url), 303);
  } catch (error) {
    console.error("Update item error:", error);
    return NextResponse.redirect(new URL(`/m/${code}/edit?error=item-update-failed`, request.url), 303);
  }
}
