import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);

    if (!Number.isFinite(numericId)) {
      return NextResponse.json({ error: "Geçersiz fotoğraf." }, { status: 400 });
    }

    const current = await prisma.memory_items.findUnique({
      where: { id: numericId },
      select: { id: true, rotation: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
    }

    const nextRotation = ((current.rotation || 0) + 90) % 360;

    const updated = await prisma.memory_items.update({
      where: { id: numericId },
      data: { rotation: nextRotation },
      select: { id: true, rotation: true },
    });

    return NextResponse.json({ ok: true, rotation: updated.rotation });
  } catch (error) {
    console.error("rotate-memory-item-error", error);
    return NextResponse.json({ error: "Fotoğraf döndürülemedi." }, { status: 500 });
  }
}
