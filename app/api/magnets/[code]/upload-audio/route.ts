import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadMediaObject } from "@/lib/storage";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

function cleanFileName(fileName: string) {
  return fileName.replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    const formData = await request.formData();

    const title = String(formData.get("audioTitle") || "").trim();
    const file = formData.get("audioFile") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-audio-file`, request.url),
        303
      );
    }

    if (!file.type.startsWith("audio/")) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=invalid-audio-file`, request.url),
        303
      );
    }

    const magnet = await prisma.magnets.findUnique({
      where: {
        magnet_code: code,
      },
      include: {
        memory: {
          include: {
            memory_items: true,
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = cleanFileName(file.name || "recording.webm");
    const extension = originalName.split(".").pop() || "webm";
    const safeFileName = `${Date.now()}-${originalName}`;
    const filePath = `memories/${magnet.memory.id}/audios/${safeFileName}`;

    await uploadMediaObject(
      filePath,
      new Uint8Array(buffer),
      file.type || `audio/${extension}`
    );

    const lastSortOrder =
      Math.max(0, ...magnet.memory.memory_items.map((item) => item.sort_order)) ||
      0;

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

    return NextResponse.redirect(new URL(`/m/${code}/edit?uploaded=audio`, request.url), 303);
  } catch (error) {
    console.error("Audio upload error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=audio-upload-failed`, request.url),
      303
    );
  }
}
