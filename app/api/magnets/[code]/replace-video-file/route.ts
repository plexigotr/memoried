import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const { itemId, filePath } = await request.json();

    if (!itemId || !filePath) {
      return NextResponse.json({ error: "missing-params" }, { status: 400 });
    }

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: { memory: true },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    await prisma.memory_items.update({
      where: { id: BigInt(itemId) },
      data: { file_path: filePath },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Replace video file error:", error);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
