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
    const memoryDateRaw = String(formData.get("memory_date") || "").trim();

    if (!itemIdRaw) {
      return NextResponse.redirect(new URL(`/m/${code}/edit?error=missing-item`, request.url), 303);
    }

    const itemId = BigInt(itemIdRaw);

    let memoryDate: Date | null = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(memoryDateRaw)) {
      const parsed = new Date(`${memoryDateRaw}T00:00:00.000Z`);
      if (!Number.isNaN(parsed.getTime())) {
        memoryDate = parsed;
      }
    }

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
      },
      data: {
        memory_date: memoryDate,
        updated_at: new Date(),
      },
    });

    return NextResponse.redirect(new URL(`/m/${code}/edit?updated=date`, request.url), 303);
  } catch (error) {
    console.error("Update item date error:", error);
    return NextResponse.redirect(new URL(`/m/${code}/edit?error=date-update-failed`, request.url), 303);
  }
}
