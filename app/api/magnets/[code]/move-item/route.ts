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
    const itemIdRaw = String(formData.get("itemId") || "").trim();
    const direction = String(formData.get("direction") || "").trim();

    if (!itemIdRaw || !direction) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=missing-data`, request.url),
        303
      );
    }

    const itemId = BigInt(itemIdRaw);

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: {
        memory: {
          include: {
            memory_items: {
              where: { is_visible: true },
              orderBy: { sort_order: "asc" },
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

    const items = magnet.memory.memory_items;
    const currentIndex = items.findIndex((item) => item.id === itemId);

    if (currentIndex === -1) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=item-not-found`, request.url),
        303
      );
    }

    let targetIndex = currentIndex;

    if (direction === "up" && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    }

    if (direction === "down" && currentIndex < items.length - 1) {
      targetIndex = currentIndex + 1;
    }

    if (targetIndex === currentIndex) {
      return NextResponse.redirect(new URL(`/m/${code}/edit`, request.url), 303);
    }

    const currentItem = items[currentIndex];
    const targetItem = items[targetIndex];

    await prisma.$transaction([
      prisma.memory_items.update({
        where: { id: currentItem.id },
        data: { sort_order: targetItem.sort_order },
      }),
      prisma.memory_items.update({
        where: { id: targetItem.id },
        data: { sort_order: currentItem.sort_order },
      }),
    ]);

    return NextResponse.redirect(new URL(`/m/${code}/edit`, request.url), 303);
  } catch (error) {
    console.error("Move item error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=move-failed`, request.url),
      303
    );
  }
}