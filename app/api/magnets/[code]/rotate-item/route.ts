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

    const item = await prisma.memory_items.findFirst({
      where: {
        id: itemId,
        memory_id: magnet.memory.id,
        item_type: "image",
      },
      select: { id: true, rotation: true },
    });

    if (!item) {
      return NextResponse.redirect(new URL(`/m/${code}/edit?error=item-not-found`, request.url), 303);
    }

    const nextRotation = ((item.rotation || 0) + 90) % 360;

    await prisma.memory_items.update({
      where: { id: item.id },
      data: { rotation: nextRotation, updated_at: new Date() },
    });

    return NextResponse.redirect(new URL(`/m/${code}/edit?updated=rotation`, request.url), 303);
  } catch (error) {
    console.error("Rotate item error:", error);
    return NextResponse.redirect(new URL(`/m/${code}/edit?error=rotate-failed`, request.url), 303);
  }
}
