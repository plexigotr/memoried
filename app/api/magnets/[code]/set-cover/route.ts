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

    if (!itemIdRaw) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-item`, request.url),
        303
      );
    }

    const itemId = BigInt(itemIdRaw);

    const magnet = await prisma.magnets.findUnique({
      where: {
        magnet_code: code,
      },
      include: {
        memory: true,
      },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-memory`, request.url),
        303
      );
    }

    const item = await prisma.memory_items.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!item || item.memory_id !== magnet.memory.id || !item.file_path) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=invalid-item`, request.url),
        303
      );
    }

    await prisma.memories.update({
      where: {
        id: magnet.memory.id,
      },
      data: {
        cover_image_path: item.file_path,
      },
    });

    return NextResponse.redirect(new URL(`/m/${code}/edit`, request.url), 303);
  } catch (error) {
    console.error("Set cover error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=set-cover-failed`, request.url),
      303
    );
  }
}