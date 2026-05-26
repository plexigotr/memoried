import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const filePath = String(body.filePath || "").trim();

    if (!filePath) {
      return NextResponse.json({ error: "missing-file-path" }, { status: 400 });
    }

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: {
        memory: {
          include: { memory_items: true },
        },
      },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.json({ error: "memory-not-found" }, { status: 404 });
    }

    if (!filePath.startsWith(`memories/${magnet.memory.id}/`)) {
      return NextResponse.json({ error: "invalid-file-path" }, { status: 400 });
    }

    const lastSortOrder =
      magnet.memory.memory_items.sort((a, b) => b.sort_order - a.sort_order)[0]
        ?.sort_order ?? 0;

    await prisma.memory_items.create({
      data: {
        memory_id: magnet.memory.id,
        item_type: "audio",
        title: title || null,
        file_path: filePath,
        sort_order: lastSortOrder + 1,
        is_visible: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete audio upload error:", error);
    return NextResponse.json({ error: "complete-audio-upload-failed" }, { status: 500 });
  }
}
