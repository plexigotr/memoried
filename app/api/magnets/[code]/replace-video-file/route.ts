import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteMediaObject, mediaObjectExists } from "@/lib/storage";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const body = await request.json();
    const itemId = String(body.itemId || "").trim();
    const filePath = String(body.filePath || "").trim();

    if (!/^[1-9]\d*$/.test(itemId) || !filePath) {
      return NextResponse.json({ error: "missing-params" }, { status: 400 });
    }

    const magnet = await prisma.magnets.findUnique({
      where: { magnet_code: code },
      include: { memory: true },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    if (!filePath.startsWith(`memories/${magnet.memory.id}/`)) {
      return NextResponse.json({ error: "invalid-file-path" }, { status: 400 });
    }

    if (!(await mediaObjectExists(filePath))) {
      return NextResponse.json(
        { error: "upload-not-found" },
        { status: 409 }
      );
    }

    const item = await prisma.memory_items.findFirst({
      where: {
        id: BigInt(itemId),
        memory_id: magnet.memory.id,
        item_type: "video",
      },
    });

    if (!item) {
      return NextResponse.json({ error: "item-not-found" }, { status: 404 });
    }

    await prisma.memory_items.update({
      where: { id: item.id },
      data: { file_path: filePath },
    });

    if (item.file_path && item.file_path !== filePath) {
      try {
        await deleteMediaObject(item.file_path);
      } catch (storageError) {
        console.error(
          "Replace video old file cleanup error:",
          storageError
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Replace video file error:", error);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
