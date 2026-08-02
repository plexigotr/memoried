import { NextResponse } from "next/server";
import { hasEditSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: "Ge\u00e7ersiz foto\u011fraf." },
        { status: 400 }
      );
    }

    const current = await prisma.memory_items.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        rotation: true,
        memory: {
          select: {
            magnet: {
              select: { magnet_code: true },
            },
          },
        },
      },
    });

    if (!current) {
      return NextResponse.json(
        { error: "Foto\u011fraf bulunamad\u0131." },
        { status: 404 }
      );
    }

    const magnetCode = current.memory.magnet.magnet_code;
    if (!(await hasEditSession(magnetCode))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nextRotation = ((current.rotation || 0) + 90) % 360;
    const updated = await prisma.memory_items.update({
      where: { id: current.id },
      data: { rotation: nextRotation },
      select: { rotation: true },
    });

    return NextResponse.json({ ok: true, rotation: updated.rotation });
  } catch (error) {
    console.error("rotate-memory-item-error", error);
    return NextResponse.json(
      { error: "Foto\u011fraf d\u00f6nd\u00fcr\u00fclemedi." },
      { status: 500 }
    );
  }
}
